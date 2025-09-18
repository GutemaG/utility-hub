import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/area-conversion")({
  component: RouteComponent,
});

interface AreaUnit {
  name: string;
  symbol: string;
  toSquareMeters: number;
  category: string;
}

const areaUnits: AreaUnit[] = [
  {
    name: "Square Meters",
    symbol: "m²",
    toSquareMeters: 1,
    category: "metric",
  },
  {
    name: "Square Kilometers",
    symbol: "km²",
    toSquareMeters: 1000000,
    category: "metric",
  },
  {
    name: "Square Centimeters",
    symbol: "cm²",
    toSquareMeters: 0.0001,
    category: "metric",
  },
  {
    name: "Square Millimeters",
    symbol: "mm²",
    toSquareMeters: 0.000001,
    category: "metric",
  },
  {
    name: "Square Feet",
    symbol: "ft²",
    toSquareMeters: 0.092903,
    category: "imperial",
  },
  {
    name: "Square Yards",
    symbol: "yd²",
    toSquareMeters: 0.836127,
    category: "imperial",
  },
  {
    name: "Square Inches",
    symbol: "in²",
    toSquareMeters: 0.00064516,
    category: "imperial",
  },
  {
    name: "Square Miles",
    symbol: "mi²",
    toSquareMeters: 2589988.11,
    category: "imperial",
  },
  {
    name: "Acres",
    symbol: "ac",
    toSquareMeters: 4046.86,
    category: "imperial",
  },
  { name: "Hectares", symbol: "ha", toSquareMeters: 10000, category: "metric" },
  {
    name: "Square Nautical Miles",
    symbol: "nmi²",
    toSquareMeters: 3429904,
    category: "nautical",
  },
  {
    name: "Square Astronomical Units",
    symbol: "AU²",
    toSquareMeters: 2.237e22,
    category: "astronomical",
  },
  {
    name: "Square Light Years",
    symbol: "ly²",
    toSquareMeters: 8.95e31,
    category: "astronomical",
  },
  {
    name: "Square Parsecs",
    symbol: "pc²",
    toSquareMeters: 9.52e32,
    category: "astronomical",
  },
  { name: "Barns", symbol: "b", toSquareMeters: 1e-28, category: "scientific" },
  {
    name: "Square Angstroms",
    symbol: "Å²",
    toSquareMeters: 1e-20,
    category: "scientific",
  },
];

