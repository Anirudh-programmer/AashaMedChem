import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

// Get list of inventory levels
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inventory = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        category: true,
        baseUnit: true,
        stock: true,
        lowStockThreshold: true,
        status: true,
        updatedAt: true,
      },
      orderBy: { name: "asc" },
    });

    // Also get reserved amounts from pending quotations
    // In our database, reserved stock = sum of baseQty in all QuotationItems belonging to quotations that are 'pending'
    const pendingQuotations = await prisma.quotation.findMany({
      where: {
        status: "pending",
      },
      include: {
        items: true,
      },
    });

    // Calculate reserved quantities map
    const reservedMap: Record<string, number> = {};
    for (const q of pendingQuotations) {
      for (const item of q.items) {
        if (item.productId) {
          const baseQty = parseFloat(item.baseQty.toString());
          reservedMap[item.productId] = (reservedMap[item.productId] || 0) + baseQty;
        }
      }
    }

    // Reconstruct peak historical capacity by iterating over all stock change events
    const maxStockMap: Record<string, number> = {};
    const history = await prisma.inventoryHistory.findMany({
      select: {
        productId: true,
        changeQty: true,
        newQty: true,
      }
    });
    for (const h of history) {
      if (h.productId) {
        const changeVal = parseFloat(h.changeQty.toString());
        const newVal = parseFloat(h.newQty.toString());
        const beforeVal = newVal - changeVal;
        const currentMax = maxStockMap[h.productId] || 0;
        maxStockMap[h.productId] = Math.max(currentMax, newVal, beforeVal);
      }
    }

    const inventoryWithReserved = inventory.map((i) => {
      const stockVal = parseFloat(i.stock.toString());
      const maxVal = Math.max(stockVal, maxStockMap[i.id] || 0, parseFloat(i.lowStockThreshold.toString()) * 5, 1);
      return {
        ...i,
        stock: stockVal,
        lowStockThreshold: parseFloat(i.lowStockThreshold.toString()),
        reserved: reservedMap[i.id] || 0,
        maxCapacity: maxVal,
      };
    });

    return NextResponse.json(inventoryWithReserved);
  } catch (error: any) {
    console.error("GET Inventory error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Adjust stock (Admin only)
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const role = user?.publicMetadata?.role as string | undefined;
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const body = await req.json();
    const { productId, adjustAmount, note } = body;

    if (!productId || adjustAmount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const parsedAdjust = parseFloat(adjustAmount);
    if (isNaN(parsedAdjust)) {
      return NextResponse.json({ error: "Invalid adjustment amount" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      const currentQty = parseFloat(product.stock.toString());
      const newQty = Math.max(0, currentQty + parsedAdjust);

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stock: new Prisma.Decimal(newQty),
        },
      });

      const history = await tx.inventoryHistory.create({
        data: {
          productId,
          changeQty: new Prisma.Decimal(parsedAdjust),
          newQty: new Prisma.Decimal(newQty),
          note: note || "Manual adjustment",
        },
      });

      return { updatedProduct, history };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST Inventory Adjust error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
