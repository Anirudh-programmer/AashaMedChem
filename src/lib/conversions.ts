export const UNITS = ["g", "kg", "mL", "L", "unit"] as const;
export type Unit = (typeof UNITS)[number];

export const UNIT_LABELS: Record<Unit, string> = {
  g: "grams (g)",
  kg: "kilograms (kg)",
  mL: "milliliters (mL)",
  L: "liters (L)",
  unit: "items (unit)",
};

export const DIMENSIONS: Record<Unit, "weight" | "volume" | "count"> = {
  g: "weight",
  kg: "weight",
  mL: "volume",
  L: "volume",
  unit: "count",
};

/**
 * Returns the conversion factor from one unit to another within the same dimension.
 * e.g. from kg to g -> 1000
 * from g to kg -> 0.001
 */
export function getConversionFactor(fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return 1;

  const fromDim = DIMENSIONS[fromUnit as Unit];
  const toDim = DIMENSIONS[toUnit as Unit];

  if (!fromDim || !toDim || fromDim !== toDim) {
    throw new Error(`Incompatible dimensions: cannot convert from ${fromUnit} to ${toUnit}`);
  }

  // Weight conversions
  if (fromUnit === "kg" && toUnit === "g") return 1000;
  if (fromUnit === "g" && toUnit === "kg") return 0.001;

  // Volume conversions
  if (fromUnit === "L" && toUnit === "mL") return 1000;
  if (fromUnit === "mL" && toUnit === "L") return 0.001;

  return 1;
}

/**
 * Converts a quantity from one unit to another.
 */
export function convertQuantity(qty: number, fromUnit: string, toUnit: string): number {
  const factor = getConversionFactor(fromUnit, toUnit);
  return qty * factor;
}

/**
 * Calculates the line total.
 * @param orderedQty Quantity in orderedUnit
 * @param orderedUnit The unit the seller selected
 * @param baseUnit The product's base unit
 * @param basePrice The product's price in INR per baseUnit
 */
export function calculateLineTotal(
  orderedQty: number,
  orderedUnit: string,
  baseUnit: string,
  basePrice: number
): { baseQty: number; lineTotal: number } {
  const baseQty = convertQuantity(orderedQty, orderedUnit, baseUnit);
  const lineTotal = baseQty * basePrice;
  return { baseQty, lineTotal };
}
