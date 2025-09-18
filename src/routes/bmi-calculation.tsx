import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/bmi-calculation")({
  component: RouteComponent,
});

interface BMICategory {
  range: string;
  category: string;
  risk: string;
  color: string;
  bgColor: string;
}

const bmiCategories: BMICategory[] = [
  {
    range: "< 18.5",
    category: "Underweight",
    risk: "Low",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    range: "18.5 - 24.9",
    category: "Normal Weight",
    risk: "Low",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    range: "25.0 - 29.9",
    category: "Overweight",
    risk: "Moderate",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
  {
    range: "30.0 - 34.9",
    category: "Obesity Class I",
    risk: "High",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  {
    range: "35.0 - 39.9",
    category: "Obesity Class II",
    risk: "Very High",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  {
    range: "≥ 40.0",
    category: "Obesity Class III",
    risk: "Extremely High",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
];

interface BodyFatCategory {
  range: string;
  category: string;
  description: string;
  color: string;
  bgColor: string;
}

const bodyFatCategories = {
  male: [
    {
      range: "2-5%",
      category: "Essential Fat",
      description: "Minimum required for survival",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      range: "6-13%",
      category: "Athletes",
      description: "Very lean, athletic",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      range: "14-17%",
      category: "Fitness",
      description: "Lean and fit",
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      range: "18-24%",
      category: "Average",
      description: "Normal, healthy range",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      range: "25-31%",
      category: "Above Average",
      description: "Higher than ideal",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      range: "32%+",
      category: "Obese",
      description: "Health risk",
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ],
  female: [
    {
      range: "10-13%",
      category: "Essential Fat",
      description: "Minimum required for survival",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      range: "14-20%",
      category: "Athletes",
      description: "Very lean, athletic",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      range: "21-24%",
      category: "Fitness",
      description: "Lean and fit",
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      range: "25-31%",
      category: "Average",
      description: "Normal, healthy range",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      range: "32-38%",
      category: "Above Average",
      description: "Higher than ideal",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      range: "39%+",
      category: "Obese",
      description: "Health risk",
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ],
};

function RouteComponent() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "BMI Calculator - Utility Hub",
    description:
      "Free online BMI, Body Fat, and Ideal Weight calculator. Calculate your Body Mass Index, body fat percentage using U.S. Navy method, and ideal weight based",
    url: "https://utility.ethioar.app/bmi-calculation",
    applicationCategory: "HealthApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Utility Hub",
      "Utility Hub BMI Calculator",
      "BMI Calculation",
      "Body Fat Calculation using U.S. Navy method",
      "Ideal Weight Calculation",
      "Body Surface Area Calculation",
      "Health Risk Assessment",
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

  const [activeSection, setActiveSection] = useState<
    "bmi" | "bodyFat" | "idealWeight"
  >("bmi");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [age, setAge] = useState<number>(30);
  const [height, setHeight] = useState<number>(170);
  const [weight, setWeight] = useState<number>(70);
  const [waist, setWaist] = useState<number>(80);
  const [hip, setHip] = useState<number>(95);
  const [neck, setNeck] = useState<number>(35);

  const calculateBMI = () => {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };

  const getBMICategory = (bmi: number): BMICategory => {
    if (bmi < 18.5) return bmiCategories[0];
    if (bmi < 25) return bmiCategories[1];
    if (bmi < 30) return bmiCategories[2];
    if (bmi < 35) return bmiCategories[3];
    if (bmi < 40) return bmiCategories[4];
    return bmiCategories[5];
  };

  const calculateBodyFat = () => {
    // Using U.S. Navy method
    if (gender === "male") {
      const bodyFat =
        495 /
          (1.0324 -
            0.19077 * Math.log10(waist - neck) +
            0.15456 * Math.log10(height)) -
        450;
      return Math.max(0, bodyFat);
    } else {
      const bodyFat =
        495 /
          (1.29579 -
            0.35004 * Math.log10(waist + hip - neck) +
            0.221 * Math.log10(height)) -
        450;
      return Math.max(0, bodyFat);
    }
  };

  const getBodyFatCategory = (bodyFat: number): BodyFatCategory => {
    const categories = bodyFatCategories[gender];
    if (gender === "male") {
      if (bodyFat <= 5) return categories[0];
      if (bodyFat <= 13) return categories[1];
      if (bodyFat <= 17) return categories[2];
      if (bodyFat <= 24) return categories[3];
      if (bodyFat <= 31) return categories[4];
      return categories[5];
    } else {
      if (bodyFat <= 13) return categories[0];
      if (bodyFat <= 20) return categories[1];
      if (bodyFat <= 24) return categories[2];
      if (bodyFat <= 31) return categories[3];
      if (bodyFat <= 38) return categories[4];
      return categories[5];
    }
  };

  const calculateIdealWeight = () => {
    const heightInInches = height / 2.54;
    const heightInFeet = Math.floor(heightInInches / 12);
    const remainingInches = heightInInches % 12;

    if (gender === "male") {
      // Robinson formula
      return 52 + 1.9 * (heightInFeet - 5) + 2.3 * remainingInches;
    } else {
      // Robinson formula for women
      return 49 + 1.7 * (heightInFeet - 5) + 2.2 * remainingInches;
    }
  };

  const calculateBodySurfaceArea = () => {
    // DuBois formula
    return 0.007184 * Math.pow(weight, 0.425) * Math.pow(height, 0.725);
  };

  const bmi = calculateBMI();
  const bmiCategory = getBMICategory(bmi);
  const bodyFat = calculateBodyFat();
  const bodyFatCategory = getBodyFatCategory(bodyFat);
  const idealWeight = calculateIdealWeight();
  const bodySurfaceArea = calculateBodySurfaceArea();

  const CollapsibleSection = ({
    title,
    isActive,
    onToggle,
    children,
  }: {
    title: string;
    isActive: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }) => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 text-left bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-200"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <svg
            className={`w-6 h-6 text-gray-500 transform transition-transform duration-200 ${
              isActive ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>
      {isActive && (
        <div className="p-6 border-t border-gray-200">{children}</div>
      )}
    </div>
  );

  return (
    <>
      <div style={{ display: "none" }}>
        <title>BMI Calculator - Utility Hub</title>
        <meta
          name="description"
          content="Free online BMI, Body Fat, and Ideal Weight calculator. Calculate your Body Mass Index, body fat percentage using U.S. Navy method, and ideal weight based"
        />
        <meta
          name="keywords"
          content="bmi calculator, body fat calculator, ideal weight calculator, body surface area, health risk assessment, us navy body fat, bmi categories, healthy weight, fitness calculator"
        />
        <meta name="author" content="FormulaLab" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="BMI Calculator" />
        <meta
          property="og:description"
          content="Free online BMI, Body Fat, and Ideal Weight calculator. Calculate your Body Mass Index, body fat percentage using U.S. Navy method, and ideal weight based"
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content="https://utility.ethioqr.app/bmi-calculation"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="BMI Calculator" />
        <meta
          name="twitter:description"
          content="Free online BMI, Body Fat, and Ideal Weight calculator. Calculate your Body Mass Index, body fat percentage using U.S. Navy method, and ideal weight based"
        />
        <link
          rel="canonical"
          href="https://utility.ethioqr.app/bmi-calculation"
        />
      </div>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Body Health Calculator
          </h1>
          <p className="text-gray-600">
            Calculate BMI, Body Fat, and Ideal Weight
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as "male" | "female")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age (years)
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="120"
              />
            </div>

            {/* Height */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Height (cm)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="50"
                max="300"
              />
            </div>

            {/* Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight (kg)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="20"
                max="500"
              />
            </div>

            {/* Waist */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Waist (cm)
              </label>
              <input
                type="number"
                value={waist}
                onChange={(e) => setWaist(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="40"
                max="200"
              />
            </div>

            {/* Hip */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hip (cm)
              </label>
              <input
                type="number"
                value={hip}
                onChange={(e) => setHip(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="40"
                max="200"
              />
            </div>

            {/* Neck */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Neck (cm)
              </label>
              <input
                type="number"
                value={neck}
                onChange={(e) => setNeck(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="20"
                max="60"
              />
            </div>

            {/* Body Surface Area Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Body Surface Area
              </label>
              <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-mono">
                {bodySurfaceArea.toFixed(2)} m²
              </div>
            </div>
          </div>
        </div>

        {/* BMI Calculator Section */}
        <CollapsibleSection
          title="BMI Calculator"
          isActive={activeSection === "bmi"}
          onToggle={() =>
            setActiveSection(activeSection === "bmi" ? "bmi" : "bmi")
          }
        >
          <div className="space-y-6">
            {/* BMI Result */}
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {bmi.toFixed(1)}
              </div>
              <div className={`text-lg font-medium ${bmiCategory.color} mb-2`}>
                {bmiCategory.category}
              </div>
              <div className="text-sm text-gray-600">
                Risk Level: {bmiCategory.risk}
              </div>
            </div>

            {/* BMI Categories Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      BMI Range
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bmiCategories.map((category, index) => (
                    <tr
                      key={index}
                      className={`${category.bgColor} ${bmiCategory.category === category.category ? "ring-2 ring-blue-500" : ""}`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {category.range}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {category.category}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {category.risk}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CollapsibleSection>

        {/* Body Fat Calculator Section */}
        <CollapsibleSection
          title="Body Fat Calculator"
          isActive={activeSection === "bodyFat"}
          onToggle={() =>
            setActiveSection(
              activeSection === "bodyFat" ? "bodyFat" : "bodyFat"
            )
          }
        >
          <div className="space-y-6">
            {/* Body Fat Result */}
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {bodyFat.toFixed(1)}%
              </div>
              <div
                className={`text-lg font-medium ${bodyFatCategory.color} mb-2`}
              >
                {bodyFatCategory.category}
              </div>
              <div className="text-sm text-gray-600">
                {bodyFatCategory.description}
              </div>
            </div>

            {/* Body Fat Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bodyFatCategories[gender].map((category, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    bodyFatCategory.category === category.category
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className={`text-lg font-semibold ${category.color}`}>
                    {category.range}
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {category.category}
                  </div>
                  <div className="text-xs text-gray-600">
                    {category.description}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
              <strong>Note:</strong> Body fat calculation uses the U.S. Navy
              method, which requires measurements of waist, hip, neck, and
              height. This method provides a reasonable estimate but may not be
              as accurate as professional body composition analysis.
            </div>
          </div>
        </CollapsibleSection>

        {/* Ideal Weight Calculator Section */}
        <CollapsibleSection
          title="Ideal Weight Calculator"
          isActive={activeSection === "idealWeight"}
          onToggle={() =>
            setActiveSection(
              activeSection === "idealWeight" ? "idealWeight" : "idealWeight"
            )
          }
        >
          <div className="space-y-6">
            {/* Ideal Weight Result */}
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {idealWeight.toFixed(1)} kg
              </div>
              <div className="text-lg text-gray-600 mb-4">
                ≈ {(idealWeight * 2.20462).toFixed(1)} lbs
              </div>
            </div>

            {/* Weight Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.abs(weight - idealWeight).toFixed(1)} kg
                </div>
                <div className="text-sm text-gray-600">
                  {weight > idealWeight ? "Over" : "Under"} Ideal Weight
                </div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {((weight / idealWeight) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">of Ideal Weight</div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {(((weight - idealWeight) / idealWeight) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">
                  Deviation from Ideal
                </div>
              </div>
            </div>

            {/* Weight Recommendations */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">
                Weight Recommendations
              </h4>
              <div className="text-sm text-yellow-700 space-y-1">
                {weight > idealWeight * 1.1 ? (
                  <p>
                    • Consider gradual weight loss through balanced diet and
                    exercise
                  </p>
                ) : weight < idealWeight * 0.9 ? (
                  <p>• Consider healthy weight gain through proper nutrition</p>
                ) : (
                  <p>
                    • Your weight is within the healthy range for your height
                  </p>
                )}
                <p>
                  • Consult with healthcare professionals for personalized
                  advice
                </p>
                <p>• Focus on overall health rather than just weight numbers</p>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Information Box */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
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
                Important Notes
              </h3>
              <div className="text-sm text-blue-700 space-y-2">
                <p>
                  • <strong>BMI:</strong> Body Mass Index is a screening tool,
                  not a diagnostic measure
                </p>
                <p>
                  • <strong>Body Fat:</strong> U.S. Navy method provides
                  estimates; professional analysis is more accurate
                </p>
                <p>
                  • <strong>Ideal Weight:</strong> Based on height and gender;
                  individual factors may vary
                </p>
                <p>
                  • <strong>Health:</strong> These calculations are for
                  informational purposes only
                </p>
                <p>
                  • <strong>Consultation:</strong> Always consult healthcare
                  professionals for medical advice
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
