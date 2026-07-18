import { taxBrackets } from "./constants";

export interface TaxCalculationResult {
  tax: number;
  taxableIncome: number;
  deductible: number;
  steps: string[];
}

export function findTaxBracket(income: number) {
  const normalized = Math.round(income * 100) / 100;
  return taxBrackets.find(
    (bracket) =>
      normalized >= bracket.min &&
      (bracket.max === null || normalized <= bracket.max)
  );
}

export function calculateTax(income: number): number {
  if (income <= 0) return 0;
  const bracket = findTaxBracket(income);
  if (!bracket) return 0;
  const grossTax = (income * bracket.rate) / 100;
  return Math.max(0, grossTax - bracket.deductible);
}

/** @deprecated Use calculateTax — kept for payroll imports */
export const CalculateTax = calculateTax;

export function calculateTaxWithBreakdown(
  taxableIncome: number
): TaxCalculationResult {
  if (taxableIncome <= 0) {
    return { tax: 0, taxableIncome: 0, deductible: 0, steps: [] };
  }

  const applicableBracket = findTaxBracket(taxableIncome);
  if (!applicableBracket) {
    return { tax: 0, taxableIncome, deductible: 0, steps: [] };
  }

  const deductible = applicableBracket.deductible;
  const grossTax = (taxableIncome * applicableBracket.rate) / 100;
  const tax = Math.max(0, grossTax - deductible);

  const steps = [
    `Taxable Income: ${taxableIncome.toLocaleString()} Birr`,
    `Tax Rate: ${applicableBracket.rate}%`,
    `Gross Tax: ${taxableIncome.toLocaleString()} × ${applicableBracket.rate / 100} = ${grossTax.toFixed(2)} Birr`,
    `Deductible: ${deductible.toLocaleString()} Birr`,
    `Final Tax: ${grossTax.toFixed(2)} - ${deductible.toLocaleString()} = ${tax.toFixed(2)} Birr`,
  ];

  return { tax, taxableIncome, deductible, steps };
}

export function calculatePension(income: number, isOrg = false): number {
  const rate = isOrg ? 0.11 : 0.07;
  return income > 0 ? income * rate : 0;
}

/** @deprecated Use calculatePension — kept for payroll imports */
export const CalculatePension = calculatePension;

export function getNonTaxableAllowanceLimit(basicSalary: number): number {
  return Math.min(basicSalary * 0.25, 2200);
}
