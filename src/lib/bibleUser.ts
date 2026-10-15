import { storage, STORAGE_KEYS, uid } from './storage'
import { formatReference } from './bibleRef'
import type {
  BibleBook,
  BibleBookmark,
  BibleHistoryEntry,
  BibleNote,
  BiblePrefs,
  FavoriteVerse,
  SavedSearch,
  SearchScope,
} from '../types'

const HISTORY_LIMIT = 20
const RECENT_SEARCH_LIMIT = 8
const FOLDER_MAX = 40

export function verseKey(bookId: string, chapter: number, verse: number): string {
  return `${bookId}.${chapter}.${verse}`
}

export function getFavorites(): FavoriteVerse[] {
  return storage.get<FavoriteVerse[]>(STORAGE_KEYS.favorites, [])
}

function coversVerse(f: FavoriteVerse, bookId: string, chapter: number, verse: number): boolean {
  if (f.bookId !== bookId || f.chapter !== chapter || f.verse === undefined) return false
  return verse >= f.verse && verse <= (f.verseEnd ?? f.verse)
}

export function isSaved(list: FavoriteVerse[], book: BibleBook, chapter: number, verse: number): boolean {
  const reference = formatReference(book, chapter, verse)
  return list.some((f) => f.reference === reference || coversVerse(f, book.id, chapter, verse))
}

export function groupConsecutive(verses: { verse: number; text: string }[]): { verse: number; text: string }[][] {
  const sorted = [...verses].sort((a, b) => a.verse - b.verse)
  const groups: { verse: number; text: string }[][] = []
  for (const v of sorted) {
    const last = groups[groups.length - 1]
    if (last && last[last.length - 1].verse + 1 === v.verse) last.push(v)
    else groups.push([v])
  }
  return groups
}

export function cleanFolder(name: string | undefined): string | undefined {
  const trimmed = (name ?? '').trim().replace(/\s+/g, ' ').slice(0, FOLDER_MAX)
  return trimmed || undefined
}

function upsertEntry(
  list: FavoriteVerse[],
  book: BibleBook,
  chapter: number,
  first: number,
  last: number,
  text: string,
  folder: string | undefined,
): FavoriteVerse[] {
  const reference = formatReference(book, chapter, first, last)
  const verses = Array.from({ length: last - first + 1 }, (_, i) => first + i)
  const overlapping = list.filter((f) =>
    verses.some((v) => f.reference === formatReference(book, chapter, v) || coversVerse(f, book.id, chapter, v)),
  )
  const exact = overlapping.find((f) => f.reference === reference)
  if (exact) return list.map((f) => (f.id === exact.id ? { ...f, folder: folder ?? f.folder } : f))
  if (overlapping.length > 0 && overlapping.every((f) => verses.every((v) => coversVerse(f, book.id, chapter, v)))) {
    return list
  }
  return [
    ...list,
    {
      id: reference,
      reference,
      text,
      savedAt: new Date().toISOString(),
      bookId: book.id,
      chapter,
      verse: first,
      verseEnd: last > first ? last : undefined,
      folder,
    },
  ]
}

export function saveVerses(
  book: BibleBook,
  chapter: number,
  verses: { verse: number; text: string }[],
  folder?: string,
): FavoriteVerse[] | null {
  const target = cleanFolder(folder)
  let next = getFavorites()
  for (const group of groupConsecutive(verses)) {
    const text = group.map((g) => g.text).join(' ')
    next = upsertEntry(next, book, chapter, group[0].verse, group[group.length - 1].verse, text, target)
  }
  return storage.set(STORAGE_KEYS.favorites, next) ? next : null
}

export function saveRange(
  book: BibleBook,
  chapter: number,
  first: number,
  last: number,
  text: string,
  folder?: string,
): FavoriteVerse[] | null {
  const next = upsertEntry(getFavorites(), book, chapter, first, Math.max(first, last), text, cleanFolder(folder))
  return storage.set(STORAGE_KEYS.favorites, next) ? next : null
}

export function unsaveRange(book: BibleBook, chapter: number, first: number, last: number): FavoriteVerse[] | null {
  const verses = Array.from({ length: Math.max(first, last) - first + 1 }, (_, i) => ({ verse: first + i }))
  return unsaveVerses(book, chapter, verses)
}

export function unsaveVerses(book: BibleBook, chapter: number, verses: { verse: number }[]): FavoriteVerse[] | null {
  const next = getFavorites().filter(
    (f) =>
      !verses.some((v) => f.reference === formatReference(book, chapter, v.verse) || coversVerse(f, book.id, chapter, v.verse)),
  )
  return storage.set(STORAGE_KEYS.favorites, next) ? next : null
}

export function removeFavorite(id: string): FavoriteVerse[] | null {
  const next = getFavorites().filter((f) => f.id !== id)
  return storage.set(STORAGE_KEYS.favorites, next) ? next : null
}

