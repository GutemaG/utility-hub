import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
  type CountryCode,
} from "libphonenumber-js";
import { Check, CheckCircle2, ChevronsUpDown, Copy, HelpCircle, Search, XCircle } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { copyText } from "@/lib/clipboard";

export const Route = createFileRoute("/phone-number-parser")({
  component: RouteComponent,
});

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

interface CountryOption {
  iso: CountryCode;
  name: string;
  dialCode: string;
}

const countryOptions: CountryOption[] = getCountries()
  .map((iso) => ({
    iso,
    name: regionNames.of(iso) ?? iso,
    dialCode: getCountryCallingCode(iso),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

function CountryBadge({ iso, tone = "muted" }: { iso: string; tone?: "muted" | "onColor" }) {
  return (
    <span
      className={`inline-flex h-5 min-w-[2.25rem] items-center justify-center rounded px-1 text-[10px] font-bold tracking-wider ${
        tone === "onColor" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
      }`}
    >
      {iso}
    </span>
  );
}

const NUMBER_TYPE_LABELS: Record<string, string> = {
  MOBILE: "Mobile",
  FIXED_LINE: "Fixed Line",
  FIXED_LINE_OR_MOBILE: "Fixed Line or Mobile",
  TOLL_FREE: "Toll-Free",
  PREMIUM_RATE: "Premium Rate",
  SHARED_COST: "Shared Cost",
  VOIP: "VoIP",
  PERSONAL_NUMBER: "Personal Number",
  PAGER: "Pager",
  UAN: "Universal Access Number",
  VOICEMAIL: "Voicemail",
};

const LENGTH_ERROR_MESSAGES: Record<string, string> = {
  TOO_SHORT: "This number is too short for the selected country.",
  TOO_LONG: "This number is too long for the selected country.",
  INVALID_COUNTRY: "Select a valid country to parse this number.",
  NOT_A_NUMBER: "Enter digits only, with an optional leading +.",
  INVALID_LENGTH: "This number's length isn't valid for the selected country.",
};

function CountryCombobox({
  value,
  onChange,
}: {
  value: CountryCode;
  onChange: (value: CountryCode) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase().replace(/^\+/, "");
    if (!normalizedQuery) {
      return countryOptions;
    }

    return countryOptions.filter((option) => {
      const haystack = `${option.name} ${option.iso} ${option.dialCode}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [query]);

  const selected = countryOptions.find((option) => option.iso === value);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-14 w-full justify-between rounded-lg px-4 font-normal text-base sm:w-56"
        >
          {selected ? (
            <span className="flex min-w-0 items-center gap-2 text-left">
              <CountryBadge iso={selected.iso} />
              <span className="truncate">
                {selected.name} (+{selected.dialCode})
              </span>
            </span>
          ) : (
            <span className="text-left">Select country</span>
          )}
          <ChevronsUpDown className="size-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or code..."
            className="pl-9"
            autoFocus
          />
        </div>
        <div className="max-h-64 overflow-y-auto rounded-md border border-border">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const isSelected = option.iso === value;
              return (
                <button
                  key={option.iso}
                  type="button"
                  onClick={() => {
                    onChange(option.iso);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <CountryBadge iso={option.iso} />
                    <span className="truncate">
                      {option.name} <span className="text-muted-foreground">+{option.dialCode}</span>
                    </span>
                  </span>
                  {isSelected ? <Check className="size-4 shrink-0 text-primary" /> : null}
                </button>
              );
            })
          ) : (
            <p className="px-3 py-2 text-sm text-muted-foreground">No countries found.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const didCopy = await copyText(value);
    if (didCopy) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-sm text-foreground">{value}</p>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={handleCopy} className="shrink-0">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

function RouteComponent() {
  useSEO({
    title: "Phone Number Parser & Formatter | Utility Hub",
    description:
      "Parse, validate, and format phone numbers into international, national, and E.164 formats with searchable country codes.",
    path: "/phone-number-parser",
    keywords:
      "phone number parser, phone number formatter, e164, international phone format, country code lookup",
    applicationCategory: "UtilitiesApplication",
    featureList: [
      "Phone number validation",
      "International, national, and E.164 formatting",
      "Searchable country code selector",
      "Number type detection",
    ],
  });

  const [country, setCountry] = useState<CountryCode>("US");
  const [rawInput, setRawInput] = useState("");

  const parsed = useMemo(() => {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      return { state: "empty" as const };
    }

    const phoneNumber = parsePhoneNumberFromString(trimmed, country);

    if (phoneNumber && phoneNumber.isValid()) {
      return {
        state: "valid" as const,
        phoneNumber,
      };
    }

    const lengthIssue = validatePhoneNumberLength(trimmed, country);
    const message =
      (lengthIssue && LENGTH_ERROR_MESSAGES[lengthIssue]) ??
      "This doesn't look like a valid phone number for the selected country.";

    return { state: "invalid" as const, message };
  }, [rawInput, country]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          Phone Number Parser & Formatter
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Pick a country, paste any phone number, and get instant validation and formatting.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <CountryCombobox value={country} onChange={setCountry} />
          <Input
            value={rawInput}
            onChange={(event) => setRawInput(event.target.value)}
            placeholder="e.g. (415) 555-2671"
            inputMode="tel"
            className="h-14 flex-1 text-lg"
          />
        </div>
      </div>

      {parsed.state === "empty" ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
          <HelpCircle className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">Enter a phone number to check and format it.</p>
        </div>
      ) : parsed.state === "invalid" ? (
        <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-500 to-orange-600 p-10 text-center text-white shadow-lg">
          <XCircle className="mx-auto h-12 w-12" />
          <p className="mt-4 text-2xl font-bold">Invalid Number</p>
          <p className="mt-2 opacity-90">{parsed.message}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-600/30 bg-gradient-to-br from-emerald-500 to-teal-600 p-10 text-center text-white shadow-lg">
            <CheckCircle2 className="mx-auto h-12 w-12" />
            <p className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              {parsed.phoneNumber.formatInternational()}
            </p>
            <p className="mt-2 text-lg font-medium opacity-95">Valid Phone Number</p>
            <p className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm opacity-90">
              {parsed.phoneNumber.country ? <CountryBadge iso={parsed.phoneNumber.country} tone="onColor" /> : null}
              <span>
                {regionNames.of(parsed.phoneNumber.country ?? "") ?? parsed.phoneNumber.country}
                {parsed.phoneNumber.getType()
                  ? ` · ${NUMBER_TYPE_LABELS[parsed.phoneNumber.getType() as string] ?? "Unknown Type"}`
                  : ""}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CopyField label="International" value={parsed.phoneNumber.formatInternational()} />
            <CopyField label="National" value={parsed.phoneNumber.formatNational()} />
            <CopyField label="E.164" value={parsed.phoneNumber.format("E.164")} />
            <CopyField label="RFC 3966 (tel: link)" value={parsed.phoneNumber.format("RFC3966")} />
          </div>
        </div>
      )}
    </div>
  );
}
