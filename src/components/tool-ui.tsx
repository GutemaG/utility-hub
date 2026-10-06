import { useEffect, useId, useRef, type ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function ToolHeader({ title, subtitle }: { title: string; subtitle: ReactNode }) {
  return (
    <div className="text-center">
      <h1 className="mb-2 text-3xl font-bold text-foreground sm:text-4xl">{title}</h1>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
  );
}

export function Tabs<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode }[];
  className?: string;
}) {
  return (
    <div className={cn("inline-flex max-w-full flex-wrap gap-1 rounded-lg border border-border p-1", className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition",
            value === o.value ? "bg-blue-600 text-white" : "text-muted-foreground hover:bg-accent/50"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
  className,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "rounded-md border px-2.5 py-1.5 text-sm font-medium transition",
        active ? "border-blue-600 bg-blue-600 text-white" : "border-border hover:bg-accent/50",
        className
      )}
    >
      {children}
    </button>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6", className)}>{children}</div>;
}

export function Field({ label, children, hint }: { label: ReactNode; children: ReactNode; hint?: ReactNode }) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  // Name the first form control after the label (unless it already has its own accessible name).
  useEffect(() => {
    const control = ref.current?.querySelector<HTMLElement>("input, select, textarea");
    if (control && !control.hasAttribute("aria-label") && !control.hasAttribute("aria-labelledby")) {
      control.setAttribute("aria-labelledby", id);
    }
  });
  return (
    <div className="space-y-1.5" ref={ref}>
      <Label id={id}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Stat({ label, value, sub, highlight }: { label: ReactNode; value: ReactNode; sub?: ReactNode; highlight?: boolean }) {
  return (
    <div className={cn("rounded-lg border p-3", highlight ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40" : "border-border")}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("font-semibold tabular-nums", highlight ? "text-2xl text-blue-700 dark:text-blue-300" : "text-xl")}>{value}</div>
      {sub ? <div className="text-xs text-muted-foreground">{sub}</div> : null}
    </div>
  );
}
