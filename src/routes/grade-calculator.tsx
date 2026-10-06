import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chip, Field, Panel, Stat, Tabs, ToolHeader } from "@/components/tool-ui";
import { fmt, num } from "@/lib/num";
import { useSEO } from "@/hooks/use-seo";

export const Route = createFileRoute("/grade-calculator")({
  component: RouteComponent,
});

type Band = { letter: string; min: number; points: number };
type ScaleKey = "ethiopia" | "us";

const SCALES: Record<ScaleKey, { label: string; bands: Band[]; note: string }> = {
  ethiopia: {
    label: "Ethiopian universities",
    note: "Harmonized grading used by Ethiopian public universities. Your institution's scale may differ slightly.",
    bands: [
      { letter: "A+", min: 90, points: 4 },
      { letter: "A", min: 85, points: 4 },
      { letter: "A-", min: 80, points: 3.75 },
      { letter: "B+", min: 75, points: 3.5 },
      { letter: "B", min: 70, points: 3 },
      { letter: "B-", min: 65, points: 2.75 },
      { letter: "C+", min: 60, points: 2.5 },
      { letter: "C", min: 50, points: 2 },
      { letter: "C-", min: 45, points: 1.75 },
      { letter: "D", min: 40, points: 1 },
      { letter: "Fx", min: 30, points: 0 },
      { letter: "F", min: 0, points: 0 },
    ],
  },
  us: {
    label: "US 4.0",
    note: "Common US high school and college scale. Some schools give A+ 4.33.",
    bands: [
      { letter: "A+", min: 97, points: 4 },
      { letter: "A", min: 93, points: 4 },
      { letter: "A-", min: 90, points: 3.7 },
      { letter: "B+", min: 87, points: 3.3 },
      { letter: "B", min: 83, points: 3 },
      { letter: "B-", min: 80, points: 2.7 },
      { letter: "C+", min: 77, points: 2.3 },
      { letter: "C", min: 73, points: 2 },
      { letter: "C-", min: 70, points: 1.7 },
      { letter: "D+", min: 67, points: 1.3 },
      { letter: "D", min: 65, points: 1 },
      { letter: "F", min: 0, points: 0 },
    ],
  },
};

function bandFor(scale: ScaleKey, percent: number): Band | undefined {
  if (!Number.isFinite(percent)) return undefined;
  return SCALES[scale].bands.find((b) => percent >= b.min);
}

type Tab = "gpa" | "weighted" | "final";
const STORE_KEY = "utility-hub:grade-calculator:v1";

type Course = { id: number; name: string; credits: string; grade: string };
type Item = { id: number; name: string; score: string; weight: string };

type Stored = {
  scale: ScaleKey;
  courses: Course[];
  prevGpa: string;
  prevCredits: string;
  items: Item[];
};

let nextId = 100;

const DEFAULT_STORE: Stored = {
  scale: "ethiopia",
  courses: [
    { id: 1, name: "Calculus", credits: "4", grade: "A" },
    { id: 2, name: "Physics", credits: "3", grade: "B+" },
    { id: 3, name: "English", credits: "2", grade: "A-" },
    { id: 4, name: "", credits: "3", grade: "" },
  ],
  prevGpa: "",
  prevCredits: "",
  items: [
    { id: 5, name: "Assignments", score: "90", weight: "20" },
    { id: 6, name: "Mid exam", score: "78", weight: "30" },
    { id: 7, name: "Final exam", score: "", weight: "50" },
  ],
};

function load(): Stored {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? { ...DEFAULT_STORE, ...JSON.parse(raw) } : DEFAULT_STORE;
  } catch {
    return DEFAULT_STORE;
  }
}

