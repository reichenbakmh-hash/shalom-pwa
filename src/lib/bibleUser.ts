import { storage, STORAGE_KEYS } from './storage'
import { formatReference } from './bibleRef'
import type { BibleBook, BibleHistoryEntry, BibleNote, FavoriteVerse } from '../types'

const HISTORY_LIMIT = 20

export function verseKey(bookId: string, chapter: number, verse: number): string {
  return `${bookId}.${chapter}.${verse}`
}

export function getFavorites(): FavoriteVerse[] {
  return storage.get<FavoriteVerse[]>(STORAGE_KEYS.favorites, [])
}

export function isFavoriteVerse(list: FavoriteVerse[], book: BibleBook, chapter: number, verse: number): boolean {
  const reference = formatReference(book, chapter, verse)
  return list.some(
    (f) => f.reference === reference || (f.bookId === book.id && f.chapter === chapter && f.verse === verse),
  )
}

export function toggleFavorites(
  book: BibleBook,
  chapter: number,
  verses: { verse: number; text: string }[],
): FavoriteVerse[] | null {
  const current = getFavorites()
  const allSaved = verses.every((v) => isFavoriteVerse(current, book, chapter, v.verse))
  let next: FavoriteVerse[]
  if (allSaved) {
    const targets = new Set(verses.map((v) => formatReference(book, chapter, v.verse)))
    next = current.filter(
      (f) =>
        !targets.has(f.reference) &&
        !(f.bookId === book.id && f.chapter === chapter && verses.some((v) => v.verse === f.verse)),
    )
  } else {
    next = [...current]
    for (const v of verses) {
      if (isFavoriteVerse(next, book, chapter, v.verse)) continue
      const reference = formatReference(book, chapter, v.verse)
      next.push({
        id: reference,
        reference,
        text: v.text,
        savedAt: new Date().toISOString(),
        bookId: book.id,
        chapter,
        verse: v.verse,
      })
    }
  }
  return storage.set(STORAGE_KEYS.favorites, next) ? next : null
}

export function removeFavorite(id: string): FavoriteVerse[] | null {
  const next = getFavorites().filter((f) => f.id !== id)
  return storage.set(STORAGE_KEYS.favorites, next) ? next : null
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
