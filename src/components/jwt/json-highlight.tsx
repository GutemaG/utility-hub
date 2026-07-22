function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const TOKEN_PATTERN =
  /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

function colorizeJson(json: string): string {
  const escaped = escapeHtml(json);
  return escaped.replace(TOKEN_PATTERN, (match) => {
    let className = "text-sky-600 dark:text-sky-400";
    if (match.startsWith('"')) {
      className = match.endsWith(":")
        ? "text-foreground font-medium"
        : "text-emerald-600 dark:text-emerald-400";
    } else if (match === "true" || match === "false") {
      className = "text-rose-600 dark:text-rose-400";
    } else if (match === "null") {
      className = "text-muted-foreground";
    }
    return `<span class="${className}">${match}</span>`;
  });
}

export function HighlightedJson({ value }: { value: unknown }) {
  const pretty = JSON.stringify(value, null, 2);
  return (
    <pre
      className="max-h-80 overflow-auto rounded bg-background p-3 font-mono text-xs leading-5"
      // Safe: colorizeJson HTML-escapes the source text before wrapping tokens in fixed-class spans.
      dangerouslySetInnerHTML={{ __html: colorizeJson(pretty) }}
    />
  );
}
