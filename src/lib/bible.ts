import booksData from '../data/bible-books.json'
import { foldText } from './bibleRef'
import { storage, STORAGE_KEYS } from './storage'
import type { BibleBook, BibleChapter, BibleManifest, BibleOfflineState } from '../types'

export const bibleBooks = booksData as BibleBook[]

export type BibleErrorCode = 'not_installed' | 'offline' | 'invalid' | 'quota' | 'aborted'

export class BibleError extends Error {
  code: BibleErrorCode

  constructor(code: BibleErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

const CACHE_NAME = 'shalom-bible'
const BASE = `${import.meta.env.BASE_URL}bible/`
const MANIFEST_URL = `${BASE}manifest.json`
const MEMORY_LIMIT = 4
const JSON_HEADERS = { 'Content-Type': 'application/json' }

interface BookPayload {
  id: string
  chapters: string[][]
}

const memory = new Map<string, string[][]>()

export function findBook(id: string): BibleBook | undefined {
  return bibleBooks.find((b) => b.id === id)
}

export function bookUrl(id: string): string {
  return `${BASE}${id}.json`
}

async function openCache(): Promise<Cache | null> {
  if (typeof caches === 'undefined') return null
  try {
    return await caches.open(CACHE_NAME)
  } catch {
    return null
  }
}

async function fetchText(url: string, signal?: AbortSignal): Promise<string> {
  let res: Response
  try {
    res = await fetch(url, { cache: 'no-store', signal })
  } catch {
    if (signal?.aborted) throw new BibleError('aborted', 'Téléchargement interrompu.')
    throw new BibleError('offline', 'Connexion indisponible.')
  }
  if (res.status === 404) throw new BibleError('not_installed', 'Données bibliques absentes.')
  if (!res.ok) throw new BibleError('offline', 'Le serveur ne répond pas correctement.')
  return res.text()
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    throw new BibleError('not_installed', 'Données bibliques absentes ou illisibles.')
  }
}

function isBookPayload(id: string, data: unknown): data is BookPayload {
  if (!data || typeof data !== 'object') return false
  const d = data as { id?: unknown; chapters?: unknown }
  const book = findBook(id)
  if (!book || d.id !== id || !Array.isArray(d.chapters)) return false
  if (d.chapters.length !== book.chapterCount) return false
  return d.chapters.every(
    (c) => Array.isArray(c) && c.length > 0 && c.every((v) => typeof v === 'string' && v.length > 0),
  )
}

function isManifest(data: unknown): data is BibleManifest {
  if (!data || typeof data !== 'object') return false
  const d = data as Partial<BibleManifest>
  return (
    typeof d.version === 'string' &&
    typeof d.translation === 'string' &&
    typeof d.verified === 'boolean' &&
    Array.isArray(d.books) &&
    d.books.length === bibleBooks.length &&
    !!d.totals
  )
}

function storageError(error: unknown): BibleError {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    return new BibleError('quota', 'Espace de stockage insuffisant sur cet appareil.')
  }
  return new BibleError('quota', 'Impossible d’écrire dans le stockage hors connexion.')
}

function remember(id: string, chapters: string[][]) {
  memory.delete(id)
  memory.set(id, chapters)
  while (memory.size > MEMORY_LIMIT) {
    const oldest = memory.keys().next().value
    if (oldest === undefined) break
    memory.delete(oldest)
  }
}

export async function loadBook(id: string): Promise<string[][]> {
  const inMemory = memory.get(id)
  if (inMemory) {
    remember(id, inMemory)
    return inMemory
  }
  const url = bookUrl(id)
  const cache = await openCache()
  let payload: BookPayload | null = null
  const hit = cache ? await cache.match(url) : undefined
  if (hit) {
    try {
      const data: unknown = await hit.json()
      if (isBookPayload(id, data)) payload = data
    } catch {
      payload = null
    }
  }
  if (!payload) {
    const text = await fetchText(url)
    const data = parseJson(text)
    if (!isBookPayload(id, data)) throw new BibleError('invalid', 'Le fichier de ce livre est incomplet.')
    payload = data
    if (cache) {
      try {
        await cache.put(url, new Response(text, { headers: JSON_HEADERS }))
      } catch {
        void 0
      }
    }
  }
  remember(id, payload.chapters)
  return payload.chapters
}

export async function getChapter(bookId: string, number: number): Promise<BibleChapter | null> {
  const book = findBook(bookId)
  if (!book || !Number.isInteger(number) || number < 1 || number > book.chapterCount) return null
  const chapters = await loadBook(bookId)
  const verses = chapters[number - 1]
  if (!verses) return null
  return {
    id: `${bookId}-${number}`,
    bookId,
    number,
    verses: verses.map((text, i) => ({
      id: `${bookId}-${number}-${i + 1}`,
      chapter: number,
      verse: i + 1,
      text,
    })),
  }
}

export async function loadManifest(): Promise<BibleManifest | null> {
  const cache = await openCache()
  const hit = cache ? await cache.match(MANIFEST_URL) : undefined
  if (hit) {
    try {
      const data: unknown = await hit.json()
      if (isManifest(data)) return data
    } catch {
      void 0
    }
  }
  try {
    const text = await fetchText(MANIFEST_URL)
    const data = parseJson(text)
    if (!isManifest(data)) return null
    if (cache) {
      try {
        await cache.put(MANIFEST_URL, new Response(text, { headers: JSON_HEADERS }))
      } catch {
        void 0
      }
    }
    return data
  } catch {
    return null
  }
}

