import * as React from "react"
import { Search, Sparkles, Star } from "lucide-react"
import { useNavigate } from "@tanstack/react-router"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { navigationGroups } from "@/config/navigation"
import {
  getFrequentlyUsedUrls,
  getToolPreferences,
  subscribeToolPreferences,
  toggleFavoriteTool,
} from "@/lib/tool-preferences"
import { cn } from "@/lib/utils"

function flattenItems() {
  return navigationGroups.flatMap((group) =>
    group.items.map((item) => ({
      ...item,
      group: group.title,
    }))
  )
}

export function CommandPalette() {
  const navigate = useNavigate()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [preferences, setPreferences] = React.useState(getToolPreferences)

  React.useEffect(() => {
    setPreferences(getToolPreferences())
    return subscribeToolPreferences(() => {
      setPreferences(getToolPreferences())
    })
  }, [])

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMod = event.ctrlKey || event.metaKey
      if (isMod && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((current) => !current)
      }

      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const items = React.useMemo(() => {
    const allItems = flattenItems()
    const normalizedQuery = query.trim().toLowerCase()
    const favoritesSet = new Set(preferences.favorites)
    const frequentUrls = getFrequentlyUsedUrls()
    const frequentOrder = new Map(frequentUrls.map((url, index) => [url, index]))

    if (!normalizedQuery) {
      return [...allItems]
        .sort((a, b) => {
          const aFavorite = favoritesSet.has(a.url)
          const bFavorite = favoritesSet.has(b.url)
          if (aFavorite !== bFavorite) {
            return aFavorite ? -1 : 1
          }

          const aFrequentIndex = frequentOrder.get(a.url)
          const bFrequentIndex = frequentOrder.get(b.url)
          if (aFrequentIndex !== undefined && bFrequentIndex !== undefined) {
            return aFrequentIndex - bFrequentIndex
          }

          if (aFrequentIndex !== undefined) {
            return -1
          }

          if (bFrequentIndex !== undefined) {
            return 1
          }

          return a.title.localeCompare(b.title)
        })
        .slice(0, 10)
    }

    return allItems.filter((item) => {
      const haystack = `${item.title} ${item.description ?? ""} ${item.group}`.toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [preferences.favorites, query])

  const handleSelect = (url: string) => {
    setOpen(false)
    setQuery("")
    navigate({ to: url })
  }

  const toggleFavorite = (event: React.MouseEvent<HTMLButtonElement>, url: string) => {
    event.stopPropagation()
    toggleFavoriteTool(url)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden border-none bg-background/95 p-0 shadow-2xl sm:max-w-xl">
        <DialogHeader className="border-b px-4 pt-4 pb-3 text-left">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <DialogTitle className="text-sm font-semibold">Quick search</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Search tools and jump to any calculator or converter instantly.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b px-4 py-4">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/10 px-3 py-2 shadow-sm">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tools..."
              className="border-0 bg-transparent px-0 py-0 text-base placeholder:text-muted-foreground focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {items.length > 0 ? (
            <div className="divide-y divide-border rounded-2xl border border-border bg-background/70 shadow-inner">
              {items.map((item) => (
                <div
                  key={item.url}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelect(item.url)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      handleSelect(item.url)
                    }
                  }}
                  className="flex w-full flex-col gap-1.5 px-3 py-3 text-left transition hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm font-semibold text-foreground">{item.title}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(event) => toggleFavorite(event, item.url)}
                        aria-label={preferences.favorites.includes(item.url) ? `Remove ${item.title} from favorites` : `Add ${item.title} to favorites`}
                        className={cn(
                          "rounded-md p-1 transition hover:bg-accent",
                          preferences.favorites.includes(item.url)
                            ? "text-amber-500"
                            : "text-muted-foreground"
                        )}
                      >
                        <Star
                          className={cn(
                            "h-3.5 w-3.5",
                            preferences.favorites.includes(item.url) && "fill-current"
                          )}
                        />
                      </button>
                      <span className="rounded-full border border-border bg-muted/70 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        {item.group}
                      </span>
                    </div>
                  </div>
                  {item.description ? (
                    <span className="text-xs leading-5 text-muted-foreground">{item.description}</span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No tools matched your search.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
