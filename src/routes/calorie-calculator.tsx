import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { Input } from "@/components/ui/input";
import { Chip, Field, Panel, Stat, ToolHeader } from "@/components/tool-ui";
import { fmt, num } from "@/lib/num";
import { useSEO } from "@/hooks/use-seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calorie-calculator")({
  component: RouteComponent,
});

type Sex = "male" | "female";
type Units = "metric" | "imperial";
type Formula = "mifflin" | "harris" | "katch";

const ACTIVITY = [
  { factor: 1.2, label: "Sedentary", hint: "Little or no exercise, desk job" },
  { factor: 1.375, label: "Light", hint: "Exercise 1–3 days a week" },
  { factor: 1.55, label: "Moderate", hint: "Exercise 3–5 days a week" },
  { factor: 1.725, label: "Active", hint: "Hard exercise 6–7 days a week" },
  { factor: 1.9, label: "Very active", hint: "Physical job or training twice a day" },
];

// 1 kg of body fat ≈ 7700 kcal, so 1 kg/week ≈ 1100 kcal/day.
const GOALS = [
  { kgPerWeek: -1, label: "Lose 1 kg/week" },
  { kgPerWeek: -0.5, label: "Lose 0.5 kg/week" },
  { kgPerWeek: -0.25, label: "Lose 0.25 kg/week" },
  { kgPerWeek: 0, label: "Maintain weight" },
  { kgPerWeek: 0.25, label: "Gain 0.25 kg/week" },
  { kgPerWeek: 0.5, label: "Gain 0.5 kg/week" },
];

const MACROS = [
  { key: "balanced", label: "Balanced", p: 0.3, c: 0.4, f: 0.3 },
  { key: "lowcarb", label: "Low carb", p: 0.35, c: 0.25, f: 0.4 },
  { key: "highprotein", label: "High protein", p: 0.4, c: 0.35, f: 0.25 },
  { key: "lowfat", label: "Low fat", p: 0.3, c: 0.5, f: 0.2 },
] as const;

