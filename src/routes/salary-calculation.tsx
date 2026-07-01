import { TaxBracketInfo } from "@/components/tax-bracket-info";
import { taxBrackets } from "@/lib/constants";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

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
  const monthlyCalc = performFullCalculation(monthlyIncome, monthlyAllowance);
  const annualCalc = performFullCalculation(annualIncome, monthlyAllowance * 12);

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

  // SEO structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Ethiopian Tax Calculator",
    description: "Free online Ethiopian income tax calculator with pension and allowance calculations.",
    url: "https://utility.ethioar.app/salary-calculation",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web Browser",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="max-w-5xl mx-auto p-2 space-y-6 overflow-auto">
        <header className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Ethiopian Salary Calculator
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Free online calculator for Ethiopian employment income tax and pension
          </p>
        </header>

        <main className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
              Ethiopian Income Tax (Salary) Calculator
            </h2>

            {/* Mode Toggle */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <span className="text-sm font-medium text-gray-700">Calculate from:</span>
                <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setCalculationMode("gross");
                      setMonthlyAllowance(0); // Reset allowance on switch
                    }}
                    className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      calculationMode === "gross"
                        ? "bg-white text-gray-900 shadow-sm ring-2 ring-blue-500"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
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
                        ? "bg-white text-gray-900 shadow-sm ring-2 ring-blue-500"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                    Birr
                  </div>
                </div>
              </div>

              {/* Allowance Input (Only in Gross Mode) */}
              {calculationMode === "gross" && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Non Taxable Allowance (Birr)
                  </label>
                  <div className="relative mb-2">
                    <input
                      type="number"
                      value={monthlyAllowance || ""}
                      onChange={(e) => handleAllowanceChange(e.target.value)}
                      className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Enter total allowance"
                      min="0"
                      step="0.01"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                      Birr
                    </div>
                  </div>
                  
                  {/* Allowance Contextual Guide */}
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between text-gray-600">
                      <span>Max Non-Taxable Limit:</span>
                      <span className="font-medium">{monthlyCalc.nonTaxableLimit.toLocaleString()} Birr</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Taxable Portion:</span>
                      <span className={`${monthlyCalc.taxableAllowance > 0 ? "text-red-600 font-medium" : "text-gray-600"}`}>
                        {monthlyCalc.taxableAllowance.toLocaleString()} Birr
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      * Up to 25% of your Basic Salary (max 2,200 ETB) is tax-free. Anything above that is taxed.
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Result Preview */}
              {calculationMode === "gross" && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200 flex justify-between items-center">
                  <span className="text-green-800 font-medium">Net Income</span>
                  <span className="text-2xl font-bold text-green-700">
                    {monthlyNetIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal">Birr</span>
                  </span>
                </div>
              )}
            </div>

            {/* Monthly Breakdown Results */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Monthly Breakdown
              </h3>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {/* 1. Basic Salary */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <div className="text-xs text-blue-600 font-medium mb-1">Basic Salary</div>
                  <div className="text-lg font-bold text-blue-900">
                    {monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-blue-500">Birr</div>
                </div>

                {/* 2. Total Taxable Income */}
                <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                  <div className="text-xs text-indigo-600 font-medium mb-1">Taxable Income</div>
                  <div className="text-lg font-bold text-indigo-900">
                    {monthlyCalc.totalTaxableIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-indigo-500">Basic + Excess Allowance</div>
                </div>

                {/* 3. Total Allowance */}
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                  <div className="text-xs text-purple-600 font-medium mb-1">Total Allowance</div>
                  <div className="text-lg font-bold text-purple-900">
                    {monthlyAllowance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-purple-500">
                    {monthlyCalc.taxableAllowance > 0 ? `${monthlyCalc.taxableAllowance.toLocaleString()} Taxable` : "Non-Taxable"}
                  </div>
                </div>

                {/* 4. Tax */}
                <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                  <div className="text-xs text-red-600 font-medium mb-1">Income Tax</div>
                  <div className="text-lg font-bold text-red-900">
                    {monthlyCalc.taxDetails.tax.toFixed(2)}
                  </div>
                  <div className="text-xs text-red-500">Birr</div>
                </div>

                {/* 5. Pension */}
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                  <div className="text-xs text-orange-600 font-medium mb-1">Pension (7%)</div>
                  <div className="text-lg font-bold text-orange-900">
                    {monthlyCalc.pension.toFixed(2)}
                  </div>
                  <div className="text-xs text-orange-500">On Basic Salary</div>
                </div>

                {/* 6. Net Income */}
                <div className="bg-green-50 p-3 rounded-lg border border-green-100 shadow-sm">
                  <div className="text-xs text-green-600 font-medium mb-1">Net Income</div>
                  <div className="text-lg font-bold text-green-900">
                    {monthlyNetIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-green-500">Birr</div>
                </div>
              </div>

              {/* Summary Formula */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center text-sm text-gray-600">
                <span className="font-medium text-gray-900">
                  ({monthlyIncome.toLocaleString()} + {monthlyAllowance.toLocaleString()})
                </span>{" "}
                Gross -{" "}
                <span className="text-red-600 font-medium">{monthlyCalc.taxDetails.tax.toFixed(2)}</span> Tax -{" "}
                <span className="text-orange-600 font-medium">{monthlyCalc.pension.toFixed(2)}</span> Pension ={" "}
                <span className="text-green-700 font-bold">{monthlyNetIncome.toFixed(2)} Birr</span>
              </div>

              {/* Detailed Steps */}
              {combinedMonthlySteps.length > 0 && (
                <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">Calculation Steps</h4>
                  <div className="space-y-3">
                    {combinedMonthlySteps.map((step, index) => (
                      <div key={index} className="flex items-start text-sm">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                          {index + 1}
                        </span>
                        <span className="text-gray-700 pt-0.5">{step}</span>
                      </div>
                    ))}
                    <div className="flex items-center text-sm pt-2 border-t mt-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                        {combinedMonthlySteps.length + 1}
                      </span>
                      <span className="text-gray-700">
                        <strong>Pension:</strong> {monthlyIncome.toLocaleString()} (Basic) × 7% = {monthlyCalc.pension.toFixed(2)} Birr
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Annual Summary (Simplified View) */}
            <div className="border-t pt-6">
               <h3 className="text-lg font-medium text-gray-900 mb-4">Annual Summary</h3>
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="text-xs text-gray-500">Annual Basic</div>
                    <div className="font-semibold">{annualIncome.toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="text-xs text-gray-500">Annual Tax</div>
                    <div className="font-semibold text-red-600">{annualCalc.taxDetails.tax.toLocaleString(undefined, {maximumFractionDigits:2})}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="text-xs text-gray-500">Annual Pension</div>
                    <div className="font-semibold text-orange-600">{annualCalc.pension.toLocaleString(undefined, {maximumFractionDigits:2})}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="text-xs text-gray-500">Annual Net</div>
                    <div className="font-semibold text-green-600">{annualNetIncome.toLocaleString(undefined, {maximumFractionDigits:2})}</div>
                  </div>
               </div>
            </div>

          </div>
        </main>

        {/* Info Box */}
      <TaxBracketInfo />  
       

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
           <h3 className="font-semibold text-blue-900 mb-2">How Allowances work</h3>
           <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
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