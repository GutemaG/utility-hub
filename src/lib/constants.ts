interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
  deductible: number;
}

export const taxBrackets: TaxBracket[] = [
  { min: 0, max: 2000.0, rate: 0, deductible: 0 },
  { min: 2001.0, max: 4000.0, rate: 15, deductible: 300 },
  { min: 4001.0, max: 7000.0, rate: 20, deductible: 500 },
  { min: 7001.0, max: 10000.0, rate: 25, deductible: 850 },
  { min: 10001.0, max: 14000.0, rate: 30, deductible: 1350 },
  { min: 14001.0, max: null, rate: 35, deductible: 2050 },
];

export interface EmployeeData {
  "Employee Name": string;
  "Basic Salary": number;
  "Total Taxable Allowance"?: number;
  "Total Non Taxable Allowance"?: number;
  "Other Deduction"?: number;
  "Gross Salary"?: number;
  "Taxable Income"?: number;
  "Income Tax"?: number;
  "Employee Pension"?: number;
  "Organization Pension"?: number;
  "Total Deduction"?: number;
  "Net Salary"?: number;
  error?: string;
}
