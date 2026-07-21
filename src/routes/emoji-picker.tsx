import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSEO } from "@/hooks/use-seo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";
import { emojiCategories, emojis, type EmojiCategory } from "@/data/emojis";

export const Route = createFileRoute("/emoji-picker")({
  component: RouteComponent,
});

const RECENT_EMOJIS_KEY = "utility-hub:emoji-picker:recent:v1";
const MAX_RECENT_EMOJIS = 24;

function loadRecentEmojis(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(RECENT_EMOJIS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string") : [];
  } catch {
    return [];
  }
}

function RouteComponent() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<EmojiCategory | "All" | "Recent">("All");
  const [copiedEmoji, setCopiedEmoji] = useState<string | null>(null);
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);

  useSEO({
    title: "Emoji Picker | Utility Hub",
    description:
      "Search, browse by category, and copy emoji instantly. Recently used emoji are saved for quick access.",
    path: "/emoji-picker",
    keywords: "emoji picker, emoji search, copy emoji, emoji list",
    applicationCategory: "UtilitiesApplication",
    featureList: ["Emoji search", "Category browsing", "Copy to clipboard", "Recently used emoji"],
  });

  useEffect(() => {
    setRecentEmojis(loadRecentEmojis());
  }, []);

  const filteredEmojis = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return emojis.filter((entry) => {
      const matchesCategory =
        activeCategory === "All" || activeCategory === "Recent" || entry.category === activeCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        entry.name.toLowerCase().includes(normalizedQuery) ||
        entry.keywords.some((keyword) => keyword.toLowerCase().includes(normalizedQuery))
      );
    });
  }, [query, activeCategory]);

  const recentEntries = useMemo(
    () => recentEmojis.map((emoji) => emojis.find((entry) => entry.emoji === emoji)).filter(Boolean),
    [recentEmojis]
  );

  const displayedEmojis = activeCategory === "Recent" ? recentEntries : filteredEmojis;

  const handleCopy = async (emoji: string) => {
    const didCopy = await copyText(emoji);
    if (!didCopy) {
      setCopiedEmoji(null);
      return;
    }

    setCopiedEmoji(emoji);
    setTimeout(() => setCopiedEmoji((current) => (current === emoji ? null : current)), 1200);

    const nextRecent = [emoji, ...recentEmojis.filter((value) => value !== emoji)].slice(
      0,
      MAX_RECENT_EMOJIS
    );
    setRecentEmojis(nextRecent);
    window.localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(nextRecent));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Emoji Picker</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Search or browse by category, then click an emoji to copy it.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search emoji by name or keyword..."
          className="mb-4"
        />

        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={activeCategory === "All" ? "default" : "outline"}
            onClick={() => setActiveCategory("All")}
          >
            All
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeCategory === "Recent" ? "default" : "outline"}
            onClick={() => setActiveCategory("Recent")}
            disabled={recentEmojis.length === 0}
          >
            Recent
          </Button>
          {emojiCategories.map((category) => (
            <Button
              key={category}
              type="button"
              size="sm"
              variant={activeCategory === category ? "default" : "outline"}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {displayedEmojis.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {activeCategory === "Recent" ? "No recently used emoji yet." : "No emoji match your search."}
          </p>
        ) : (
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
            {displayedEmojis.map((entry) => (
              <button
                key={`${entry!.emoji}-${entry!.name}`}
                type="button"
                title={entry!.name}
                onClick={() => handleCopy(entry!.emoji)}
                className="group relative flex aspect-square items-center justify-center rounded-lg border border-transparent text-2xl transition-colors hover:border-border hover:bg-accent"
              >
                {entry!.emoji}
                {copiedEmoji === entry!.emoji ? (
                  <span className="absolute -top-2 right-0 rounded bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background">
                    Copied
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
