import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: Request, { params }: RouteParams) {
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

    const { id } = await params;
    const body = await req.json();
    const { status } = body; // pending, approved, rejected, fulfilled

    if (!status || !["pending", "approved", "rejected", "fulfilled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!quotation) {
        throw new Error("Quotation not found");
      }

      const isDeducting = 
        (quotation.status === "pending" || quotation.status === "rejected") && 
        (status === "approved" || status === "fulfilled");

      const isRestoring = 
        (quotation.status === "approved" || quotation.status === "fulfilled") && 
        (status === "rejected" || status === "pending");

      if (isDeducting) {
        for (const item of quotation.items) {
          if (!item.productId) continue;

          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new Error(`Product not found for item: ${item.productName}`);
          }

          const currentStock = parseFloat(product.stock.toString());
          const baseQty = parseFloat(item.baseQty.toString());

          if (currentStock < baseQty) {
            throw new Error(`Insufficient stock for ${item.productName}. Requested: ${item.orderedQty} ${item.orderedUnit}, Available: ${product.stock} ${product.baseUnit}`);
          }

          const newStock = currentStock - baseQty;

          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: new Prisma.Decimal(newStock),
            },
          });

          await tx.inventoryHistory.create({
            data: {
              productId: item.productId,
              changeQty: new Prisma.Decimal(-baseQty),
              newQty: new Prisma.Decimal(newStock),
              note: `Stock deducted on quotation approval: ${id}`,
            },
          });
        }
      } else if (isRestoring) {
        for (const item of quotation.items) {
          if (!item.productId) continue;

          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new Error(`Product not found for item: ${item.productName}`);
          }

          const currentStock = parseFloat(product.stock.toString());
          const baseQty = parseFloat(item.baseQty.toString());
          const newStock = currentStock + baseQty;

          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: new Prisma.Decimal(newStock),
            },
          });

          await tx.inventoryHistory.create({
            data: {
              productId: item.productId,
              changeQty: new Prisma.Decimal(baseQty),
              newQty: new Prisma.Decimal(newStock),
              note: `Stock restored on quotation cancel/reversal: ${id}`,
            },
          });
        }
      }

      // Update status
      const updated = await tx.quotation.update({
        where: { id },
        data: { status },
        include: { items: true },
      });

      return updated;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("PUT Quotation status error:", error);
    const status = error.message?.includes("Insufficient stock") || error.message?.includes("not found") ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
