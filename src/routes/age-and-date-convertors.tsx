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
import DatePicker from "@/components/date-picker";
import DateRangePicker from "@/components/date-range-picker";

export const Route = createFileRoute("/age-and-date-convertors")({
  component: RouteComponent,
});

function RouteComponent() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [birthDate, setBirthDate] = useState<Date>(new Date());
  const [targetDate, setTargetDate] = useState<Date>(new Date());
  const [dateRange] = useState<{ from: Date; to: Date } | undefined>();
  const [operation, setOperation] = useState<"add" | "subtract">("add");
  const [operationValue, setOperationValue] = useState<number>(1);
  const [operationUnit, setOperationUnit] = useState<
    "years" | "months" | "days"
  >("years");
  const [activeTab, setActiveTab] = useState<string>("age-calculator");

  // Calculate age
  const calculateAge = (birth: Date, target: Date) => {
    const years = differenceInYears(target, birth);
    const months = differenceInMonths(target, birth) % 12;
    const days = differenceInDays(target, birth) % 30;

    return { years, months, days };
  };

  // Calculate date difference
  const calculateDateDifference = (date1: Date, date2: Date) => {
    const years = Math.abs(differenceInYears(date1, date2));
    const months = Math.abs(differenceInMonths(date1, date2) % 12);
    const days = Math.abs(differenceInDays(date1, date2) % 30);

    return { years, months, days };
  };

  // Perform date operation
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
  const dateDiff = dateRange
    ? calculateDateDifference(dateRange.from, dateRange.to)
    : null;
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
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Age Calculator",
      "Date Converter",
      "Date Calculator",
      "Date Range Calculator",
      "Ethiopian Calendar Support",
      "Gregorian Calendar Support",
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
      <div style={{ display: "none" }}>
        <title>Age Date Convertor- Utility Hub</title>
        <meta
          name="description"
          content="Convert between Gregorian and Ethiopian calendars, calculate ages, and perform date operations"
        />
        <meta
          name="keywords"
          content="Age Calculator, Date Converter, Date Calculator, Date Range Calculator, Ethiopian Calendar, Gregorian Calendar, Date Operations, Online Tools"
        />
        <meta name="author" content="FormulaLab" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Ethiopian Age and date convertor" />
        <meta
          property="og:description"
          content="Convert between Gregorian and Ethiopian calendars, calculate ages, and perform date operations"
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content="https://utility.ethioqr.app/age-and-date-convertors"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Age Converter" />
        <meta
          name="twitter:description"
          content="Convert between Gregorian and Ethiopian calendars, calculate ages, and perform date operations"
        />
        <link
          rel="canonical"
          href="https://utility.ethioqr.app/age-and-date-convertors"
        />
      </div>
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Age & Date Convertors</h1>
          <p className="text-gray-600">
            Convert between Gregorian and Ethiopian calendars, calculate ages,
            and perform date operations
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            { id: "age-calculator", label: "Age Calculator" },
            { id: "date-converter", label: "Date Converter" },
            { id: "date-calculator", label: "Date Calculator" },
            { id: "date-range", label: "Date Range" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Age Calculator Tab */}
        {activeTab === "age-calculator" && (
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800">
                Age Calculator
              </h2>
              <p className="text-gray-600">
                Calculate age between two dates in both Gregorian and Ethiopian
                calendars
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Birth Date
                </label>
                <DatePicker date={birthDate} setDate={setBirthDate} />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Target Date
                </label>
                <DatePicker date={targetDate} setDate={setTargetDate} />
              </div>
            </div>

            <hr className="my-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-gray-800">
                  Gregorian Calendar
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Birth Date:</span>
                    <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                      {format(birthDate, "PPP")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Target Date:</span>
                    <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                      {format(targetDate, "PPP")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age:</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded font-medium">
                      {age.years}y {age.months}m {age.days}d
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-gray-800">
                  Ethiopian Calendar
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Birth Date:</span>
                    <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                      {formatEthiopianDate(birthDate, "PPP")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Target Date:</span>
                    <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                      {formatEthiopianDate(targetDate, "PPP")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age:</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded font-medium">
                      {age.years}y {age.months}m {age.days}d
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Date Converter Tab */}
        {activeTab === "date-converter" && (
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800">
                Date Converter
              </h2>
              <p className="text-gray-600">
                Convert dates between Gregorian and Ethiopian calendars
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Date
              </label>
              <DatePicker date={selectedDate} setDate={setSelectedDate} />
            </div>

            <hr className="my-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-gray-800">
                  Gregorian Calendar
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                      {format(selectedDate, "PPP")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ISO:</span>
                    <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                      {format(selectedDate, "yyyy-MM-dd")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Day of Week:</span>
                    <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                      {format(selectedDate, "EEEE")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-gray-800">
                  Ethiopian Calendar
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                      {formatEthiopianDate(selectedDate, "PPP")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ISO:</span>
                    <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                      {formatEthiopianDate(selectedDate, "yyyy-MM-dd")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Day of Week:</span>
                    <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                      {formatEthiopianDate(selectedDate, "cccc")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Date Calculator Tab */}
        {activeTab === "date-calculator" && (
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800">
                Date Calculator
              </h2>
              <p className="text-gray-600">Add or subtract time from a date</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Base Date
                </label>
                <DatePicker date={selectedDate} setDate={setSelectedDate} />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Operation
                </label>
                <select
                  value={operation}
                  onChange={(e) =>
                    setOperation(e.target.value as "add" | "subtract")
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="add">Add</option>
                  <option value="subtract">Subtract</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Value
                </label>
                <input
                  type="number"
                  value={operationValue}
                  onChange={(e) =>
                    setOperationValue(parseInt(e.target.value) || 0)
                  }
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Unit
                </label>
                <select
                  value={operationUnit}
                  onChange={(e) =>
                    setOperationUnit(
                      e.target.value as "years" | "months" | "days"
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="years">Years</option>
                  <option value="months">Months</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>

            <hr className="my-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-gray-800">
                  Original Date
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gregorian:</span>
                    <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                      {format(selectedDate, "PPP")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ethiopian:</span>
                    <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                      {formatEthiopianDate(selectedDate, "PPP")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-gray-800">
                  Result Date
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gregorian:</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded font-medium">
                      {format(resultDate, "PPP")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ethiopian:</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded font-medium">
                      {formatEthiopianDate(resultDate, "PPP")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Date Range Tab */}
        {activeTab === "date-range" && (
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800">
                Date Range Calculator
              </h2>
              <p className="text-gray-600">
                Calculate the difference between two dates
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Date Range
              </label>
              <DateRangePicker />
            </div>

            {dateRange && (
              <>
                <hr className="my-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg text-gray-800">
                      Gregorian Calendar
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">From:</span>
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                          {format(dateRange.from, "PPP")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">To:</span>
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                          {format(dateRange.to, "PPP")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Difference:</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded font-medium">
                          {dateDiff?.years}y {dateDiff?.months}m{" "}
                          {dateDiff?.days}d
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg text-gray-800">
                      Ethiopian Calendar
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">From:</span>
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                          {formatEthiopianDate(dateRange.from, "PPP")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">To:</span>
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                          {formatEthiopianDate(dateRange.to, "PPP")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Difference:</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded font-medium">
                          {dateDiff?.years}y {dateDiff?.months}m{" "}
                          {dateDiff?.days}d
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
