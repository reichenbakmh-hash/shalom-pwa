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
} as const

export function purgeRemovedFeatureData() {
  storage.remove('ai_conversation')
}