function RouteComponent() {
  const [tab, setTab] = useState<Tab>("gpa");
  const [store, setStore] = useState<Stored>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch {
      /* storage unavailable */
    }
  }, [store]);

  useSEO({
    title: "Grade & GPA Calculator (Ethiopian and US scales) | Utility Hub",
    description:
      "Calculate your semester GPA and cumulative CGPA, your weighted course grade, and the score you need on the final exam. Supports the Ethiopian university grading scale and the US 4.0 scale.",
    path: "/grade-calculator",
    keywords:
      "grade calculator, gpa calculator, cgpa calculator, final grade calculator, weighted grade calculator, ethiopian university gpa, what do i need on my final",
    applicationCategory: "EducationalApplication",
    featureList: [
      "Semester GPA and cumulative CGPA",
      "Weighted grade from assignments and exams",
      "Score needed on the final exam",
      "Ethiopian harmonized and US 4.0 grading scales",
    ],
  });

  const update = (patch: Partial<Stored>) => setStore((s) => ({ ...s, ...patch }));

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <ToolHeader title="Grade & GPA Calculator" subtitle="Work out your GPA, your current course grade, and what you need on the final." />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { value: "gpa", label: "GPA / CGPA" },
            { value: "weighted", label: "Weighted grade" },
            { value: "final", label: "Final exam" },
          ]}
        />
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">Scale</span>
          {(Object.keys(SCALES) as ScaleKey[]).map((k) => (
            <Chip key={k} active={store.scale === k} onClick={() => update({ scale: k })}>
              {SCALES[k].label}
            </Chip>
          ))}
        </div>
      </div>
      {tab === "gpa" && <GpaTool store={store} update={update} />}
      {tab === "weighted" && <WeightedTool store={store} update={update} />}
      {tab === "final" && <FinalTool scale={store.scale} />}
      <ScaleTable scale={store.scale} />
    </div>
  );
}

/** A grade cell accepts a letter (B+) or a percentage (78). */
function gradePoints(scale: ScaleKey, grade: string): Band | undefined {
  const g = grade.trim().toUpperCase();
  if (!g) return undefined;
  const byLetter = SCALES[scale].bands.find((b) => b.letter.toUpperCase() === g);
  if (byLetter) return byLetter;
  const pct = num(g.replace("%", ""));
  return pct >= 0 && pct <= 100 ? bandFor(scale, pct) : undefined;
}

