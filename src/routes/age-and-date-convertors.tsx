import { useSEO } from "@/hooks/use-seo";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  format,
  differenceInYears,
  differenceInMonths,
  differenceInDays,
  addYears,
  addMonths,
  addDays,
  subYears,
  subMonths,
  subDays,
} from "date-fns";
import { formatEthiopianDate } from "@/lib/EthiopianDateUtils";
import { EthiopianGregorianDatePicker } from "@/components/calendars/ethiopian-gregorian-date-picker";

export const Route = createFileRoute("/age-and-date-convertors")({
  component: RouteComponent,
});

function RouteComponent() {
  useSEO({
    title: "Age & Date Converter | Utility Hub",
    description:
      "Convert between Gregorian and Ethiopian calendars, calculate ages, and perform date operations.",
    path: "/age-and-date-convertors",
    keywords:
      "age calculator, date converter, ethiopian calendar, gregorian calendar, date operations",
    applicationCategory: "Tool",
    featureList: [
      "Age calculator",
      "Date converter",
      "Date calculator",
      "Date range calculator",
      "Ethiopian calendar support",
    ],
  });

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [birthDate, setBirthDate] = useState<Date>(new Date());
  const [targetDate, setTargetDate] = useState<Date>(new Date());
  const [operation, setOperation] = useState<"add" | "subtract">("add");
  const [operationValue, setOperationValue] = useState<number>(1);
  const [operationUnit, setOperationUnit] = useState<
    "years" | "months" | "days"
  >("years");
  const [activeTab, setActiveTab] = useState<string>("date-converter");

  const calculateAge = (birth: Date, target: Date) => {
    const years = differenceInYears(target, birth);
    const months = differenceInMonths(target, birth) % 12;
    const days = differenceInDays(target, birth) % 30;
    return { years, months, days };
  };

  const performDateOperation = (
    date: Date,
    operation: "add" | "subtract",
    value: number,
    unit: "years" | "months" | "days"
  ) => {
    if (operation === "add") {
      switch (unit) {
        case "years":
          return addYears(date, value);
        case "months":
          return addMonths(date, value);
        case "days":
          return addDays(date, value);
      }
    } else {
      switch (unit) {
        case "years":
          return subYears(date, value);
        case "months":
          return subMonths(date, value);
        case "days":
          return subDays(date, value);
      }
    }
    return date;
  };

  const age = calculateAge(birthDate, targetDate);
  const resultDate = performDateOperation(
    selectedDate,
    operation,
    operationValue,
    operationUnit
  );

  // Helper to render key-value pairs cleanly
  const KeyValueCard = ({
    title,
    items,
  }: {
    title: string;
    items: { label: string; value: string }[];
  }) => (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold text-card-foreground">{title}</h3>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <span className="rounded bg-muted px-2.5 py-1 font-mono text-sm text-foreground">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">
            Age & Date Convertors
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Convert between Gregorian and Ethiopian calendars, calculate ages,
            and perform date operations
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {[
            { id: "date-converter", label: "Date Converter" },
            { id: "age-calculator", label: "Age Calculator" },
            { id: "date-calculator", label: "Date Calculator" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-full font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {/* Age Calculator */}
          {activeTab === "age-calculator" && (
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <h2 className="mb-2 text-center text-2xl font-bold text-card-foreground">
                Age Calculator
              </h2>
              <p className="mb-6 text-center text-muted-foreground">
                Calculate age between two dates in both Gregorian and Ethiopian
                calendars
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Birth Date
                  </label>
                  <EthiopianGregorianDatePicker
                    date={birthDate}
                    setDate={setBirthDate}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Target Date
                  </label>
                  <EthiopianGregorianDatePicker
                    date={targetDate}
                    setDate={setTargetDate}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <KeyValueCard
                  title="Ethiopian Calendar"
                  items={[
                    {
                      label: "Birth Date",
                      value: formatEthiopianDate(birthDate, "PPPP"),
                    },
                    {
                      label: "Target Date",
                      value: formatEthiopianDate(targetDate, "PPPP"),
                    },
                    {
                      label: "Age",
                      value: `${age.years}y ${age.months}m ${age.days}d`,
                    },
                  ]}
                />
                <KeyValueCard
                  title="Gregorian Calendar"
                  items={[
                    { label: "Birth Date", value: format(birthDate, "PPPP") },
                    { label: "Target Date", value: format(targetDate, "PPPP") },
                    {
                      label: "Age",
                      value: `${age.years}y ${age.months}m ${age.days}d`,
                    },
                  ]}
                />
              </div>
            </div>
          )}

          {/* Date Converter */}
          {activeTab === "date-converter" && (
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <h2 className="mb-2 text-center text-2xl font-bold text-card-foreground">
                Date Converter
              </h2>
              <p className="mb-6 text-center text-muted-foreground">
                Convert dates between Gregorian and Ethiopian calendars
              </p>

              <div className="max-w-md mx-auto mb-8">
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Select Date
                </label>
                <EthiopianGregorianDatePicker
                  date={selectedDate}
                  setDate={setSelectedDate}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <KeyValueCard
                  title="Ethiopian Calendar"
                  items={[
                    {
                      label: "Date",
                      value: formatEthiopianDate(selectedDate, "PPPP"),
                    },
                    {
                      label: "ISO",
                      value: formatEthiopianDate(selectedDate, "yyyy-MM-dd"),
                    },
                    {
                      label: "Day",
                      value: formatEthiopianDate(selectedDate, "cccc"),
                    },
                  ]}
                />
                <KeyValueCard
                  title="Gregorian Calendar"
                  items={[
                    { label: "Date", value: format(selectedDate, "PPP") },
                    { label: "ISO", value: format(selectedDate, "yyyy-MM-dd") },
                    { label: "Day", value: format(selectedDate, "EEEE") },
                  ]}
                />
              </div>
            </div>
          )}

          {/* Date Calculator */}
          {activeTab === "date-calculator" && (
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <h2 className="mb-2 text-center text-2xl font-bold text-card-foreground">
                Date Calculator
              </h2>
              <p className="mb-8 text-center text-muted-foreground">
                Add or subtract time from a date
              </p>

              {/* Base Date */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Base Date
                </label>
                <EthiopianGregorianDatePicker
                  date={selectedDate}
                  setDate={setSelectedDate}
                />
              </div>

              {/* Operation Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                {/* Operation */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Operation
                  </label>
                  <select
                    value={operation}
                    onChange={(e) =>
                      setOperation(e.target.value as "add" | "subtract")
                    }
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
                  >
                    <option value="add">Add</option>
                    <option value="subtract">Subtract</option>
                  </select>
                </div>

                {/* Value */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Value
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={operationValue}
                    onChange={(e) =>
                      setOperationValue(parseInt(e.target.value) || 0)
                    }
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Unit */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Unit
                  </label>
                  <select
                    value={operationUnit}
                    onChange={(e) =>
                      setOperationUnit(
                        e.target.value as "years" | "months" | "days"
                      )
                    }
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring"
                  >
                    <option value="years">Years</option>
                    <option value="months">Months</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              </div>

              {/* Result */}
              <div className="max-w-md mx-auto">
                <KeyValueCard
                  title="Result"
                  items={[
                    { label: "Gregorian", value: format(resultDate, "PPPP") },
                    {
                      label: "Ethiopian",
                      value: formatEthiopianDate(resultDate, "PPPP"),
                    },
                  ]}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
