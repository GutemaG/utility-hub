import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSEO } from "@/hooks/use-seo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  Shuffle,
  Copy,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/prime-number-checker")({
  component: RouteComponent,
});

const SIEVE_GRID_START = 2;
const SIEVE_GRID_END = 200;
const PRIME_INDEX_LIMIT = 1_000_000;
const MAX_SAFE_CHECK = 1_000_000_000_000;

function buildSieve(limit: number) {
  const sieve = new Uint8Array(limit + 1).fill(1);
  sieve[0] = 0;
  sieve[1] = 0;
  for (let i = 2; i * i <= limit; i++) {
    if (sieve[i]) {
      for (let j = i * i; j <= limit; j += i) {
        sieve[j] = 0;
      }
    }
  }

  const prefix = new Int32Array(limit + 1);
  let count = 0;
  for (let i = 0; i <= limit; i++) {
    if (sieve[i]) count++;
    prefix[i] = count;
  }

  return { sieve, prefix };
}

function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

function primeFactorize(n: number) {
  let remaining = n;
  const factors: { prime: number; exponent: number }[] = [];
  for (let p = 2; p * p <= remaining; p++) {
    if (remaining % p === 0) {
      let exponent = 0;
      while (remaining % p === 0) {
        remaining /= p;
        exponent++;
      }
      factors.push({ prime: p, exponent });
    }
  }
  if (remaining > 1) {
    factors.push({ prime: remaining, exponent: 1 });
  }
  return factors;
}

function countDivisors(n: number): number {
  let count = 0;
  for (let i = 1; i * i <= n; i++) {
    if (n % i === 0) {
      count += i * i === n ? 1 : 2;
    }
  }
  return count;
}

function previousPrime(n: number): number | null {
  let candidate = Math.trunc(n) - 1;
  while (candidate >= 2) {
    if (isPrime(candidate)) return candidate;
    candidate--;
  }
  return null;
}

function nextPrime(n: number): number {
  let candidate = Math.max(2, Math.trunc(n) + 1);
  while (!isPrime(candidate)) {
    candidate++;
  }
  return candidate;
}

function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

type NumericStatus = "invalid" | "not-integer" | "too-large" | "undefined" | "prime" | "composite";

