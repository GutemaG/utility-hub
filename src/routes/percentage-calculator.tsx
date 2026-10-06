import { useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { Input } from "@/components/ui/input";
import { Panel, ToolHeader } from "@/components/tool-ui";
import { fmt, num } from "@/lib/num";
import { useSEO } from "@/hooks/use-seo";

export const Route = createFileRoute("/percentage-calculator")({
  component: RouteComponent,
});

function RouteComponent() {
  useSEO({
    title: "Percentage Calculator: % of, % change, increase & discount | Utility Hub",
    description:
      "Free percentage calculator: find X% of a number, what percent one number is of another, percentage increase or decrease, percentage difference, discounts and VAT.",
    path: "/percentage-calculator",
    keywords:
      "percentage calculator, percent calculator, what percent of, percentage increase calculator, percentage change, percentage difference, discount calculator, vat calculator",
    applicationCategory: "UtilitiesApplication",
    featureList: [
      "X% of Y",
      "X is what percent of Y",
      "Percentage change between two values",
      "Increase or decrease by a percentage",
      "Percentage difference",
      "Discount and VAT",
    ],
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <ToolHeader title="Percentage Calculator" subtitle="Fill in any row and the answer appears instantly." />
      <div className="space-y-4">
        <PercentOf />
        <WhatPercent />
        <Change />
        <IncreaseDecrease />
        <ReversePercent />
        <Difference />
        <Discount />
      </div>
    </div>
  );
}

function Row({ title, children, result, explain }: { title: string; children: ReactNode; result: ReactNode; explain?: ReactNode }) {
  return (
    <Panel className="space-y-3">
      <h2 className="text-sm font-semibold text-blue-700 dark:text-blue-300">{title}</h2>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {children}
        <span className="font-medium">=</span>
        <span className="min-w-24 rounded-md bg-muted px-3 py-1.5 text-lg font-bold tabular-nums" data-testid="pct-result">
          {result}
        </span>
      </div>
      {explain ? <p className="text-xs text-muted-foreground">{explain}</p> : null}
    </Panel>
  );
}

function NumIn({ value, onChange, label, className }: { value: string; onChange: (v: string) => void; label: string; className?: string }) {
  return (
    <Input
      inputMode="decimal"
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className ?? "w-28"}
    />
  );
}

const pct = (v: number) => (Number.isFinite(v) ? `${fmt(v, 4)}%` : "—");

function PercentOf() {
  const [p, setP] = useState("15");
  const [x, setX] = useState("200");
  const r = (num(p) / 100) * num(x);
  return (
    <Row title="What is X% of Y?" result={fmt(r, 6)} explain={Number.isFinite(r) ? `${p} ÷ 100 × ${x} = ${fmt(r, 6)}` : undefined}>
      <span>What is</span>
      <NumIn value={p} onChange={setP} label="Percent" className="w-20" />
      <span>% of</span>
      <NumIn value={x} onChange={setX} label="Number" />
      <span>?</span>
    </Row>
  );
}

function WhatPercent() {
  const [a, setA] = useState("30");
  const [b, setB] = useState("200");
  const r = (num(a) / num(b)) * 100;
  return (
    <Row title="X is what percent of Y?" result={pct(r)} explain={Number.isFinite(r) ? `${a} ÷ ${b} × 100 = ${fmt(r, 4)}%` : undefined}>
      <NumIn value={a} onChange={setA} label="Part" />
      <span>is what % of</span>
      <NumIn value={b} onChange={setB} label="Whole" />
      <span>?</span>
    </Row>
  );
}

function Change() {
  const [from, setFrom] = useState("80");
  const [to, setTo] = useState("100");
  const r = ((num(to) - num(from)) / Math.abs(num(from))) * 100;
  return (
    <Row
      title="Percentage change (increase or decrease)"
      result={Number.isFinite(r) ? `${r > 0 ? "+" : ""}${fmt(r, 4)}%` : "—"}
      explain={Number.isFinite(r) ? `(${to} − ${from}) ÷ |${from}| × 100. That is a ${r >= 0 ? "increase" : "decrease"} of ${fmt(Math.abs(r), 4)}%.` : undefined}
    >
      <span>From</span>
      <NumIn value={from} onChange={setFrom} label="Old value" />
      <span>to</span>
      <NumIn value={to} onChange={setTo} label="New value" />
    </Row>
  );
}

function IncreaseDecrease() {
  const [x, setX] = useState("500");
  const [p, setP] = useState("10");
  const [dir, setDir] = useState<"inc" | "dec">("inc");
  const r = num(x) * (1 + ((dir === "inc" ? 1 : -1) * num(p)) / 100);
  return (
    <Row title="Increase or decrease a number by a percentage" result={fmt(r, 6)} explain={Number.isFinite(r) ? `${x} × (1 ${dir === "inc" ? "+" : "−"} ${p}/100)` : undefined}>
      <select
        value={dir}
        onChange={(e) => setDir(e.target.value as "inc" | "dec")}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        aria-label="Direction"
      >
        <option value="inc">Increase</option>
        <option value="dec">Decrease</option>
      </select>
      <NumIn value={x} onChange={setX} label="Number" />
      <span>by</span>
      <NumIn value={p} onChange={setP} label="Percent" className="w-20" />
      <span>%</span>
    </Row>
  );
}

function ReversePercent() {
  const [a, setA] = useState("45");
  const [p, setP] = useState("15");
  const r = num(a) / (num(p) / 100);
  return (
    <Row title="X is P% of what number?" result={fmt(r, 6)} explain={Number.isFinite(r) ? `${a} ÷ (${p} ÷ 100)` : undefined}>
      <NumIn value={a} onChange={setA} label="Part" />
      <span>is</span>
      <NumIn value={p} onChange={setP} label="Percent" className="w-20" />
      <span>% of what?</span>
    </Row>
  );
}

function Difference() {
  const [a, setA] = useState("120");
  const [b, setB] = useState("100");
  const r = (Math.abs(num(a) - num(b)) / ((num(a) + num(b)) / 2)) * 100;
  return (
    <Row title="Percentage difference between two numbers" result={pct(r)} explain="|A − B| ÷ ((A + B) ÷ 2) × 100. Use this when neither value is the “original”.">
      <NumIn value={a} onChange={setA} label="Value A" />
      <span>and</span>
      <NumIn value={b} onChange={setB} label="Value B" />
    </Row>
  );
}

function Discount() {
  const [price, setPrice] = useState("1500");
  const [off, setOff] = useState("20");
  const [vat, setVat] = useState("15");
  const p = num(price);
  const saved = (p * num(off || "0")) / 100;
  const after = p - saved;
  const tax = (after * num(vat || "0")) / 100;
  return (
    <Panel className="space-y-3">
      <h2 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Discount and VAT</h2>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>Price</span>
        <NumIn value={price} onChange={setPrice} label="Price" />
        <span>discount</span>
        <NumIn value={off} onChange={setOff} label="Discount percent" className="w-20" />
        <span>% · VAT</span>
        <NumIn value={vat} onChange={setVat} label="VAT percent" className="w-20" />
        <span>%</span>
      </div>
      <div className="grid gap-2 text-sm sm:grid-cols-4">
        <Cell label="You save" value={fmt(saved)} />
        <Cell label="Price after discount" value={fmt(after)} />
        <Cell label="VAT" value={fmt(tax)} />
        <Cell label="Total to pay" value={fmt(after + tax)} strong />
      </div>
      <p className="text-xs text-muted-foreground">Ethiopia's standard VAT rate is 15%. Set VAT to 0 to ignore it.</p>
    </Panel>
  );
}

function Cell({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-md bg-muted px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={strong ? "text-lg font-bold tabular-nums" : "font-semibold tabular-nums"}>{value}</div>
    </div>
  );
}
