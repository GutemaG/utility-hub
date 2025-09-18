import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/salary-calculation")({
  component: RouteComponent,
});

interface TaxBracket {
  min: number;
  max: number | null;
  rate: number; // Stored as percentage, e.g., 15 for 15%
  deductible: number;
}

const taxBrackets: TaxBracket[] = [
  { min: 0, max: 2000.0, rate: 0, deductible: 0 },
  { min: 2001.0, max: 4000.0, rate: 15, deductible: 300 },
  { min: 4001.0, max: 7000.0, rate: 20, deductible: 500 },
  { min: 7001.0, max: 10000.0, rate: 25, deductible: 850 },
  { min: 10001.0, max: 14000.0, rate: 30, deductible: 1350 },
  { min: 14001.0, max: null, rate: 35, deductible: 2050 },
];

function RouteComponent() {
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [monthlyNetIncome, setMonthlyNetIncome] = useState<number>(0);
  const [annualIncome, setAnnualIncome] = useState<number>(0);
  const [annualNetIncome, setAnnualNetIncome] = useState<number>(0);
  const [calculationMode, setCalculationMode] = useState<"gross" | "net">(
    "gross"
  );

  const calculateTax = (
    income: number
  ): {
    tax: number;
    taxableIncome: number;
    deductible: number;
    steps: string[];
  } => {
    if (income <= 0)
      return { tax: 0, taxableIncome: 0, deductible: 0, steps: [] };

    let totalTax = 0;
    let totalDeductible = 0;
    const steps: string[] = [];

    // Find the applicable tax bracket
    // const applicableBracket = taxBrackets.find(bracket =>
    //   bracket.max ? (income >= bracket.min && income <= bracket.max) : income >= bracket.min
    // )
    const applicableBracket = taxBrackets.find((bracket) =>
      bracket.max
        ? Math.ceil(income) >= bracket.min && Math.ceil(income) <= bracket.max
        : income >= bracket.min
    );
    if (applicableBracket) {
      totalDeductible = applicableBracket.deductible;
      const grossTax = (income * applicableBracket.rate) / 100;
      totalTax = Math.max(0, grossTax - totalDeductible);

      // Generate calculation steps
      steps.push(`Income: ${income.toLocaleString()} Birr`);
      steps.push(`Tax Rate: ${applicableBracket.rate}%`);
      steps.push(
        `Gross Tax: ${income.toLocaleString()} × ${applicableBracket.rate / 100} = ${grossTax.toFixed(2)} Birr`
      );
      steps.push(`Deductible: ${totalDeductible.toLocaleString()} Birr`);
      steps.push(
        `Final Tax: ${grossTax.toFixed(2)} - ${totalDeductible.toLocaleString()} = ${totalTax.toFixed(2)} Birr`
      );
    }

    return {
      tax: totalTax,
      taxableIncome: income,
      deductible: totalDeductible,
      steps,
    };
  };

  const calculatePension = (income: number): number => {
    return income * 0.07;
  };

  const calculateNetIncome = (grossIncome: number): number => {
    if (grossIncome <= 0) return 0;
    const tax = calculateTax(grossIncome).tax;
    const pension = calculatePension(grossIncome);
    return grossIncome - tax - pension;
  };

  // ** NEW, ACCURATE REVERSE CALCULATION **
  const calculateGrossIncome = (netIncome: number): number => {
    if (netIncome <= 0) return 0;

    // The formula is: Net = Gross - Tax - Pension
    // Net = Gross - ((Gross * Rate) - Deductible) - (Gross * 0.07)
    // Net = Gross - (Gross * Rate) + Deductible - (Gross * 0.07)
    // Net - Deductible = Gross * (1 - Rate - 0.07)
    // Gross = (Net - Deductible) / (1 - Rate/100 - 0.07)

    // We need to find which bracket the netIncome falls into.
    // We do this by calculating the net income at the *start* of each gross bracket.
    for (let i = 0; i < taxBrackets.length; i++) {
      const bracket = taxBrackets[i];
      const nextBracket = taxBrackets[i + 1];

      // Calculate the net income at the lower bound of the current gross bracket
      const netAtMin = calculateNetIncome(bracket.min);

      // If there's a next bracket, calculate the net income at its lower bound
      // This gives us the net income range for the current bracket.
      const netAtNextMin = nextBracket
        ? calculateNetIncome(nextBracket.min)
        : Infinity;

      if (netIncome >= netAtMin && netIncome < netAtNextMin) {
        const rate = bracket.rate / 100; // convert percentage to decimal
        const deductible = bracket.deductible;

        // Apply the reversed formula
        const gross = (netIncome - deductible) / (1 - rate - 0.07);
        return gross;
      }
    }

    // Fallback for the highest bracket (where there is no nextBracket)
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
      const netIncome = calculateNetIncome(income);
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
    }
  };

  const monthlyTaxCalculation = calculateTax(monthlyIncome);
  const monthlyPension = calculatePension(monthlyIncome);
  const annualTaxCalculation = calculateTax(annualIncome);
  const annualPension = calculatePension(annualIncome);

  // SEO structured data for tax calculator
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Ethiopian Tax Calculator",
    description:
      "Free online Ethiopian income tax calculator with pension calculations. Calculate tax from gross or net income with detailed breakdowns.",
    url: "https://utility.ethioar.app/salary-calculation",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Income tax calculation",
      "Pension calculation",
      "Tax bracket information",
      "Gross to net conversion",
      "Net to gross conversion",
    ],
  };

  // Add structured data to page head
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
      {/* SEO Meta Tags */}
      <div style={{ display: "none" }}>
        <title>Ethiopian Salary Calculator</title>
        <meta
          name="description"
          content="Free Ethiopian tax calculator for 2024. Calculate income tax, pension, and net salary with detailed breakdowns. Supports both gross to net and net to gross calculations."
        />
        <meta
          name="keywords"
          content="Ethiopian tax calculator, income tax calculator, tax bracket calculator, pension calculator, salary calculator, Ethiopia tax 2024, gross to net salary"
        />
        <meta name="author" content="FormulaLab" />
        <meta name="robots" content="index, follow" />
        <meta
          property="og:title"
          content="Ethiopian Tax Calculator 2024 - Free Income Tax & Pension Calculator"
        />
        <meta
          property="og:description"
          content="Calculate your Ethiopian income tax and pension with our free online calculator. Get detailed breakdowns and tax bracket information."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content="https://utility.ethioqr.app/salary-calculation"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Ethiopian Tax Calculator 2024" />
        <meta
          name="twitter:description"
          content="Free Ethiopian tax calculator with detailed breakdowns and tax bracket information."
        />
        <link
          rel="canonical"
          href="https://utility.ethioqr.app/salary-calculation"
        />
      </div>

      <div className="max-w-4xl mx-auto p-2 space-y-6 overflow-auto">
        <header className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Ethiopian Salary Calculator
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Free online calculator for Ethiopian employment income tax and
            pension calculations
          </p>
        </header>

        {/* Tax Calculator */}
        <main className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
              Ethiopian Income Tax(Salary) Calculator
            </h2>

            {/* Calculation Mode Toggle */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <span className="text-sm font-medium text-gray-700">
                  Calculate from:
                </span>
                <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
                  <button
                    onClick={() => setCalculationMode("gross")}
                    className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      calculationMode === "gross"
                        ? "bg-white text-gray-900 shadow-sm ring-2 ring-blue-500"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Gross Income
                  </button>
                  <button
                    onClick={() => setCalculationMode("net")}
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

            {/* Income Input */}
            <div className="mb-6">
              <label
                htmlFor="monthlyIncome"
                className="block text-sm font-medium text-gray-700 mb-3"
              >
                Monthly {calculationMode === "gross" ? "Gross" : "Net"} Income
                (Birr)
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="monthlyIncome"
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
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder={`Enter monthly ${calculationMode === "gross" ? "gross" : "net"} income`}
                  min="0"
                  step="0.01"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                  Birr
                </div>
              </div>

              {calculationMode == "gross" && (
                <div className="mt-3 bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <div className="text-xs text-green-600 font-medium mb-1">
                    Net Income
                  </div>
                  <div className="text-lg font-bold text-green-900">
                    {monthlyNetIncome.toFixed(2)}
                  </div>
                  <div className="text-xs text-green-600">Birr</div>
                </div>
              )}
            </div>

            {/* Monthly Results */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <svg
                  className="w-5 h-5 text-blue-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v16a2 2 0 002 2z"
                  />
                </svg>
                Monthly Breakdown
              </h3>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="text-xs text-blue-600 font-medium mb-1">
                    Gross Income
                  </div>
                  <div className="text-lg font-bold text-blue-900">
                    {monthlyIncome.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-xs text-blue-600">Birr</div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                  <div className="text-xs text-red-600 font-medium mb-1">
                    Tax
                  </div>
                  <div className="text-lg font-bold text-red-900">
                    {monthlyTaxCalculation.tax.toFixed(2)}
                  </div>
                  <div className="text-xs text-red-600">Birr</div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                  <div className="text-xs text-orange-600 font-medium mb-1">
                    Pension (7%)
                  </div>
                  <div className="text-lg font-bold text-orange-900">
                    {monthlyPension.toFixed(2)}
                  </div>
                  <div className="text-xs text-orange-600">Birr</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <div className="text-xs text-green-600 font-medium mb-1">
                    Net Income
                  </div>
                  <div className="text-lg font-bold text-green-900">
                    {monthlyNetIncome.toFixed(2)}
                  </div>
                  <div className="text-xs text-green-600">Birr</div>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-700 text-center">
                  <span className="font-medium">
                    {monthlyIncome.toFixed(2)}
                  </span>{" "}
                  -{" "}
                  <span className="text-red-600 font-medium">
                    {monthlyTaxCalculation.tax.toFixed(2)}
                  </span>{" "}
                  -{" "}
                  <span className="text-orange-600 font-medium">
                    {monthlyPension.toFixed(2)}
                  </span>{" "}
                  ={" "}
                  <span className="text-green-600 font-bold">
                    {monthlyNetIncome.toFixed(2)} Birr
                  </span>
                </div>
              </div>

              {/* Calculation Steps */}
              {monthlyTaxCalculation.steps.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    Calculation Steps
                  </h4>
                  <div className="space-y-2">
                    {monthlyTaxCalculation.steps.map((step, index) => (
                      <div
                        key={index}
                        className="text-sm text-blue-700 flex items-start"
                      >
                        <span className="w-5 h-5 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5 flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="text-sm text-blue-700 flex items-center">
                      <span className="w-5 h-5 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3 flex-shrink-0">
                        {monthlyTaxCalculation.steps.length + 1}
                      </span>
                      <span>
                        <strong>Pension:</strong>{" "}
                        {monthlyIncome.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        × 7% = {monthlyPension.toFixed(2)} Birr
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Annual Results */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Annual Summary
              </h3>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                  <div className="text-xs text-blue-600 font-medium mb-1">
                    Gross Annual
                  </div>
                  <div className="text-base font-bold text-blue-900">
                    {annualIncome.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-xs text-blue-600">Birr</div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 rounded-lg border border-red-200">
                  <div className="text-xs text-red-600 font-medium mb-1">
                    Annual Tax
                  </div>
                  <div className="text-base font-bold text-red-900">
                    {annualTaxCalculation.tax.toFixed(2)}
                  </div>
                  <div className="text-xs text-red-600">Birr</div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg border border-orange-200">
                  <div className="text-xs text-orange-600 font-medium mb-1">
                    Annual Pension
                  </div>
                  <div className="text-base font-bold text-orange-900">
                    {annualPension.toFixed(2)}
                  </div>
                  <div className="text-xs text-orange-600">Birr</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                  <div className="text-xs text-green-600 font-medium mb-1">
                    Net Annual
                  </div>
                  <div className="text-base font-bold text-green-900">
                    {annualNetIncome.toFixed(2)}
                  </div>
                  <div className="text-xs text-green-600">Birr</div>
                </div>
              </div>

              {/* Annual Summary */}
              <div className="p-4 bg-gray-50 rounded-lg"></div>

              {/* Annual Calculation Steps */}
              {annualTaxCalculation.steps.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    Annual Calculation Steps
                  </h4>
                  <div className="space-y-2">
                    {annualTaxCalculation.steps.map((step, index) => (
                      <div
                        key={index}
                        className="text-sm text-blue-700 flex items-start"
                      >
                        <span className="w-5 h-5 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5 flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="text-sm text-blue-700 flex items-center">
                      <span className="w-5 h-5 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3 flex-shrink-0">
                        {annualTaxCalculation.steps.length + 1}
                      </span>
                      <span>
                        <strong>Pension:</strong>{" "}
                        {annualIncome.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        × 7% = {annualPension.toFixed(2)} Birr
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Information Box */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 sm:p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-blue-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-base font-medium text-blue-800 mb-3">
                How the calculation works
              </h3>
              <div className="text-sm text-blue-700 space-y-2">
                <p>
                  • <strong>Tax Formula:</strong> Tax = (Gross Income × Tax
                  Rate) - Deductible Amount
                </p>
                <p>
                  • <strong>Pension Formula:</strong> Pension = Gross Income ×
                  7%
                </p>
                <p>
                  • <strong>Net Income Formula:</strong> Net = Gross Income -
                  Tax - Pension
                </p>
                <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                  <p className="font-medium text-blue-800 mb-2">
                    Example for 10,001 Birr Gross:
                  </p>
                  <div className="space-y-1 text-sm">
                    <p>• Gross Tax = 10,001 × 30% = 3,000.30 Birr</p>
                    <p>• Final Tax = 3,000.30 - 1,350 = 1,650.30 Birr</p>
                    <p>• Pension = 10,001 × 7% = 700.07 Birr</p>
                    <p>
                      • Net Income = 10,001 - 1,650.30 - 700.07 = 7,650.63 Birr
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tax Brackets Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Tax Brackets & Deductibles
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Income (Birr)
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tax Rate
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deductible
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Formula
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {taxBrackets.map((bracket, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {bracket.min.toLocaleString()} -{" "}
                      {bracket.max ? bracket.max.toLocaleString() : "∞"}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {bracket.rate}%
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bracket.deductible.toLocaleString()} Birr
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bracket.rate > 0 ? (
                        <span className="font-mono text-xs">
                          (Income × {bracket.rate}%) -{" "}
                          {bracket.deductible.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-green-600 font-medium">
                          No tax
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
