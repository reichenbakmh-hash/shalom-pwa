import { bibleBooks, loadBook } from './bible'
import { foldText, normalizeForSearch } from './bibleRef'
import type { SearchScope } from '../types'

export interface SearchHit {
  bookId: string
  chapter: number
  verse: number
  text: string
  score: number
}

export interface SearchOutcome {
  hits: SearchHit[]
  capped: boolean
  skippedBooks: number
  terms: string[]
  byBook: { bookId: string; count: number }[]
}

export interface ParsedQuery {
  words: string[]
  phrases: string[]
  whole: string
  terms: string[]
}

const STOPWORDS = new Set([
  'le', 'la', 'les', 'de', 'des', 'du', 'un', 'une', 'et', 'en', 'au', 'aux', 'a', 'que', 'qui', 'dans', 'sur', 'par',
  'pour', 'ne', 'pas', 'je', 'tu', 'il', 'nous', 'vous', 'ils', 'mon', 'ton', 'son', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses',
  'ce', 'se', 'est', 'qu', 'l', 'd', 's', 'n', 'j', 'm', 't', 'c',
])

const indexCache = new Map<string, string[][]>()

export function parseQuery(input: string): ParsedQuery {
  const phrases: string[] = []
  const rest = input.replace(/["“”«»]([^"“”«»]+)["“”«»]/g, (_, inner: string) => {
    const phrase = normalizeForSearch(inner)
    if (phrase) phrases.push(phrase)
    return ' '
  })
  const all = normalizeForSearch(rest)
    .split(' ')
    .filter((w) => w.length > 0 && (w.length > 1 || /\d/.test(w)))
  const meaningful = all.filter((w) => !STOPWORDS.has(w))
  const words = meaningful.length > 0 ? meaningful : all
  const whole = phrases.length === 0 && all.length > 1 ? all.join(' ') : ''
  const terms = [...words, ...phrases.flatMap((p) => p.split(' '))].filter((t, i, a) => t.length > 1 && a.indexOf(t) === i)
  return { words, phrases, whole, terms }
}

async function indexBook(bookId: string): Promise<string[][]> {
  const cached = indexCache.get(bookId)
  if (cached) return cached
  const chapters = await loadBook(bookId)
  const built = chapters.map((verses) => verses.map((v) => ` ${normalizeForSearch(v)} `))
  indexCache.set(bookId, built)
  return built
}

function scoreVerse(norm: string, query: ParsedQuery): number {
  let score = 0
  for (const word of query.words) {
    if (norm.includes(` ${word} `)) score += 3
    else if (norm.includes(` ${word}`)) score += 1
    else return 0
  }
  for (const phrase of query.phrases) {
    if (!norm.includes(` ${phrase}`)) return 0
    score += 5
  }
  if (query.whole && norm.includes(` ${query.whole}`)) score += 4
  return score
}

export function hasSearchableTerms(input: string): boolean {
  const q = parseQuery(input)
  return q.words.length > 0 || q.phrases.length > 0
}

export async function searchBible(
  input: string,
  scope: SearchScope,
  onProgress: (done: number, total: number) => void,
  signal: AbortSignal,
  cap = 600,
): Promise<SearchOutcome> {
  const query = parseQuery(input)
  const books = bibleBooks.filter((b) => scope === 'tous' || b.testament === scope)
  const hits: SearchHit[] = []
  let skippedBooks = 0
  let capped = false
  if (query.words.length === 0 && query.phrases.length === 0) {
    return { hits, capped, skippedBooks, terms: [], byBook: [] }
  }

  for (let i = 0; i < books.length && !capped; i++) {
    if (signal.aborted) break
    onProgress(i, books.length)
    let raw: string[][]
    let index: string[][]
    try {
      raw = await loadBook(books[i].id)
      index = await indexBook(books[i].id)
    } catch {
      skippedBooks++
      continue
    }
    for (let c = 0; c < index.length && !capped; c++) {
      for (let v = 0; v < index[c].length; v++) {
        const score = scoreVerse(index[c][v], query)
        if (score > 0) {
          hits.push({ bookId: books[i].id, chapter: c + 1, verse: v + 1, text: raw[c][v], score })
          if (hits.length >= cap) {
            capped = true
            break
          }
        }
      }
    }
  }
  onProgress(books.length, books.length)

  const order = new Map(bibleBooks.map((b) => [b.id, b.order]))
  hits.sort(
    (a, b) =>
      b.score - a.score ||
      (order.get(a.bookId) ?? 0) - (order.get(b.bookId) ?? 0) ||
      a.chapter - b.chapter ||
      a.verse - b.verse,
  )
  const counts = new Map<string, number>()
  for (const h of hits) counts.set(h.bookId, (counts.get(h.bookId) ?? 0) + 1)
  const byBook = [...counts.entries()]
    .map(([bookId, count]) => ({ bookId, count }))
    .sort((a, b) => b.count - a.count || (order.get(a.bookId) ?? 0) - (order.get(b.bookId) ?? 0))
  return { hits, capped, skippedBooks, terms: query.terms, byBook }
}

export interface Segment {
  text: string
  match: boolean
}

export function highlightSegments(text: string, terms: string[]): Segment[] {
  if (terms.length === 0) return [{ text, match: false }]
  const segments: Segment[] = []
  const pattern = /[\p{L}\p{N}]+/gu
  let last = 0
  let m: RegExpExecArray | null
  while ((m = pattern.exec(text)) !== null) {
    const folded = foldText(m[0])
    const hit = terms.some((t) => folded.startsWith(t))
    if (!hit) continue
    if (m.index > last) segments.push({ text: text.slice(last, m.index), match: false })
    segments.push({ text: m[0], match: true })
    last = m.index + m[0].length
  }
  if (last < text.length) segments.push({ text: text.slice(last), match: false })
  return segments.length > 0 ? segments : [{ text, match: false }]
}

export interface RandomVerse {
  bookId: string
  chapter: number
  verse: number
  text: string
}

export async function randomVerse(scope: SearchScope = 'tous'): Promise<RandomVerse | null> {
  const books = bibleBooks.filter((b) => scope === 'tous' || b.testament === scope)
  const weights = books.map((b) => b.chapterCount)
  const total = weights.reduce((a, b) => a + b, 0)
  let fallback: RandomVerse | null = null
  for (let attempt = 0; attempt < 10; attempt++) {
    let pick = Math.random() * total
    let book = books[0]
    for (let i = 0; i < books.length; i++) {
      pick -= weights[i]
      if (pick <= 0) {
        book = books[i]
        break
      }
    }
    let chapters: string[][]
    try {
      chapters = await loadBook(book.id)
    } catch {
      continue
    }
    const c = Math.floor(Math.random() * chapters.length)
    const verses = chapters[c]
    if (!verses || verses.length === 0) continue
    const v = Math.floor(Math.random() * verses.length)
    const candidate = { bookId: book.id, chapter: c + 1, verse: v + 1, text: verses[v] }
    fallback = candidate
    if (candidate.text.length >= 45 && candidate.text.length <= 230) return candidate
  }
  return fallback
}
