const PREFIX = 'shalom:'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export const storage = {
  get: read,
  set: write,
  remove(key: string) {
    try {
      localStorage.removeItem(PREFIX + key)
    } catch {
      return
    }
  },
}

export const STORAGE_KEYS = {
  prayers: 'prayers',
  journal: 'journal',
  journeyProgress: 'journey_progress',
  meditationSessions: 'meditation_sessions',
  favorites: 'favorites',
  notificationSettings: 'notification_settings',
  bibleReadingHistory: 'bible_reading_history',
  bibleNotes: 'bible_notes',
  bibleOffline: 'bible_offline',
  bibleBookmarks: 'bible_bookmarks',
  bibleSavedSearches: 'bible_saved_searches',
  bibleRecentSearches: 'bible_recent_searches',
  biblePrefs: 'bible_prefs',
} as const

export function purgeRemovedFeatureData() {
  storage.remove('ai_conversation')
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}
