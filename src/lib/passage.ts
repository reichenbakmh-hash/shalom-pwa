import { useEffect, useState } from 'react'
import { bibleBooks, findBook, getPassageText } from './bible'
import { buildBookIndex, parseReference } from './bibleRef'
import type { BibleBook } from '../types'

const index = buildBookIndex(bibleBooks)

export interface ResolvedReference {
  book: BibleBook
  chapter: number
  verse: number | null
  verseEnd: number | null
}

export function resolveReference(reference: string): ResolvedReference | null {
  const parsed = parseReference(reference, index)
  if (!parsed || parsed.chapter === null) return null
  const book = findBook(parsed.bookId)
  if (!book || parsed.chapter < 1 || parsed.chapter > book.chapterCount) return null
  return { book, chapter: parsed.chapter, verse: parsed.verseStart, verseEnd: parsed.verseEnd }
}

export function usePassageText(
  bookId: string | undefined,
  chapter: number | undefined,
  verse: number | null | undefined,
  verseEnd: number | null | undefined,
  fallback: string,
): string {
  const [text, setText] = useState(fallback)
  useEffect(() => {
    setText(fallback)
    if (!bookId || !chapter || !verse) return
    let cancelled = false
    void getPassageText(bookId, chapter, verse, verseEnd ?? undefined).then((value) => {
      if (!cancelled && value) setText(value)
    })
    return () => {
      cancelled = true
    }
  }, [bookId, chapter, verse, verseEnd, fallback])
  return text
}
