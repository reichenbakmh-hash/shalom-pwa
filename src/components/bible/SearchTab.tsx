import { useEffect, useMemo, useRef, useState } from 'react'
import { Bookmark, CloudOff, Clock, Copy, Search, Shuffle, Star, X } from 'lucide-react'
import IconButton from './IconButton'
import VerseCard from './VerseCard'
import { bibleBooks, findBook, getChapter, TRANSLATION_LABEL } from '../../lib/bible'
import { buildBookIndex, formatReference, parseReference, suggestBooks } from '../../lib/bibleRef'
import {
  hasSearchableTerms,
  parseQuery,
  randomVerse,
  searchBible,
  type RandomVerse,
  type SearchOutcome,
} from '../../lib/bibleSearch'
import {
  clearRecentSearches,
  getRecentSearches,
  isSaved,
  isSearchSaved,
  rememberSearch,
} from '../../lib/bibleUser'
import { copyText } from '../../lib/share'
import type { BibleVerse, FavoriteVerse, SavedSearch, SearchScope } from '../../types'

export interface OpenTarget {
  bookId: string
  chapter: number
  verse?: number
  verseEnd?: number
}

export interface VerseRef {
  bookId: string
  chapter: number
  verse: number
  verseEnd?: number
  text: string
}

interface Props {
  favorites: FavoriteVerse[]
  savedSearches: SavedSearch[]
  intent: { query: string; scope?: SearchScope; nonce: number } | null
  onOpen: (target: OpenTarget) => void
  onToggleSave: (verse: VerseRef) => void
  onToggleSearch: (query: string, scope: SearchScope) => void
  onNotify: (message: string) => void
  onBibleMissing: () => void
}

type RefState =
  | { status: 'idle' }
  | { status: 'invalid'; message: string }
  | { status: 'ready'; bookId: string; chapter: number; verses: BibleVerse[]; start: number | null; end: number | null }
  | { status: 'error'; missing: boolean; message: string }

type OutcomeView = SearchOutcome & { query: string; scope: SearchScope }

const bookIndex = buildBookIndex(bibleBooks)
const PAGE = 25
const IDEAS = ['paix', 'joie', 'lumière', 'courage', 'pardon', 'berger', 'fidélité', 'grâce']
const EXAMPLES: { label: string; value: string }[] = [
  { label: '« ne crains point »', value: '"ne crains point"' },
  { label: 'Jean 3:16', value: 'Jean 3:16' },
  { label: 'Psaume 23', value: 'Psaume 23' },
]
const SCOPES: { id: SearchScope; label: string }[] = [
  { id: 'tous', label: 'Toute la Bible' },
  { id: 'ancien', label: 'Ancien Testament' },
  { id: 'nouveau', label: 'Nouveau Testament' },
]

function plural(n: number, word: string): string {
  return `${n} ${word}${n > 1 ? 's' : ''}`
}

