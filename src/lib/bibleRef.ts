import type { BibleBook } from '../types'

export function foldText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/gi, 'oe')
    .replace(/æ/gi, 'ae')
    .replace(/[’‘]/g, "'")
    .toLowerCase()
}

function compact(input: string): string {
  return foldText(input).replace(/[\s.\-']/g, '')
}

const EXTRA_ALIASES: Record<string, string> = {
  gn: 'gen',
  lv: 'lev',
  dt: 'deu',
  jg: 'jdg',
  jb: 'job',
  qo: 'ecc',
  ct: 'sng',
  cant: 'sng',
  is: 'isa',
  jr: 'jer',
  lm: 'lam',
  ez: 'ezk',
  dn: 'dan',
  jl: 'jol',
  am: 'amo',
  ab: 'oba',
  mc: 'mrk',
  mr: 'mrk',
  lc: 'luk',
  lu: 'luk',
  rm: 'rom',
  hb: 'heb',
  jc: 'jas',
  apoc: 'rev',
  ps: 'psa',
  pr: 'pro',
  mt: 'mat',
  matt: 'mat',
  jn: 'jhn',
}

export interface BookIndex {
  exact: Map<string, string>
  names: { key: string; id: string }[]
}

export function buildBookIndex(books: BibleBook[]): BookIndex {
  const exact = new Map<string, string>()
  const names: { key: string; id: string }[] = []
  for (const b of books) {
    for (const raw of [b.id, b.name, b.abbr]) {
      const key = compact(raw)
      if (key && !exact.has(key)) exact.set(key, b.id)
    }
    names.push({ key: compact(b.name), id: b.id })
  }
  for (const [alias, id] of Object.entries(EXTRA_ALIASES)) {
    if (!exact.has(alias)) exact.set(alias, id)
  }
  return { exact, names }
}

export interface ParsedReference {
  bookId: string
  chapter: number | null
  verseStart: number | null
  verseEnd: number | null
}

const PATTERN =
  /^\s*([123]?\s*[a-zà-ÿœæ][a-zà-ÿœæ'’.\s-]*?)\s*(?:(\d{1,3})(?:\s*[:.,vV]\s*(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?)?)?\s*$/i

export function parseReference(input: string, index: BookIndex): ParsedReference | null {
  const match = PATTERN.exec(input)
  if (!match) return null
  const key = compact(match[1])
  if (!key) return null
  let bookId = index.exact.get(key)
  if (!bookId && key.length >= 3) {
    const candidates = index.names.filter((n) => n.key.startsWith(key))
    if (candidates.length === 1) bookId = candidates[0].id
  }
  if (!bookId) return null
  const chapter = match[2] ? Number(match[2]) : null
  const verseStart = match[3] ? Number(match[3]) : null
  const verseEnd = match[4] ? Number(match[4]) : null
  if (verseStart !== null && verseEnd !== null && verseEnd < verseStart) return null
  return { bookId, chapter, verseStart, verseEnd }
}

export function formatVerseList(verses: number[]): string {
  const sorted = [...new Set(verses)].sort((a, b) => a - b)
  const parts: string[] = []
  let start = 0
  while (start < sorted.length) {
    let end = start
    while (end + 1 < sorted.length && sorted[end + 1] === sorted[end] + 1) end++
    parts.push(end > start ? `${sorted[start]}-${sorted[end]}` : `${sorted[start]}`)
    start = end + 1
  }
  return parts.join(', ')
}

export function formatReference(
  book: BibleBook,
  chapter: number,
  verseStart?: number | null,
  verseEnd?: number | null,
): string {
  const label = book.id === 'psa' ? 'Psaume' : book.name
  if (!verseStart) return `${label} ${chapter}`
  const suffix = verseEnd && verseEnd !== verseStart ? `${verseStart}-${verseEnd}` : `${verseStart}`
  return `${label} ${chapter}:${suffix}`
}

export function suggestBooks(input: string, books: BibleBook[], limit = 4): BibleBook[] {
  const key = compact(input)
  if (key.length < 2) return []
  const starts: BibleBook[] = []
  const contains: BibleBook[] = []
  for (const b of books) {
    const name = compact(b.name)
    if (name.startsWith(key) || compact(b.abbr) === key) starts.push(b)
    else if (key.length >= 3 && name.includes(key)) contains.push(b)
  }
  return [...starts, ...contains].slice(0, limit)
}

export function normalizeForSearch(input: string): string {
  return foldText(input)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