function RouteComponent() {
  const [inputValue, setInputValue] = useState("97");
  const [copied, setCopied] = useState(false);

  useSEO({
    title: "Prime Number Checker | Utility Hub",
    description:
      "Check if a number is prime, view its prime factorization, nearest primes, and explore an interactive Sieve of Eratosthenes grid.",
    path: "/prime-number-checker",
    keywords: "prime number checker, is prime, prime factorization, sieve of eratosthenes, math tool",
    applicationCategory: "UtilitiesApplication",
    featureList: [
      "Primality check",
      "Prime factorization",
      "Nearest prime navigation",
      "Interactive sieve grid",
    ],
  });

  const sieveData = useMemo(() => buildSieve(PRIME_INDEX_LIMIT), []);

  const parsedNumber = useMemo(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return null;
    const value = Number(trimmed);
    return Number.isFinite(value) ? value : null;
  }, [inputValue]);

  const numericStatus: NumericStatus = useMemo(() => {
    if (parsedNumber === null) return "invalid";
    if (!Number.isInteger(parsedNumber)) return "not-integer";
    if (Math.abs(parsedNumber) > MAX_SAFE_CHECK) return "too-large";
    if (parsedNumber < 2) return "undefined";
    return isPrime(parsedNumber) ? "prime" : "composite";
  }, [parsedNumber]);

  const integerValue =
    parsedNumber !== null &&
    Number.isInteger(parsedNumber) &&
    Math.abs(parsedNumber) <= MAX_SAFE_CHECK
      ? parsedNumber
      : null;

  const navHints = useMemo(() => {
    if (integerValue === null) return null;
    return { previous: previousPrime(integerValue), next: nextPrime(integerValue) };
  }, [integerValue]);

  const details = useMemo(() => {
    if (integerValue === null || integerValue < 2) return null;
    return {
      factors: numericStatus === "composite" ? primeFactorize(integerValue) : [],
      divisorCount: countDivisors(integerValue),
      index: integerValue <= PRIME_INDEX_LIMIT ? sieveData.prefix[integerValue] : null,
    };
  }, [integerValue, numericStatus, sieveData]);

  const summaryText = useMemo(() => {
    if (integerValue === null || details === null) return "";
    if (numericStatus === "prime") {
      return `${integerValue.toLocaleString()} is a prime number.`;
    }
    if (numericStatus === "composite") {
      const factorization = details.factors
        .map((f) => (f.exponent > 1 ? `${f.prime}^${f.exponent}` : `${f.prime}`))
        .join(" x ");
      return `${integerValue.toLocaleString()} is not a prime number (${integerValue} = ${factorization}).`;
    }
    return "";
  }, [integerValue, numericStatus, details]);

  const handleCopySummary = async () => {
    if (!summaryText) return;
    const didCopy = await copyText(summaryText);
    if (didCopy) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const sieveGridNumbers = useMemo(
    () =>
      Array.from(
        { length: SIEVE_GRID_END - SIEVE_GRID_START + 1 },
        (_, i) => SIEVE_GRID_START + i
      ),
    []
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Prime Number Checker</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Check primality, view factorization, and explore primes visually.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter a number"
            inputMode="numeric"
            className="text-center text-lg font-semibold sm:text-left"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navHints?.previous !== null && navHints?.previous !== undefined && setInputValue(String(navHints.previous))}
              disabled={!navHints || navHints.previous === null}
            >
              <ArrowLeft className="h-4 w-4" />
              Prev Prime
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navHints && setInputValue(String(navHints.next))}
              disabled={!navHints}
            >
              Next Prime
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInputValue(String(Math.floor(Math.random() * 998) + 2))}
            >
              <Shuffle className="h-4 w-4" />
              Random
            </Button>
          </div>
        </div>
      </div>

      <ResultHero
        status={numericStatus}
        value={integerValue ?? parsedNumber}
        details={details}
        onCopy={handleCopySummary}
        copied={copied}
        canCopy={Boolean(summaryText)}
      />

      {details && (numericStatus === "prime" || numericStatus === "composite") ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Previous Prime"
            value={navHints?.previous !== null && navHints?.previous !== undefined ? navHints.previous.toLocaleString() : "—"}
          />
          <StatCard label="Next Prime" value={navHints ? navHints.next.toLocaleString() : "—"} />
          <StatCard label="Total Divisors" value={details.divisorCount.toLocaleString()} />
          <StatCard
            label="Prime Index"
            value={
              numericStatus === "prime" && details.index !== null
                ? ordinal(details.index)
                : numericStatus === "prime"
                  ? "Too large"
                  : "N/A"
            }
          />
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Sieve of Eratosthenes ({SIEVE_GRID_START}–{SIEVE_GRID_END})
          </h2>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Prime
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" /> Composite
            </span>
          </div>
        </div>
        <div className="grid grid-cols-10 gap-1.5 sm:grid-cols-14 md:grid-cols-20">
          {sieveGridNumbers.map((num) => {
            const prime = sieveData.sieve[num] === 1;
            const isSelected = integerValue === num;
            return (
              <button
                key={num}
                type="button"
                onClick={() => setInputValue(String(num))}
                title={`${num} is ${prime ? "prime" : "composite"}`}
                className={`aspect-square rounded-md text-[10px] font-medium transition-all sm:text-xs ${
                  prime
                    ? "bg-emerald-500/90 text-white hover:bg-emerald-500"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                } ${isSelected ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110" : ""}`}
              >
                {num}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ResultHero({
  status,
  value,
  details,
  onCopy,
  copied,
  canCopy,
}: {
  status: NumericStatus;
  value: number | null;
  details: { factors: { prime: number; exponent: number }[]; divisorCount: number; index: number | null } | null;
  onCopy: () => void;
  copied: boolean;
  canCopy: boolean;
}) {
  if (status === "invalid") {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
        <HelpCircle className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-muted-foreground">Enter a number to check for primality.</p>
      </div>
    );
  }

  if (status === "not-integer") {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-10 text-center shadow-sm">
        <HelpCircle className="mx-auto h-10 w-10 text-amber-600 dark:text-amber-400" />
        <p className="mt-3 text-amber-700 dark:text-amber-300">
          Primality is only defined for whole numbers. Try an integer instead of {value}.
        </p>
      </div>
    );
  }

  if (status === "too-large") {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-10 text-center shadow-sm">
        <HelpCircle className="mx-auto h-10 w-10 text-amber-600 dark:text-amber-400" />
        <p className="mt-3 text-amber-700 dark:text-amber-300">
          That number is too large to check safely in the browser. Try a value under{" "}
          {MAX_SAFE_CHECK.toLocaleString()}.
        </p>
      </div>
    );
  }

  if (status === "undefined") {
    return (
      <div className="rounded-2xl border border-border bg-gradient-to-br from-slate-500 to-slate-700 p-10 text-center text-white shadow-lg">
        <HelpCircle className="mx-auto h-12 w-12 opacity-90" />
        <p className="mt-4 text-3xl font-bold">{value}</p>
        <p className="mt-2 text-slate-100">
          Neither prime nor composite. Primality is only defined for integers greater than 1.
        </p>
      </div>
    );
  }

  const isPrimeResult = status === "prime";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-10 text-center text-white shadow-lg ${
        isPrimeResult
          ? "border-emerald-600/30 bg-gradient-to-br from-emerald-500 to-teal-600"
          : "border-rose-600/30 bg-gradient-to-br from-rose-500 to-orange-600"
      }`}
    >
      {canCopy ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={onCopy}
          className="absolute right-4 top-4 bg-white/15 text-white hover:bg-white/25"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      ) : null}

      {isPrimeResult ? (
        <CheckCircle2 className="mx-auto h-12 w-12" />
      ) : (
        <XCircle className="mx-auto h-12 w-12" />
      )}

      <p className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{value?.toLocaleString()}</p>
      <p className="mt-2 text-lg font-medium opacity-95">
        {isPrimeResult ? "is a Prime Number" : "is not a Prime Number"}
      </p>

      {isPrimeResult ? (
        <p className="mt-3 text-sm opacity-90">
          It has exactly two positive divisors: 1 and {value?.toLocaleString()}.
          {details?.index !== null && details?.index !== undefined
            ? ` It's the ${ordinal(details.index)} prime number.`
            : ""}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {details?.factors.map((factor, i) => (
              <span
                key={i}
                className="inline-flex items-baseline rounded-full bg-white/20 px-3 py-1 text-sm font-semibold"
              >
                {factor.prime}
                {factor.exponent > 1 ? <sup className="ml-0.5">{factor.exponent}</sup> : null}
              </span>
            ))}
          </div>
          <p className="text-sm opacity-90">Has {details?.divisorCount.toLocaleString()} total positive divisors.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-center shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}