function RouteComponent() {
  const [values, setValues] = useState<{ [key: string]: string }>({});
  const [activeInput, setActiveInput] = useState<string>("m²");
  const [fromUnit, setFromUnit] = useState<string>("m²");
  const [toUnit, setToUnit] = useState<string>("km²");

  // Initialize with 1000 square meters
  useEffect(() => {
    const initialValues: { [key: string]: string } = {};
    areaUnits.forEach((unit) => {
      initialValues[unit.symbol] = "1000";
    });
    setValues(initialValues);
  }, []);

  const convertArea = (value: string, fromUnit: string) => {
    if (!value || isNaN(Number(value))) {
      // Clear all fields if input is invalid
      const clearedValues: { [key: string]: string } = {};
      areaUnits.forEach((unit) => {
        clearedValues[unit.symbol] = "";
      });
      setValues(clearedValues);
      return;
    }

    const fromUnitData = areaUnits.find((unit) => unit.symbol === fromUnit);
    if (!fromUnitData) return;

    const squareMeters = Number(value) * fromUnitData.toSquareMeters;
    const newValues: { [key: string]: string } = {};

    areaUnits.forEach((unit) => {
      if (unit.symbol === fromUnit) {
        newValues[unit.symbol] = value;
      } else {
        const convertedValue = squareMeters / unit.toSquareMeters;
        // Format area values appropriately - avoid scientific notation
        if (Math.abs(convertedValue) < 0.000001 && convertedValue !== 0) {
          // For very small numbers, show more decimal places
          newValues[unit.symbol] = convertedValue.toFixed(12);
        } else if (Math.abs(convertedValue) < 0.001 && convertedValue !== 0) {
          // For very small numbers, show more decimal places
          newValues[unit.symbol] = convertedValue.toFixed(9);
        } else if (Math.abs(convertedValue) < 1) {
          // For numbers less than 1, show more decimal places
          newValues[unit.symbol] = convertedValue.toFixed(6);
        } else if (Math.abs(convertedValue) >= 1000000000) {
          // For very large numbers, show with commas and up to 1 decimal place
          newValues[unit.symbol] = convertedValue.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
          });
        } else if (Math.abs(convertedValue) >= 1000000) {
          // For large numbers, show with commas and up to 2 decimal places
          newValues[unit.symbol] = convertedValue.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          });
        } else if (Math.abs(convertedValue) >= 1000) {
          // For medium numbers, show with commas and up to 2 decimal places
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
    convertArea(value, unit);
  };

  const clearAll = () => {
    const clearedValues: { [key: string]: string } = {};
    areaUnits.forEach((unit) => {
      clearedValues[unit.symbol] = "";
    });
    setValues(clearedValues);
    setActiveInput("m²");
  };

  const setExample = (example: number) => {
    setActiveInput(fromUnit);
    convertArea(example.toString(), fromUnit);
  };

  const getAreaDescription = (squareMeters: number) => {
    if (squareMeters < 0.01) return "Very Small";
    if (squareMeters < 1) return "Small";
    if (squareMeters < 100) return "Medium";
    if (squareMeters < 10000) return "Large";
    if (squareMeters < 1000000) return "Very Large";
    if (squareMeters < 1000000000) return "Huge";
    return "Massive";
  };
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Area Converter - Utility Hub",
    description:
      "Area Converter: Convert between Square Meters, Square Kilometers, Square Feet, Acres, Hectares, and more. Perfect for students, engineers, real estate professionals, and landscapers.",
    url: "https://utility.ethioqr.app/area-conversion",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Real-time conversion as you type",
      "Supports 16 different area units",
      "Area context indicators",
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
        <title>Area Convertor - Utility Hub</title>
        <meta
          name="description"
          content="Area Converter: Convert between Square Meters, Square Kilometers, Square Feet, Acres, Hectares, and more. Perfect for students, engineers, real estate professionals, and landscapers."
        />
        <meta
          name="keywords"
          content="area converter, area conversion, square meters to square feet, acres to hectares, square kilometers to square miles, convert area units, measurement conversion, real-time area conversion, metric area units, imperial area units"
        />
        <meta name="author" content="FormulaLab" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Area Convertor" />
        <meta
          property="og:description"
          content="Area Converter: Convert between Square Meters, Square Kilometers, Square Feet, Acres, Hectares, and more. Perfect for students, engineers, real estate professionals, and landscapers."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content="https://utility.ethioqr.app/area-conversion"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Area Convertor" />
        <meta
          name="twitter:description"
          content="Area Converter: Convert between Square Meters, Square Kilometers, Square Feet, Acres, Hectares, and more. Perfect for students, engineers, real estate professionals, and landscapers."
        />
        <link
          rel="canonical"
          href="https://utility.ethioqr.app/area-conversion"
        />
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Area Converter
          </h1>
          <p className="text-gray-600">
            Convert between different area units instantly
          </p>
        </div>

        {/* From/To Selector with Input and Result */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Convert Area
          </h3>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            {/* From Section */}
            <div className="flex-1 max-w-xs">
              {/* Input Field */}
              <label
                htmlFor="mainFromInput"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {areaUnits.find((u) => u.symbol === fromUnit)?.name} ({fromUnit}
                )
              </label>
              <input
                id="mainFromInput"
                type="text"
                value={values[fromUnit] || ""}
                onChange={(e) => handleInputChange(e.target.value, fromUnit)}
                className="w-full px-3 py-2 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
                placeholder="Enter area"
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
                    convertArea(values[e.target.value], e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {areaUnits.map((unit) => (
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
                {areaUnits.find((u) => u.symbol === toUnit)?.name} ({toUnit})
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
                {areaUnits.map((unit) => (
                  <option key={unit.symbol} value={unit.symbol}>
                    {unit.name} ({unit.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Area in Square Meters Display */}

        {/* Quick Examples */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Quick Examples
          </h3>
          <div className="flex flex-wrap gap-2">
            {[1, 100, 1000, 10000, 1000000].map((value) => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  gap-4">
          {areaUnits.map((unit) => (
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

                {/* Area Context */}
                {values[unit.symbol] && !isNaN(Number(values[unit.symbol])) && (
                  <div className="mt-2 text-sm">
                    <span className="font-medium text-gray-700">
                      {(() => {
                        const area =
                          Number(values[unit.symbol]) * unit.toSquareMeters;
                        return getAreaDescription(area);
                      })()}
                    </span>
                  </div>
                )}

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
                            : unit.category === "astronomical"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-red-100 text-red-800"
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
            onClick={() => setExample(1000)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Reset to 1000 {fromUnit}
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
                <li>• Supports 16 different area units</li>
                <li>• Area context indicators</li>
                <li>• Responsive design for all devices</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Categories:</h4>
              <ul className="space-y-1">
                <li>
                  • <span className="font-medium text-green-700">Metric:</span>{" "}
                  m², km², cm², mm², ha
                </li>
                <li>
                  • <span className="font-medium text-blue-700">Imperial:</span>{" "}
                  ft², yd², in², mi², ac
                </li>
                <li>
                  •{" "}
                  <span className="font-medium text-purple-700">Nautical:</span>{" "}
                  nmi²
                </li>
                <li>
                  •{" "}
                  <span className="font-medium text-orange-700">
                    Astronomical:
                  </span>{" "}
                  AU², ly², pc²
                </li>
                <li>
                  •{" "}
                  <span className="font-medium text-red-700">Scientific:</span>{" "}
                  b, Å²
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
