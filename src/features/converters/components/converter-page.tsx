import type { ReactNode } from "react";
import { useSEO } from "@/hooks/use-seo";
import { getCategoryStyle, CATEGORY_LABEL_COLORS } from "../category-styles";
import { useUnitConverter } from "../use-unit-converter";
import type { ConverterConfig, ConverterUnit } from "../types";

function ArrowIcon() {
  return (
    <svg
      className="h-8 w-8 text-muted-foreground"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 8l4 4m0 0l-4 4m4-4H3"
      />
    </svg>
  );
}

interface ConverterPageProps {
  config: ConverterConfig;
}

export function ConverterPage({ config }: ConverterPageProps) {
  const {
    values,
    activeInput,
    fromUnit,
    toUnit,
    baseValue,
    setToUnit,
    handleInputChange,
    handleFromUnitChange,
    clearAll,
    setExample,
  } = useUnitConverter(config);

  useSEO({
    title: `${config.title} - Utility Hub`,
    description: config.subtitle,
    path: `/${config.slug}`,
    keywords: config.keywords,
    applicationCategory: config.applicationCategory,
    featureList: config.features,
  });

  const findUnit = (symbol: string) =>
    config.units.find((unit) => unit.symbol === symbol);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-foreground sm:text-4xl">
          {config.title}
        </h1>
        <p className="text-muted-foreground">{config.subtitle}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-center text-lg font-semibold text-card-foreground">
          {config.convertLabel}
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="flex-1 max-w-xs">
            <label
              htmlFor="mainFromInput"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              {findUnit(fromUnit)?.name} ({fromUnit})
            </label>
            <input
              id="mainFromInput"
              type="text"
              value={values[fromUnit] || ""}
              onChange={(e) => handleInputChange(e.target.value, fromUnit)}
              className="mb-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-lg text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={config.inputPlaceholder ?? "Enter value"}
            />
            <label
              htmlFor="fromUnit"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              From Unit
            </label>
            <select
              id="fromUnit"
              value={fromUnit}
              onChange={(e) => handleFromUnitChange(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {config.units.map((unit) => (
                <option key={unit.symbol} value={unit.symbol}>
                  {unit.name} ({unit.symbol})
                </option>
              ))}
            </select>
          </div>

          <div className="flex-shrink-0">
            <ArrowIcon />
          </div>

          <div className="flex-1 max-w-xs">
            <label className="mb-2 block text-sm font-medium text-foreground">
              {findUnit(toUnit)?.name} ({toUnit})
            </label>
            <div className="mb-3 w-full overflow-auto rounded-lg border border-input bg-muted px-3 py-2 font-mono text-lg text-foreground">
              {values[toUnit] || "0"}
            </div>
            <label
              htmlFor="toUnit"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              To Unit
            </label>
            <select
              id="toUnit"
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {config.units.map((unit) => (
                <option key={unit.symbol} value={unit.symbol}>
                  {unit.name} ({unit.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {config.renderPanelExtra?.(baseValue)}
      </div>

      <div className="rounded-xl border border-border bg-gradient-to-r from-muted to-muted/40 p-4">
        <h3 className="mb-3 text-lg font-semibold text-foreground">
          Quick Examples
        </h3>
        <div className="flex flex-wrap gap-2">
          {config.examples.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setExample(value)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {value} {fromUnit}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {config.units.map((unit) => (
          <UnitCard
            key={unit.symbol}
            unit={unit}
            value={values[unit.symbol] || ""}
            isActive={activeInput === unit.symbol}
            onChange={(value) => handleInputChange(value, unit.symbol)}
            extra={config.renderUnitExtra?.(
              unit,
              Number(values[unit.symbol]),
              baseValue
            )}
          />
        ))}
      </div>

      <div className="flex justify-center space-x-4">
        <button
          type="button"
          onClick={clearAll}
          className="rounded-lg bg-secondary px-6 py-3 font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
        >
          Clear All
        </button>
        <button
          type="button"
          onClick={() => setExample(config.resetValue)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {config.resetLabel ?? `Reset to ${config.resetValue}${fromUnit}`}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-gradient-to-r from-muted/80 to-muted p-6">
        <h3 className="mb-3 text-lg font-semibold text-foreground">How it works</h3>
        <div className="grid grid-cols-1 gap-4 text-sm text-muted-foreground md:grid-cols-2">
          <div>
            <h4 className="mb-2 font-medium text-foreground">Features:</h4>
            <ul className="space-y-1">
              {config.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-2 font-medium text-foreground">Categories:</h4>
            <ul className="space-y-1">
              {config.categories.map((category) => (
                <li key={category.label}>
                  •{" "}
                  <span
                    className={`font-medium ${CATEGORY_LABEL_COLORS[category.label.toLowerCase()] ?? "text-foreground"}`}
                  >
                    {category.label}:
                  </span>{" "}
                  {category.units}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function UnitCard({
  unit,
  value,
  isActive,
  onChange,
  extra,
}: {
  unit: ConverterUnit;
  value: string;
  isActive: boolean;
  onChange: (value: string) => void;
  extra?: ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border-2 bg-card shadow-lg transition-all duration-200 ${
        isActive
          ? "border-blue-500 shadow-blue-100"
          : "border-border hover:border-ring/40"
      }`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-card-foreground">{unit.name}</h3>
          <span className="font-mono text-sm text-muted-foreground">{unit.symbol}</span>
        </div>

        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full rounded-lg border bg-background px-3 py-2 text-lg text-foreground transition-all focus:outline-none focus:ring-2 ${
              isActive
                ? "border-blue-500 focus:ring-blue-500 focus:border-blue-500"
                : "border-input focus:border-ring focus:ring-ring"
            }`}
            placeholder="0"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 transform text-sm font-medium text-muted-foreground">
            {unit.symbol}
          </div>
        </div>

        {extra}

        <div className="mt-2">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryStyle(unit.category)}`}
          >
            {unit.category}
          </span>
        </div>
      </div>
    </div>
  );
}
