import * as React from "react";
import { cn } from "@/lib/utils";

const SEGMENT_CLASSES = {
  header: "text-rose-600 dark:text-rose-400",
  payload: "text-violet-600 dark:text-violet-400",
  signature: "text-teal-600 dark:text-teal-400",
  dot: "text-muted-foreground",
} as const;

export function TokenSpans({ token }: { token: string }) {
  const parts = token.split(".");
  const [header, payload, ...signatureParts] = parts;
  const signature = signatureParts.join(".");

  return (
    <>
      <span className={SEGMENT_CLASSES.header}>{header}</span>
      {parts.length > 1 ? (
        <>
          <span className={SEGMENT_CLASSES.dot}>.</span>
          <span className={SEGMENT_CLASSES.payload}>{payload}</span>
        </>
      ) : null}
      {parts.length > 2 ? (
        <>
          <span className={SEGMENT_CLASSES.dot}>.</span>
          <span className={SEGMENT_CLASSES.signature}>{signature}</span>
        </>
      ) : null}
    </>
  );
}

const FIELD_TEXT_CLASSES =
  "m-0 min-h-40 w-full whitespace-pre-wrap break-all p-3 font-mono text-sm leading-6";

export const JwtTokenEditor = React.forwardRef<HTMLTextAreaElement, {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}>(function JwtTokenEditor({ value, onChange, placeholder, className }, ref) {
  return (
    <div
      className={cn(
        "relative rounded-lg border border-input bg-background focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        className
      )}
    >
      <pre aria-hidden className={cn(FIELD_TEXT_CLASSES, "pointer-events-none")}>
        {value ? <TokenSpans token={value} /> : <span className="text-muted-foreground">{placeholder}</span>}
      </pre>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        className={cn(
          FIELD_TEXT_CLASSES,
          "absolute inset-0 resize-none bg-transparent text-transparent caret-foreground outline-none placeholder:text-transparent"
        )}
      />
    </div>
  );
});
