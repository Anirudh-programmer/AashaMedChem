const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const initialProducts = [
  { name: "Sodium Chloride", sku: "NaCl-001", category: "Salts", description: "Laboratory grade NaCl, ≥99.5% purity", baseUnit: "g", basePrice: 0.45, stock: 50000, lowStockThreshold: 5000, status: "active" },
  { name: "Ethanol (Absolute)", sku: "ETOH-001", category: "Solvents", description: "Absolute ethanol, ≥99.9% purity", baseUnit: "mL", basePrice: 1.2, stock: 20000, lowStockThreshold: 2000, status: "active" },
  { name: "Sulfuric Acid (Conc.)", sku: "H2SO4-001", category: "Acids", description: "Concentrated H₂SO₄, 98%", baseUnit: "mL", basePrice: 2.8, stock: 5000, lowStockThreshold: 500, status: "active" },
  { name: "Activated Charcoal", sku: "CHAR-001", category: "Adsorbents", description: "Pharmaceutical grade activated charcoal", baseUnit: "g", basePrice: 3.2, stock: 8000, lowStockThreshold: 1000, status: "active" },
  { name: "Glucose Monohydrate", sku: "GLUC-001", category: "Sugars", description: "Anhydrous D-glucose, pharma grade", baseUnit: "kg", basePrice: 180, stock: 200, lowStockThreshold: 20, status: "active" },
  { name: "Sterile Vials (10mL)", sku: "VIAL-001", category: "Equipment", description: "Type I borosilicate glass vials", baseUnit: "unit", basePrice: 12, stock: 2000, lowStockThreshold: 200, status: "inactive" },
];

async function main() {
  console.log("Seeding database with chemical products...");
  for (const p of initialProducts) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
  }
  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
