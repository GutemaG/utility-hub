import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, Copy, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { copyText } from "@/lib/clipboard";
import { epochSecondsToDate, isEpochSecondsClaim } from "@/lib/jwt";
import { HighlightedJson } from "@/components/jwt/json-highlight";

type ViewMode = "json" | "claims";

export function JsonPanel({
  title,
  data,
  claimInfo,
}: {
  title: string;
  data: Record<string, unknown> | null;
  claimInfo: Record<string, string>;
}) {
  const [view, setView] = useState<ViewMode>("json");
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = async () => {
    if (!data) return;
    const didCopy = await copyText(JSON.stringify(data, null, 2));
    if (didCopy) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <div className="flex items-center gap-1">
          <Button type="button" size="icon" variant="ghost" className="size-7" disabled={!data} onClick={handleCopy}>
            {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
            <span className="sr-only">Copy {title}</span>
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-7"
            disabled={!data}
            onClick={() => setExpanded(true)}
          >
            <Maximize2 className="size-4" />
            <span className="sr-only">Expand {title}</span>
          </Button>
        </div>
      </div>

      <ViewToggle view={view} onChange={setView} />

      {view === "json" ? (
        data ? (
          <HighlightedJson value={data} />
        ) : (
          <EmptyPanel />
        )
      ) : data ? (
        <ClaimsList data={data} claimInfo={claimInfo} />
      ) : (
        <EmptyPanel />
      )}

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {data ? (
            view === "json" ? (
              <HighlightedJson value={data} />
            ) : (
              <ClaimsList data={data} claimInfo={claimInfo} />
            )
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (view: ViewMode) => void }) {
  return (
    <div className="inline-flex rounded-md border border-border bg-background p-0.5 text-xs">
      {(["json", "claims"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={cn(
            "rounded px-2 py-1 font-medium transition-colors",
            view === mode
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {mode === "json" ? "JSON" : "Claims Breakdown"}
        </button>
      ))}
    </div>
  );
}

function EmptyPanel() {
  return (
    <div className="rounded bg-background p-3 text-xs text-muted-foreground">
      Paste a token above to see its contents.
    </div>
  );
}

function ClaimsList({
  data,
  claimInfo,
}: {
  data: Record<string, unknown>;
  claimInfo: Record<string, string>;
}) {
  const keys = Object.keys(data);
  if (keys.length === 0) {
    return <EmptyPanel />;
  }

  return (
    <ul className="max-h-80 space-y-2 overflow-auto rounded bg-background p-3">
      {keys.map((key) => (
        <li key={key} className="border-b border-border/60 pb-2 last:border-0 last:pb-0">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <span className="font-mono text-xs font-semibold text-foreground">{key}</span>
            <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400">
              {formatClaimValue(key, data[key])}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {claimInfo[key] ?? "Custom claim — not part of the reserved JWT claim set."}
          </p>
        </li>
      ))}
    </ul>
  );
}

function formatClaimValue(key: string, value: unknown): string {
  if (isEpochSecondsClaim(key)) {
    const date = epochSecondsToDate(value);
    if (date) {
      const relative = formatDistanceToNow(date, { addSuffix: true });
      return `${date.toLocaleString()} (${relative})`;
    }
  }
  return JSON.stringify(value);
}
