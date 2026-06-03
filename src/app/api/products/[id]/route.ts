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
    const { name, sku, category, description, baseUnit, basePrice, stock, lowStockThreshold, status } = body;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check SKU uniqueness if changed
    if (sku && sku !== existingProduct.sku) {
      const duplicateSku = await prisma.product.findUnique({
        where: { sku },
      });
      if (duplicateSku) {
        return NextResponse.json({ error: "A product with this SKU already exists" }, { status: 400 });
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name || undefined,
        sku: sku || undefined,
        category: category || undefined,
        description: description ?? undefined,
        baseUnit: baseUnit || undefined,
        basePrice: basePrice !== undefined ? new Prisma.Decimal(basePrice) : undefined,
        stock: stock !== undefined ? new Prisma.Decimal(stock) : undefined,
        lowStockThreshold: lowStockThreshold !== undefined ? new Prisma.Decimal(lowStockThreshold) : undefined,
        status: status || undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT Product error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
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

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (error: any) {
    console.error("DELETE Product error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