export function moveFavorite(id: string, folder: string | undefined): FavoriteVerse[] | null {
  const target = cleanFolder(folder)
  const next = getFavorites().map((f) => (f.id === id ? { ...f, folder: target } : f))
  return storage.set(STORAGE_KEYS.favorites, next) ? next : null
}

export function listFolders(list: FavoriteVerse[]): { name: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const f of list) {
    if (f.folder) counts.set(f.folder, (counts.get(f.folder) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
}

export function favoritesToText(list: FavoriteVerse[], translation: string): string {
  const body = list.map((f) => `${f.text}\n${f.reference}`).join('\n\n')
  return `${body}\n\n(${translation})`
}

export function getNotes(): BibleNote[] {
  return storage.get<BibleNote[]>(STORAGE_KEYS.bibleNotes, [])
}

export function saveNote(bookId: string, chapter: number, verse: number, text: string): BibleNote[] | null {
  const id = verseKey(bookId, chapter, verse)
  const others = getNotes().filter((n) => n.id !== id)
  const trimmed = text.trim()
  const next = trimmed
    ? [...others, { id, bookId, chapter, verse, text: trimmed, updatedAt: new Date().toISOString() }]
    : others
  return storage.set(STORAGE_KEYS.bibleNotes, next) ? next : null
}

export function getBookmarks(): BibleBookmark[] {
  return storage.get<BibleBookmark[]>(STORAGE_KEYS.bibleBookmarks, [])
}

export function chapterKey(bookId: string, chapter: number): string {
  return `${bookId}.${chapter}`
}

export function toggleBookmark(bookId: string, chapter: number): BibleBookmark[] | null {
  const id = chapterKey(bookId, chapter)
  const current = getBookmarks()
  const next = current.some((b) => b.id === id)
    ? current.filter((b) => b.id !== id)
    : [...current, { id, bookId, chapter, savedAt: new Date().toISOString() }]
  return storage.set(STORAGE_KEYS.bibleBookmarks, next) ? next : null
}

export function getSavedSearches(): SavedSearch[] {
  return storage.get<SavedSearch[]>(STORAGE_KEYS.bibleSavedSearches, [])
}

export function isSearchSaved(list: SavedSearch[], query: string, scope: SearchScope): boolean {
  const key = query.trim().toLowerCase()
  return list.some((s) => s.query.toLowerCase() === key && s.scope === scope)
}

export function toggleSavedSearch(query: string, scope: SearchScope): SavedSearch[] | null {
  const current = getSavedSearches()
  const key = query.trim().toLowerCase()
  const next = isSearchSaved(current, query, scope)
    ? current.filter((s) => !(s.query.toLowerCase() === key && s.scope === scope))
    : [...current, { id: uid('ss'), query: query.trim(), scope, savedAt: new Date().toISOString() }]
  return storage.set(STORAGE_KEYS.bibleSavedSearches, next) ? next : null
}

export function removeSavedSearch(id: string): SavedSearch[] | null {
  const next = getSavedSearches().filter((s) => s.id !== id)
  return storage.set(STORAGE_KEYS.bibleSavedSearches, next) ? next : null
}

export function getRecentSearches(): string[] {
  return storage.get<string[]>(STORAGE_KEYS.bibleRecentSearches, [])
}

export function rememberSearch(query: string): string[] {
  const value = query.trim()
  const rest = getRecentSearches().filter((q) => q.toLowerCase() !== value.toLowerCase())
  const next = [value, ...rest].slice(0, RECENT_SEARCH_LIMIT)
  storage.set(STORAGE_KEYS.bibleRecentSearches, next)
  return next
}

export function clearRecentSearches(): void {
  storage.remove(STORAGE_KEYS.bibleRecentSearches)
}

export function getHistory(): BibleHistoryEntry[] {
  return storage.get<BibleHistoryEntry[]>(STORAGE_KEYS.bibleReadingHistory, [])
}

export function getLastReading(): BibleHistoryEntry | null {
  return getHistory()[0] ?? null
}

export function recordReading(bookId: string, chapter: number): void {
  const rest = getHistory().filter((h) => !(h.bookId === bookId && h.chapter === chapter))
  storage.set(
    STORAGE_KEYS.bibleReadingHistory,
    [{ bookId, chapter, at: new Date().toISOString() }, ...rest].slice(0, HISTORY_LIMIT),
  )
}

export function getPrefs(): BiblePrefs {
  const stored = storage.get<Partial<BiblePrefs>>(STORAGE_KEYS.biblePrefs, {})
  const size = stored.textSize
  return { textSize: size === 0 || size === 1 || size === 2 ? size : 1 }
}

export function setPrefs(prefs: BiblePrefs): void {
  storage.set(STORAGE_KEYS.biblePrefs, prefs)
}