function GpaTool({ store, update }: { store: Stored; update: (p: Partial<Stored>) => void }) {
  const { scale, courses } = store;
  const setCourse = (id: number, patch: Partial<Course>) =>
    update({ courses: courses.map((c) => (c.id === id ? { ...c, ...patch } : c)) });

  let credits = 0;
  let points = 0;
  for (const c of courses) {
    const cr = num(c.credits);
    const band = gradePoints(scale, c.grade);
    if (cr > 0 && band) {
      credits += cr;
      points += cr * band.points;
    }
  }
  const gpa = credits ? points / credits : NaN;
  const prevGpa = num(store.prevGpa);
  const prevCredits = num(store.prevCredits);
  const hasPrev = prevGpa >= 0 && prevCredits > 0;
  const cgpa = hasPrev ? (points + prevGpa * prevCredits) / (credits + prevCredits) : NaN;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <Panel>
        <div className="grid grid-cols-[1fr_56px_76px_20px] sm:grid-cols-[1fr_80px_90px_70px_32px] gap-2 text-xs font-medium text-muted-foreground">
          <span>Course</span>
          <span>Credits</span>
          <span>Grade</span>
          <span className="hidden sm:block">Points</span>
          <span />
        </div>
        {courses.map((c, i) => {
          const band = gradePoints(scale, c.grade);
          return (
            <div key={c.id} className="grid grid-cols-[1fr_56px_76px_20px] sm:grid-cols-[1fr_80px_90px_70px_32px] items-center gap-2">
              <Input placeholder={`Course ${i + 1}`} value={c.name} onChange={(e) => setCourse(c.id, { name: e.target.value })} />
              <Input type="number" min={0} value={c.credits} onChange={(e) => setCourse(c.id, { credits: e.target.value })} aria-label="Credits" />
              <Input
                list={`letters-${scale}`}
                placeholder="A or 87"
                value={c.grade}
                onChange={(e) => setCourse(c.id, { grade: e.target.value })}
                aria-label="Grade"
                className={c.grade && !band ? "border-red-500" : undefined}
              />
              <span className="hidden text-sm tabular-nums text-muted-foreground sm:block">
                {band ? `${band.letter} · ${band.points}` : "—"}
              </span>
              <button
                className="text-muted-foreground hover:text-red-600"
                aria-label="Remove course"
                onClick={() => update({ courses: courses.filter((x) => x.id !== c.id) })}
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
        <datalist id={`letters-${scale}`}>
          {SCALES[scale].bands.map((b) => (
            <option key={b.letter} value={b.letter} />
          ))}
        </datalist>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => update({ courses: [...courses, { id: nextId++, name: "", credits: "3", grade: "" }] })}>
            <Plus className="size-4" /> Add course
          </Button>
          <Button variant="ghost" size="sm" onClick={() => update({ courses: DEFAULT_STORE.courses.map((c) => ({ ...c, grade: "", name: "" })) })}>
            <RotateCcw className="size-4" /> Clear
          </Button>
        </div>
        <div className="border-t border-border pt-4">
          <h2 className="mb-2 text-sm font-semibold">Previous semesters (optional)</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Current CGPA">
              <Input type="number" step="0.01" min={0} max={4} value={store.prevGpa} onChange={(e) => update({ prevGpa: e.target.value })} />
            </Field>
            <Field label="Credits completed">
              <Input type="number" min={0} value={store.prevCredits} onChange={(e) => update({ prevCredits: e.target.value })} />
            </Field>
          </div>
        </div>
      </Panel>
      <div className="space-y-3">
        <Stat label="Semester GPA" value={Number.isFinite(gpa) ? gpa.toFixed(2) : "—"} sub={`${fmt(credits)} credits · ${fmt(points)} grade points`} highlight />
        {hasPrev ? <Stat label="Cumulative CGPA" value={Number.isFinite(cgpa) ? cgpa.toFixed(2) : "—"} sub={`${fmt(credits + prevCredits)} total credits`} /> : null}
        {scale === "ethiopia" && Number.isFinite(gpa) ? <Stat label="Standing" value={ethiopianStanding(hasPrev ? cgpa : gpa)} /> : null}
      </div>
    </div>
  );
}

function ethiopianStanding(gpa: number) {
  if (gpa >= 3.75) return "Very great distinction";
  if (gpa >= 3.5) return "Great distinction";
  if (gpa >= 3.25) return "Distinction";
  if (gpa >= 2) return "Pass";
  return "Below 2.00 (academic warning)";
}

function WeightedTool({ store, update }: { store: Stored; update: (p: Partial<Stored>) => void }) {
  const { items, scale } = store;
  const setItem = (id: number, patch: Partial<Item>) => update({ items: items.map((c) => (c.id === id ? { ...c, ...patch } : c)) });

  let earned = 0;
  let gradedWeight = 0;
  let totalWeight = 0;
  for (const it of items) {
    const w = num(it.weight);
    if (!(w > 0)) continue;
    totalWeight += w;
    const s = parseScore(it.score);
    if (Number.isFinite(s)) {
      earned += s * w;
      gradedWeight += w;
    }
  }
  const current = gradedWeight ? earned / gradedWeight : NaN;
  const band = bandFor(scale, current);
  const remaining = Math.max(0, totalWeight - gradedWeight);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <Panel>
        <div className="grid grid-cols-[1fr_84px_60px_20px] sm:grid-cols-[1fr_110px_90px_32px] gap-2 text-xs font-medium text-muted-foreground">
          <span>Assessment</span>
          <span>Score</span>
          <span>Weight %</span>
          <span />
        </div>
        {items.map((it, i) => (
          <div key={it.id} className="grid grid-cols-[1fr_84px_60px_20px] sm:grid-cols-[1fr_110px_90px_32px] items-center gap-2">
            <Input placeholder={`Item ${i + 1}`} value={it.name} onChange={(e) => setItem(it.id, { name: e.target.value })} />
            <Input placeholder="85 or 18/20" value={it.score} onChange={(e) => setItem(it.id, { score: e.target.value })} aria-label="Score" />
            <Input type="number" min={0} value={it.weight} onChange={(e) => setItem(it.id, { weight: e.target.value })} aria-label="Weight" />
            <button className="text-muted-foreground hover:text-red-600" aria-label="Remove" onClick={() => update({ items: items.filter((x) => x.id !== it.id) })}>
              <X className="size-4" />
            </button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => update({ items: [...items, { id: nextId++, name: "", score: "", weight: "10" }] })}>
          <Plus className="size-4" /> Add assessment
        </Button>
        <p className="text-xs text-muted-foreground">Leave a score blank if it hasn't been graded yet. Weights don't have to add up to 100.</p>
      </Panel>
      <div className="space-y-3">
        <Stat
          label="Current grade"
          value={Number.isFinite(current) ? `${current.toFixed(2)}%` : "—"}
          sub={band ? `${band.letter} (${band.points} points)` : undefined}
          highlight
        />
        <Stat label="Points earned so far" value={`${fmt(earned / 100)} / ${fmt(totalWeight)}`} sub={`${fmt(gradedWeight)}% of the course graded`} />
        {remaining > 0 ? <Stat label="Still to be graded" value={`${fmt(remaining)}%`} /> : null}
      </div>
    </div>
  );
}

function parseScore(value: string): number {
  const v = value.trim();
  if (!v) return NaN;
  const frac = v.match(/^([\d.]+)\s*\/\s*([\d.]+)$/);
  if (frac) {
    const total = Number(frac[2]);
    return total > 0 ? (Number(frac[1]) / total) * 100 : NaN;
  }
  return num(v.replace("%", ""));
}

function FinalTool({ scale }: { scale: ScaleKey }) {
  const [current, setCurrent] = useState("78");
  const [target, setTarget] = useState("85");
  const [weight, setWeight] = useState("40");

  const c = num(current);
  const t = num(target);
  const w = num(weight) / 100;
  const valid = Number.isFinite(c) && w > 0 && w <= 1;
  const needed = (goal: number) => (goal - c * (1 - w)) / w;
  const need = valid && Number.isFinite(t) ? needed(t) : NaN;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <Panel>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Current grade (%)">
            <Input type="number" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </Field>
          <Field label="Grade you want (%)">
            <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
          </Field>
          <Field label="Final exam weight (%)">
            <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </Field>
        </div>
        {valid ? (
          <table className="w-full text-sm tabular-nums">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-1 font-medium">To finish with</th>
                <th className="py-1 font-medium">You need on the final</th>
              </tr>
            </thead>
            <tbody>
              {SCALES[scale].bands
                .filter((b) => b.min > 0)
                .map((b) => {
                  const n = needed(b.min);
                  return (
                    <tr key={b.letter} className="border-t border-border">
                      <td className="py-1.5">
                        {b.letter} ({b.min}%+)
                      </td>
                      <td className="py-1.5">{n <= 0 ? "Already secured" : n > 100 ? `${n.toFixed(1)}% (not possible)` : `${n.toFixed(1)}%`}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        ) : null}
      </Panel>
      <div className="space-y-3">
        <Stat
          label="Score needed on the final"
          value={Number.isFinite(need) ? `${Math.max(0, need).toFixed(1)}%` : "—"}
          sub={Number.isFinite(need) ? (need > 100 ? "Above 100%, so this target isn't reachable." : need <= 0 ? "You've already reached this target." : `to finish with ${t}%`) : "Enter all three values."}
          highlight
        />
      </div>
    </div>
  );
}

function ScaleTable({ scale }: { scale: ScaleKey }) {
  const { bands, note, label } = SCALES[scale];
  return (
    <Panel>
      <h2 className="text-sm font-semibold">{label} grading scale</h2>
      <div className="grid grid-cols-3 gap-x-6 gap-y-1 text-sm sm:grid-cols-4 lg:grid-cols-6">
        {bands.map((b, i) => (
          <div key={b.letter} className="flex justify-between gap-2 tabular-nums">
            <b>{b.letter}</b>
            <span className="text-muted-foreground">
              {b.min}
              {i === 0 ? "–100" : `–<${bands[i - 1].min}`}
            </span>
            <span>{b.points.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{note}</p>
    </Panel>
  );
}
