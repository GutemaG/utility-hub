import { useSEO } from "@/hooks/use-seo";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

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
    bgColor: "bg-blue-500/10",
  },
  {
    range: "18.5 - 24.9",
    category: "Normal Weight",
    risk: "Low",
    color: "text-green-600",
    bgColor: "bg-green-500/10",
  },
  {
    range: "25.0 - 29.9",
    category: "Overweight",
    risk: "Moderate",
    color: "text-yellow-600",
    bgColor: "bg-yellow-500/10",
  },
  {
    range: "30.0 - 34.9",
    category: "Obesity Class I",
    risk: "High",
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
  },
  {
    range: "35.0 - 39.9",
    category: "Obesity Class II",
    risk: "Very High",
    color: "text-red-600",
    bgColor: "bg-red-500/10",
  },
  {
    range: "≥ 40.0",
    category: "Obesity Class III",
    risk: "Extremely High",
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
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
  useSEO({
    title: "BMI Calculator | Utility Hub",
    description:
      "Free online BMI, body fat, and ideal weight calculator with health category insights.",
    path: "/bmi-calculation",
    keywords:
      "bmi calculator, body fat calculator, ideal weight calculator, health calculator, body mass index",
    applicationCategory: "HealthApplication",
    featureList: [
      "BMI calculation",
      "Body fat estimation",
      "Ideal weight guidance",
      "Body surface area estimate",
      "Health risk assessment",
    ],
  });

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
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
      <button
        onClick={onToggle}
        className="w-full bg-gradient-to-r from-muted/80 to-muted px-6 py-4 text-left transition-all duration-200 hover:from-muted hover:to-muted/90"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-card-foreground">{title}</h2>
          <svg
            className={`h-6 w-6 transform text-muted-foreground transition-transform duration-200 ${
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
        <div className="border-t border-border p-6">{children}</div>
      )}
    </div>
  );

  return (
    <>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-foreground sm:text-4xl">
            Body Health Calculator
          </h1>
          <p className="text-muted-foreground">
            Calculate BMI, Body Fat, and Ideal Weight
          </p>
        </div>

        {/* Input Section */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold text-card-foreground">
            Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Gender */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as "male" | "female")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            {/* Age */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Age (years)
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                min="1"
                max="120"
              />
            </div>

            {/* Height */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Height (cm)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                min="50"
                max="300"
              />
            </div>

            {/* Weight */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Weight (kg)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                min="20"
                max="500"
              />
            </div>

            {/* Waist */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Waist (cm)
              </label>
              <input
                type="number"
                value={waist}
                onChange={(e) => setWaist(Number(e.target.value))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                min="40"
                max="200"
              />
            </div>

            {/* Hip */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Hip (cm)
              </label>
              <input
                type="number"
                value={hip}
                onChange={(e) => setHip(Number(e.target.value))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                min="40"
                max="200"
              />
            </div>

            {/* Neck */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Neck (cm)
              </label>
              <input
                type="number"
                value={neck}
                onChange={(e) => setNeck(Number(e.target.value))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                min="20"
                max="60"
              />
            </div>

            {/* Body Surface Area Display */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Body Surface Area
              </label>
              <div className="w-full rounded-lg border border-input bg-muted px-3 py-2 font-mono text-foreground">
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
              <div className="mb-2 text-4xl font-bold text-foreground">
                {bmi.toFixed(1)}
              </div>
              <div className={`text-lg font-medium ${bmiCategory.color} mb-2`}>
                {bmiCategory.category}
              </div>
              <div className="text-sm text-muted-foreground">
                Risk Level: {bmiCategory.risk}
              </div>
            </div>

            {/* BMI Categories Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      BMI Range
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Risk Level
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {bmiCategories.map((category, index) => (
                    <tr
                      key={index}
                      className={`${category.bgColor} ${bmiCategory.category === category.category ? "ring-2 ring-blue-500" : ""}`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {category.range}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {category.category}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
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
              <div className="mb-2 text-4xl font-bold text-foreground">
                {bodyFat.toFixed(1)}%
              </div>
              <div
                className={`text-lg font-medium ${bodyFatCategory.color} mb-2`}
              >
                {bodyFatCategory.category}
              </div>
              <div className="text-sm text-muted-foreground">
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
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-border bg-muted/50"
                  }`}
                >
                  <div className={`text-lg font-semibold ${category.color}`}>
                    {category.range}
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {category.category}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {category.description}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-blue-500/10 p-4 text-sm text-muted-foreground">
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
              <div className="mb-2 text-4xl font-bold text-foreground">
                {idealWeight.toFixed(1)} kg
              </div>
              <div className="mb-4 text-lg text-muted-foreground">
                ≈ {(idealWeight * 2.20462).toFixed(1)} lbs
              </div>
            </div>

            {/* Weight Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 text-center">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {Math.abs(weight - idealWeight).toFixed(1)} kg
                </div>
                <div className="text-sm text-muted-foreground">
                  {weight > idealWeight ? "Over" : "Under"} Ideal Weight
                </div>
              </div>

              <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-center">
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {((weight / idealWeight) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">of Ideal Weight</div>
              </div>

              <div className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-4 text-center">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {(((weight - idealWeight) / idealWeight) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Deviation from Ideal
                </div>
              </div>
            </div>

            {/* Weight Recommendations */}
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
              <h4 className="mb-2 font-semibold text-yellow-700 dark:text-yellow-300">
                Weight Recommendations
              </h4>
              <div className="space-y-1 text-sm text-yellow-700 dark:text-yellow-200">
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
        <div className="rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-blue-600 dark:text-blue-300"
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
              <h3 className="mb-3 text-base font-medium text-blue-700 dark:text-blue-300">
                Important Notes
              </h3>
              <div className="space-y-2 text-sm text-blue-700 dark:text-blue-200">
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