export default function SearchTab({
  favorites,
  savedSearches,
  intent,
  onOpen,
  onToggleSave,
  onToggleSearch,
  onNotify,
  onBibleMissing,
}: Props) {
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<SearchScope>('tous')
  const [outcome, setOutcome] = useState<OutcomeView | null>(null)
  const [searching, setSearching] = useState<{ done: number; total: number } | null>(null)
  const [bookFilter, setBookFilter] = useState<string | null>(null)
  const [visible, setVisible] = useState(PAGE)
  const [refState, setRefState] = useState<RefState>({ status: 'idle' })
  const [recent, setRecent] = useState<string[]>(() => getRecentSearches())
  const [random, setRandom] = useState<RandomVerse | null>(null)
  const [randomBusy, setRandomBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const trimmed = query.trim()
  const parsedRef = useMemo(() => (trimmed ? parseReference(trimmed, bookIndex) : null), [trimmed])
  const refQuery = parsedRef && parsedRef.chapter !== null ? parsedRef : null
  const textQuery = refQuery ? '' : trimmed
  const searchable = textQuery.length >= 3 && hasSearchableTerms(textQuery)
  const refKey = refQuery
    ? `${refQuery.bookId}.${refQuery.chapter}.${refQuery.verseStart ?? ''}.${refQuery.verseEnd ?? ''}`
    : ''
  const bookSuggestions = useMemo(
    () => (!refQuery && trimmed.length >= 2 && !trimmed.includes(' ') ? suggestBooks(trimmed, bibleBooks) : []),
    [refQuery, trimmed],
  )

  useEffect(() => {
    if (!intent) return
    if (intent.scope) setScope(intent.scope)
    setQuery(intent.query)
  }, [intent])

  useEffect(() => {
    if (!refQuery || refQuery.chapter === null) {
      setRefState({ status: 'idle' })
      return
    }
    const book = findBook(refQuery.bookId)
    if (!book) {
      setRefState({ status: 'invalid', message: 'Référence introuvable.' })
      return
    }
    if (refQuery.chapter < 1 || refQuery.chapter > book.chapterCount) {
      setRefState({
        status: 'invalid',
        message: `${book.name} compte ${plural(book.chapterCount, 'chapitre')}.`,
      })
      return
    }
    let cancelled = false
    const chapter = refQuery.chapter
    const timer = window.setTimeout(() => {
      getChapter(book.id, chapter)
        .then((data) => {
          if (cancelled) return
          if (!data) {
            setRefState({ status: 'error', missing: false, message: 'Ce chapitre est indisponible.' })
            return
          }
          if (refQuery.verseStart && refQuery.verseStart > data.verses.length) {
            setRefState({
              status: 'invalid',
              message: `${formatReference(book, chapter)} ne compte que ${plural(data.verses.length, 'verset')}.`,
            })
            return
          }
          setRefState({
            status: 'ready',
            bookId: book.id,
            chapter,
            verses: data.verses,
            start: refQuery.verseStart,
            end: refQuery.verseEnd,
          })
        })
        .catch(() => {
          if (!cancelled) {
            setRefState({
              status: 'error',
              missing: true,
              message: 'Le texte de la Bible n’est pas encore sur cet appareil.',
            })
          }
        })
    }, 150)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [refKey])

  useEffect(() => {
    if (!searchable) {
      setOutcome(null)
      setSearching(null)
      return
    }
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setSearching({ done: 0, total: 1 })
      searchBible(textQuery, scope, (done, total) => setSearching({ done, total }), controller.signal)
        .then((result) => {
          if (controller.signal.aborted) return
          setOutcome({ ...result, query: textQuery, scope })
          setBookFilter(null)
          setVisible(PAGE)
        })
        .catch(() => {
          if (!controller.signal.aborted) setOutcome(null)
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(null)
        })
    }, 350)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [textQuery, scope, searchable])

  function commit() {
    if (searchable) setRecent(rememberSearch(textQuery))
    inputRef.current?.blur()
  }

  function pick(value: string) {
    setQuery(value)
    setRecent(rememberSearch(value))
  }

  function openHit(target: OpenTarget) {
    if (searchable) setRecent(rememberSearch(textQuery))
    onOpen(target)
  }

  async function surprise() {
    setRandomBusy(true)
    const found = await randomVerse(scope)
    setRandomBusy(false)
    if (!found) {
      onNotify('Le texte de la Bible n’est pas encore sur cet appareil.')
      onBibleMissing()
      return
    }
    setRandom(found)
  }

  async function copyVerse(bookId: string, chapter: number, verse: number, text: string) {
    const book = findBook(bookId)
    if (!book) return
    const ok = await copyText(`${text}\n${formatReference(book, chapter, verse)} (${TRANSLATION_LABEL})`)
    onNotify(ok ? 'Verset copié.' : 'Copie impossible sur cet appareil.')
  }

  function renderVerseActions(bookId: string, chapter: number, verse: number, text: string, verseEnd?: number) {
    const book = findBook(bookId)
    if (!book) return null
    const saved = isSaved(favorites, book, chapter, verse)
    return (
      <>
        <IconButton label="Copier" onClick={() => void copyVerse(bookId, chapter, verse, text)}>
          <Copy size={15} />
        </IconButton>
        <IconButton
          label={saved ? 'Retirer des enregistrés' : 'Enregistrer'}
          onClick={() => onToggleSave({ bookId, chapter, verse, verseEnd, text })}
        >
          <Bookmark size={16} className={saved ? 'fill-rose-300 text-rose-300' : ''} />
        </IconButton>
      </>
    )
  }

  const filteredHits = outcome ? (bookFilter ? outcome.hits.filter((h) => h.bookId === bookFilter) : outcome.hits) : []
  const shownHits = filteredHits.slice(0, visible)
  const searchSaved = outcome ? isSearchSaved(savedSearches, outcome.query, outcome.scope) : false
  const everyBookMissing = outcome !== null && outcome.hits.length === 0 && outcome.skippedBooks > 0
  const queryWords = outcome ? parseQuery(outcome.query).words : []
  const idle = trimmed.length === 0

  return (
    <div>
      <div className="surface rounded-xl flex items-center gap-2 pl-4 pr-1.5 py-1.5 mb-3 focus-within:border-white/30 transition-colors">
        <Search size={16} className="text-white/40 shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
          }}
          placeholder="Un mot, une phrase ou une référence"
          className="bg-transparent outline-none text-[15px] text-white placeholder:text-white/30 w-full py-2"
          enterKeyHint="search"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Rechercher dans la Bible"
        />
        {query && (
          <IconButton
            label="Effacer"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
          >
            <X size={16} />
          </IconButton>
        )}
      </div>

      {!refQuery && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-5 -mx-1 px-1">
          {SCOPES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setScope(s.id)}
              aria-pressed={scope === s.id}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs transition-colors ${
                scope === s.id ? 'bg-white text-black font-medium' : 'control text-white/60'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {bookSuggestions.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mb-5 -mx-1 px-1">
          <span className="text-white/40 text-xs shrink-0">Aller à</span>
          {bookSuggestions.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => openHit({ bookId: b.id, chapter: 1 })}
              className="control shrink-0 text-white/80 text-xs px-3 py-1.5 rounded-full"
            >
              {b.name}
            </button>
          ))}
        </div>
      )}

      {refQuery && refState.status === 'invalid' && <p className="text-amber-200/90 text-sm">{refState.message}</p>}

      {refQuery && refState.status === 'error' && (
        <div className="surface rounded-2xl p-5 text-center">
          <CloudOff size={18} className="text-white/40 mx-auto mb-2" />
          <p className="text-white/70 text-sm">{refState.message}</p>
          {refState.missing && (
            <button
              type="button"
              onClick={onBibleMissing}
              className="bg-white text-black text-xs font-medium px-4 py-2 rounded-full mt-4"
            >
              Installer la Bible
            </button>
          )}
        </div>
      )}

      {refQuery && refState.status === 'ready' && (() => {
        const book = findBook(refState.bookId)
        if (!book) return null
        const { chapter, verses, start, end } = refState
        if (start === null) {
          const preview = verses.slice(0, 3)
          return (
            <VerseCard
              reference={formatReference(book, chapter)}
              text={`${preview.map((v) => v.text).join(' ')}${verses.length > 3 ? ' …' : ''}`}
              onOpen={() => onOpen({ bookId: book.id, chapter })}
              actions={
                <button
                  type="button"
                  onClick={() => onOpen({ bookId: book.id, chapter })}
                  className="bg-white text-black text-xs font-medium px-3 py-1.5 rounded-full mr-2"
                >
                  Lire le chapitre
                </button>
              }
            />
          )
        }
        const last = Math.min(end ?? start, verses.length, start + 11)
        const slice = verses.slice(start - 1, last)
        const text = slice.map((v) => v.text).join(' ')
        return (
          <VerseCard
            reference={formatReference(book, chapter, start, last > start ? last : null)}
            text={text}
            onOpen={() => onOpen({ bookId: book.id, chapter, verse: start, verseEnd: last > start ? last : undefined })}
            actions={renderVerseActions(book.id, chapter, start, text, last > start ? last : undefined)}
            footer={
              <button
                type="button"
                onClick={() => onOpen({ bookId: book.id, chapter, verse: start, verseEnd: last > start ? last : undefined })}
                className="text-white/60 hover:text-white text-xs underline underline-offset-4 mt-1"
              >
                Lire dans le chapitre
              </button>
            }
          />
        )
      })()}

      {searching && (
        <div className="mb-4" aria-live="polite">
          <div className="h-0.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-white/60 transition-all"
              style={{ width: `${Math.max(6, (searching.done / searching.total) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {!refQuery && outcome && (
        <div className="animate-fadeIn">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="text-white/70 text-sm min-w-0">
              {outcome.hits.length === 0 ? (
                <>Rien trouvé pour « {outcome.query} »</>
              ) : (
                <>
                  <span className="text-white font-medium">
                    {outcome.hits.length}
                    {outcome.capped ? '+' : ''}
                  </span>{' '}
                  verset{outcome.hits.length > 1 ? 's' : ''} pour « {outcome.query} »
                </>
              )}
            </div>
            {outcome.hits.length > 0 && (
              <button
                type="button"
                onClick={() => onToggleSearch(outcome.query, outcome.scope)}
                className="control shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-white/70"
                aria-pressed={searchSaved}
              >
                <Star size={13} className={searchSaved ? 'fill-amber-200 text-amber-200' : ''} />
                {searchSaved ? 'Gardée' : 'Garder'}
              </button>
            )}
          </div>

          {outcome.skippedBooks > 0 && (
            <div className="flex items-start gap-2 text-amber-200/90 text-xs mb-3">
              <CloudOff size={14} className="mt-0.5 shrink-0" />
              <span>
                {everyBookMissing && outcome.skippedBooks >= bibleBooks.length - 1
                  ? 'Le texte de la Bible n’est pas encore sur cet appareil.'
                  : `${plural(outcome.skippedBooks, 'livre')} introuvable${outcome.skippedBooks > 1 ? 's' : ''} sur cet appareil : la liste est incomplète.`}{' '}
                <button type="button" onClick={onBibleMissing} className="underline underline-offset-2">
                  Installer la Bible
                </button>
              </span>
            </div>
          )}

          {outcome.byBook.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-4 -mx-1 px-1">
              <button
                type="button"
                onClick={() => {
                  setBookFilter(null)
                  setVisible(PAGE)
                }}
                aria-pressed={bookFilter === null}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs ${
                  bookFilter === null ? 'bg-white/15 text-white' : 'control text-white/60'
                }`}
              >
                Tous · {outcome.hits.length}
              </button>
              {outcome.byBook.slice(0, 14).map((b) => (
                <button
                  key={b.bookId}
                  type="button"
                  onClick={() => {
                    setBookFilter(b.bookId)
                    setVisible(PAGE)
                  }}
                  aria-pressed={bookFilter === b.bookId}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs ${
                    bookFilter === b.bookId ? 'bg-white/15 text-white' : 'control text-white/60'
                  }`}
                >
                  {findBook(b.bookId)?.name} · {b.count}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2.5">
            {shownHits.map((h) => {
              const book = findBook(h.bookId)
              if (!book) return null
              return (
                <VerseCard
                  key={`${h.bookId}.${h.chapter}.${h.verse}`}
                  reference={formatReference(book, h.chapter, h.verse)}
                  text={h.text}
                  terms={outcome.terms}
                  onOpen={() => openHit({ bookId: h.bookId, chapter: h.chapter, verse: h.verse })}
                  actions={renderVerseActions(h.bookId, h.chapter, h.verse, h.text)}
                />
              )
            })}
          </div>

          {filteredHits.length > visible && (
            <button
              type="button"
              onClick={() => setVisible((v) => v + PAGE)}
              className="control w-full text-white/80 text-sm py-3 rounded-xl mt-3"
            >
              Voir {Math.min(PAGE, filteredHits.length - visible)} de plus
            </button>
          )}

          {outcome.hits.length === 0 && !everyBookMissing && (
            <div className="surface rounded-2xl p-5">
              <p className="text-white/70 text-sm leading-relaxed">
                Aucun verset ne contient tous ces mots. Essaie avec moins de mots, ou garde juste le plus important.
              </p>
              {queryWords.length > 1 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {queryWords.map((w) => (
                    <button key={w} type="button" onClick={() => pick(w)} className="control text-white/80 text-xs px-3 py-1.5 rounded-full">
                      {w}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!searching && !outcome && trimmed.length > 0 && !refQuery && !searchable && bookSuggestions.length === 0 && (
        <p className="text-white/40 text-sm">Tape au moins trois lettres.</p>
      )}

      {idle && (
        <div className="space-y-7 animate-fadeIn">
          <div>
            <div className="text-white/40 text-xs mb-2.5">Un mot pour commencer</div>
            <div className="flex flex-wrap gap-1.5">
              {IDEAS.map((w) => (
                <button key={w} type="button" onClick={() => pick(w)} className="control text-white/80 text-sm px-3.5 py-2 rounded-full">
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-white/40 text-xs mb-2.5">Ou essaie une phrase, une référence</div>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((e) => (
                <button
                  key={e.label}
                  type="button"
                  onClick={() => pick(e.value)}
                  className="control text-white/80 text-sm px-3.5 py-2 rounded-full"
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => void surprise()}
              disabled={randomBusy}
              className="control w-full flex items-center justify-center gap-2 text-white text-sm font-medium py-3.5 rounded-xl disabled:opacity-60"
            >
              <Shuffle size={16} />
              {random ? 'Un autre verset au hasard' : 'Surprends-moi avec un verset'}
            </button>
            {random && (() => {
              const book = findBook(random.bookId)
              if (!book) return null
              return (
                <div className="mt-3 animate-fadeIn" key={`${random.bookId}.${random.chapter}.${random.verse}`}>
                  <VerseCard
                    reference={formatReference(book, random.chapter, random.verse)}
                    text={random.text}
                    onOpen={() => onOpen({ bookId: random.bookId, chapter: random.chapter, verse: random.verse })}
                    actions={renderVerseActions(random.bookId, random.chapter, random.verse, random.text)}
                  />
                </div>
              )
            })()}
          </div>

          {savedSearches.length > 0 && (
            <div>
              <div className="text-white/40 text-xs mb-2.5">Mes recherches gardées</div>
              <div className="flex flex-wrap gap-1.5">
                {savedSearches.slice(0, 6).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setScope(s.scope)
                      pick(s.query)
                    }}
                    className="control flex items-center gap-1.5 text-white/80 text-sm px-3.5 py-2 rounded-full"
                  >
                    <Star size={12} className="fill-amber-200 text-amber-200" />
                    {s.query}
                  </button>
                ))}
              </div>
            </div>
          )}

          {recent.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-white/40 text-xs">Récemment</span>
                <button
                  type="button"
                  onClick={() => {
                    clearRecentSearches()
                    setRecent([])
                  }}
                  className="text-white/40 hover:text-white text-xs"
                >
                  Effacer
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recent.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => pick(q)}
                    className="control flex items-center gap-1.5 text-white/70 text-sm px-3.5 py-2 rounded-full"
                  >
                    <Clock size={12} className="text-white/40" />
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
