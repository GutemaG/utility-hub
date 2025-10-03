import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Age & Date Convertors - Utility Hub",
    url: "https://utility.ethioqr.app/age-and-date-convertors",
    description:
      "Convert between Gregorian and Ethiopian calendars, calculate ages, and perform date operations",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web Browser",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: [
      "Age Calculator",
      "Date Converter",
      "Date Calculator",
      "Date Range Calculator",
      "Ethiopian Calendar Support",
      "Gregorian Calendar Support",
    ],
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

  // Helper to render key-value pairs cleanly
  const KeyValueCard = ({
    title,
    items,
  }: {
    title: string;
    items: { label: string; value: string }[];
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="font-semibold text-lg text-gray-800 mb-3">{title}</h3>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">{item.label}</span>
            <span className="font-mono text-gray-900 bg-gray-50 px-2.5 py-1 rounded text-sm">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Hidden SEO Metadata */}
      <div className="hidden">
        <title>Age & Date Convertor - Utility Hub</title>
        <meta
          name="description"
          content="Convert between Gregorian and Ethiopian calendars, calculate ages, and perform date operations"
        />
        <meta
          name="keywords"
          content="Age Calculator, Date Converter, Ethiopian Calendar, Gregorian Calendar, Date Operations"
        />
        <meta name="author" content="FormulaLab" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Ethiopian Age and Date Convertor" />
        <meta
          property="og:description"
          content="Convert between Gregorian and Ethiopian calendars, calculate ages, and perform date operations"
        />
        <meta
          property="og:url"
          content="https://utility.ethioqr.app/age-and-date-convertors"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <link
          rel="canonical"
          href="https://utility.ethioqr.app/age-and-date-convertors"
        />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Age & Date Convertors
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
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
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
            <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
                Age Calculator
              </h2>
              <p className="text-gray-600 text-center mb-6">
                Calculate age between two dates in both Gregorian and Ethiopian
                calendars
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Birth Date
                  </label>
                  <EthiopianGregorianDatePicker
                    date={birthDate}
                    setDate={setBirthDate}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
                Date Converter
              </h2>
              <p className="text-gray-600 text-center mb-6">
                Convert dates between Gregorian and Ethiopian calendars
              </p>

              <div className="max-w-md mx-auto mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
                Date Calculator
              </h2>
              <p className="text-gray-600 text-center mb-8">
                Add or subtract time from a date
              </p>

              {/* Base Date */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Operation
                  </label>
                  <select
                    value={operation}
                    onChange={(e) =>
                      setOperation(e.target.value as "add" | "subtract")
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  >
                    <option value="add">Add</option>
                    <option value="subtract">Subtract</option>
                  </select>
                </div>

                {/* Value */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Value
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={operationValue}
                    onChange={(e) =>
                      setOperationValue(parseInt(e.target.value) || 0)
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit
                  </label>
                  <select
                    value={operationUnit}
                    onChange={(e) =>
                      setOperationUnit(
                        e.target.value as "years" | "months" | "days"
                      )
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
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