export async function fetchRemoteManifest(signal?: AbortSignal): Promise<BibleManifest> {
  const data = parseJson(await fetchText(MANIFEST_URL, signal))
  if (!isManifest(data)) throw new BibleError('invalid', 'Le manifeste de la Bible est invalide.')
  return data
}

export interface OfflineStatus {
  installed: number
  total: number
  complete: boolean
  version: string | null
}

export async function getOfflineStatus(): Promise<OfflineStatus> {
  const total = bibleBooks.length
  const state = storage.get<BibleOfflineState | null>(STORAGE_KEYS.bibleOffline, null)
  const cache = await openCache()
  if (!cache) return { installed: 0, total, complete: false, version: null }
  const keys = await cache.keys()
  const paths = new Set(keys.map((r) => new URL(r.url).pathname))
  const installed = bibleBooks.filter((b) => paths.has(new URL(bookUrl(b.id), location.origin).pathname)).length
  return { installed, total, complete: installed === total && !!state, version: state?.version ?? null }
}

export async function hasRemoteUpdate(): Promise<boolean> {
  const state = storage.get<BibleOfflineState | null>(STORAGE_KEYS.bibleOffline, null)
  if (!state) return false
  try {
    const remote = await fetchRemoteManifest()
    return remote.version !== state.version
  } catch {
    return false
  }
}

async function ensureSpace(needed: number) {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return
  const { quota, usage } = await navigator.storage.estimate()
  if (quota === undefined || usage === undefined) return
  if (quota - usage < needed * 1.3) {
    throw new BibleError('quota', 'Espace de stockage insuffisant pour installer la Bible sur cet appareil.')
  }
}

export interface DownloadProgress {
  done: number
  total: number
  bytes: number
}

export async function downloadBible(
  onProgress: (progress: DownloadProgress) => void,
  signal?: AbortSignal,
): Promise<BibleManifest> {
  const manifest = await fetchRemoteManifest(signal)
  if (!manifest.verified) {
    throw new BibleError('invalid', 'Le corpus biblique n’a pas été vérifié : installation refusée.')
  }
  await ensureSpace(manifest.books.reduce((sum, b) => sum + b.bytes, 0))
  const cache = await openCache()
  if (!cache) throw new BibleError('quota', 'Le stockage hors connexion n’est pas disponible sur ce navigateur.')

  let bytes = 0
  for (let i = 0; i < bibleBooks.length; i++) {
    if (signal?.aborted) throw new BibleError('aborted', 'Téléchargement interrompu.')
    const book = bibleBooks[i]
    const text = await fetchText(bookUrl(book.id), signal)
    const data = parseJson(text)
    if (!isBookPayload(book.id, data)) {
      throw new BibleError('invalid', `Le fichier « ${book.name} » est incomplet.`)
    }
    const expected = manifest.books.find((b) => b.id === book.id)
    if (!expected || expected.verses.join(',') !== data.chapters.map((c) => c.length).join(',')) {
      throw new BibleError('invalid', `Le fichier « ${book.name} » ne correspond pas au manifeste.`)
    }
    try {
      await cache.put(bookUrl(book.id), new Response(text, { headers: JSON_HEADERS }))
    } catch (error) {
      throw storageError(error)
    }
    bytes += text.length
    onProgress({ done: i + 1, total: bibleBooks.length, bytes })
  }

  try {
    await cache.put(MANIFEST_URL, new Response(JSON.stringify(manifest), { headers: JSON_HEADERS }))
  } catch (error) {
    throw storageError(error)
  }
  memory.clear()
  storage.set(STORAGE_KEYS.bibleOffline, {
    version: manifest.version,
    completedAt: new Date().toISOString(),
  } satisfies BibleOfflineState)
  if (navigator.storage?.persist) {
    try {
      await navigator.storage.persist()
    } catch {
      void 0
    }
  }
  return manifest
}

export interface SearchHit {
  bookId: string
  chapter: number
  verse: number
  text: string
}

export interface SearchOutcome {
  hits: SearchHit[]
  truncated: boolean
  skippedBooks: number
}

export async function searchText(
  query: string,
  scope: 'tous' | 'ancien' | 'nouveau',
  onProgress: (done: number, total: number) => void,
  signal: AbortSignal,
  limit = 150,
): Promise<SearchOutcome> {
  const quoted = /^"(.+)"$/.exec(query.trim())
  const terms = quoted ? [foldText(quoted[1]).trim()] : foldText(query).split(/\s+/).filter(Boolean)
  const books = bibleBooks.filter((b) => scope === 'tous' || b.testament === scope)
  const hits: SearchHit[] = []
  let skippedBooks = 0
  let truncated = false
  if (terms.length === 0 || terms.every((t) => !t)) return { hits, truncated, skippedBooks }

  for (let i = 0; i < books.length && !truncated; i++) {
    if (signal.aborted) break
    onProgress(i, books.length)
    let chapters: string[][]
    try {
      chapters = await loadBook(books[i].id)
    } catch {
      skippedBooks++
      continue
    }
    for (let c = 0; c < chapters.length && !truncated; c++) {
      for (let v = 0; v < chapters[c].length; v++) {
        const folded = foldText(chapters[c][v])
        if (terms.every((t) => folded.includes(t))) {
          hits.push({ bookId: books[i].id, chapter: c + 1, verse: v + 1, text: chapters[c][v] })
          if (hits.length >= limit) {
            truncated = true
            break
          }
        }
      }
    }
  }
  onProgress(books.length, books.length)
  return { hits, truncated, skippedBooks }
}
