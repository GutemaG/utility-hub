import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { Input } from "@/components/ui/input";
import { Chip, Field, Panel, Stat, ToolHeader } from "@/components/tool-ui";
import { fmt, num } from "@/lib/num";
import { useSEO } from "@/hooks/use-seo";

export const Route = createFileRoute("/compound-interest-calculator")({
  component: RouteComponent,
});

const COMPOUNDING = [
  { n: 1, label: "Yearly" },
  { n: 2, label: "Half-yearly" },
  { n: 4, label: "Quarterly" },
  { n: 12, label: "Monthly" },
  { n: 365, label: "Daily" },
  { n: Infinity, label: "Continuous" },
];

/** Effective annual yield for a nominal rate r compounded n times a year. */
function apy(r: number, n: number) {
  return n === Infinity ? Math.exp(r) - 1 : Math.pow(1 + r / n, n) - 1;
}

function RouteComponent() {
  const [principal, setPrincipal] = useState("10000");
  const [monthly, setMonthly] = useState("1000");
  const [rate, setRate] = useState("7");
  const [years, setYears] = useState("10");
  const [n, setN] = useState(12);
  const [apyIn, setApyIn] = useState("5");

  useSEO({
    title: "Compound Interest & APY Calculator | Utility Hub",
    description:
      "See how your savings grow with compound interest and monthly deposits. Shows APY (effective annual rate), total interest, and a year-by-year breakdown, plus an APR to APY converter.",
    path: "/compound-interest-calculator",
    keywords:
      "compound interest calculator, apy calculator, savings calculator, investment calculator, interest calculator, apr to apy, effective annual rate",
    applicationCategory: "FinanceApplication",
    featureList: [
      "Compound interest with monthly deposits",
      "Yearly, quarterly, monthly, daily or continuous compounding",
      "APY / effective annual rate",
      "Year-by-year growth table and chart",
      "APR ↔ APY converter",
    ],
  });

  const r = num(rate) / 100;
  const P = num(principal) || 0;
  const PMT = num(monthly) || 0;
  const Y = Math.min(Math.floor(num(years)), 100);
  const yieldPct = apy(r, n);

  const rows = useMemo(() => {
    if (!(Y > 0) || !Number.isFinite(r)) return [];
    const monthlyRate = Math.pow(1 + yieldPct, 1 / 12) - 1;
    let balance = P;
    let deposits = P;
    const out: { year: number; deposits: number; interest: number; balance: number }[] = [];
    for (let y = 1; y <= Y; y++) {
      for (let m = 0; m < 12; m++) {
        balance = balance * (1 + monthlyRate) + PMT;
        deposits += PMT;
      }
      out.push({ year: y, deposits, interest: balance - deposits, balance });
    }
    return out;
  }, [P, PMT, Y, r, yieldPct]);

  const final = rows[rows.length - 1];
  const maxBalance = final?.balance ?? 1;

  const apyNum = num(apyIn) / 100;
  const aprFromApy = (k: number) => (k === Infinity ? Math.log(1 + apyNum) : k * (Math.pow(1 + apyNum, 1 / k) - 1));

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <ToolHeader title="Compound Interest Calculator" subtitle="Watch your savings grow with interest on interest and regular deposits." />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Panel>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Starting amount">
              <Input inputMode="decimal" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
            </Field>
            <Field label="Monthly deposit">
              <Input inputMode="decimal" value={monthly} onChange={(e) => setMonthly(e.target.value)} />
            </Field>
            <Field label="Annual interest rate (%)">
              <Input inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
            </Field>
            <Field label="Years">
              <Input type="number" min={1} max={100} value={years} onChange={(e) => setYears(e.target.value)} />
            </Field>
          </div>
          <Field label="Compounding">
            <div className="flex flex-wrap gap-1.5">
              {COMPOUNDING.map((c) => (
                <Chip key={c.label} active={n === c.n} onClick={() => setN(c.n)}>
                  {c.label}
                </Chip>
              ))}
            </div>
          </Field>
        </Panel>
        <div className="space-y-3">
          <Stat label={`Balance after ${Y || 0} years`} value={final ? fmt(final.balance) : "—"} highlight />
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Total deposits" value={final ? fmt(final.deposits) : "—"} />
            <Stat label="Interest earned" value={final ? fmt(final.interest) : "—"} />
          </div>
          <Stat label="APY (effective annual rate)" value={Number.isFinite(yieldPct) ? `${(yieldPct * 100).toFixed(3)}%` : "—"} sub={`${rate}% compounded ${COMPOUNDING.find((c) => c.n === n)?.label.toLowerCase()}`} />
        </div>
      </div>

      {rows.length ? (
        <Panel>
          <h2 className="text-sm font-semibold">Growth by year</h2>
          <div className="flex h-48 items-end gap-0.5" aria-hidden>
            {rows.map((row) => (
              <div key={row.year} className="flex flex-1 flex-col justify-end" title={`Year ${row.year}: ${fmt(row.balance)}`}>
                <div className="bg-emerald-500" style={{ height: `${(row.interest / maxBalance) * 100}%` }} />
                <div className="bg-blue-600" style={{ height: `${(row.deposits / maxBalance) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="size-3 rounded-sm bg-blue-600" /> Deposits
            </span>
            <span className="flex items-center gap-1">
              <span className="size-3 rounded-sm bg-emerald-500" /> Interest
            </span>
          </div>
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-sm tabular-nums">
              <thead className="sticky top-0 bg-card">
                <tr className="text-left text-muted-foreground">
                  <th className="py-1 font-medium">Year</th>
                  <th className="py-1 text-right font-medium">Deposits</th>
                  <th className="py-1 text-right font-medium">Interest</th>
                  <th className="py-1 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.year} className="border-t border-border">
                    <td className="py-1.5">{row.year}</td>
                    <td className="py-1.5 text-right">{fmt(row.deposits)}</td>
                    <td className="py-1.5 text-right">{fmt(row.interest)}</td>
                    <td className="py-1.5 text-right font-semibold">{fmt(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}

      <Panel>
        <h2 className="text-sm font-semibold">APY → APR converter</h2>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="APY (%)">
            <Input inputMode="decimal" className="w-28" value={apyIn} onChange={(e) => setApyIn(e.target.value)} />
          </Field>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-3">
          {COMPOUNDING.map((c) => (
            <div key={c.label} className="flex justify-between rounded-md bg-muted px-3 py-1.5">
              <span className="text-muted-foreground">{c.label}</span>
              <span className="font-semibold tabular-nums">{Number.isFinite(apyNum) ? `${(aprFromApy(c.n) * 100).toFixed(4)}%` : "—"}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          APR is the nominal yearly rate; APY includes the effect of compounding. Banks quote APY on savings because it looks higher.
        </p>
      </Panel>
    </div>
  );
}
