import { useSEO } from "@/hooks/use-seo";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/loan-mortgage-calculator")({
  component: RouteComponent,
});

interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

interface LoanResults {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  amortizationSchedule: AmortizationRow[];
}

function RouteComponent() {
  useSEO({
    title: "Loan & Mortgage Calculator",
    description:
      "Calculate monthly payments, total interest, and view amortization schedule for loans and mortgages.",
    keywords: [
      "loan calculator",
      "mortgage calculator",
      "amortization schedule",
      "monthly payment",
      "interest calculator",
    ],
  });

  const [loanAmount, setLoanAmount] = useState<string>("200000");
  const [interestRate, setInterestRate] = useState<string>("5.5");
  const [loanTerm, setLoanTerm] = useState<string>("30");
  const [results, setResults] = useState<LoanResults | null>(null);
  const [showSchedule, setShowSchedule] = useState<boolean>(false);

  const calculateLoan = () => {
    const principal = parseFloat(loanAmount);
    const annualRate = parseFloat(interestRate);
    const years = parseFloat(loanTerm);

    if (
      isNaN(principal) ||
      isNaN(annualRate) ||
      isNaN(years) ||
      principal <= 0 ||
      annualRate < 0 ||
      years <= 0
    ) {
      alert("Please enter valid positive numbers");
      return;
    }

    // Convert annual rate to monthly rate
    const monthlyRate = annualRate / 100 / 12;
    const numberOfPayments = years * 12;

    // Calculate monthly payment using mortgage formula
    // M = P [ i(1 + i)^n ] / [ (1 + i)^n - 1]
    let monthlyPayment: number;

    if (monthlyRate === 0) {
      monthlyPayment = principal / numberOfPayments;
    } else {
      monthlyPayment =
        (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    }

    const totalPayment = monthlyPayment * numberOfPayments;
    const totalInterest = totalPayment - principal;

    // Generate amortization schedule
    const schedule: AmortizationRow[] = [];
    let remainingBalance = principal;

    for (let month = 1; month <= numberOfPayments; month++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance -= principalPayment;

      // Prevent negative balance due to rounding
      if (remainingBalance < 0) {
        remainingBalance = 0;
      }

      schedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: remainingBalance,
      });
    }

    setResults({
      monthlyPayment,
      totalPayment,
      totalInterest,
      amortizationSchedule: schedule,
    });
    setShowSchedule(false);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          💰 Loan & Mortgage Calculator
        </h1>
        <p className="text-muted-foreground">
          Calculate monthly payments, total interest, and view detailed
          amortization schedule for your loan or mortgage.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Loan Details</CardTitle>
            <CardDescription>
              Enter your loan information to calculate payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loanAmount">Loan Amount ($)</Label>
              <Input
                id="loanAmount"
                type="number"
                placeholder="200000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                min="0"
                step="1000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interestRate">Annual Interest Rate (%)</Label>
              <Input
                id="interestRate"
                type="number"
                placeholder="5.5"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                min="0"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loanTerm">Loan Term (Years)</Label>
              <Input
                id="loanTerm"
                type="number"
                placeholder="30"
                value={loanTerm}
                onChange={(e) => setLoanTerm(e.target.value)}
                min="1"
                step="1"
              />
            </div>

            <Button onClick={calculateLoan} className="w-full">
              Calculate
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Calculation Results</CardTitle>
              <CardDescription>
                Your loan payment breakdown
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <span className="text-sm font-medium">Monthly Payment</span>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(results.monthlyPayment)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Total Payment</span>
                  <span className="text-lg font-semibold">
                    {formatCurrency(results.totalPayment)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Total Interest</span>
                  <span className="text-lg font-semibold">
                    {formatCurrency(results.totalInterest)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Loan Amount</span>
                  <span className="text-lg font-semibold">
                    {formatCurrency(parseFloat(loanAmount))}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => setShowSchedule(!showSchedule)}
                variant="outline"
                className="w-full"
              >
                {showSchedule ? "Hide" : "Show"} Amortization Schedule
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Amortization Schedule */}
      {results && showSchedule && (
        <Card>
          <CardHeader>
            <CardTitle>Amortization Schedule</CardTitle>
            <CardDescription>
              Detailed monthly payment breakdown over the life of the loan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border max-h-96 overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-20">Month</TableHead>
                    <TableHead className="text-right">Payment</TableHead>
                    <TableHead className="text-right">Principal</TableHead>
                    <TableHead className="text-right">Interest</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.amortizationSchedule.map((row) => (
                    <TableRow key={row.month}>
                      <TableCell className="font-medium">{row.month}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.payment)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.principal)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.interest)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Section */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              Monthly Payment Formula
            </h3>
            <p>
              The monthly payment is calculated using the standard mortgage
              formula: M = P [ i(1 + i)^n ] / [ (1 + i)^n - 1], where:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>M = Monthly payment</li>
              <li>P = Principal loan amount</li>
              <li>i = Monthly interest rate (annual rate / 12)</li>
              <li>n = Total number of payments (years × 12)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-2">
              Amortization Schedule
            </h3>
            <p>
              The amortization schedule shows how each payment is split between
              principal and interest over time. Early payments have higher
              interest portions, while later payments apply more toward the
              principal.
            </p>
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs">
              <strong>Note:</strong> This calculator provides estimates for
              educational purposes. Actual loan terms may include additional
              fees, insurance, taxes, or other costs not reflected in these
              calculations. Always consult with a financial advisor or lender
              for precise loan terms.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
