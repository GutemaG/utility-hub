import { createFileRoute } from "@tanstack/react-router";
import { useSEO } from "@/hooks/use-seo";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronDown, Info, Maximize2, Printer, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CHEAT_CATEGORIES,
  CHEAT_SHEETS,
  type CheatSheet,
  type CheatSubsection,
} from "@/data/cheat-sheets";

export const Route = createFileRoute("/cheat-sheets")({
  component: RouteComponent,
});

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function matches(text: string, query: string): boolean {
  return text.toLowerCase().includes(query);
}

function countItems(sections: CheatSubsection[]): number {
  return sections.reduce((sum, section) => sum + section.items.length, 0);
}

function filterSheet(sheet: CheatSheet, query: string): CheatSubsection[] | null {
  if (!query || matches(sheet.title, query)) {
    return sheet.sections;
  }

  const filtered = sheet.sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => matches(item.command, query) || matches(item.description, query),
      ),
    }))
    .filter((section) => section.items.length > 0);

  return filtered.length > 0 ? filtered : null;
}

interface CategoryResult {
  sheet: CheatSheet;
  sections: CheatSubsection[];
}

function RouteComponent() {
  const [query, setQuery] = useState("");
  const [openSheets, setOpenSheets] = useState<Set<string>>(() => new Set());
  const [focusedSheetId, setFocusedSheetId] = useState<string | null>(null);
  const searchPanelRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoPrintRef = useRef(false);

  useSEO({
    title: "Cheat Sheets | Utility Hub",
    description:
      "Searchable quick references for Git, GitHub, editors, shells, regex, Docker, and more — filter by command, view any sheet fullscreen, or print/save it as PDF.",
    path: "/cheat-sheets",
    keywords:
      "cheat sheets, git cheat sheet, vim cheat sheet, tmux cheat sheet, vscode shortcuts, bash cheat sheet, docker cheat sheet, regex cheat sheet, npm cheat sheet, printable cheat sheet",
    applicationCategory: "DeveloperApplication",
    featureList: CHEAT_SHEETS.map((sheet) => sheet.title),
  });

  const normalizedQuery = query.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;

  const resultsByCategory = useMemo(() => {
    const map = new Map<string, CategoryResult[]>();

    for (const category of CHEAT_CATEGORIES) {
      const results: CategoryResult[] = [];

      for (const sheet of CHEAT_SHEETS.filter((s) => s.category === category)) {
        const sections = filterSheet(sheet, normalizedQuery);
        if (sections) {
          results.push({ sheet, sections });
        }
      }

      if (results.length > 0) {
        map.set(category, results);
      }
    }

    return map;
  }, [normalizedQuery]);

  const totalMatches = useMemo(
    () =>
      Array.from(resultsByCategory.values()).reduce(
        (sum, results) => sum + results.length,
        0,
      ),
    [resultsByCategory],
  );

  const focusedSheet = focusedSheetId
    ? CHEAT_SHEETS.find((sheet) => sheet.id === focusedSheetId) ?? null
    : null;

  useEffect(() => {
    if (!focusedSheet) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFocusedSheetId(null);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [focusedSheet]);

  useEffect(() => {
    if (!focusedSheet || !shouldAutoPrintRef.current) return;

    shouldAutoPrintRef.current = false;
    let frame2 = 0;
    // Wait a full paint cycle (not just one rAF) so the overlay has actually
    // laid out and painted before print grabs the page — printing on the
    // same frame the overlay mounts can capture it before content renders.
    const frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => window.print());
    });

    return () => {
      cancelAnimationFrame(frame1);
      cancelAnimationFrame(frame2);
    };
  }, [focusedSheet]);

  const toggleSheet = (id: string) => {
    setOpenSheets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openFullscreen = (id: string) => {
    shouldAutoPrintRef.current = false;
    setFocusedSheetId(id);
  };

  const openAndPrint = (id: string) => {
    shouldAutoPrintRef.current = true;
    setFocusedSheetId(id);
  };

  const jumpToCategory = (category: string) => {
    const sectionId = slugify(category);
    const target = document.getElementById(sectionId);
    if (!target) return;

    // The panel's rendered height is invariant, but its bottom position (via
    // getBoundingClientRect) is NOT — it depends on whether it's currently
    // "stuck" (sticky, pinned at STICKY_TOP_PX) or still sitting in normal
    // flow below the page heading, which differs before the first scroll.
    // Anchor the offset to height + the fixed sticky top instead.
    const STICKY_TOP_PX = 64; // matches the `top-16` class below
    const panelHeight = searchPanelRef.current?.getBoundingClientRect().height ?? 0;
    const topOffset = STICKY_TOP_PX + panelHeight + 16;
    const targetTop = target.getBoundingClientRect().top + window.scrollY;

    window.scrollTo({
      top: Math.max(0, targetTop - topOffset),
      behavior: "smooth",
    });
    window.history.replaceState(null, "", `#${sectionId}`);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <div
        className={cn(
          "space-y-6",
          focusedSheetId && "print:hidden",
        )}
      >
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Developer Cheat Sheets</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {CHEAT_SHEETS.length} quick references across version control,
            editors, shells, web dev, DevOps, and docs. Search across all of
            them, view one fullscreen, or print it as a PDF.
          </p>
        </div>

        <div
          ref={searchPanelRef}
          className="sticky top-16 z-30 space-y-3 rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/85 sm:p-4"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search commands, shortcuts, or a tool name..."
              className="pr-9 pl-9"
            />
            {query ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                title="Clear"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {CHEAT_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => jumpToCategory(category)}
                disabled={isSearching && !resultsByCategory.has(category)}
                className="rounded-full border border-border px-3 py-1.5 text-sm text-foreground transition hover:bg-muted disabled:opacity-40"
              >
                {category}
              </button>
            ))}
          </div>

          {isSearching ? (
            <p className="text-xs text-muted-foreground">
              {totalMatches} matching sheet{totalMatches === 1 ? "" : "s"} for
              &ldquo;{query}&rdquo;
            </p>
          ) : null}
        </div>

        {CHEAT_CATEGORIES.map((category) => {
          const results = resultsByCategory.get(category);
          if (!results) return null;

          return (
            <section key={category} id={slugify(category)} className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">{category}</h2>
              {results.map(({ sheet, sections }) => (
                <CheatCard
                  key={sheet.id}
                  sheet={sheet}
                  sections={sections}
                  open={isSearching || openSheets.has(sheet.id)}
                  forcedOpen={isSearching}
                  onToggle={() => toggleSheet(sheet.id)}
                  onFullscreen={() => openFullscreen(sheet.id)}
                  onPrint={() => openAndPrint(sheet.id)}
                />
              ))}
            </section>
          );
        })}

        {resultsByCategory.size === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No cheat sheets match &ldquo;{query}&rdquo;. Try a different
            command or tool name.
          </p>
        ) : null}
      </div>

      {focusedSheet ? (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-background p-4 sm:p-8 print:static print:inset-auto print:z-auto print:overflow-visible print:bg-white print:p-[10mm]">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex items-start justify-between gap-3 print:mb-4">
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {focusedSheet.category}
                </p>
                <h2 className="text-3xl font-bold text-foreground print:text-2xl">
                  {focusedSheet.title}
                </h2>
              </div>
              <div className="flex shrink-0 items-center gap-2 print:hidden">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                >
                  <Printer className="h-4 w-4" />
                  Print / Save as PDF
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFocusedSheetId(null)}
                >
                  <X className="h-4 w-4" />
                  Close
                </Button>
              </div>
            </div>
            <CheatSections sections={focusedSheet.sections} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

const COLUMN_MIN_WIDTH = 220;
const COLUMN_GAP = 24;
const MAX_COLUMNS = 3;

/** Greedily bucket sections into `columnCount` columns, always adding the
 * next section to whichever column currently has the fewest rows — a
 * simple, fully deterministic masonry substitute. CSS `columns-*` was tried
 * here first, but multi-column layout is a pagination mechanism (designed
 * for known-height print pages), not a masonry one, and behaves
 * unpredictably (dumping nearly everything into one column) inside an
 * unconstrained-height scrollable container like the fullscreen view. */
function distributeIntoColumns(
  sections: CheatSubsection[],
  columnCount: number,
): CheatSubsection[][] {
  const columns: CheatSubsection[][] = Array.from({ length: columnCount }, () => []);
  const weights = new Array(columnCount).fill(0);

  for (const section of sections) {
    let lightest = 0;
    for (let i = 1; i < columnCount; i++) {
      if (weights[i] < weights[lightest]) lightest = i;
    }
    columns[lightest].push(section);
    weights[lightest] += section.items.length + 1; // +1 accounts for the header row
  }

  return columns;
}

function CheatSections({ sections }: { sections: CheatSubsection[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [measuredColumns, setMeasuredColumns] = useState(1);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateColumnCount = () => {
      const width = node.clientWidth;
      const next = Math.max(
        1,
        Math.min(
          MAX_COLUMNS,
          Math.floor((width + COLUMN_GAP) / (COLUMN_MIN_WIDTH + COLUMN_GAP)),
        ),
      );
      setMeasuredColumns((current) => (current === next ? current : next));
    };

    updateColumnCount();
    const observer = new ResizeObserver(updateColumnCount);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const columnCount = Math.max(1, Math.min(measuredColumns, sections.length));
  const columns = useMemo(
    () => distributeIntoColumns(sections, columnCount),
    [sections, columnCount],
  );

  return (
    <div ref={containerRef} className="flex gap-x-6 print:gap-x-4">
      {columns.map((columnSections, columnIndex) => (
        <div
          key={columnIndex}
          className="flex flex-1 flex-col gap-y-5 print:gap-y-3"
        >
          {columnSections.map((section, index) => (
            <div key={section.title ?? index} className="space-y-1.5">
              {section.title ? (
                <h3 className="text-sm font-bold text-foreground print:text-[13px]">
                  {section.title}
                </h3>
              ) : null}
              <div className="grid grid-cols-[auto_1fr] overflow-hidden rounded-md border border-border/70 text-xs">
                {section.items.map((item, itemIndex) => {
                  const striped = itemIndex % 2 === 1;
                  return (
                    <Fragment key={item.command}>
                      <div
                        className={cn(
                          "px-2 py-1.5 font-mono text-[11px] font-medium whitespace-nowrap text-foreground print:px-1.5 print:py-1 print:text-[10px]",
                          striped && "bg-muted",
                        )}
                      >
                        {item.command}
                      </div>
                      <div
                        className={cn(
                          "flex items-start justify-between gap-1.5 px-2.5 py-1.5 text-muted-foreground print:px-2 print:py-1 print:text-[10px]",
                          striped && "bg-muted",
                        )}
                      >
                        <span>{item.description}</span>
                        {item.example ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                aria-label="Show example"
                                className="shrink-0 text-muted-foreground/60 hover:text-foreground print:hidden"
                              >
                                <Info className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <code className="font-mono text-[11px]">{item.example}</code>
                            </TooltipContent>
                          </Tooltip>
                        ) : null}
                      </div>
                    </Fragment>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function CheatCard({
  sheet,
  sections,
  open,
  forcedOpen,
  onToggle,
  onFullscreen,
  onPrint,
}: {
  sheet: CheatSheet;
  sections: CheatSubsection[];
  open: boolean;
  forcedOpen: boolean;
  onToggle: () => void;
  onFullscreen: () => void;
  onPrint: () => void;
}) {
  const matchCount = countItems(sections);
  const totalCount = countItems(sheet.sections);

  return (
    <Collapsible open={open} onOpenChange={forcedOpen ? undefined : onToggle}>
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-2 p-4">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              disabled={forcedOpen}
              className="flex flex-1 items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
            >
              <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 [&[data-state=open]]:rotate-180" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">{sheet.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {matchCount === totalCount
                    ? `${totalCount} entries`
                    : `${matchCount} of ${totalCount} entries match`}
                </p>
              </div>
            </button>
          </CollapsibleTrigger>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onFullscreen}
              title="View fullscreen"
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onPrint}
              title="Print / Save as PDF"
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Printer className="h-4 w-4" />
            </button>
          </div>
        </div>
        <CollapsibleContent className="px-4 pb-4">
          <CheatSections sections={sections} />
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
