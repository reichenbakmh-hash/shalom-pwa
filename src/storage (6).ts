// Couche de persistance locale-first.
// Chaque fonction lit/écrit dans localStorage sous une clé préfixée "shalom:".
// Conçue pour être remplacée/complétée demain par des appels au Worker Cloudflare
// (POST /api/sync) sans changer la forme des données côté composants :
// il suffira d'ajouter un "push" en arrière-plan après chaque set().

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

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // stockage indisponible (mode privé, quota) — l'app continue sans persister
  }
}

export const storage = {
  get: read,
  set: write,
  remove(key: string) {
    localStorage.removeItem(PREFIX + key)
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
  aiConversation: 'ai_conversation',
} as const
