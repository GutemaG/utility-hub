import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSEO } from "@/hooks/use-seo";
import { CHEAT_SHEETS } from "@/data/cheat-sheets";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/regex-tester")({
  component: RouteComponent,
});

const REGEX_CHEATSHEET = CHEAT_SHEETS.find((sheet) => sheet.id === "regex");
const JS_FLAGS = new Set(["d", "g", "i", "m", "s", "u", "v", "y"]);
const FLAG_ITEMS = (REGEX_CHEATSHEET?.sections.find((s) => s.title === "Flags")?.items ?? []).filter(
  (item) => JS_FLAGS.has(item.command)
);
const SIDEBAR_SECTIONS = (REGEX_CHEATSHEET?.sections ?? []).filter((s) => s.title !== "Flags");

function RouteComponent() {
  const [pattern, setPattern] = useState("[a-z]+");
  const [flags, setFlags] = useState("gi");
  const [text, setText] = useState("Hello123World");
  const patternInputRef = useRef<HTMLInputElement>(null);

  useSEO({
    title: "Regex Tester | Utility Hub",
    description:
      "Test regular expressions live with flags, highlighted matches, match details, a plain-English pattern explainer, and a clickable regex cheat sheet.",
    path: "/regex-tester",
    keywords: "regex tester, regex playground, regex flags, regular expression test, regex explainer, regex cheat sheet",
    applicationCategory: "DeveloperApplication",
    featureList: [
      "Pattern testing",
      "Flags with descriptions",
      "Highlighted matches",
      "Match list",
      "Plain-English pattern explainer",
      "Clickable regex cheat sheet",
    ],
  });

  const result = useMemo(() => testRegex(pattern, flags, text), [pattern, flags, text]);
  const explanation = useMemo(
    () => (pattern && !result.error ? explainPattern(pattern) : []),
    [pattern, result.error]
  );

  const toggleFlag = (flag: string) => {
    const next = flags.includes(flag) ? flags.replace(flag, "") : flags + flag;
    setFlags(sanitizeFlags(next));
  };

  const insertSnippet = (snippet: string) => {
    const el = patternInputRef.current;
    if (!el) {
      setPattern((p) => p + snippet);
      return;
    }
    const start = el.selectionStart ?? pattern.length;
    const end = el.selectionEnd ?? pattern.length;
    const next = pattern.slice(0, start) + snippet + pattern.slice(end);
    setPattern(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + snippet.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Regex Tester</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Build and test regular expressions with instant match feedback.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6 space-y-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <label className="mb-2 block text-sm font-medium text-foreground">Pattern</label>
                <Input
                  ref={patternInputRef}
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="[a-z]+"
                  className="font-mono"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Flags</label>
                <Input
                  value={flags}
                  onChange={(e) => setFlags(sanitizeFlags(e.target.value))}
                  placeholder="gi"
                  className="font-mono"
                />
              </div>
            </div>

            {/* Flags helper */}
            <div className="flex flex-wrap gap-1.5">
              {FLAG_ITEMS.map((item) => {
                const active = flags.includes(item.command);
                return (
                  <Tooltip key={item.command}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => toggleFlag(item.command)}
                        className={cn(
                          "rounded-md border px-2 py-1 font-mono text-xs font-semibold transition",
                          active
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-border text-muted-foreground hover:bg-accent/50"
                        )}
                      >
                        {item.command}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{item.description}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            {result.error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <span className="font-medium">Invalid pattern:</span> {result.error}
              </div>
            ) : pattern ? (
              <div className="rounded-md border border-border bg-muted/30 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Explanation
                </p>
                <PatternExplanation tokens={explanation} />
              </div>
            ) : null}

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Test Text</label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-40 font-mono text-sm"
                placeholder="Type text to test against regex..."
              />
            </div>

            {!result.error ? (
              <>
                <div className="rounded-md border border-border bg-muted/30 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Highlighted Output
                  </p>
                  <HighlightedText segments={result.segments} />
                </div>

                <div className="rounded-md border border-border bg-background p-3">
                  <p className="mb-2 text-sm font-medium text-foreground">Matches ({result.matches.length})</p>
                  {result.matches.length > 0 ? (
                    <ul className="space-y-1 text-sm">
                      {result.matches.map((match, index) => (
                        <li key={`${match.value}-${index}`} className="font-mono text-foreground">
                          #{index + 1} [{match.index}-{match.index + match.value.length}]: {match.value}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No matches found.</p>
                  )}
                </div>
              </>
            ) : null}

            <div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setPattern("[a-z]+");
                  setFlags("gi");
                  setText("Hello123World");
                }}
              >
                Reset Sample
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar: cheat sheet */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-auto rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
            <p className="mb-1 text-sm font-semibold text-foreground">Regex Cheat Sheet</p>
            <p className="mb-3 text-xs text-muted-foreground">Click any token to insert it into the pattern.</p>
            <div className="space-y-2">
              {SIDEBAR_SECTIONS.map((section, index) => (
                <details key={section.title} className="group" open={index < 2}>
                  <summary className="cursor-pointer list-none rounded-md px-2 py-1.5 text-sm font-medium text-foreground hover:bg-accent/50">
                    <span className="mr-1 inline-block transition-transform group-open:rotate-90">›</span>
                    {section.title}
                  </summary>
                  <ul className="mt-1 space-y-1 pb-2 pl-3">
                    {section.items.map((item) => (
                      <li key={item.command}>
                        <button
                          type="button"
                          onClick={() => insertSnippet(item.command)}
                          className="w-full rounded-md px-2 py-1 text-left text-xs hover:bg-accent/50"
                          title={item.example}
                        >
                          <code className="rounded bg-muted px-1 py-0.5 font-mono text-foreground">
                            {item.command}
                          </code>
                          <span className="ml-2 text-muted-foreground">{item.description}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function sanitizeFlags(raw: string) {
  const cleaned = raw.replace(/[^dgimsuvy]/g, "");
  return Array.from(new Set(cleaned.split(""))).join("");
}

function testRegex(pattern: string, flags: string, text: string) {
  if (!pattern) {
    return {
      error: "",
      segments: [{ text, matched: false }],
      matches: [] as Array<{ value: string; index: number }>,
    };
  }

  try {
    const globalFlags = flags.includes("g") ? flags : `${flags}g`;
    const regex = new RegExp(pattern, globalFlags);
    const matches: Array<{ value: string; index: number }> = [];
    const segments: Array<{ text: string; matched: boolean }> = [];

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const value = match[0];
      const index = match.index;

      if (index > lastIndex) {
        segments.push({ text: text.slice(lastIndex, index), matched: false });
      }

      segments.push({ text: value, matched: true });
      matches.push({ value, index });
      lastIndex = index + value.length;

      if (value === "") {
        regex.lastIndex += 1;
      }
    }

    if (lastIndex < text.length) {
      segments.push({ text: text.slice(lastIndex), matched: false });
    }

    if (segments.length === 0) {
      segments.push({ text, matched: false });
    }

    return { error: "", segments, matches };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Invalid regex pattern.",
      segments: [{ text, matched: false }],
      matches: [] as Array<{ value: string; index: number }>,
    };
  }
}

function HighlightedText({ segments }: { segments: Array<{ text: string; matched: boolean }> }) {
  return (
    <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded bg-background p-3 text-sm leading-6">
      {segments.map((segment, index) =>
        segment.matched ? (
          <mark key={index} className="rounded bg-amber-200 px-0.5 text-amber-950">
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </pre>
  );
}

// ---------------------------------------------------------------------
// Plain-English pattern explainer
// ---------------------------------------------------------------------

interface ExplainToken {
  raw: string;
  description: string;
  depth: number;
  literalChar?: string;
}

const ESCAPE_DESCRIPTIONS: Record<string, string> = {
  d: "Digit. Matches any digit character (0-9).",
  D: "Non-digit. Matches any character that is not a digit.",
  w: "Word. Matches any word character (letter, digit, or underscore).",
  W: "Non-word. Matches any character that is not a word character.",
  s: "Whitespace. Matches any whitespace character (spaces, tabs, line breaks).",
  S: "Non-whitespace. Matches any character that is not whitespace.",
  b: "Word boundary. Matches a position between a word and non-word character.",
  B: "Non-word boundary. Matches a position that is NOT a word boundary.",
  n: "Matches a newline character.",
  r: "Matches a carriage return character.",
  t: "Matches a tab character.",
  "0": "Matches a NUL character.",
};

function explainPattern(pattern: string): ExplainToken[] {
  const raw: ExplainToken[] = [];
  let depth = 0;
  let i = 0;
  const n = pattern.length;

  const push = (rawText: string, description: string, literalChar?: string) => {
    raw.push({ raw: rawText, description, depth, literalChar });
  };

  const parseCharClass = (start: number): number => {
    let j = start + 1;
    let negated = false;
    if (pattern[j] === "^") {
      negated = true;
      j++;
    }
    push(
      negated ? "[^" : "[",
      negated
        ? "Negated character set. Matches any character NOT in the set."
        : "Character set. Matches any one character in the set."
    );
    const innerDepth = depth + 1;
    if (pattern[j] === "]") {
      raw.push({ raw: "]", description: "Literal character \"]\" (as first item in set)", depth: innerDepth });
      j++;
    }
    while (j < n && pattern[j] !== "]") {
      if (pattern[j] === "\\") {
        const esc = pattern[j + 1];
        const desc = esc !== undefined ? (ESCAPE_DESCRIPTIONS[esc] ?? `Literal character "${esc}"`) : "Trailing backslash";
        raw.push({ raw: pattern.slice(j, j + 2), description: desc, depth: innerDepth });
        j += 2;
        continue;
      }
      if (pattern[j + 1] === "-" && pattern[j + 2] !== undefined && pattern[j + 2] !== "]") {
        const from = pattern[j];
        const to = pattern[j + 2];
        raw.push({
          raw: `${from}-${to}`,
          description: `Range. Matches a character from "${from}" to "${to}".`,
          depth: innerDepth,
        });
        j += 3;
        continue;
      }
      raw.push({
        raw: pattern[j],
        description: `Literal character "${pattern[j]}"`,
        depth: innerDepth,
        literalChar: pattern[j],
      });
      j++;
    }
    raw.push({ raw: "]", description: "End of character set.", depth });
    return j + 1;
  };

  while (i < n) {
    const ch = pattern[i];

    if (ch === "\\") {
      const next = pattern[i + 1];
      if (next === undefined) {
        push("\\", "Trailing backslash (incomplete escape).");
        i += 1;
        continue;
      }
      if (/[1-9]/.test(next)) {
        let j = i + 1;
        while (j < n && /[0-9]/.test(pattern[j])) j++;
        push(pattern.slice(i, j), `Backreference to capturing group ${pattern.slice(i + 1, j)}.`);
        i = j;
        continue;
      }
      if (next === "k" && pattern[i + 2] === "<") {
        const end = pattern.indexOf(">", i + 3);
        if (end !== -1) {
          const name = pattern.slice(i + 3, end);
          push(pattern.slice(i, end + 1), `Backreference to named group "${name}".`);
          i = end + 1;
          continue;
        }
      }
      if ((next === "p" || next === "P") && pattern[i + 2] === "{") {
        const end = pattern.indexOf("}", i + 3);
        if (end !== -1) {
          const prop = pattern.slice(i + 3, end);
          push(pattern.slice(i, end + 1), `${next === "P" ? "Negated Unicode" : "Unicode"} property: ${prop}.`);
          i = end + 1;
          continue;
        }
      }
      if (next === "u") {
        if (pattern[i + 2] === "{") {
          const end = pattern.indexOf("}", i + 3);
          if (end !== -1) {
            push(pattern.slice(i, end + 1), `Unicode code point U+${pattern.slice(i + 3, end)}.`);
            i = end + 1;
            continue;
          }
        }
        push(pattern.slice(i, i + 6), `Unicode character U+${pattern.slice(i + 2, i + 6)}.`);
        i += 6;
        continue;
      }
      if (next === "x") {
        push(pattern.slice(i, i + 4), `Character with hex code ${pattern.slice(i + 2, i + 4)}.`);
        i += 4;
        continue;
      }
      if (next in ESCAPE_DESCRIPTIONS) {
        push(`\\${next}`, ESCAPE_DESCRIPTIONS[next]);
        i += 2;
        continue;
      }
      push(`\\${next}`, `Literal character "${next}"`, next);
      i += 2;
      continue;
    }

    if (ch === "[") {
      i = parseCharClass(i);
      continue;
    }

    if (ch === "^") {
      push("^", "Anchor. Matches the start of the string (or line, with the m flag).");
      i++;
      continue;
    }
    if (ch === "$") {
      push("$", "Anchor. Matches the end of the string (or line, with the m flag).");
      i++;
      continue;
    }
    if (ch === ".") {
      push(".", "Any character. Matches any character except line breaks (unless the s flag is set).");
      i++;
      continue;
    }

    if (ch === "(") {
      if (pattern.slice(i, i + 3) === "(?:") {
        push("(?:", "Non-capturing group. Groups tokens together without creating a capture group.");
        depth++;
        i += 3;
        continue;
      }
      if (pattern.slice(i, i + 3) === "(?=") {
        push("(?=", "Positive lookahead. Asserts that what follows matches this, without consuming characters.");
        depth++;
        i += 3;
        continue;
      }
      if (pattern.slice(i, i + 3) === "(?!") {
        push("(?!", "Negative lookahead. Asserts that what follows does NOT match this, without consuming characters.");
        depth++;
        i += 3;
        continue;
      }
      if (pattern.slice(i, i + 4) === "(?<=") {
        push("(?<=", "Positive lookbehind. Asserts that what precedes matches this, without consuming characters.");
        depth++;
        i += 4;
        continue;
      }
      if (pattern.slice(i, i + 4) === "(?<!") {
        push("(?<!", "Negative lookbehind. Asserts that what precedes does NOT match this, without consuming characters.");
        depth++;
        i += 4;
        continue;
      }
      if (pattern[i + 1] === "?" && pattern[i + 2] === "<") {
        const end = pattern.indexOf(">", i + 3);
        if (end !== -1) {
          const name = pattern.slice(i + 3, end);
          push(pattern.slice(i, end + 1), `Named capturing group "${name}". Captures its contents for extraction or reuse.`);
          depth++;
          i = end + 1;
          continue;
        }
      }
      push("(", "Capturing group. Groups tokens together and captures the match for extraction or reuse.");
      depth++;
      i++;
      continue;
    }
    if (ch === ")") {
      depth = Math.max(0, depth - 1);
      push(")", "End of group.");
      i++;
      continue;
    }
    if (ch === "|") {
      push("|", "Alternation. Matches whatever is on either side.");
      i++;
      continue;
    }

    if (ch === "*" || ch === "+" || ch === "?") {
      const lazy = pattern[i + 1] === "?";
      const base =
        ch === "*"
          ? "Quantifier. Matches 0 or more of the preceding token."
          : ch === "+"
            ? "Quantifier. Matches 1 or more of the preceding token."
            : "Quantifier. Matches 0 or 1 of the preceding token (optional).";
      push(lazy ? `${ch}?` : ch, lazy ? `${base} As few times as possible (lazy).` : base);
      i += lazy ? 2 : 1;
      continue;
    }
    if (ch === "{") {
      const end = pattern.indexOf("}", i);
      if (end !== -1 && /^\{\d+(,\d*)?\}$/.test(pattern.slice(i, end + 1))) {
        const lazy = pattern[end + 1] === "?";
        const inside = pattern.slice(i + 1, end);
        let desc: string;
        if (/^\d+$/.test(inside)) {
          desc = `Quantifier. Matches exactly ${inside} of the preceding token.`;
        } else {
          const [min, max] = inside.split(",");
          desc = max
            ? `Quantifier. Matches between ${min} and ${max} of the preceding token.`
            : `Quantifier. Matches ${min} or more of the preceding token.`;
        }
        push(
          pattern.slice(i, end + 1 + (lazy ? 1 : 0)),
          lazy ? `${desc} As few times as possible (lazy).` : desc
        );
        i = end + 1 + (lazy ? 1 : 0);
        continue;
      }
    }

    push(ch, `Literal character "${ch}"`, ch);
    i++;
  }

  return mergeLiteralRuns(raw);
}

function mergeLiteralRuns(tokens: ExplainToken[]): ExplainToken[] {
  const result: ExplainToken[] = [];
  let buffer: { raw: string; chars: string; depth: number } | null = null;

  const flush = () => {
    if (buffer) {
      result.push({
        raw: buffer.raw,
        depth: buffer.depth,
        description:
          buffer.chars.length > 1 ? `Literal text: "${buffer.chars}"` : `Literal character "${buffer.chars}"`,
      });
      buffer = null;
    }
  };

  for (const token of tokens) {
    if (token.literalChar !== undefined) {
      if (!buffer || buffer.depth !== token.depth) {
        flush();
        buffer = { raw: "", chars: "", depth: token.depth };
      }
      buffer.raw += token.raw;
      buffer.chars += token.literalChar;
    } else {
      flush();
      result.push(token);
    }
  }
  flush();
  return result;
}

function PatternExplanation({ tokens }: { tokens: ExplainToken[] }) {
  if (tokens.length === 0) return null;
  return (
    <ul className="space-y-1">
      {tokens.map((token, index) => (
        <li
          key={index}
          className="flex items-start gap-2 text-sm"
          style={{ paddingLeft: token.depth * 16 }}
        >
          <code className="mt-0.5 shrink-0 rounded bg-background px-1.5 py-0.5 font-mono text-xs text-foreground">
            {token.raw}
          </code>
          <span className="text-muted-foreground">{token.description}</span>
        </li>
      ))}
    </ul>
  );
}

export default RouteComponent;
