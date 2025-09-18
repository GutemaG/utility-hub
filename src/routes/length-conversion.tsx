import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/length-conversion")({
  component: RouteComponent,
});

interface LengthUnit {
  name: string;
  symbol: string;
  toMeters: number;
  category: string;
}

const lengthUnits: LengthUnit[] = [
  { name: "Meters", symbol: "m", toMeters: 1, category: "metric" },
  { name: "Kilometers", symbol: "km", toMeters: 1000, category: "metric" },
  { name: "Centimeters", symbol: "cm", toMeters: 0.01, category: "metric" },
  { name: "Millimeters", symbol: "mm", toMeters: 0.001, category: "metric" },
  { name: "Inches", symbol: "in", toMeters: 0.0254, category: "imperial" },
  { name: "Feet", symbol: "ft", toMeters: 0.3048, category: "imperial" },
  { name: "Yards", symbol: "yd", toMeters: 0.9144, category: "imperial" },
  { name: "Miles", symbol: "mi", toMeters: 1609.344, category: "imperial" },
  {
    name: "Nautical Miles",
    symbol: "nmi",
    toMeters: 1852,
    category: "nautical",
  },
  {
    name: "Light Years",
    symbol: "ly",
    toMeters: 9.461e15,
    category: "astronomical",
  },
  {
    name: "Astronomical Units",
    symbol: "AU",
    toMeters: 1.496e11,
    category: "astronomical",
  },
  {
    name: "Parsecs",
    symbol: "pc",
    toMeters: 3.086e16,
    category: "astronomical",
  },
];

