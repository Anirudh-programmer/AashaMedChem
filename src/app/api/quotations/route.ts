import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { calculateLineTotal } from "@/lib/conversions";

// Get list of quotations
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    const role = user?.publicMetadata?.role as string | undefined;

    const where: any = {};
    // If not admin, restrict to user's own quotations
    if (role !== "admin") {
      where.sellerEmail = email;
    }

    const quotations = await prisma.quotation.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(quotations);
  } catch (error: any) {
    console.error("GET Quotations error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Submit a new quotation (Seller/User only)
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Seller";

    if (!email) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    const body = await req.json();
    const { items, notes } = body; // items: Array of { productId, orderedQty, orderedUnit }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Quotation must contain at least one item" }, { status: 400 });
    }

    // Process items and calculate totals in a transaction
    const result = await prisma.$transaction(async (tx) => {
      let grandTotal = 0;
      const processedItems = [];

      for (const item of items) {
        const { productId, orderedQty, orderedUnit } = item;
        const parsedQty = parseFloat(orderedQty);

        if (!productId || isNaN(parsedQty) || parsedQty <= 0 || !orderedUnit) {
          throw new Error("Invalid item format in request");
        }

        const product = await tx.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          throw new Error(`Product not found: ${productId}`);
        }

        if (product.status !== "active") {
          throw new Error(`Product ${product.name} is currently inactive and cannot be ordered`);
        }

        const basePrice = parseFloat(product.basePrice.toString());
        const baseUnit = product.baseUnit;

        // Perform calculation using conversions utility
        const { baseQty, lineTotal } = calculateLineTotal(parsedQty, orderedUnit, baseUnit, basePrice);
        grandTotal += lineTotal;

        processedItems.push({
          productId,
          productName: product.name,
          sku: product.sku,
          orderedQty: new Prisma.Decimal(parsedQty),
          orderedUnit,
          baseUnit,
          baseQty: new Prisma.Decimal(baseQty),
          basePrice: new Prisma.Decimal(basePrice),
          lineTotal: new Prisma.Decimal(lineTotal),
        });
      }

      // Create Quotation
      const quotation = await tx.quotation.create({
        data: {
          sellerName: name,
          sellerEmail: email,
          status: "pending",
          notes: notes || "",
          total: new Prisma.Decimal(grandTotal),
          items: {
            create: processedItems.map((pi) => ({
              productId: pi.productId,
              productName: pi.productName,
              sku: pi.sku,
              orderedQty: pi.orderedQty,
              orderedUnit: pi.orderedUnit,
              baseUnit: pi.baseUnit,
              baseQty: pi.baseQty,
              basePrice: pi.basePrice,
              lineTotal: pi.lineTotal,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      return quotation;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST Quotation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