function RouteComponent() {
  const [units, setUnits] = useState<Units>("metric");
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState("30");
  const [cm, setCm] = useState("175");
  const [ft, setFt] = useState("5");
  const [inch, setInch] = useState("9");
  const [weight, setWeight] = useState("75");
  const [bodyFat, setBodyFat] = useState("");
  const [activity, setActivity] = useState(1.55);
  const [formula, setFormula] = useState<Formula>("mifflin");
  const [goal, setGoal] = useState(-0.5);
  const [macro, setMacro] = useState<(typeof MACROS)[number]["key"]>("balanced");

  useSEO({
    title: "Calorie Calculator: TDEE, BMR & Calorie Deficit | Utility Hub",
    description:
      "Find how many calories you need a day to lose, maintain or gain weight. Calculates BMR and TDEE (Mifflin-St Jeor, Harris-Benedict, Katch-McArdle) with a calorie deficit plan and macro split.",
    path: "/calorie-calculator",
    keywords:
      "calorie calculator, calorie deficit calculator, tdee calculator, bmr calculator, maintenance calories, how many calories should i eat, macro calculator",
    applicationCategory: "HealthApplication",
    featureList: [
      "BMR with three formulas",
      "TDEE from activity level",
      "Daily calories to lose or gain weight",
      "Macro split in grams",
      "Metric and imperial units",
    ],
  });

  const a = num(age);
  const heightCm = units === "metric" ? num(cm) : (num(ft) * 12 + (num(inch) || 0)) * 2.54;
  const weightKg = units === "metric" ? num(weight) : num(weight) * 0.45359237;
  const bf = num(bodyFat);
  const useFormula: Formula = formula === "katch" && !(bf > 0 && bf < 70) ? "mifflin" : formula;

  let bmr = NaN;
  if (a > 0 && heightCm > 0 && weightKg > 0) {
    if (useFormula === "mifflin") bmr = 10 * weightKg + 6.25 * heightCm - 5 * a + (sex === "male" ? 5 : -161);
    else if (useFormula === "harris")
      bmr =
        sex === "male"
          ? 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * a
          : 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * a;
    else bmr = 370 + 21.6 * weightKg * (1 - bf / 100);
  }
  const tdee = bmr * activity;
  const floor = sex === "male" ? 1500 : 1200;
  const target = tdee + goal * 1100;
  const m = MACROS.find((x) => x.key === macro)!;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <ToolHeader title="Calorie Calculator" subtitle="Your daily calories for losing, keeping or gaining weight, based on your body and activity." />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Panel>
          <div className="flex flex-wrap gap-4">
            <div className="flex gap-1.5">
              <Chip active={units === "metric"} onClick={() => setUnits("metric")}>
                Metric
              </Chip>
              <Chip active={units === "imperial"} onClick={() => setUnits("imperial")}>
                US / Imperial
              </Chip>
            </div>
            <div className="flex gap-1.5">
              <Chip active={sex === "male"} onClick={() => setSex("male")}>
                Male
              </Chip>
              <Chip active={sex === "female"} onClick={() => setSex("female")}>
                Female
              </Chip>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Age">
              <Input type="number" min={15} max={100} value={age} onChange={(e) => setAge(e.target.value)} />
            </Field>
            {units === "metric" ? (
              <Field label="Height (cm)">
                <Input type="number" value={cm} onChange={(e) => setCm(e.target.value)} />
              </Field>
            ) : (
              <Field label="Height (ft, in)">
                <div className="flex gap-2">
                  <Input type="number" value={ft} onChange={(e) => setFt(e.target.value)} aria-label="Feet" />
                  <Input type="number" value={inch} onChange={(e) => setInch(e.target.value)} aria-label="Inches" />
                </div>
              </Field>
            )}
            <Field label={`Weight (${units === "metric" ? "kg" : "lb"})`}>
              <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </Field>
          </div>
          <Field label="Activity level">
            <div className="grid gap-1.5 sm:grid-cols-2">
              {ACTIVITY.map((x) => (
                <button
                  key={x.factor}
                  onClick={() => setActivity(x.factor)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-left text-sm transition",
                    activity === x.factor ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40" : "border-border hover:bg-accent/50"
                  )}
                >
                  <div className="font-medium">{x.label}</div>
                  <div className="text-xs text-muted-foreground">{x.hint}</div>
                </button>
              ))}
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Formula">
              <div className="flex flex-wrap gap-1.5">
                <Chip active={formula === "mifflin"} onClick={() => setFormula("mifflin")}>
                  Mifflin-St Jeor
                </Chip>
                <Chip active={formula === "harris"} onClick={() => setFormula("harris")}>
                  Harris-Benedict
                </Chip>
                <Chip active={formula === "katch"} onClick={() => setFormula("katch")}>
                  Katch-McArdle
                </Chip>
              </div>
            </Field>
            <Field label="Body fat % (optional)" hint={formula === "katch" && useFormula !== "katch" ? "Katch-McArdle needs your body fat %." : undefined}>
              <Input type="number" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} placeholder="e.g. 20" />
            </Field>
          </div>
        </Panel>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="BMR (at rest)" value={Number.isFinite(bmr) ? `${fmt(bmr, 0)}` : "—"} sub="kcal/day" />
            <Stat label="Maintenance (TDEE)" value={Number.isFinite(tdee) ? `${fmt(tdee, 0)}` : "—"} sub="kcal/day" />
          </div>
          <Panel className="space-y-2 p-4 sm:p-4">
            <h2 className="text-sm font-semibold">Daily calories by goal</h2>
            {GOALS.map((g) => {
              const kcal = tdee + g.kgPerWeek * 1100;
              const low = kcal < floor;
              return (
                <button
                  key={g.kgPerWeek}
                  onClick={() => setGoal(g.kgPerWeek)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition",
                    goal === g.kgPerWeek ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40" : "border-border hover:bg-accent/50"
                  )}
                >
                  <span>{g.label}</span>
                  <span className={cn("font-semibold tabular-nums", low && "text-amber-600")} data-testid={`goal-${g.kgPerWeek}`}>
                    {Number.isFinite(kcal) ? `${fmt(kcal, 0)} kcal` : "—"}
                    {low && Number.isFinite(kcal) ? " ⚠" : ""}
                  </span>
                </button>
              );
            })}
            {Number.isFinite(target) && target < floor ? (
              <p className="text-xs text-amber-600">
                Eating under about {floor} kcal a day is not recommended without medical supervision. Choose a slower rate.
              </p>
            ) : null}
          </Panel>
          <Panel className="space-y-3 p-4 sm:p-4">
            <h2 className="text-sm font-semibold">Macros for {fmt(target, 0)} kcal</h2>
            <div className="flex flex-wrap gap-1.5">
              {MACROS.map((x) => (
                <Chip key={x.key} active={macro === x.key} onClick={() => setMacro(x.key)} className="px-2 py-1 text-xs">
                  {x.label}
                </Chip>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              {(
                [
                  ["Protein", m.p, 4, "bg-rose-500"],
                  ["Carbs", m.c, 4, "bg-amber-500"],
                  ["Fat", m.f, 9, "bg-sky-500"],
                ] as const
              ).map(([label, share, kcalPerGram, color]) => (
                <div key={label} className="rounded-md bg-muted p-2">
                  <div className={cn("mx-auto mb-1 h-1.5 w-8 rounded-full", color)} />
                  <div className="text-lg font-bold tabular-nums">{Number.isFinite(target) ? `${fmt((target * share) / kcalPerGram, 0)} g` : "—"}</div>
                  <div className="text-xs text-muted-foreground">
                    {label} · {Math.round(share * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
      <Panel>
        <h2 className="text-sm font-semibold">How it works</h2>
        <p className="text-sm text-muted-foreground">
          BMR is the energy your body uses at rest. Multiplying it by your activity factor gives your total daily energy expenditure
          (TDEE), the calories that keep your weight steady. A pound of fat stores about 3,500 kcal (≈7,700 kcal per kg), so eating
          550 kcal below TDEE each day loses roughly 0.5 kg a week. These are estimates: track your weight for 2–3 weeks and adjust.
        </p>
      </Panel>
    </div>
  );
}
