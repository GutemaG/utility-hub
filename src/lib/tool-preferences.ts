import { navigationGroups } from "@/config/navigation"

const TOOL_PREFERENCES_KEY = "utility-hub:tool-preferences:v1"
const TOOL_PREFERENCES_EVENT = "utility-hub:tool-preferences-changed"
const MAX_RECENT_ITEMS = 6

type ToolUsageMap = Record<string, number>

interface ToolPreferences {
  favorites: string[]
  recent: string[]
  usage: ToolUsageMap
}

const defaultPreferences: ToolPreferences = {
  favorites: [],
  recent: [],
  usage: {},
}

const knownToolUrls = new Set(
  navigationGroups.flatMap((group) => group.items.map((item) => item.url))
)

function isBrowser() {
  return typeof window !== "undefined"
}

function sanitizeUrlList(urls: string[]) {
  return Array.from(new Set(urls)).filter((url) => knownToolUrls.has(url))
}

function sanitizeUsageMap(usage: ToolUsageMap) {
  const cleaned: ToolUsageMap = {}
  for (const [url, count] of Object.entries(usage)) {
    if (!knownToolUrls.has(url)) {
      continue
    }

    const normalizedCount = Number(count)
    if (Number.isFinite(normalizedCount) && normalizedCount > 0) {
      cleaned[url] = Math.floor(normalizedCount)
    }
  }

  return cleaned
}

function normalizePreferences(value: Partial<ToolPreferences> | null | undefined): ToolPreferences {
  if (!value) {
    return { ...defaultPreferences }
  }

  return {
    favorites: sanitizeUrlList(Array.isArray(value.favorites) ? value.favorites : []),
    recent: sanitizeUrlList(Array.isArray(value.recent) ? value.recent : []).slice(0, MAX_RECENT_ITEMS),
    usage: sanitizeUsageMap(value.usage ?? {}),
  }
}

function emitPreferencesChanged() {
  if (!isBrowser()) {
    return
  }

  window.dispatchEvent(new CustomEvent(TOOL_PREFERENCES_EVENT))
}

function savePreferences(preferences: ToolPreferences) {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(TOOL_PREFERENCES_KEY, JSON.stringify(preferences))
  emitPreferencesChanged()
}

export function getToolPreferences() {
  if (!isBrowser()) {
    return { ...defaultPreferences }
  }

  try {
    const raw = window.localStorage.getItem(TOOL_PREFERENCES_KEY)
    if (!raw) {
      return { ...defaultPreferences }
    }

    return normalizePreferences(JSON.parse(raw) as Partial<ToolPreferences>)
  } catch {
    return { ...defaultPreferences }
  }
}

export function toggleFavoriteTool(url: string) {
  if (!knownToolUrls.has(url)) {
    return getToolPreferences()
  }

  const current = getToolPreferences()
  const nextFavorites = current.favorites.includes(url)
    ? current.favorites.filter((favoriteUrl) => favoriteUrl !== url)
    : [...current.favorites, url]

  const next = {
    ...current,
    favorites: nextFavorites,
  }

  savePreferences(next)
  return next
}

export function recordToolUsage(url: string) {
  if (!knownToolUrls.has(url)) {
    return getToolPreferences()
  }

  const current = getToolPreferences()
  const currentCount = current.usage[url] ?? 0
  const next = {
    ...current,
    recent: [url, ...current.recent.filter((recentUrl) => recentUrl !== url)].slice(0, MAX_RECENT_ITEMS),
    usage: {
      ...current.usage,
      [url]: currentCount + 1,
    },
  }

  savePreferences(next)
  return next
}

export function getFrequentlyUsedUrls(limit = MAX_RECENT_ITEMS) {
  const preferences = getToolPreferences()
  return Object.entries(preferences.usage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([url]) => url)
}

export function subscribeToolPreferences(onChange: () => void) {
  if (!isBrowser()) {
    return () => undefined
  }

  const listener = () => onChange()
  window.addEventListener(TOOL_PREFERENCES_EVENT, listener)
  window.addEventListener("storage", listener)

  return () => {
    window.removeEventListener(TOOL_PREFERENCES_EVENT, listener)
    window.removeEventListener("storage", listener)
  }
}