function RouteComponent() {
  const [values, setValues] = useState<{ [key: string]: string }>({});
  const [activeInput, setActiveInput] = useState<string>("m");
  const [fromUnit, setFromUnit] = useState<string>("m");
  const [toUnit, setToUnit] = useState<string>("km");

  // Initialize with 1 meter
  useEffect(() => {
    const initialValues: { [key: string]: string } = {};
    lengthUnits.forEach((unit) => {
      initialValues[unit.symbol] = "1";
    });
    setValues(initialValues);
  }, []);

  const convertLength = (value: string, fromUnit: string) => {
    if (!value || isNaN(Number(value))) {
      // Clear all fields if input is invalid
      const clearedValues: { [key: string]: string } = {};
      lengthUnits.forEach((unit) => {
        clearedValues[unit.symbol] = "";
      });
      setValues(clearedValues);
      return;
    }

    const fromUnitData = lengthUnits.find((unit) => unit.symbol === fromUnit);
    if (!fromUnitData) return;

    const meters = Number(value) * fromUnitData.toMeters;
    const newValues: { [key: string]: string } = {};

    lengthUnits.forEach((unit) => {
      if (unit.symbol === fromUnit) {
        newValues[unit.symbol] = value;
      } else {
        const convertedValue = meters / unit.toMeters;
        // Format based on the magnitude of the number - avoid scientific notation
        if (convertedValue < 0.01 && convertedValue > 0) {
          // For very small numbers, show more decimal places
          newValues[unit.symbol] = convertedValue.toFixed(8);
        } else if (convertedValue < 1) {
          // For numbers less than 1, show more decimal places
          newValues[unit.symbol] = convertedValue.toFixed(6);
        } else if (convertedValue >= 1000) {
          // For large numbers, show with commas and up to 2 decimal places
          newValues[unit.symbol] = convertedValue.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          });
        } else {
          // For regular numbers, show up to 3 decimal places
          newValues[unit.symbol] = convertedValue.toFixed(3);
        }
      }
    });

    setValues(newValues);
  };

  const handleInputChange = (value: string, unit: string) => {
    setActiveInput(unit);
    convertLength(value, unit);
  };

  const clearAll = () => {
    const clearedValues: { [key: string]: string } = {};
    lengthUnits.forEach((unit) => {
      clearedValues[unit.symbol] = "";
    });
    setValues(clearedValues);
    setActiveInput("m");
  };

  const setExample = (example: number) => {
    setActiveInput(fromUnit);
    convertLength(example.toString(), fromUnit);
  };
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Length Convertor - Utility Hub",
    description:
      "Length Converter: Instantly convert between meters, kilometers, miles, feet, inches, and more. Perfect for students, engineers, and travelers.",
    url: "https://utility.ethioar.app/length-conversion",
    applicationCategory: "HealthApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Real-time conversion as you type",
      "Supports 12 different length units",
      "Automatic formatting for very large/small numbers",
      "Responsive design for all devices",
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
        <title>Length Convertor - Utility Hub</title>
        <meta
          name="description"
          content="Length Converter: Instantly convert between meters, kilometers, miles, feet, inches, and more. Perfect for students, engineers, and travelers."
        />
        <meta
          name="keywords"
          content="length converter, unit conversion, meters to feet, kilometers to miles, inches to centimeters, feet to meters, length units, convert length units, measurement conversion"
        />
        <meta name="author" content="FormulaLab" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Length Convertor" />
        <meta
          property="og:description"
          content="Length Converter: Instantly convert between meters, kilometers, miles, feet, inches, and more. Perfect for students, engineers, and travelers."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content="https://utility.ethioqr.app/length-conversion"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Length Convertor" />
        <meta
          name="twitter:description"
          content="Length Converter: Instantly convert between meters, kilometers, miles, feet, inches, and more. Perfect for students, engineers, and travelers."
        />
        <link
          rel="canonical"
          href="https://utility.ethioqr.app/length-conversion"
        />
      </div>
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Length Converter
          </h1>
          <p className="text-gray-600">
            Convert between different length units instantly
          </p>
        </div>

        {/* From/To Selector with Input and Result */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Convert Length
          </h3>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            {/* From Section */}
            <div className="flex-1 max-w-xs">
              {/* Input Field */}
              <label
                htmlFor="mainFromInput"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {lengthUnits.find((u) => u.symbol === fromUnit)?.name} (
                {fromUnit})
              </label>
              <input
                id="mainFromInput"
                type="text"
                value={values[fromUnit] || ""}
                onChange={(e) => handleInputChange(e.target.value, fromUnit)}
                className="w-full px-3 py-2 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
                placeholder="Enter value"
              />

              {/* From Unit Dropdown */}
              <label
                htmlFor="fromUnit"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                From Unit
              </label>
              <select
                id="fromUnit"
                value={fromUnit}
                onChange={(e) => {
                  setFromUnit(e.target.value);
                  setActiveInput(e.target.value);
                  if (values[e.target.value]) {
                    convertLength(values[e.target.value], e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {lengthUnits.map((unit) => (
                  <option key={unit.symbol} value={unit.symbol}>
                    {unit.name} ({unit.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Arrow Icon */}
            <div className="flex-shrink-0">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </div>

            {/* To Section */}
            <div className="flex-1 max-w-xs">
              {/* Result Display */}
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lengthUnits.find((u) => u.symbol === toUnit)?.name} ({toUnit})
              </label>
              <div className="w-full px-3 py-2 text-lg bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-mono mb-3">
                {values[toUnit] || "0"}
              </div>

              {/* To Unit Dropdown */}
              <label
                htmlFor="toUnit"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                To Unit
              </label>
              <select
                id="toUnit"
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {lengthUnits.map((unit) => (
                  <option key={unit.symbol} value={unit.symbol}>
                    {unit.name} ({unit.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quick Examples */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Quick Examples
          </h3>
          <div className="flex flex-wrap gap-2">
            {[1, 10, 100, 1000, 1.5, 2.54].map((value) => (
              <button
                key={value}
                onClick={() => setExample(value)}
                className="px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                {value} {fromUnit}
              </button>
            ))}
          </div>
        </div>

        {/* Conversion Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lengthUnits.map((unit) => (
            <div
              key={unit.symbol}
              className={`bg-white rounded-xl shadow-lg border-2 transition-all duration-200 ${
                activeInput === unit.symbol
                  ? "border-blue-500 shadow-blue-100"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{unit.name}</h3>
                  <span className="text-sm text-gray-500 font-mono">
                    {unit.symbol}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={values[unit.symbol] || ""}
                    onChange={(e) =>
                      handleInputChange(e.target.value, unit.symbol)
                    }
                    className={`w-full px-3 py-2 text-lg border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      activeInput === unit.symbol
                        ? "border-blue-500 focus:ring-blue-500 focus:border-blue-500"
                        : "border-gray-300 focus:ring-gray-500 focus:border-gray-500"
                    }`}
                    placeholder="0"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">
                    {unit.symbol}
                  </div>
                </div>

                {/* Category Badge */}
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      unit.category === "metric"
                        ? "bg-green-100 text-green-800"
                        : unit.category === "imperial"
                          ? "bg-blue-100 text-blue-800"
                          : unit.category === "nautical"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {unit.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={clearAll}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={() => setExample(1)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Reset to 1{fromUnit}
          </button>
        </div>

        {/* Information */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            How it works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Features:</h4>
              <ul className="space-y-1">
                <li>• Real-time conversion as you type</li>
                <li>• Supports 12 different length units</li>
                <li>• Automatic formatting for very large/small numbers</li>
                <li>• Responsive design for all devices</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Categories:</h4>
              <ul className="space-y-1">
                <li>
                  • <span className="font-medium text-green-700">Metric:</span>{" "}
                  m, km, cm, mm
                </li>
                <li>
                  • <span className="font-medium text-blue-700">Imperial:</span>{" "}
                  in, ft, yd, mi
                </li>
                <li>
                  •{" "}
                  <span className="font-medium text-purple-700">Nautical:</span>{" "}
                  nmi
                </li>
                <li>
                  •{" "}
                  <span className="font-medium text-orange-700">
                    Astronomical:
                  </span>{" "}
                  ly, AU, pc
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
