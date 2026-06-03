import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

// Get products (with search & category filtering)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "All";
    const status = searchParams.get("status"); // filter active if needed

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category && category !== "All") {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(products);
  } catch (error: any) {
    console.error("GET Products error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create new product (Admin only)
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
    const { name, sku, category, description, baseUnit, basePrice, stock, lowStockThreshold, status } = body;

    if (!name || !sku || !baseUnit) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check SKU uniqueness
    const existing = await prisma.product.findUnique({
      where: { sku },
    });
    if (existing) {
      return NextResponse.json({ error: "A product with this SKU already exists" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        category: category || "Other",
        description: description || "",
        baseUnit,
        basePrice: new Prisma.Decimal(basePrice || 0),
        stock: new Prisma.Decimal(stock || 0),
        lowStockThreshold: new Prisma.Decimal(lowStockThreshold || 0),
        status: status || "active",
      },
    });

    // Record initial stock if greater than 0
    if (stock && parseFloat(stock) > 0) {
      await prisma.inventoryHistory.create({
        data: {
          productId: product.id,
          changeQty: new Prisma.Decimal(stock),
          newQty: new Prisma.Decimal(stock),
          note: "Initial stock creation",
        },
      });
    }

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("POST Product error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
