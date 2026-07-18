import { useCallback, useEffect, useState } from "react";
import {
  formatConvertedValue,
  formatDataStorageValue,
  formatShoeSizeValue,
  formatTemperatureValue,
} from "./format-value";
import type { ConverterConfig, ConverterUnit } from "./types";

function unitToBase(unit: ConverterUnit, value: number): number {
  if (unit.kind === "linear") return value * unit.toBase;
  return unit.toBase(value);
}

function baseToUnit(unit: ConverterUnit, base: number): number {
  if (unit.kind === "linear") return base / unit.toBase;
  return unit.fromBase(base);
}

function formatValueForUnit(
  unit: ConverterUnit,
  converted: number,
  slug: string
): string {
  if (unit.kind === "affine" && unit.step !== undefined) {
    return formatShoeSizeValue(converted, unit.step);
  }
  if (slug === "temperature-conversion") {
    return formatTemperatureValue(converted);
  }
  if (slug === "data-storage-conversion") {
    return formatDataStorageValue(converted);
  }
  return formatConvertedValue(converted);
}

export function useUnitConverter(config: ConverterConfig) {
  const { units, initialValue, defaultFrom } = config;
  const [values, setValues] = useState<Record<string, string>>({});
  const [activeInput, setActiveInput] = useState(defaultFrom);
  const [fromUnit, setFromUnit] = useState(config.defaultFrom);
  const [toUnit, setToUnit] = useState(config.defaultTo);
  const [baseValue, setBaseValue] = useState(0);

  const convert = useCallback(
    (value: string, sourceUnit: string) => {
      if (!value || Number.isNaN(Number(value))) {
        const cleared: Record<string, string> = {};
        units.forEach((unit) => {
          cleared[unit.symbol] = "";
        });
        setValues(cleared);
        setBaseValue(0);
        return;
      }

      const source = units.find((unit) => unit.symbol === sourceUnit);
      if (!source) return;

      const base = unitToBase(source, Number(value));
      setBaseValue(base);

      const next: Record<string, string> = {};
      units.forEach((unit) => {
        if (unit.symbol === sourceUnit) {
          next[unit.symbol] = value;
        } else {
          const converted = baseToUnit(unit, base);
          next[unit.symbol] = formatValueForUnit(unit, converted, config.slug);
        }
      });
      setValues(next);
    },
    [config.slug, units]
  );

  useEffect(() => {
    convert(initialValue, defaultFrom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (value: string, unit: string) => {
    setActiveInput(unit);
    convert(value, unit);
  };

  const clearAll = () => {
    const cleared: Record<string, string> = {};
    units.forEach((unit) => {
      cleared[unit.symbol] = "";
    });
    setValues(cleared);
    setBaseValue(0);
    setActiveInput(defaultFrom);
  };

  const setExample = (example: number) => {
    setActiveInput(fromUnit);
    convert(example.toString(), fromUnit);
  };

  const handleFromUnitChange = (symbol: string) => {
    setFromUnit(symbol);
    setActiveInput(symbol);
    if (values[symbol]) convert(values[symbol], symbol);
  };

  return {
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
    convert,
  };
}
