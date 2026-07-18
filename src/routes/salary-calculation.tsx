import { TaxBracketInfo } from "@/components/tax-bracket-info";
import { taxBrackets } from "@/lib/constants";
import { useSEO } from "@/hooks/use-seo";
import { createFileRoute } from "@tanstack/react-router";
import { useDeferredValue, useState } from "react";

export const Route = createFileRoute("/salary-calculation")({
  component: RouteComponent,
});


const MAX_NON_TAXABLE_ALLOWANCE_AMOUNT = 2200;

function RouteComponent() {
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0); // Basic Salary
  const [monthlyAllowance, setMonthlyAllowance] = useState<number>(0); // Total Allowance
  const [monthlyNetIncome, setMonthlyNetIncome] = useState<number>(0);
  const [annualIncome, setAnnualIncome] = useState<number>(0);
  const [annualNetIncome, setAnnualNetIncome] = useState<number>(0);
  const [calculationMode, setCalculationMode] = useState<"gross" | "net">("gross");
  const deferredMonthlyIncome = useDeferredValue(monthlyIncome);
  const deferredMonthlyAllowance = useDeferredValue(monthlyAllowance);

  // Helper: Calculate the non-taxable limit based on basic salary
  const getNonTaxableLimit = (basicSalary: number) => {
    return Math.min(basicSalary * 0.25, MAX_NON_TAXABLE_ALLOWANCE_AMOUNT);
  };

  const calculateTax = (
    taxableIncome: number
  ): {
    tax: number;
    taxableIncome: number;
    deductible: number;
    steps: string[];
  } => {
    if (taxableIncome <= 0)
      return { tax: 0, taxableIncome: 0, deductible: 0, steps: [] };

    let totalTax = 0;
    let totalDeductible = 0;
    const steps: string[] = [];

    const applicableBracket = taxBrackets.find((bracket) =>
      bracket.max
        ? Math.ceil(taxableIncome) >= bracket.min &&
          Math.ceil(taxableIncome) <= bracket.max
        : taxableIncome >= bracket.min
    );

    if (applicableBracket) {
      totalDeductible = applicableBracket.deductible;
      const grossTax = (taxableIncome * applicableBracket.rate) / 100;
      totalTax = Math.max(0, grossTax - totalDeductible);

      steps.push(`Taxable Income: ${taxableIncome.toLocaleString()} Birr`);
      steps.push(`Tax Rate: ${applicableBracket.rate}%`);
      steps.push(
        `Gross Tax: ${taxableIncome.toLocaleString()} × ${
          applicableBracket.rate / 100
        } = ${grossTax.toFixed(2)} Birr`
      );
      steps.push(`Deductible: ${totalDeductible.toLocaleString()} Birr`);
      steps.push(
        `Final Tax: ${grossTax.toFixed(2)} - ${totalDeductible.toLocaleString()} = ${totalTax.toFixed(2)} Birr`
      );
    }

    return {
      tax: totalTax,
      taxableIncome,
      deductible: totalDeductible,
      steps,
    };
  };

  const calculatePension = (basicSalary: number): number => {
    return basicSalary * 0.07;
  };

  // Main calculation logic integrating Allowance
  const performFullCalculation = (basicSalary: number, allowance: number) => {
    const nonTaxableLimit = getNonTaxableLimit(basicSalary);
    const taxableAllowance = Math.max(0, allowance - nonTaxableLimit);
    const totalTaxableIncome = basicSalary + taxableAllowance;

    const taxDetails = calculateTax(totalTaxableIncome);
    const pension = calculatePension(basicSalary);
    const netIncome = basicSalary + allowance - taxDetails.tax - pension;

    return {
      basicSalary,
      allowance,
      nonTaxableLimit,
      taxableAllowance,
      totalTaxableIncome,
      taxDetails,
      pension,
      netIncome,
    };
  };

  const calculateNetIncome = (basicSalary: number, allowance: number): number => {
    if (basicSalary <= 0) return 0;
    return performFullCalculation(basicSalary, allowance).netIncome;
  };

  // Reverse calculation (simplified to ignore dynamic allowance complexity for now)
  const calculateGrossIncome = (netIncome: number): number => {
    if (netIncome <= 0) return 0;
    
    // Note: This reverse formula assumes 0 allowance for stability.
    // Reversing with variable allowance requires a numerical solver due to the circular dependency
    // of the non-taxable limit on the Gross Basic.
    
    for (let i = 0; i < taxBrackets.length; i++) {
      const bracket = taxBrackets[i];
      const nextBracket = taxBrackets[i + 1];

      const netAtMin = calculateNetIncome(bracket.min, 0);
      const netAtNextMin = nextBracket
        ? calculateNetIncome(nextBracket.min, 0)
        : Infinity;

      if (netIncome >= netAtMin && netIncome < netAtNextMin) {
        const rate = bracket.rate / 100;
        const deductible = bracket.deductible;
        const gross = (netIncome - deductible) / (1 - rate - 0.07);
        return gross;
      }
    }

    const lastBracket = taxBrackets[taxBrackets.length - 1];
    const rate = lastBracket.rate / 100;
    const deductible = lastBracket.deductible;
    const gross = (netIncome - deductible) / (1 - rate - 0.07);
    return gross;
  };

  const handleMonthlyIncomeChange = (value: string) => {
    const income = parseFloat(value) || 0;
    setMonthlyIncome(income);
    setAnnualIncome(income * 12);

    if (calculationMode === "gross") {
      const netIncome = calculateNetIncome(income, monthlyAllowance);
      setMonthlyNetIncome(netIncome);
      setAnnualNetIncome(netIncome * 12);
    }
  };

  const handleAllowanceChange = (value: string) => {
    const allowance = parseFloat(value) || 0;
    setMonthlyAllowance(allowance);

    if (calculationMode === "gross") {
      const netIncome = calculateNetIncome(monthlyIncome, allowance);
      setMonthlyNetIncome(netIncome);
      setAnnualNetIncome(netIncome * 12);
    }
  };

  const handleMonthlyNetIncomeChange = (value: string) => {
    const netIncome = parseFloat(value) || 0;
    setMonthlyNetIncome(netIncome);
    setAnnualNetIncome(netIncome * 12);

    if (calculationMode === "net") {
      const grossIncome = calculateGrossIncome(netIncome);
      setMonthlyIncome(grossIncome);
      setAnnualIncome(grossIncome * 12);
      // Reset allowance in net mode to avoid confusion as reverse calc assumes 0
      setMonthlyAllowance(0); 
    }
  };

  // Perform calculations for rendering
  const monthlyCalc = performFullCalculation(
    deferredMonthlyIncome,
    deferredMonthlyAllowance
  );
  const annualCalc = performFullCalculation(
    annualIncome,
    deferredMonthlyAllowance * 12
  );

  // Additional steps for allowance logic
  const allowanceSteps =
    monthlyAllowance > 0
      ? [
          `Basic Salary: ${monthlyIncome.toLocaleString()} Birr`,
          `Total Allowance: ${monthlyAllowance.toLocaleString()} Birr`,
          `Non-Taxable Limit: min(25% of Basic, 2,200) = ${monthlyCalc.nonTaxableLimit.toLocaleString()} Birr`,
          `Taxable Allowance: ${monthlyAllowance.toLocaleString()} - ${monthlyCalc.nonTaxableLimit.toLocaleString()} = ${monthlyCalc.taxableAllowance.toLocaleString()} Birr`,
          `Total Taxable Income: ${monthlyIncome.toLocaleString()} (Basic) + ${monthlyCalc.taxableAllowance.toLocaleString()} (Excess Allowance) = ${monthlyCalc.totalTaxableIncome.toLocaleString()} Birr`,
        ]
      : [];

  const combinedMonthlySteps = [
    ...allowanceSteps,
    ...monthlyCalc.taxDetails.steps,
  ];

  useSEO({
    title: "Ethiopian Salary Calculator | Utility Hub",
    description:
      "Free online Ethiopian income tax calculator with pension and allowance calculations.",
    path: "/salary-calculation",
    applicationCategory: "FinanceApplication",
    featureList: [
      "Income tax calculation",
      "Pension calculation",
      "Allowance handling",
      "Monthly and annual summaries",
    ],
  });

  return (
    <>
      <div className="max-w-5xl mx-auto p-2 space-y-6 overflow-auto">
        <header className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">
            Ethiopian Salary Calculator
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Free online calculator for Ethiopian employment income tax and pension
          </p>
        </header>

        <main className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-card-foreground sm:text-xl">
              Ethiopian Income Tax (Salary) Calculator
            </h2>

            {/* Mode Toggle */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <span className="text-sm font-medium text-foreground">Calculate from:</span>
                <div className="flex w-full rounded-lg bg-muted p-1 sm:w-auto">
                  <button
                    onClick={() => {
                      setCalculationMode("gross");
                      setMonthlyAllowance(0); // Reset allowance on switch
                    }}
                    className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      calculationMode === "gross"
                        ? "bg-card text-card-foreground shadow-sm ring-2 ring-blue-500"
                        : "text-muted-foreground hover:bg-background hover:text-foreground"
                    }`}
                  >
                    Basic Income
                  </button>
                  <button
                    onClick={() => {
                      setCalculationMode("net");
                      setMonthlyAllowance(0);
                    }}
                    className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      calculationMode === "net"
                        ? "bg-card text-card-foreground shadow-sm ring-2 ring-blue-500"
                        : "text-muted-foreground hover:bg-background hover:text-foreground"
                    }`}
                  >
                    Net Income
                  </button>
                </div>
              </div>
            </div>

            {/* Input Section */}
            <div className="space-y-6 mb-8">
              {/* Income Input */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Monthly {calculationMode === "gross" ? "Basic" : "Net"} Income (Birr)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={
                      calculationMode === "gross"
                        ? monthlyIncome || ""
                        : monthlyNetIncome || ""
                    }
                    onChange={(e) =>
                      calculationMode === "gross"
                        ? handleMonthlyIncomeChange(e.target.value)
                        : handleMonthlyNetIncomeChange(e.target.value)
                    }
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 text-lg text-foreground shadow-sm transition-all focus:border-ring focus:ring-2 focus:ring-ring"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 transform text-sm text-muted-foreground">
                    Birr
                  </div>
                </div>
              </div>

              {/* Allowance Input (Only in Gross Mode) */}
              {calculationMode === "gross" && (
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Monthly Non Taxable Allowance (Birr)
                  </label>
                  <div className="relative mb-2">
                    <input
                      type="number"
                      value={monthlyAllowance || ""}
                      onChange={(e) => handleAllowanceChange(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-4 py-3 text-lg text-foreground shadow-sm transition-all focus:border-ring focus:ring-2 focus:ring-ring"
                      placeholder="Enter total allowance"
                      min="0"
                      step="0.01"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 transform text-sm text-muted-foreground">
                      Birr
                    </div>
                  </div>
                  
                  {/* Allowance Contextual Guide */}
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Max Non-Taxable Limit:</span>
                      <span className="font-medium">{monthlyCalc.nonTaxableLimit.toLocaleString()} Birr</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Taxable Portion:</span>
                      <span className={`${monthlyCalc.taxableAllowance > 0 ? "font-medium text-red-600" : "text-muted-foreground"}`}>
                        {monthlyCalc.taxableAllowance.toLocaleString()} Birr
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      * Up to 25% of your Basic Salary (max 2,200 ETB) is tax-free. Anything above that is taxed.
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Result Preview */}
              {calculationMode === "gross" && (
                <div className="flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                  <span className="font-medium text-green-700 dark:text-green-300">Net Income</span>
                  <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {monthlyNetIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal">Birr</span>
                  </span>
                </div>
              )}
            </div>

            {/* Monthly Breakdown Results */}
            <div className="mb-8">
              <h3 className="mb-4 flex items-center text-lg font-medium text-foreground">
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Monthly Breakdown
              </h3>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {/* 1. Basic Salary */}
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
                  <div className="mb-1 text-xs font-medium text-blue-700 dark:text-blue-300">Basic Salary</div>
                  <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-blue-700/80 dark:text-blue-300/80">Birr</div>
                </div>

                {/* 2. Total Taxable Income */}
                <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-3">
                  <div className="mb-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">Taxable Income</div>
                  <div className="text-lg font-bold text-indigo-900 dark:text-indigo-100">
                    {monthlyCalc.totalTaxableIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-indigo-700/80 dark:text-indigo-300/80">Basic + Excess Allowance</div>
                </div>

                {/* 3. Total Allowance */}
                <div className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-3">
                  <div className="mb-1 text-xs font-medium text-purple-700 dark:text-purple-300">Total Allowance</div>
                  <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                    {monthlyAllowance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-purple-700/80 dark:text-purple-300/80">
                    {monthlyCalc.taxableAllowance > 0 ? `${monthlyCalc.taxableAllowance.toLocaleString()} Taxable` : "Non-Taxable"}
                  </div>
                </div>

                {/* 4. Tax */}
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                  <div className="mb-1 text-xs font-medium text-red-700 dark:text-red-300">Income Tax</div>
                  <div className="text-lg font-bold text-red-900 dark:text-red-100">
                    {monthlyCalc.taxDetails.tax.toFixed(2)}
                  </div>
                  <div className="text-xs text-red-700/80 dark:text-red-300/80">Birr</div>
                </div>

                {/* 5. Pension */}
                <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-3">
                  <div className="mb-1 text-xs font-medium text-orange-700 dark:text-orange-300">Pension (7%)</div>
                  <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
                    {monthlyCalc.pension.toFixed(2)}
                  </div>
                  <div className="text-xs text-orange-700/80 dark:text-orange-300/80">On Basic Salary</div>
                </div>

                {/* 6. Net Income */}
                <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3 shadow-sm">
                  <div className="mb-1 text-xs font-medium text-green-700 dark:text-green-300">Net Income</div>
                  <div className="text-lg font-bold text-green-900 dark:text-green-100">
                    {monthlyNetIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-green-700/80 dark:text-green-300/80">Birr</div>
                </div>
              </div>

              {/* Summary Formula */}
              <div className="mt-4 rounded-lg bg-muted/50 p-3 text-center text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  ({monthlyIncome.toLocaleString()} + {monthlyAllowance.toLocaleString()})
                </span>{" "}
                Gross -{" "}
                <span className="text-red-600 font-medium">{monthlyCalc.taxDetails.tax.toFixed(2)}</span> Tax -{" "}
                <span className="text-orange-600 font-medium">{monthlyCalc.pension.toFixed(2)}</span> Pension ={" "}
                <span className="text-green-700 font-bold">{monthlyNetIncome.toFixed(2)} Birr</span>
              </div>

              {/* Detailed Steps */}
              {combinedMonthlySteps.length > 0 && (
                <div className="mt-6 rounded-lg border border-border bg-card p-4 shadow-sm">
                  <h4 className="mb-4 border-b border-border pb-2 text-sm font-semibold text-card-foreground">Calculation Steps</h4>
                  <div className="space-y-3">
                    {combinedMonthlySteps.map((step, index) => (
                      <div key={index} className="flex items-start text-sm">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                          {index + 1}
                        </span>
                        <span className="pt-0.5 text-muted-foreground">{step}</span>
                      </div>
                    ))}
                    <div className="mt-2 flex items-center border-t border-border pt-2 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                        {combinedMonthlySteps.length + 1}
                      </span>
                      <span className="text-muted-foreground">
                        <strong>Pension:</strong> {monthlyIncome.toLocaleString()} (Basic) × 7% = {monthlyCalc.pension.toFixed(2)} Birr
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Annual Summary (Simplified View) */}
            <div className="border-t pt-6">
               <h3 className="mb-4 text-lg font-medium text-foreground">Annual Summary</h3>
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded border border-border bg-muted/40 p-3">
                    <div className="text-xs text-muted-foreground">Annual Basic</div>
                    <div className="font-semibold">{annualIncome.toLocaleString()}</div>
                  </div>
                  <div className="rounded border border-border bg-muted/40 p-3">
                    <div className="text-xs text-muted-foreground">Annual Tax</div>
                    <div className="font-semibold text-red-600">{annualCalc.taxDetails.tax.toLocaleString(undefined, {maximumFractionDigits:2})}</div>
                  </div>
                  <div className="rounded border border-border bg-muted/40 p-3">
                    <div className="text-xs text-muted-foreground">Annual Pension</div>
                    <div className="font-semibold text-orange-600">{annualCalc.pension.toLocaleString(undefined, {maximumFractionDigits:2})}</div>
                  </div>
                  <div className="rounded border border-border bg-muted/40 p-3">
                    <div className="text-xs text-muted-foreground">Annual Net</div>
                    <div className="font-semibold text-green-600">{annualNetIncome.toLocaleString(undefined, {maximumFractionDigits:2})}</div>
                  </div>
               </div>
            </div>

          </div>
        </main>

        {/* Info Box */}
      <TaxBracketInfo />  
       

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-6">
            <h3 className="mb-2 font-semibold text-blue-700 dark:text-blue-300">How Allowances work</h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-blue-700 dark:text-blue-200">
             <li><strong>Basic Salary</strong> is fully taxable.</li>
             <li><strong>Allowances</strong> are non-taxable up to 25% of Basic Salary or 2,200 Birr (whichever is lower).</li>
             <li>Any allowance amount exceeding this limit(2200) is added to the Basic Salary to form the <strong>Taxable Income</strong>.</li>
             <li>Pension (7%) is calculated only on the Basic Salary.</li>
           </ul>
        </div>
      </div>
    </>
  );
}