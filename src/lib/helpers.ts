import { taxBrackets } from "./constants";

export const CalculateTax = (income: number): number => {
  if (income <= 0) return 0;
  const bracket = taxBrackets.find(
    (b) => income >= b.min && (b.max === null || income <= b.max)
  );
  if (bracket) {
    const grossTax = (income * bracket.rate) / 100;
    return Math.max(0, grossTax - bracket.deductible);
  }
  return 0;
};

export const CalculatePension = (
  income: number,
  isOrg: boolean = false
): number => {
  const rate = isOrg ? 0.11 : 0.07;
  return income > 0 ? income * rate : 0;
};
