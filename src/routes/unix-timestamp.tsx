import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSEO } from "@/hooks/use-seo";

export const Route = createFileRoute("/unix-timestamp")({
  component: RouteComponent,
});

function RouteComponent() {
  const [timestampInput, setTimestampInput] = useState(() => Math.floor(Date.now() / 1000).toString());
  const [isoInput, setIsoInput] = useState(() => new Date().toISOString().slice(0, 19));

  useSEO({
    title: "Unix Timestamp Converter | Utility Hub",
    description: "Convert between Unix timestamp, ISO date, UTC time, and local time.",
    path: "/unix-timestamp",
    keywords: "unix timestamp converter, epoch converter, iso to unix, unix to utc",
    applicationCategory: "DeveloperApplication",
    featureList: ["Unix to ISO", "ISO to Unix", "UTC display", "Local time display"],
  });

  const fromUnix = useMemo(() => convertFromUnix(timestampInput), [timestampInput]);
  const fromIso = useMemo(() => convertFromIso(isoInput), [isoInput]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Unix Timestamp Converter</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Convert between Unix timestamp, ISO datetime, UTC, and local time.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Unix to Date</h2>
          <label className="mb-2 block text-sm font-medium text-foreground">Unix Timestamp (seconds)</label>
          <Input
            value={timestampInput}
            onChange={(e) => setTimestampInput(e.target.value.trim())}
            placeholder="1721308800"
          />

          {fromUnix.error ? (
            <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {fromUnix.error}
            </p>
          ) : (
            <div className="mt-3 space-y-2 text-sm">
              <Info label="ISO" value={fromUnix.iso} />
              <Info label="UTC" value={fromUnix.utc} />
              <Info label="Local" value={fromUnix.local} />
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Date to Unix</h2>
          <label className="mb-2 block text-sm font-medium text-foreground">ISO Datetime</label>
          <Input
            value={isoInput}
            onChange={(e) => setIsoInput(e.target.value)}
            placeholder="2026-07-18T08:30:00"
          />

          {fromIso.error ? (
            <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {fromIso.error}
            </p>
          ) : (
            <div className="mt-3 space-y-2 text-sm">
              <Info label="Unix (seconds)" value={fromIso.unixSeconds} />
              <Info label="Unix (milliseconds)" value={fromIso.unixMilliseconds} />
              <Info label="UTC" value={fromIso.utc} />
              <Info label="Local" value={fromIso.local} />
            </div>
          )}
        </section>
      </div>

      <div className="flex justify-center">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setTimestampInput(Math.floor(Date.now() / 1000).toString());
            setIsoInput(new Date().toISOString().slice(0, 19));
          }}
        >
          Use Current Time
        </Button>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 break-all text-foreground">{value}</p>
    </div>
  );
}

function convertFromUnix(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return {
      error: "Enter a valid numeric Unix timestamp.",
      iso: "",
      utc: "",
      local: "",
    };
  }

  const date = new Date(parsed * 1000);
  if (Number.isNaN(date.getTime())) {
    return {
      error: "Timestamp is out of range.",
      iso: "",
      utc: "",
      local: "",
    };
  }

  return {
    error: "",
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toLocaleString(),
  };
}

function convertFromIso(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return {
      error: "Enter a valid ISO date/time value.",
      unixSeconds: "",
      unixMilliseconds: "",
      utc: "",
      local: "",
    };
  }

  return {
    error: "",
    unixSeconds: Math.floor(date.getTime() / 1000).toString(),
    unixMilliseconds: date.getTime().toString(),
    utc: date.toUTCString(),
    local: date.toLocaleString(),
  };
}
