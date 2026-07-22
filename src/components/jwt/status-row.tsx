import { AlertCircle, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusState = "valid" | "invalid" | "neutral";

export function StatusRow({ state, label }: { state: StatusState; label: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-sm",
        state === "valid" && "text-emerald-600 dark:text-emerald-400",
        state === "invalid" && "text-red-600 dark:text-red-400",
        state === "neutral" && "text-muted-foreground"
      )}
    >
      {state === "valid" ? (
        <Check className="size-4 shrink-0" />
      ) : state === "invalid" ? (
        <X className="size-4 shrink-0" />
      ) : (
        <AlertCircle className="size-4 shrink-0" />
      )}
      <span>{label}</span>
    </div>
  );
}
