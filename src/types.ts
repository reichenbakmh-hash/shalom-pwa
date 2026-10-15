export type ViewId =
  | 'home'
  | 'bible'
  | 'prayer'
  | 'meditation'
  | 'journey'
  | 'journal'
  | 'explore'
  | 'profile'

export interface DailyVerse {
  id: string
  date: string
  reference: string
  text: string
  meditation: string
  bookId: string
  chapter: number
  verse: number
  verseEnd?: number
}

export interface BibleVerse {
  id: string
  chapter: number
  verse: number
  text: string
}

export interface BibleChapter {
  id: string
  bookId: string
  number: number
  verses: BibleVerse[]
}

export interface BibleManifest {
  translation: string
  translationName: string
  language: string
  version: string
  source: string
  license: string
  generatedAt: string
  verified: boolean
  totals: { books: number; chapters: number; verses: number }
  books: { id: string; chapters: number; verses: number[]; bytes: number }[]
}

export interface BibleNote {
  id: string
  bookId: string
  chapter: number
  verse: number
  text: string
  updatedAt: string
}

export interface BibleHistoryEntry {
  bookId: string
  chapter: number
  at: string
}

export interface BibleOfflineState {
  version: string
  completedAt: string
}

export interface BibleBook {
  id: string
  name: string
  abbr: string
  testament: 'ancien' | 'nouveau'
  order: number
  chapterCount: number
}

export interface JourneyDay {
  day: number
  title: string
  reference: string
  passageSummary: string
  meditation: string
  reflectionQuestion: string
  prayer: string
  action: string
}

export interface JourneyProgress {
  completedDays: number[]
  lastCompletedAt?: string
}

export type PrayerCategory =
  | 'Gratitude'
  | 'Famille'
  | 'Études'
  | 'Travail'
  | 'Projets'
  | 'Relations'
  | 'Difficultés'
  | 'Espérance'
  | 'Autre'

export type PrayerStatus = 'en_attente' | 'reponse'

export interface Prayer {
  id: string
  title: string
  content: string
  category: PrayerCategory
  createdAt: string
  reminderAt?: string
  status: PrayerStatus
  answerNote?: string
  favorite: boolean
}

export interface JournalEntry {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  createdAt: string
}

export interface MeditationSession {
  id: string
  themeId: string
  durationMinutes: number
  reflection?: string
  completedAt: string
}

export interface Theme {
  id: string
  title: string
  passages: ThemePassage[]
  meditations: string[]
  prayers: string[]
  reflectionQuestions: string[]
}

export interface FavoriteVerse {
  id: string
  reference: string
  text: string
  savedAt: string
  bookId?: string
  chapter?: number
  verse?: number
  verseEnd?: number
  folder?: string
}

export interface BibleBookmark {
  id: string
  bookId: string
  chapter: number
  savedAt: string
}

export type SearchScope = 'tous' | 'ancien' | 'nouveau'

export interface SavedSearch {
  id: string
  query: string
  scope: SearchScope
  savedAt: string
}

export type BibleTab = 'lire' | 'chercher' | 'enregistres'

export interface BibleIntent {
  tab?: BibleTab
  bookId?: string
  chapter?: number
  verse?: number
  verseEnd?: number
  query?: string
  nonce: number
}

export type BibleIntentInput = Omit<BibleIntent, 'nonce'>

export interface BiblePrefs {
  textSize: 0 | 1 | 2
}

export interface ThemePassage {
  reference: string
  text: string
}

export interface NotificationSettings {
  dailyVerse: { enabled: boolean; time: string }
  reading: { enabled: boolean; time: string }
  prayer: { enabled: boolean; time: string }
  meditation: { enabled: boolean; time: string }
  journey: { enabled: boolean; time: string }
}
