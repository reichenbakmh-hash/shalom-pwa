import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Search,
  Heart,
  StickyNote,
  Copy,
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  History,
  CloudOff,
  Trash2,
} from 'lucide-react'
import PageContainer from '../components/PageContainer'
import BibleOfflinePanel from '../components/BibleOfflinePanel'
import { BibleError, bibleBooks, findBook, getChapter, getOfflineStatus, searchText, type SearchOutcome } from '../lib/bible'
import { buildBookIndex, formatReference, formatVerseList, parseReference } from '../lib/bibleRef'
import {
  getFavorites,
  getHistory,
  getLastReading,
  getNotes,
  isFavoriteVerse,
  recordReading,
  removeFavorite,
  saveNote,
  toggleFavorites,
  verseKey,
} from '../lib/bibleUser'
import type { BibleChapter, BibleNote, FavoriteVerse } from '../types'

type View = 'lire' | 'favoris' | 'notes'
type Picker = 'none' | 'book' | 'chapter'
type SearchMode = 'ref' | 'text'
type Scope = 'tous' | 'ancien' | 'nouveau'

type ChapterState =
  | { status: 'loading' }
  | { status: 'ready'; chapter: BibleChapter }
  | { status: 'error'; code: BibleError['code'] | 'unavailable'; message: string }

interface Target {
  bookId: string
  chapter: number
  verse?: number
  verseEnd?: number
}

const bookIndex = buildBookIndex(bibleBooks)
const TRANSLATION_LABEL = 'Louis Segond 1910'

function initialTarget(): Target {
  const last = getLastReading()
  if (last && findBook(last.bookId)) return { bookId: last.bookId, chapter: last.chapter }
  return { bookId: 'jhn', chapter: 1 }
}

