import type { ReactNode } from "react";

export interface BaseUnit {
  name: string;
  symbol: string;
  category: string;
}

export interface LinearUnit extends BaseUnit {
  kind: "linear";
  toBase: number;
}

export interface AffineUnit extends BaseUnit {
  kind: "affine";
  toBase: (value: number) => number;
  fromBase: (base: number) => number;
  step?: number;
}

export type ConverterUnit = LinearUnit | AffineUnit;

export interface CategoryInfo {
  label: string;
  colorClass: string;
  units: string;
}

export interface ConverterConfig {
  slug: string;
  title: string;
  subtitle: string;
  convertLabel: string;
  units: ConverterUnit[];
  defaultFrom: string;
  defaultTo: string;
  initialValue: string;
  examples: number[];
  resetValue: number;
  resetLabel?: string;
  features: string[];
  categories: CategoryInfo[];
  keywords?: string;
  applicationCategory?: string;
  inputPlaceholder?: string;
  renderUnitExtra?: (
    unit: ConverterUnit,
    numericValue: number,
    baseValue: number
  ) => ReactNode;
  renderPanelExtra?: (baseValue: number) => ReactNode;
}

export interface FormatOptions {
  largeThreshold?: number;
  veryLargeThreshold?: number;
}
