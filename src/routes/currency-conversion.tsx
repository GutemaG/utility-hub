import { useSEO } from "@/hooks/use-seo";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const CURRENCY_API_BASES = [
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1",
  "https://latest.currency-api.pages.dev/v1",
];

interface CurrencyRatesPayload {
  date: string;
  [baseCurrency: string]: string | Record<string, number>;
}

const FALLBACK_CURRENCIES: Record<string, string> = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  ETB: "Ethiopian Birr",
  JPY: "Japanese Yen",
  CAD: "Canadian Dollar",
  AUD: "Australian Dollar",
  CNY: "Chinese Yuan",
  INR: "Indian Rupee",
};

interface CurrencyComboboxProps {
  value: string;
  currencies: Record<string, string>;
  onChange: (value: string) => void;
  className?: string;
}

function CurrencyCombobox({
  value,
  currencies,
  onChange,
  className,
}: CurrencyComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const entries = useMemo(
    () => Object.entries(currencies).sort((a, b) => a[0].localeCompare(b[0])),
    [currencies]
  );

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return entries;
    }

    return entries.filter(([code, name]) => {
      const haystack = `${code} ${name}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [entries, query]);

  const selectedLabel = currencies[value] ? `${value} - ${currencies[value]}` : value;

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setQuery("");
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "h-14 w-full justify-between rounded-none border-0 border-t border-input px-4 font-normal text-base sm:border-t-0 sm:border-l",
            className
          )}
        >
          <span className="truncate text-left">{selectedLabel}</span>
          <ChevronsUpDown className="size-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search currencies..."
            className="pl-9"
          />
        </div>
        <div className="max-h-64 overflow-y-auto rounded-md border border-border">
          {filteredEntries.length > 0 ? (
            filteredEntries.map(([code, name]) => {
              const itemLabel = `${code} - ${name}`;
              const isSelected = code === value;

              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    onChange(code);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <span className="truncate">{itemLabel}</span>
                  {isSelected ? <Check className="size-4 text-primary" /> : null}
                </button>
              );
            })
          ) : (
            <p className="px-3 py-2 text-sm text-muted-foreground">No currencies found.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function CurrencyConversionRoute() {
  useSEO({
    title: "Currency Converter",
    description:
      "Convert currencies with latest exchange rates using Frankfurter API.",
    path: "/currency-conversion",
    keywords:
      "currency converter, exchange rates, forex converter, USD to ETB, Frankfurter API",
    applicationCategory: "FinanceApplication",
    featureList: [
      "Latest exchange rates from Frankfurter",
      "Swap base and target currencies",
      "Precision currency conversion with result timestamp",
    ],
  });

  const [fromAmount, setFromAmount] = useState("1");
  const [toAmount, setToAmount] = useState("");
  const [activeInput, setActiveInput] = useState<"from" | "to">("from");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("ETB");

  const [currencies, setCurrencies] = useState<Record<string, string>>(
    FALLBACK_CURRENCIES
  );

  const [latestRate, setLatestRate] = useState<number | null>(null);
  const [rateDate, setRateDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchWithFallback = async (path: string): Promise<unknown> => {
    let lastError: unknown = null;

    for (const baseUrl of CURRENCY_API_BASES) {
      try {
        const response = await fetch(`${baseUrl}${path}`);
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        return (await response.json()) as unknown;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError ?? new Error("All currency providers failed");
  };

  const normalizeCurrencies = (payload: unknown): Record<string, string> => {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return {};
    }

    const normalized: Record<string, string> = {};
    const currencyEntries = Object.entries(payload as Record<string, unknown>);

    for (const [code, name] of currencyEntries) {
      if (typeof code !== "string" || typeof name !== "string") {
        continue;
      }

      const normalizedCode = code.toUpperCase();
      normalized[normalizedCode] = name.trim() || normalizedCode;
    }

    return normalized;
  };

  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        const payload = await fetchWithFallback("/currencies.json");
        const currencyMap = normalizeCurrencies(payload);

        if (!currencyMap || Object.keys(currencyMap).length === 0) {
          throw new Error("No currencies returned");
        }

        setCurrencies(currencyMap);
      } catch {
        setError(
          "Unable to load full currency list. Showing a fallback set; conversion still works."
        );
      }
    };

    void loadCurrencies();
  }, []);

  const parseInputAmount = (input: string): number | null => {
    const normalized = input.replace(/,/g, "").trim();
    if (!normalized) {
      return null;
    }

    const value = Number(normalized);

    if (!Number.isFinite(value) || value < 0) {
      return null;
    }

    return value;
  };

  const formatInputAmount = (value: number): string => {
    if (!Number.isFinite(value)) {
      return "";
    }

    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    }).format(value);
  };

  const extractRate = (
    payload: unknown,
    base: string,
    quote: string
  ): { rate: number; date: string } | null => {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return null;
    }

    const typedPayload = payload as CurrencyRatesPayload;
    const baseKey = base.toLowerCase();
    const quoteKey = quote.toLowerCase();
    const ratesByBase = typedPayload[baseKey];

    if (!ratesByBase || typeof ratesByBase !== "object" || Array.isArray(ratesByBase)) {
      return null;
    }

    const rateValue = (ratesByBase as Record<string, unknown>)[quoteKey];
    if (typeof rateValue !== "number" || !Number.isFinite(rateValue)) {
      return null;
    }

    return {
      rate: rateValue,
      date: typeof typedPayload.date === "string" ? typedPayload.date : "",
    };
  };

  const fetchLatestRate = async () => {
    if (fromCurrency === toCurrency) {
      setLatestRate(1);
      setRateDate(new Date().toISOString().slice(0, 10));
      setError(null);
      return;
    }

    setError(null);

    try {
      const payload = await fetchWithFallback(
        `/currencies/${fromCurrency.toLowerCase()}.json`
      );
      const rateData = extractRate(payload, fromCurrency, toCurrency);

      if (!rateData) {
        throw new Error("Invalid response from exchange API");
      }

      setLatestRate(rateData.rate);
      setRateDate(rateData.date);
    } catch {
      setError("Could not fetch latest exchange rate from providers. Please try again.");
    }
  };

  const handleSwap = () => {
    setError(null);
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleFromAmountChange = (value: string) => {
    setActiveInput("from");
    setFromAmount(value);

    const numericValue = parseInputAmount(value);
    if (numericValue === null || latestRate === null) {
      setToAmount("");
      if (value.trim()) {
        setError("Enter a valid positive amount.");
      } else {
        setError(null);
      }
      return;
    }

    setError(null);
    setToAmount(formatInputAmount(numericValue * latestRate));
  };

  const handleToAmountChange = (value: string) => {
    setActiveInput("to");
    setToAmount(value);

    const numericValue = parseInputAmount(value);
    if (numericValue === null || latestRate === null || latestRate === 0) {
      setFromAmount("");
      if (value.trim()) {
        setError("Enter a valid positive amount.");
      } else {
        setError(null);
      }
      return;
    }

    setError(null);
    setFromAmount(formatInputAmount(numericValue / latestRate));
  };

  useEffect(() => {
    void fetchLatestRate();
  }, [fromCurrency, toCurrency]);

  useEffect(() => {
    if (latestRate === null || latestRate === 0) {
      return;
    }

    if (activeInput === "from") {
      const numericFromAmount = parseInputAmount(fromAmount);
      if (numericFromAmount === null) {
        if (toAmount !== "") {
          setToAmount("");
        }
        return;
      }

      const nextToAmount = formatInputAmount(numericFromAmount * latestRate);
      if (nextToAmount !== toAmount) {
        setToAmount(nextToAmount);
      }
      return;
    }

    const numericToAmount = parseInputAmount(toAmount);
    if (numericToAmount === null) {
      if (fromAmount !== "") {
        setFromAmount("");
      }
      return;
    }

    const nextFromAmount = formatInputAmount(numericToAmount / latestRate);
    if (nextFromAmount !== fromAmount) {
      setFromAmount(nextFromAmount);
    }
  }, [latestRate, activeInput, fromAmount, toAmount]);

  const fromCurrencyName = currencies[fromCurrency] ?? fromCurrency;
  const toCurrencyName = currencies[toCurrency] ?? toCurrency;

  return (
    <div className="container mx-auto max-w-2xl p-4 md:p-6">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-card-foreground">
          Currency Converter
        </h1>

        {latestRate !== null ? (
          <div className="space-y-1">
            <p className="text-lg text-muted-foreground">
              1 {fromCurrencyName} equals
            </p>
            <p className="text-5xl font-semibold leading-tight text-card-foreground">
              {latestRate.toFixed(6)} {toCurrencyName}
            </p>
            <p className="text-sm text-muted-foreground">
              {rateDate ? `Rate date: ${rateDate}` : "Live reference rate"}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Loading latest exchange rate...</p>
        )}

        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-input bg-background sm:grid-cols-2">
            <Input
              type="text"
              inputMode="decimal"
              placeholder="1"
              value={fromAmount}
              onChange={(event) => handleFromAmountChange(event.target.value)}
              className="h-14 rounded-none border-0 text-lg shadow-none focus-visible:ring-0"
            />
            <CurrencyCombobox
              value={fromCurrency}
              currencies={currencies}
              onChange={setFromCurrency}
            />
          </div>

          <div className="flex justify-center">
            <Button type="button" variant="outline" onClick={handleSwap} className="h-9 px-6">
              Swap
            </Button>
          </div>

          <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-input bg-muted/40 sm:grid-cols-2">
            <Input
              type="text"
              inputMode="decimal"
              value={toAmount}
              onChange={(event) => handleToAmountChange(event.target.value)}
              className="h-14 rounded-none border-0 bg-transparent text-lg shadow-none focus-visible:ring-0"
            />
            <CurrencyCombobox
              value={toCurrency}
              currencies={currencies}
              onChange={setToCurrency}
              className="bg-transparent"
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/currency-conversion")({
  component: CurrencyConversionRoute,
});