export default function Bible() {
  const [start] = useState(initialTarget)
  const [view, setView] = useState<View>('lire')
  const [bookId, setBookId] = useState(start.bookId)
  const [chapterNumber, setChapterNumber] = useState(start.chapter)
  const [picker, setPicker] = useState<Picker>('none')
  const [pickerTestament, setPickerTestament] = useState<'ancien' | 'nouveau'>(findBook(start.bookId)?.testament ?? 'nouveau')
  const [chapterState, setChapterState] = useState<ChapterState>({ status: 'loading' })
  const [reloadToken, setReloadToken] = useState(0)
  const [selected, setSelected] = useState<number[]>([])
  const [highlight, setHighlight] = useState<number | null>(null)
  const [noteEditor, setNoteEditor] = useState<{ verse: number; text: string } | null>(null)
  const [favorites, setFavorites] = useState<FavoriteVerse[]>(() => getFavorites())
  const [notes, setNotes] = useState<BibleNote[]>(() => getNotes())
  const [history, setHistory] = useState(() => getHistory())
  const [searchMode, setSearchMode] = useState<SearchMode>('ref')
  const [scope, setScope] = useState<Scope>('tous')
  const [query, setQuery] = useState('')
  const [searchMessage, setSearchMessage] = useState<string | null>(null)
  const [searching, setSearching] = useState<{ done: number; total: number } | null>(null)
  const [outcome, setOutcome] = useState<SearchOutcome | null>(null)
  const [outcomeQuery, setOutcomeQuery] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [offlineComplete, setOfflineComplete] = useState<boolean | null>(null)
  const [showOffline, setShowOffline] = useState(false)
  const searchAbort = useRef<AbortController | null>(null)
  const pendingTarget = useRef<Target | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  const book = findBook(bookId) ?? bibleBooks[0]

  const refreshOffline = useCallback(async () => {
    setOfflineComplete((await getOfflineStatus()).complete)
  }, [])

  useEffect(() => {
    void refreshOffline()
    return () => {
      searchAbort.current?.abort()
      window.clearTimeout(toastTimer.current)
    }
  }, [refreshOffline])

  function notify(message: string) {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2800)
  }

  useEffect(() => {
    let cancelled = false
    setChapterState({ status: 'loading' })
    getChapter(bookId, chapterNumber)
      .then((chapter) => {
        if (cancelled) return
        if (!chapter) {
          setChapterState({ status: 'error', code: 'unavailable', message: 'Ce chapitre est indisponible.' })
          return
        }
        setChapterState({ status: 'ready', chapter })
        recordReading(bookId, chapterNumber)
        setHistory(getHistory())
      })
      .catch((error: unknown) => {
        if (cancelled) return
        if (error instanceof BibleError) {
          setChapterState({ status: 'error', code: error.code, message: error.message })
        } else {
          setChapterState({ status: 'error', code: 'invalid', message: 'Erreur inattendue pendant la lecture.' })
        }
      })
    return () => {
      cancelled = true
    }
  }, [bookId, chapterNumber, reloadToken])

  useEffect(() => {
    if (chapterState.status !== 'ready') return
    const target = pendingTarget.current
    if (!target || target.bookId !== bookId || target.chapter !== chapterNumber) return
    pendingTarget.current = null
    const count = chapterState.chapter.verses.length
    if (target.verse && target.verse > count) {
      notify(`Ce chapitre ne compte que ${count} versets.`)
      return
    }
    if (target.verse) {
      setHighlight(target.verse)
      if (target.verseEnd && target.verseEnd > target.verse) {
        const end = Math.min(target.verseEnd, count)
        setSelected(Array.from({ length: end - target.verse + 1 }, (_, i) => target.verse! + i))
      }
      window.setTimeout(() => document.getElementById(`verse-${target.verse}`)?.scrollIntoView({ block: 'center' }), 60)
    }
  }, [chapterState, bookId, chapterNumber])

  function goTo(target: Target) {
    const next = findBook(target.bookId)
    if (!next || target.chapter < 1 || target.chapter > next.chapterCount) {
      notify('Référence introuvable.')
      return
    }
    pendingTarget.current = target.verse ? target : null
    setBookId(next.id)
    setChapterNumber(target.chapter)
    setSelected([])
    setHighlight(null)
    setNoteEditor(null)
    setPicker('none')
    setView('lire')
    if (!target.verse) window.scrollTo({ top: 0 })
  }

  function step(direction: -1 | 1) {
    const chapter = chapterNumber + direction
    if (chapter >= 1 && chapter <= book.chapterCount) {
      goTo({ bookId, chapter })
      return
    }
    const neighbour = bibleBooks[book.order - 1 + direction]
    if (!neighbour) return
    goTo({ bookId: neighbour.id, chapter: direction === 1 ? 1 : neighbour.chapterCount })
  }

  const isFirst = book.order === 1 && chapterNumber === 1
  const isLast = book.order === bibleBooks.length && chapterNumber === book.chapterCount

  function submitSearch() {
    const value = query.trim()
    setSearchMessage(null)
    if (!value) return
    if (searchMode === 'ref') {
      const parsed = parseReference(value, bookIndex)
      if (!parsed) {
        setSearchMessage('Référence non reconnue. Exemple : Jean 3:16 ou 1 Co 13.')
        return
      }
      const target = findBook(parsed.bookId)!
      const chapter = parsed.chapter ?? 1
      if (chapter > target.chapterCount) {
        setSearchMessage(`${target.name} compte ${target.chapterCount} chapitre${target.chapterCount > 1 ? 's' : ''}.`)
        return
      }
      setOutcome(null)
      goTo({ bookId: target.id, chapter, verse: parsed.verseStart ?? undefined, verseEnd: parsed.verseEnd ?? undefined })
      return
    }
    if (value.length < 2) {
      setSearchMessage('Saisissez au moins deux caractères.')
      return
    }
    searchAbort.current?.abort()
    const abort = new AbortController()
    searchAbort.current = abort
    setOutcome(null)
    setSearching({ done: 0, total: 1 })
    searchText(value, scope, (done, total) => setSearching({ done, total }), abort.signal)
      .then((result) => {
        if (abort.signal.aborted) return
        setOutcome(result)
        setOutcomeQuery(value)
      })
      .finally(() => {
        if (searchAbort.current === abort) setSearching(null)
      })
  }

  const selectedVerses = useMemo(() => {
    if (chapterState.status !== 'ready') return []
    return [...selected].sort((a, b) => a - b).flatMap((n) => {
      const v = chapterState.chapter.verses[n - 1]
      return v ? [v] : []
    })
  }, [selected, chapterState])

  function toggleVerse(verse: number) {
    setNoteEditor(null)
    setHighlight(null)
    setSelected((current) => (current.includes(verse) ? current.filter((n) => n !== verse) : [...current, verse]))
  }

  function selectionReference(): string {
    return `${book.name} ${chapterNumber}:${formatVerseList(selectedVerses.map((v) => v.verse))}`
  }

  function selectionText(): string {
    const body =
      selectedVerses.length === 1
        ? selectedVerses[0].text
        : selectedVerses.map((v) => `${v.verse}. ${v.text}`).join('\n')
    return `${body}\n${selectionReference()} (${TRANSLATION_LABEL})`
  }

  async function copySelection() {
    try {
      await navigator.clipboard.writeText(selectionText())
      notify('Passage copié.')
    } catch {
      notify('Copie impossible sur cet appareil.')
    }
  }

  async function shareSelection() {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ text: selectionText() })
      } catch {
        return
      }
      return
    }
    await copySelection()
  }

  function toggleSelectionFavorite() {
    const next = toggleFavorites(book, chapterNumber, selectedVerses.map((v) => ({ verse: v.verse, text: v.text })))
    if (!next) {
      notify('Enregistrement impossible : stockage plein ou indisponible.')
      return
    }
    setFavorites(next)
  }

  function openNoteEditor() {
    if (selectedVerses.length !== 1) return
    const verse = selectedVerses[0].verse
    const existing = notes.find((n) => n.id === verseKey(bookId, chapterNumber, verse))
    setNoteEditor({ verse, text: existing?.text ?? '' })
  }

  function commitNote() {
    if (!noteEditor) return
    const next = saveNote(bookId, chapterNumber, noteEditor.verse, noteEditor.text)
    if (!next) {
      notify('Enregistrement impossible : stockage plein ou indisponible.')
      return
    }
    setNotes(next)
    setNoteEditor(null)
    notify(noteEditor.text.trim() ? 'Note enregistrée.' : 'Note supprimée.')
  }

  function openFavorite(f: FavoriteVerse) {
    if (f.bookId && f.chapter) {
      goTo({ bookId: f.bookId, chapter: f.chapter, verse: f.verse })
      return
    }
    const parsed = parseReference(f.reference, bookIndex)
    if (parsed?.chapter) goTo({ bookId: parsed.bookId, chapter: parsed.chapter, verse: parsed.verseStart ?? undefined })
    else notify('Référence introuvable.')
  }

  function deleteFavorite(id: string) {
    const next = removeFavorite(id)
    if (next) setFavorites(next)
    else notify('Suppression impossible.')
  }

  function deleteNote(note: BibleNote) {
    const next = saveNote(note.bookId, note.chapter, note.verse, '')
    if (next) setNotes(next)
    else notify('Suppression impossible.')
  }

  const lastReading = history[0]
  const showResume = view === 'lire' && lastReading && (lastReading.bookId !== bookId || lastReading.chapter !== chapterNumber)
  const pickerBooks = bibleBooks.filter((b) => b.testament === pickerTestament)
  const recent = history.slice(0, 8)
  const hasSelection = selectedVerses.length > 0

  return (
    <PageContainer title="La Parole" subtitle="Lisez, recherchez et gardez trace de vos passages préférés.">
      {(offlineComplete === false || showOffline) && (
        <BibleOfflinePanel
          onChange={() => {
            void refreshOffline()
            setReloadToken((t) => t + 1)
          }}
        />
      )}

      <div className="liquid-glass-panel rounded-xl flex items-center gap-2 px-4 py-3 mb-3">
        <Search size={16} className="text-white/40 shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitSearch()
          }}
          placeholder={searchMode === 'ref' ? 'Référence : Jean 3:16, 1 Co 13…' : 'Mot ou expression : paix, "ne crains point"…'}
          className="bg-transparent outline-none text-sm text-white placeholder:text-white/30 w-full"
          enterKeyHint="search"
          autoCapitalize="none"
          autoCorrect="off"
        />
        <button
          onClick={submitSearch}
          className="bg-white text-black text-xs font-medium px-3 py-1.5 rounded-full shrink-0"
        >
          {searchMode === 'ref' ? 'Aller' : 'Chercher'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(['ref', 'text'] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setSearchMode(m)
              setSearchMessage(null)
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              searchMode === m ? 'bg-white text-black' : 'liquid-glass text-white/70'
            }`}
          >
            {m === 'ref' ? 'Référence' : 'Texte'}
          </button>
        ))}
        {searchMode === 'text' &&
          (['tous', 'ancien', 'nouveau'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                scope === s ? 'bg-white/15 text-white' : 'liquid-glass text-white/50'
              }`}
            >
              {s === 'tous' ? 'Toute la Bible' : s === 'ancien' ? 'Ancien Testament' : 'Nouveau Testament'}
            </button>
          ))}
      </div>

      {searchMessage && <p className="text-amber-200/90 text-xs mb-4">{searchMessage}</p>}

      {searching && (
        <div className="mb-4">
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-white/60 transition-all" style={{ width: `${(searching.done / searching.total) * 100}%` }} />
          </div>
          <p className="text-white/40 text-xs mt-2">
            Recherche… {searching.done} / {searching.total} livres
          </p>
        </div>
      )}

      {outcome && (
        <div className="liquid-glass-panel rounded-2xl p-5 mb-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="text-white/70 text-sm">
              {outcome.hits.length === 0
                ? `Aucun résultat pour « ${outcomeQuery} ».`
                : `${outcome.hits.length}${outcome.truncated ? '+' : ''} résultat${outcome.hits.length > 1 ? 's' : ''} pour « ${outcomeQuery} »`}
            </div>
            <button onClick={() => setOutcome(null)} className="text-white/40 hover:text-white" aria-label="Fermer les résultats">
              <X size={16} />
            </button>
          </div>
          {outcome.skippedBooks > 0 && (
            <div className="flex items-start gap-2 text-amber-200/90 text-xs mb-3">
              <CloudOff size={14} className="mt-0.5 shrink-0" />
              <span>
                {outcome.skippedBooks} livre{outcome.skippedBooks > 1 ? 's' : ''} non disponible{outcome.skippedBooks > 1 ? 's' : ''} localement : résultats
                incomplets. Installez la Bible hors connexion pour une recherche complète.
              </span>
            </div>
          )}
          {outcome.truncated && <p className="text-white/40 text-xs mb-3">Seuls les premiers résultats sont affichés. Précisez votre recherche.</p>}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {outcome.hits.map((h) => {
              const b = findBook(h.bookId)!
              return (
                <button
                  key={verseKey(h.bookId, h.chapter, h.verse)}
                  onClick={() => goTo({ bookId: h.bookId, chapter: h.chapter, verse: h.verse })}
                  className="block w-full text-left"
                >
                  <div className="text-white/50 text-xs">{formatReference(b, h.chapter, h.verse)}</div>
                  <div className="text-white/85 text-sm leading-relaxed">{h.text}</div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-5">
        {(
          [
            ['lire', 'Lecture'],
            ['favoris', `Favoris (${favorites.length})`],
            ['notes', `Notes (${notes.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
              view === id ? 'bg-white text-black' : 'liquid-glass text-white/70'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => setShowOffline((s) => !s)}
          className="ml-auto liquid-glass text-white/60 p-2 rounded-full"
          aria-label="Gérer la lecture hors connexion"
        >
          <CloudOff size={14} />
        </button>
      </div>

      {view === 'favoris' && (
        <div className="space-y-3">
          {favorites.length === 0 && (
            <div className="liquid-glass-panel rounded-2xl p-6 text-white/40 text-sm text-center">
              Aucun favori pour le moment. Touchez un verset puis le cœur pour l’ajouter.
            </div>
          )}
          {[...favorites]
            .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
            .map((f) => (
              <div key={f.id} className="liquid-glass-panel rounded-2xl p-4 flex gap-3">
                <button onClick={() => openFavorite(f)} className="flex-1 text-left">
                  <div className="text-white/50 text-xs mb-1">{f.reference}</div>
                  <div className="text-white/85 text-sm leading-relaxed">{f.text}</div>
                </button>
                <button onClick={() => deleteFavorite(f.id)} className="text-white/30 hover:text-white self-start" aria-label="Retirer des favoris">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
        </div>
      )}

      {view === 'notes' && (
        <div className="space-y-3">
          {notes.length === 0 && (
            <div className="liquid-glass-panel rounded-2xl p-6 text-white/40 text-sm text-center">
              Aucune note. Touchez un verset puis l’icône de note pour en écrire une.
            </div>
          )}
          {[...notes]
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            .map((n) => {
              const b = findBook(n.bookId)
              return (
                <div key={n.id} className="liquid-glass-panel rounded-2xl p-4 flex gap-3">
                  <button
                    onClick={() => goTo({ bookId: n.bookId, chapter: n.chapter, verse: n.verse })}
                    className="flex-1 text-left"
                  >
                    <div className="text-white/50 text-xs mb-1">{b ? formatReference(b, n.chapter, n.verse) : n.id}</div>
                    <div className="text-white/85 text-sm leading-relaxed whitespace-pre-wrap">{n.text}</div>
                  </button>
                  <button onClick={() => deleteNote(n)} className="text-white/30 hover:text-white self-start" aria-label="Supprimer la note">
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
        </div>
      )}

      {view === 'lire' && (
        <>
          {showResume && lastReading && (
            <button
              onClick={() => goTo({ bookId: lastReading.bookId, chapter: lastReading.chapter })}
              className="liquid-glass-panel rounded-xl w-full flex items-center gap-3 px-4 py-3 mb-4 text-left"
            >
              <History size={16} className="text-white/50 shrink-0" />
              <span className="text-white/80 text-sm">
                Reprendre ma lecture —{' '}
                {formatReference(findBook(lastReading.bookId) ?? bibleBooks[0], lastReading.chapter)}
              </span>
            </button>
          )}

          {recent.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
              {recent.map((h) => (
                <button
                  key={`${h.bookId}-${h.chapter}`}
                  onClick={() => goTo({ bookId: h.bookId, chapter: h.chapter })}
                  className="shrink-0 liquid-glass text-white/60 text-xs px-3 py-1.5 rounded-full"
                >
                  {formatReference(findBook(h.bookId) ?? bibleBooks[0], h.chapter)}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 mb-3">
            <button
              onClick={() => {
                setPickerTestament(book.testament)
                setPicker((p) => (p === 'book' ? 'none' : 'book'))
              }}
              className="liquid-glass-panel rounded-xl flex-1 flex items-center justify-between px-4 py-3 text-white text-sm"
            >
              <span className="truncate">{book.name}</span>
              <ChevronDown size={14} className="text-white/40 shrink-0" />
            </button>
            <button
              onClick={() => setPicker((p) => (p === 'chapter' ? 'none' : 'chapter'))}
              className="liquid-glass-panel rounded-xl flex items-center justify-between gap-3 px-4 py-3 text-white text-sm"
            >
              <span>
                Chap. {chapterNumber} / {book.chapterCount}
              </span>
              <ChevronDown size={14} className="text-white/40" />
            </button>
          </div>

          {picker === 'book' && (
            <div className="liquid-glass-panel rounded-2xl p-4 mb-4">
              <div className="flex gap-2 mb-4">
                {(['ancien', 'nouveau'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setPickerTestament(t)}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                      pickerTestament === t ? 'bg-white text-black' : 'liquid-glass text-white/70'
                    }`}
                  >
                    {t === 'nouveau' ? 'Nouveau Testament' : 'Ancien Testament'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                {pickerBooks.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => goTo({ bookId: b.id, chapter: 1 })}
                    className={`px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                      b.id === bookId ? 'bg-white/15 text-white' : 'liquid-glass text-white/60 hover:text-white'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {picker === 'chapter' && (
            <div className="liquid-glass-panel rounded-2xl p-4 mb-4">
              <div className="flex gap-1.5 flex-wrap max-h-72 overflow-y-auto">
                {Array.from({ length: book.chapterCount }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => goTo({ bookId, chapter: n })}
                    className={`w-10 h-10 rounded-lg text-xs transition-colors ${
                      chapterNumber === n ? 'bg-white text-black' : 'liquid-glass text-white/50 hover:text-white'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => step(-1)}
              disabled={isFirst}
              className="liquid-glass text-white/70 p-2.5 rounded-full disabled:opacity-30"
              aria-label="Chapitre précédent"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-white/60 text-sm">{formatReference(book, chapterNumber)}</span>
            <button
              onClick={() => step(1)}
              disabled={isLast}
              className="liquid-glass text-white/70 p-2.5 rounded-full disabled:opacity-30"
              aria-label="Chapitre suivant"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="liquid-glass-panel rounded-2xl p-5 sm:p-6 mb-4">
            {chapterState.status === 'loading' && <div className="text-white/40 text-sm text-center py-10">Chargement du chapitre…</div>}

            {chapterState.status === 'error' && (
              <div className="text-center py-8">
                <CloudOff size={20} className="text-white/40 mx-auto mb-3" />
                <p className="text-white/70 text-sm leading-relaxed">
                  {chapterState.code === 'offline'
                    ? 'Ce chapitre n’est pas disponible hors connexion. Reconnectez-vous ou installez la Bible depuis le panneau hors connexion.'
                    : chapterState.code === 'not_installed'
                      ? 'Le texte de ce livre n’est pas installé dans cette version de l’application.'
                      : chapterState.message}
                </p>
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    onClick={() => setReloadToken((t) => t + 1)}
                    className="bg-white text-black text-xs font-medium px-4 py-2 rounded-full"
                  >
                    Réessayer
                  </button>
                  <button
                    onClick={() => setShowOffline(true)}
                    className="liquid-glass text-white/80 text-xs font-medium px-4 py-2 rounded-full"
                  >
                    Hors connexion
                  </button>
                </div>
              </div>
            )}

            {chapterState.status === 'ready' && (
              <div className="space-y-1">
                {chapterState.chapter.verses.map((v) => {
                  const isSelected = selected.includes(v.verse)
                  const note = notes.find((n) => n.id === verseKey(bookId, chapterNumber, v.verse))
                  const favorite = isFavoriteVerse(favorites, book, chapterNumber, v.verse)
                  return (
                    <div key={v.id} id={`verse-${v.verse}`}>
                      <button
                        onClick={() => toggleVerse(v.verse)}
                        className={`w-full flex gap-3 text-left rounded-lg px-2 py-2 transition-colors ${
                          isSelected ? 'bg-white/15' : highlight === v.verse ? 'bg-white/10' : ''
                        }`}
                        aria-pressed={isSelected}
                      >
                        <span className="text-white/30 text-xs mt-1 w-6 shrink-0 text-right">{v.verse}</span>
                        <span className="text-white/85 text-[15px] leading-relaxed flex-1">{v.text}</span>
                        <span className="flex flex-col gap-1.5 mt-1 shrink-0">
                          {favorite && <Heart size={12} className="text-rose-300/80 fill-rose-300/80" />}
                          {note && <StickyNote size={12} className="text-amber-200/70" />}
                        </span>
                      </button>
                      {note && (
                        <div className="ml-11 mr-2 mb-2 text-xs text-amber-100/70 whitespace-pre-wrap border-l border-amber-200/20 pl-3">
                          {note.text}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => step(-1)}
              disabled={isFirst}
              className="liquid-glass text-white/70 text-xs px-4 py-2.5 rounded-full disabled:opacity-30"
            >
              Précédent
            </button>
            <button
              onClick={() => step(1)}
              disabled={isLast}
              className="liquid-glass text-white/70 text-xs px-4 py-2.5 rounded-full disabled:opacity-30"
            >
              Suivant
            </button>
          </div>
        </>
      )}

      {view === 'lire' && hasSelection && (
        <div className="fixed bottom-4 left-4 right-4 z-40 liquid-glass rounded-2xl p-3 max-w-3xl mx-auto bg-night-950/80">
          {noteEditor ? (
            <div>
              <div className="text-white/60 text-xs mb-2">
                Note — {formatReference(book, chapterNumber, noteEditor.verse)}
              </div>
              <textarea
                value={noteEditor.text}
                onChange={(e) => setNoteEditor({ verse: noteEditor.verse, text: e.target.value })}
                rows={3}
                autoFocus
                placeholder="Votre réflexion sur ce verset…"
                className="w-full bg-white/5 rounded-lg p-3 text-sm text-white placeholder:text-white/30 outline-none resize-none"
              />
              <div className="flex gap-2 mt-2">
                <button onClick={commitNote} className="bg-white text-black text-xs font-medium px-4 py-2 rounded-full">
                  Enregistrer
                </button>
                <button onClick={() => setNoteEditor(null)} className="liquid-glass text-white/70 text-xs px-4 py-2 rounded-full">
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 text-white/70 text-xs truncate">{selectionReference()}</div>
              <button
                onClick={toggleSelectionFavorite}
                className="liquid-glass text-white p-2.5 rounded-full"
                aria-label="Ajouter ou retirer des favoris"
              >
                <Heart
                  size={16}
                  className={
                    selectedVerses.every((v) => isFavoriteVerse(favorites, book, chapterNumber, v.verse))
                      ? 'fill-rose-300 text-rose-300'
                      : ''
                  }
                />
              </button>
              <button
                onClick={openNoteEditor}
                disabled={selectedVerses.length !== 1}
                className="liquid-glass text-white p-2.5 rounded-full disabled:opacity-30"
                aria-label="Écrire une note"
              >
                <StickyNote size={16} />
              </button>
              <button onClick={() => void copySelection()} className="liquid-glass text-white p-2.5 rounded-full" aria-label="Copier">
                <Copy size={16} />
              </button>
              <button onClick={() => void shareSelection()} className="liquid-glass text-white p-2.5 rounded-full" aria-label="Partager">
                <Share2 size={16} />
              </button>
              <button onClick={() => setSelected([])} className="text-white/50 p-2" aria-label="Désélectionner">
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 liquid-glass rounded-full px-4 py-2 text-white text-xs bg-night-950/80">
          {toast}
        </div>
      )}
    </PageContainer>
  )
}
