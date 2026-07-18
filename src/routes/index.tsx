import { useSEO } from "@/hooks/use-seo";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

import { Link } from "@tanstack/react-router";
import "../App.css";

function FeatureCard({
  title,
  description,
  to,
}: {
  title: string;
  description: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="block bg-white dark:bg-zinc-900 rounded-lg shadow-md hover:shadow-xl transition p-5 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500"
    >
      <h3 className="text-lg font-semibold mb-1 text-blue-600 dark:text-blue-400">
        {title}
      </h3>
      <p className="text-zinc-600 dark:text-zinc-300 text-sm">{description}</p>
    </Link>
  );
}

function Index() {
  useSEO({
    title: "UtilityHub | Free calculators, converters, and generators",
    description:
      "UtilityHub delivers fast, free calculators, converters, and generators for everyday life, health, finance, and tech.",
    path: "/",
    keywords:
      "utility hub, calculator, converter, generator, salary calculator, bmi calculator, qr code generator",
    applicationCategory: "Application",
    featureList: [
      "Salary and payroll tools",
      "Health and BMI calculators",
      "Unit converters",
      "Password and UUID generators",
      "QR code and markdown tools",
    ],
  });

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex flex-col items-center mb-8">
        <img
          src="/main_image.png"
          alt="UtilityHub"
          className="w-32 h-32 mb-4 rounded-xl shadow"
        />
        <h1 className="text-3xl font-bold mb-2 text-center">UtilityHub</h1>
        <p className="text-zinc-700 dark:text-zinc-300 text-center max-w-2xl">
          <span className="font-semibold">
            Your everyday digital Swiss Army Knife
          </span>{" "}
          — A sleek, fast bundles essential calculators, converters, and
          generators for daily life, health, finance, tech, and more.
        </p>
      </div>

      <h2 className="text-xl font-semibold mb-4 mt-8">🧮 Calculations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <FeatureCard
          title="Salary Calculator"
          description="Estimate income or sales tax based on region or custom rates (Ethiopia only)."
          to="/salary-calculation"
        />
        <FeatureCard
          title="BMI Calculator"
          description="Calculate Body Mass Index with health category feedback."
          to="/bmi-calculation"
        />
        <FeatureCard
          title="Payroll Generator"
          description="Generate detailed payroll reports for employees with deductions and benefits by uploading a CSV file (Ethiopia only)."
          to="/payroll-generator"
        />
      </div>

      <h2 className="text-xl font-semibold mb-4">🔄 Conversions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <FeatureCard
          title="Length"
          description="Meters, feet, inches, kilometers, miles, etc."
          to="/length-conversion"
        />
        <FeatureCard
          title="Temperature"
          description="Celsius, Fahrenheit, Kelvin."
          to="/temperature-conversion"
        />
        <FeatureCard
          title="Shoe Size"
          description="Men’s, women’s, and kids’ sizes across US, EU, UK."
          to="/shoe-size-conversion"
        />
        <FeatureCard
          title="Weight"
          description="Pounds, kilograms, stones, ounces."
          to="/weight-conversion"
        />
        <FeatureCard
          title="Area"
          description="Square meters, feet, acres, hectares, square miles, etc."
          to="/area-conversion"
        />
        <FeatureCard
          title="Speed"
          description="km/h, mph, knots, m/s."
          to="/speed-conversion"
        />
        <FeatureCard
          title="Data Storage"
          description="Bits, Bytes, KB, MB, GB, TB, PB — binary & decimal."
          to="/data-storage-conversion"
        />
        <FeatureCard
          title="Time"
          description="Seconds, minutes, hours, days, weeks, months, years."
          to="/time-conversion"
        />
        <FeatureCard
          title="Age & Date Converters"
          description="Exact age, date difference, add/subtract days."
          to="/age-and-date-convertors"
        />
      </div>

      <h2 className="text-xl font-semibold mb-4">🧩 Other Tools</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <FeatureCard
          title="Password Generator"
          description="Create strong, customizable passwords."
          to="/password-generator"
        />
        <FeatureCard
          title="UUID Generator"
          description="Generate universally unique identifiers."
          to="/uuid-generator"
        />
        <FeatureCard
          title="QR Code Generator"
          description=" Create QR codes for URLs, text, and more."
          to="/qr-code-generator"
        />
        <FeatureCard
          title="Markdown Editor"
          description="Create and preview Markdown documents."
          to="/mark-down-editor"
        />
      </div>

      <div className="mt-10 text-center text-zinc-500 dark:text-zinc-400 text-xs">
        Made with <span className="text-red-500">♥</span> — Simplify your daily
        calculations in one place.
      </div>
    </div>
  );
}
