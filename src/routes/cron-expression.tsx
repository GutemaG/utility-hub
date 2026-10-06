import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import cronstrue from "cronstrue";
import { CronExpressionParser } from "cron-parser";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSEO } from "@/hooks/use-seo";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cron-expression")({
  component: RouteComponent,
});

const PRESETS: { label: string; expr: string }[] = [
  { label: "Every minute", expr: "* * * * *" },
  { label: "Every 5 minutes", expr: "*/5 * * * *" },
  { label: "Every 15 minutes", expr: "*/15 * * * *" },
  { label: "Every hour", expr: "0 * * * *" },
  { label: "Every day at midnight", expr: "0 0 * * *" },
  { label: "Every day at 9:00", expr: "0 9 * * *" },
  { label: "Weekdays at 9:00", expr: "0 9 * * 1-5" },
  { label: "Every Monday at 8:00", expr: "0 8 * * 1" },
  { label: "1st of every month", expr: "0 0 1 * *" },
  { label: "Every 6 hours", expr: "0 */6 * * *" },
  { label: "Office hours, every 30 min", expr: "*/30 9-17 * * 1-5" },
  { label: "Every year on Jan 1", expr: "0 0 1 1 *" },
];

type FieldDef = { name: string; range: string; examples: string };

const FIELDS_5: FieldDef[] = [
  { name: "Minute", range: "0–59", examples: "0, */5, 15,45" },
  { name: "Hour", range: "0–23", examples: "9, 9-17, */2" },
  { name: "Day of month", range: "1–31, L", examples: "1, 15, L" },
  { name: "Month", range: "1–12 or JAN–DEC", examples: "*, 1-6, JAN" },
  { name: "Day of week", range: "0–7 or SUN–SAT (0 and 7 = Sunday)", examples: "1-5, MON, 5L" },
];
const SECONDS: FieldDef = { name: "Second", range: "0–59", examples: "0, */10" };

const SYNTAX: [string, string][] = [
  ["*", "any value"],
  [",", "list: 1,15,30"],
  ["-", "range: 9-17"],
  ["/", "step: */5 (every 5), 10-40/10"],
  ["L", "last: L in day-of-month = last day; 5L in day-of-week = last Friday"],
  ["#", "nth weekday: 1#2 = second Monday of the month"],
  ["?", "same as * (Quartz style, day fields only)"],
  ["@yearly @monthly @weekly @daily @hourly", "shortcuts"],
];

function localTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function allTimeZones(): string[] {
  try {
    return (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf("timeZone");
  } catch {
    return [localTimeZone(), "UTC"];
  }
}

function RouteComponent() {
  const [expr, setExpr] = useState("*/15 9-17 * * 1-5");
  const [tz, setTz] = useState(localTimeZone);
  const [use24h, setUse24h] = useState(true);
  const [copied, setCopied] = useState(false);
  const zones = useMemo(allTimeZones, []);

  useSEO({
    title: "Cron Expression Generator & Explainer | Utility Hub",
    description:
      "Build and understand cron schedules: get a plain-English description of any cron expression and see the next run times in your time zone. Supports seconds, L, # and @daily shortcuts.",
    path: "/cron-expression",
    keywords: "cron expression generator, crontab guru, cron explainer, cron next run, cron schedule builder, cron syntax",
    applicationCategory: "DeveloperApplication",
    featureList: [
      "Plain-English description of any cron expression",
      "Next run times in any time zone",
      "Field-by-field editor and common presets",
      "5-field and 6-field (with seconds) syntax",
    ],
  });

  const trimmed = expr.trim().replace(/\s+/g, " ");
  const isMacro = trimmed.startsWith("@");
  const parts = isMacro ? [] : trimmed.split(" ");
  const hasSeconds = parts.length === 6;
  const fieldDefs = hasSeconds ? [SECONDS, ...FIELDS_5] : FIELDS_5;

  const result = useMemo(() => {
    if (!trimmed) return { error: "Enter a cron expression." };
    if (!isMacro && (parts.length < 5 || parts.length > 6)) {
      return { error: `Expected 5 fields (or 6 with seconds), got ${parts.length}.` };
    }
    try {
      const interval = CronExpressionParser.parse(trimmed, { tz, strict: false });
      const next = interval.take(10).map((d) => d.toDate());
      let description = "";
      try {
        description = isMacro ? macroDescription(trimmed) : cronstrue.toString(trimmed, { use24HourTimeFormat: use24h, verbose: true });
      } catch {
        description = "";
      }
      return { description, next };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Invalid cron expression." };
    }
  }, [trimmed, tz, use24h, isMacro, parts.length]);

  const setField = (index: number, value: string) => {
    const next = [...parts];
    next[index] = value.replace(/\s+/g, "") || "*";
    setExpr(next.join(" "));
  };

  const toggleSeconds = () => setExpr(hasSeconds ? parts.slice(1).join(" ") : `0 ${parts.join(" ")}`);

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        timeZone: tz,
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: hasSeconds ? "2-digit" : undefined,
        hour12: !use24h,
      }),
    [tz, use24h, hasSeconds]
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-foreground sm:text-4xl">Cron Expression Generator</h1>
        <p className="text-muted-foreground">Build a cron schedule, read it in plain English, and see exactly when it runs next.</p>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Cron expression</Label>
            <div className="flex gap-2">
              {!isMacro ? (
                <Button size="sm" variant="ghost" onClick={toggleSeconds} disabled={parts.length < 5}>
                  {hasSeconds ? "Remove seconds field" : "Add seconds field"}
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  if (await copyText(trimmed)) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }
                }}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
          <Input
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            spellCheck={false}
            className="h-12 font-mono text-lg tracking-wider"
            placeholder="*/5 * * * *"
          />
        </div>

        <div className={cn("rounded-lg border p-4", "error" in result ? "border-red-500/30 bg-red-500/5" : "border-blue-500/20 bg-blue-500/5")}>
          {"error" in result ? (
            <p className="text-sm text-red-600">{result.error}</p>
          ) : (
            <p className="text-lg font-medium text-foreground">“{result.description || trimmed}”</p>
          )}
        </div>

        {!isMacro && parts.length >= 5 && parts.length <= 6 ? (
          <div className={cn("grid gap-3", hasSeconds ? "grid-cols-2 sm:grid-cols-6" : "grid-cols-2 sm:grid-cols-5")}>
            {fieldDefs.map((f, i) => (
              <div key={f.name} className="space-y-1">
                <Label className="text-xs">{f.name}</Label>
                <Input value={parts[i] ?? ""} onChange={(e) => setField(i, e.target.value)} spellCheck={false} className="text-center font-mono" />
                <p className="text-[11px] leading-tight text-muted-foreground">{f.range}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="space-y-2">
          <Label>Presets</Label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.expr}
                onClick={() => setExpr(p.expr)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition",
                  trimmed === p.expr ? "border-blue-600 bg-blue-600 text-white" : "border-border hover:bg-accent/50"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Next runs</h2>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={use24h} onChange={(e) => setUse24h(e.target.checked)} />
              24-hour
            </label>
          </div>
          <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={tz} onChange={(e) => setTz(e.target.value)}>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
                {z === localTimeZone() ? " (your time zone)" : ""}
              </option>
            ))}
          </select>
          {"next" in result && result.next ? (
            <ol className="divide-y divide-border rounded-lg border border-border">
              {result.next.map((d, i) => (
                <li key={d.getTime()} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="font-mono">{dateFmt.format(d)}</span>
                  <span className="text-xs text-muted-foreground">{i === 0 ? relative(d) : ""}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">Fix the expression to see upcoming runs.</p>
          )}
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold">Syntax</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {fieldDefs.map((f) => (
                  <tr key={f.name}>
                    <td className="py-1.5 pr-3 font-medium">{f.name}</td>
                    <td className="py-1.5 pr-3 text-muted-foreground">{f.range}</td>
                    <td className="py-1.5 font-mono text-xs text-muted-foreground">{f.examples}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="space-y-1 text-sm">
            {SYNTAX.map(([k, v]) => (
              <div key={k} className="flex gap-3">
                <dt className="w-20 shrink-0 font-mono font-semibold">{k}</dt>
                <dd className="text-muted-foreground">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-muted-foreground">
            When both day-of-month and day-of-week are set, standard cron runs on either match (e.g. "0 0 13 * 5" runs on
            every 13th and every Friday).
          </p>
        </div>
      </div>
    </div>
  );
}

function macroDescription(macro: string) {
  const map: Record<string, string> = {
    "@yearly": "Once a year, at midnight on January 1",
    "@annually": "Once a year, at midnight on January 1",
    "@monthly": "Once a month, at midnight on the 1st",
    "@weekly": "Once a week, at midnight on Sunday",
    "@daily": "Once a day, at midnight",
    "@midnight": "Once a day, at midnight",
    "@hourly": "Once an hour, at the start of the hour",
  };
  return map[macro.toLowerCase()] ?? macro;
}

function relative(date: Date) {
  const diff = date.getTime() - Date.now();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "in less than a minute";
  if (mins < 60) return `in ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `in ${hours} h`;
  return `in ${Math.round(hours / 24)} days`;
}

export default RouteComponent;
