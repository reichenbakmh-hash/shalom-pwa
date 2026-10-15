import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Bookmark,
  BookMarked,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CloudOff,
  Copy,
  History,
  Share2,
  StickyNote,
  X,
} from 'lucide-react'
import PageContainer from '../components/PageContainer'
import BibleOfflinePanel from '../components/BibleOfflinePanel'
import SearchTab, { type OpenTarget, type VerseRef } from '../components/bible/SearchTab'
import SavedTab from '../components/bible/SavedTab'
import SaveSheet from '../components/bible/SaveSheet'
import {
  BibleError,
  bibleBooks,
  findBook,
  getChapter,
  getOfflineStatus,
  TRANSLATION_LABEL,
} from '../lib/bible'
import { formatReference, formatVerseList } from '../lib/bibleRef'
import {
  chapterKey,
  getBookmarks,
  getFavorites,
  getHistory,
  getLastReading,
  getNotes,
  getPrefs,
  getSavedSearches,
  isSaved,
  listFolders,
  moveFavorite,
  recordReading,
  removeFavorite,
  removeSavedSearch,
  saveNote,
  saveRange,
  saveVerses,
  setPrefs,
  toggleBookmark,
  toggleSavedSearch,
  unsaveRange,
  unsaveVerses,
  verseKey,
} from '../lib/bibleUser'
import { shareOrCopy } from '../lib/share'
import type {
  BibleChapter,
  BibleIntent,
  BibleNote,
  BiblePrefs,
  BibleTab,
  FavoriteVerse,
  SavedSearch,
  SearchScope,
} from '../types'

type Picker = 'none' | 'book' | 'chapter'

type ChapterState =
  | { status: 'loading' }
  | { status: 'ready'; chapter: BibleChapter }
  | { status: 'error'; code: BibleError['code'] | 'unavailable'; message: string }

type Sheet = { kind: 'selection' } | { kind: 'move'; favorite: FavoriteVerse }

interface Target {
  bookId: string
  chapter: number
  verse?: number
  verseEnd?: number
}

interface Props {
  intent: BibleIntent | null
}

const TEXT_SIZES = ['text-[14px]', 'text-[16px]', 'text-[18px]'] as const

function initialTarget(intent: BibleIntent | null): Target {
  if (intent?.bookId && intent.chapter && findBook(intent.bookId)) {
    return { bookId: intent.bookId, chapter: intent.chapter }
  }
  const last = getLastReading()
  if (last && findBook(last.bookId)) return { bookId: last.bookId, chapter: last.chapter }
  return { bookId: 'jhn', chapter: 1 }
}

export default function Bible({ intent }: Props) {
  const [start] = useState(() => initialTarget(intent))
  const [tab, setTab] = useState<BibleTab>(intent?.tab ?? 'lire')
  const [bookId, setBookId] = useState(start.bookId)
  const [chapterNumber, setChapterNumber] = useState(start.chapter)
  const [picker, setPicker] = useState<Picker>('none')
  const [pickerTestament, setPickerTestament] = useState<'ancien' | 'nouveau'>(
    findBook(start.bookId)?.testament ?? 'nouveau',
  )
  const [chapterState, setChapterState] = useState<ChapterState>({ status: 'loading' })
  const [reloadToken, setReloadToken] = useState(0)
  const [selected, setSelected] = useState<number[]>([])
  const [highlight, setHighlight] = useState<number | null>(null)
  const [noteEditor, setNoteEditor] = useState<{ verse: number; text: string } | null>(null)
  const [sheet, setSheet] = useState<Sheet | null>(null)
  const [favorites, setFavorites] = useState<FavoriteVerse[]>(() => getFavorites())
  const [notes, setNotes] = useState<BibleNote[]>(() => getNotes())
  const [bookmarks, setBookmarks] = useState(() => getBookmarks())
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(() => getSavedSearches())
  const [history, setHistory] = useState(() => getHistory())
  const [prefs, setPrefsState] = useState<BiblePrefs>(() => getPrefs())
  const [searchIntent, setSearchIntent] = useState<{ query: string; scope?: SearchScope; nonce: number } | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [offlineComplete, setOfflineComplete] = useState<boolean | null>(null)
  const [showOffline, setShowOffline] = useState(false)
  const pendingTarget = useRef<Target | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  const book = findBook(bookId) ?? bibleBooks[0]

  const refreshOffline = useCallback(async () => {
    setOfflineComplete((await getOfflineStatus()).complete)
  }, [])

  useEffect(() => {
    void refreshOffline()
    return () => window.clearTimeout(toastTimer.current)
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

  function applyTarget(target: Target, count: number) {
    if (!target.verse) return
    if (target.verse > count) {
      notify(`Ce chapitre ne compte que ${count} verset${count > 1 ? 's' : ''}.`)
      return
    }
    const first = target.verse
    setHighlight(first)
    if (target.verseEnd && target.verseEnd > first) {
      const end = Math.min(target.verseEnd, count)
      setSelected(Array.from({ length: end - first + 1 }, (_, i) => first + i))
    }
    window.setTimeout(() => document.getElementById(`verse-${first}`)?.scrollIntoView({ block: 'center' }), 80)
  }

  useEffect(() => {
    if (chapterState.status !== 'ready') return
    const target = pendingTarget.current
    if (!target || target.bookId !== bookId || target.chapter !== chapterNumber) return
    pendingTarget.current = null
    applyTarget(target, chapterState.chapter.verses.length)
  }, [chapterState, bookId, chapterNumber])

  function goTo(target: Target) {
    const next = findBook(target.bookId)
    if (!next || target.chapter < 1 || target.chapter > next.chapterCount) {
      notify('Référence introuvable.')
      return
    }
    const sameChapter = next.id === bookId && target.chapter === chapterNumber
    setBookId(next.id)
    setChapterNumber(target.chapter)
    setSelected([])
    setHighlight(null)
    setNoteEditor(null)
    setPicker('none')
    setTab('lire')
    if (!target.verse) window.scrollTo({ top: 0 })
    if (sameChapter && chapterState.status === 'ready') {
      pendingTarget.current = null
      applyTarget(target, chapterState.chapter.verses.length)
    } else {
      pendingTarget.current = target.verse ? target : null
    }
  }

  useEffect(() => {
    if (!intent) return
    if (intent.query) {
      setSearchIntent({ query: intent.query, nonce: intent.nonce })
      setTab('chercher')
    } else if (intent.bookId && intent.chapter) {
      goTo({ bookId: intent.bookId, chapter: intent.chapter, verse: intent.verse, verseEnd: intent.verseEnd })
    } else if (intent.tab) {
      setTab(intent.tab)
    }
  }, [intent])

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

  const selectedVerses = useMemo(() => {
    if (chapterState.status !== 'ready') return []
    return [...selected]
      .sort((a, b) => a - b)
      .flatMap((n) => {
        const v = chapterState.chapter.verses[n - 1]
        return v ? [v] : []
      })
  }, [selected, chapterState])

  const allSelectedSaved =
    selectedVerses.length > 0 && selectedVerses.every((v) => isSaved(favorites, book, chapterNumber, v.verse))

  function toggleVerse(verse: number) {
    setNoteEditor(null)
    setHighlight(null)
    setSelected((current) => (current.includes(verse) ? current.filter((n) => n !== verse) : [...current, verse]))
  }

  function selectionReference(): string {
    return `${formatReference(book, chapterNumber)}:${formatVerseList(selectedVerses.map((v) => v.verse))}`
  }

  function selectionText(): string {
    const body =
      selectedVerses.length === 1
        ? selectedVerses[0].text
        : selectedVerses.map((v) => `${v.verse}. ${v.text}`).join('\n')
    return `${body}\n${selectionReference()} (${TRANSLATION_LABEL})`
  }

  async function shareSelection() {
    const result = await shareOrCopy(selectionText())
    if (result === 'copied') notify('Passage copié.')
    if (result === 'failed') notify('Partage impossible sur cet appareil.')
  }

  async function copySelection() {
    try {
      await navigator.clipboard.writeText(selectionText())
      notify('Passage copié.')
    } catch {
      notify('Copie impossible sur cet appareil.')
    }
  }

  function onSaveSelection() {
    if (allSelectedSaved) {
      const next = unsaveVerses(book, chapterNumber, selectedVerses)
      if (!next) {
        notify('Action impossible : stockage plein ou indisponible.')
        return
      }
      setFavorites(next)
      notify('Retiré de tes enregistrés.')
      return
    }
    setSheet({ kind: 'selection' })
  }

  function commitSheet(folder: string | undefined) {
    const current = sheet
    setSheet(null)
    if (!current) return
    if (current.kind === 'selection') {
      const next = saveVerses(
        book,
        chapterNumber,
        selectedVerses.map((v) => ({ verse: v.verse, text: v.text })),
        folder,
      )
      if (!next) {
        notify('Enregistrement impossible : stockage plein ou indisponible.')
        return
      }
      setFavorites(next)
      notify(folder ? `Enregistré dans « ${folder} ».` : 'Enregistré.')
      return
    }
    const next = moveFavorite(current.favorite.id, folder)
    if (!next) {
      notify('Action impossible : stockage plein ou indisponible.')
      return
    }
    setFavorites(next)
    notify(folder ? `Rangé dans « ${folder} ».` : 'Retiré du dossier.')
  }

  function toggleSaveVerse(ref: VerseRef) {
    const target = findBook(ref.bookId)
    if (!target) return
    const last = ref.verseEnd ?? ref.verse
    if (isSaved(favorites, target, ref.chapter, ref.verse)) {
      const next = unsaveRange(target, ref.chapter, ref.verse, last)
      if (next) {
        setFavorites(next)
        notify('Retiré de tes enregistrés.')
      } else {
        notify('Action impossible : stockage plein ou indisponible.')
      }
      return
    }
    const next = saveRange(target, ref.chapter, ref.verse, last, ref.text)
    if (next) {
      setFavorites(next)
      notify('Enregistré. Tu peux le ranger dans un dossier depuis « Enregistrés ».')
    } else {
      notify('Enregistrement impossible : stockage plein ou indisponible.')
    }
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

  function deleteFavorite(id: string) {
    const next = removeFavorite(id)
    if (next) {
      setFavorites(next)
      notify('Retiré de tes enregistrés.')
    } else {
      notify('Suppression impossible.')
    }
  }

  function deleteNote(note: BibleNote) {
    const next = saveNote(note.bookId, note.chapter, note.verse, '')
    if (next) setNotes(next)
    else notify('Suppression impossible.')
  }

  function flipBookmark(targetBook: string, chapter: number) {
    const next = toggleBookmark(targetBook, chapter)
    if (!next) {
      notify('Action impossible : stockage plein ou indisponible.')
      return
    }
    const added = next.some((b) => b.id === chapterKey(targetBook, chapter))
    setBookmarks(next)
    notify(added ? 'Chapitre marqué.' : 'Signet retiré.')
  }

  function flipSearch(query: string, scope: SearchScope) {
    const next = toggleSavedSearch(query, scope)
    if (next) setSavedSearches(next)
    else notify('Action impossible : stockage plein ou indisponible.')
  }

  function deleteSearch(id: string) {
    const next = removeSavedSearch(id)
    if (next) setSavedSearches(next)
    else notify('Suppression impossible.')
  }

  function changeTextSize(delta: -1 | 1) {
    const size = Math.max(0, Math.min(2, prefs.textSize + delta)) as BiblePrefs['textSize']
    const next = { textSize: size }
    setPrefsState(next)
    setPrefs(next)
  }

  function showInstall() {
    setShowOffline(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const lastReading = history[0]
  const showResume =
    tab === 'lire' && lastReading && (lastReading.bookId !== bookId || lastReading.chapter !== chapterNumber)
  const pickerBooks = bibleBooks.filter((b) => b.testament === pickerTestament)
  const recent = history.slice(0, 8)
  const hasSelection = selectedVerses.length > 0
  const bookmarked = bookmarks.some((b) => b.id === chapterKey(bookId, chapterNumber))
  const folderNames = listFolders(favorites).map((f) => f.name)
  const openTarget = (t: OpenTarget) => goTo(t)

  const tabs: { id: BibleTab; label: string }[] = [
    { id: 'lire', label: 'Lire' },
    { id: 'chercher', label: 'Chercher' },
    { id: 'enregistres', label: favorites.length > 0 ? `Enregistrés · ${favorites.length}` : 'Enregistrés' },
  ]

  return (
    <PageContainer title="La Parole" subtitle="Lis, cherche, et garde ce qui te parle.">
      {(offlineComplete === false || showOffline) && (
        <BibleOfflinePanel
          onChange={() => {
            void refreshOffline()
            setReloadToken((t) => t + 1)
          }}
        />
      )}

      <div className="flex items-center gap-2 mb-6">
        <div className="flex gap-1.5 flex-1 overflow-x-auto no-scrollbar" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 px-4 py-2.5 rounded-full text-sm transition-colors ${
                tab === t.id ? 'bg-white text-black font-medium' : 'control text-white/70'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowOffline((s) => !s)}
          className="control text-white/60 w-10 h-10 shrink-0 rounded-full flex items-center justify-center"
          aria-label="Lecture hors connexion"
          title="Lecture hors connexion"
        >
          <CloudOff size={15} />
        </button>
      </div>

      <div className={tab === 'chercher' ? '' : 'hidden'}>
        <SearchTab
          favorites={favorites}
          savedSearches={savedSearches}
          intent={searchIntent}
          onOpen={openTarget}
          onToggleSave={toggleSaveVerse}
          onToggleSearch={flipSearch}
          onNotify={notify}
          onBibleMissing={showInstall}
        />
      </div>

      {tab === 'enregistres' && (
        <SavedTab
          favorites={favorites}
          notes={notes}
          bookmarks={bookmarks}
          savedSearches={savedSearches}
          onOpen={openTarget}
          onRunSearch={(query, scope) => {
            setSearchIntent({ query, scope, nonce: Date.now() })
            setTab('chercher')
          }}
          onMove={(favorite) => setSheet({ kind: 'move', favorite })}
          onDeleteFavorite={deleteFavorite}
          onDeleteNote={deleteNote}
          onDeleteBookmark={(b) => flipBookmark(b.bookId, b.chapter)}
          onDeleteSearch={deleteSearch}
          onNotify={notify}
          onGoRead={() => setTab('lire')}
          onGoSearch={() => setTab('chercher')}
        />
      )}

      {tab === 'lire' && (
        <>
          {showResume && lastReading && (
            <button
              type="button"
              onClick={() => goTo({ bookId: lastReading.bookId, chapter: lastReading.chapter })}
              className="surface rounded-xl w-full flex items-center gap-3 px-4 py-3 mb-4 text-left"
            >
              <History size={16} className="text-white/50 shrink-0" />
              <span className="text-white/80 text-sm">
                Reprendre : {formatReference(findBook(lastReading.bookId) ?? bibleBooks[0], lastReading.chapter)}
              </span>
            </button>
          )}

          {recent.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4 -mx-1 px-1">
              {recent.map((h) => (
                <button
                  type="button"
                  key={`${h.bookId}-${h.chapter}`}
                  onClick={() => goTo({ bookId: h.bookId, chapter: h.chapter })}
                  className="shrink-0 control text-white/60 text-xs px-3 py-1.5 rounded-full"
                >
                  {formatReference(findBook(h.bookId) ?? bibleBooks[0], h.chapter)}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => {
                setPickerTestament(book.testament)
                setPicker((p) => (p === 'book' ? 'none' : 'book'))
              }}
              className="surface rounded-xl flex-1 flex items-center justify-between px-4 py-3 text-white text-sm"
              aria-expanded={picker === 'book'}
            >
              <span className="truncate">{book.name}</span>
              <ChevronDown size={14} className="text-white/40 shrink-0" />
            </button>
            <button
              type="button"
              onClick={() => setPicker((p) => (p === 'chapter' ? 'none' : 'chapter'))}
              className="surface rounded-xl flex items-center justify-between gap-3 px-4 py-3 text-white text-sm"
              aria-expanded={picker === 'chapter'}
            >
              <span>
                Chap. {chapterNumber} / {book.chapterCount}
              </span>
              <ChevronDown size={14} className="text-white/40" />
            </button>
          </div>

          {picker === 'book' && (
            <div className="surface rounded-2xl p-4 mb-4">
              <div className="flex gap-2 mb-4">
                {(['ancien', 'nouveau'] as const).map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setPickerTestament(t)}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                      pickerTestament === t ? 'bg-white text-black' : 'control text-white/70'
                    }`}
                  >
                    {t === 'nouveau' ? 'Nouveau Testament' : 'Ancien Testament'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                {pickerBooks.map((b) => (
                  <button
                    type="button"
                    key={b.id}
                    onClick={() => goTo({ bookId: b.id, chapter: 1 })}
                    className={`px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                      b.id === bookId ? 'bg-white/15 text-white' : 'control text-white/60 hover:text-white'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {picker === 'chapter' && (
            <div className="surface rounded-2xl p-4 mb-4">
              <div className="flex gap-1.5 flex-wrap max-h-72 overflow-y-auto">
                {Array.from({ length: book.chapterCount }, (_, i) => i + 1).map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => goTo({ bookId, chapter: n })}
                    className={`w-10 h-10 rounded-lg text-xs transition-colors ${
                      chapterNumber === n ? 'bg-white text-black' : 'control text-white/50 hover:text-white'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4 gap-2">
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={isFirst}
              className="control text-white/70 w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30"
              aria-label="Chapitre précédent"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-white/80 text-sm truncate">{formatReference(book, chapterNumber)}</span>
              <button
                type="button"
                onClick={() => flipBookmark(bookId, chapterNumber)}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 shrink-0"
                aria-label={bookmarked ? 'Retirer le signet de ce chapitre' : 'Marquer ce chapitre'}
                aria-pressed={bookmarked}
                title={bookmarked ? 'Retirer le signet' : 'Marquer ce chapitre'}
              >
                <BookMarked size={15} className={bookmarked ? 'text-sky-300 fill-sky-300/30' : 'text-white/40'} />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => changeTextSize(-1)}
                disabled={prefs.textSize === 0}
                className="control text-white/70 w-9 h-9 rounded-full text-xs disabled:opacity-30"
                aria-label="Réduire la taille du texte"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => changeTextSize(1)}
                disabled={prefs.textSize === 2}
                className="control text-white/70 w-9 h-9 rounded-full text-base disabled:opacity-30"
                aria-label="Agrandir la taille du texte"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                disabled={isLast}
                className="control text-white/70 w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 ml-1"
                aria-label="Chapitre suivant"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="surface rounded-2xl p-4 sm:p-6 mb-4">
            {chapterState.status === 'loading' && (
              <div className="text-white/40 text-sm text-center py-10">Chargement du chapitre…</div>
            )}

            {chapterState.status === 'error' && (
              <div className="text-center py-8">
                <CloudOff size={20} className="text-white/40 mx-auto mb-3" />
                <p className="text-white/70 text-sm leading-relaxed">
                  {chapterState.code === 'offline'
                    ? 'Ce chapitre n’est pas disponible sans connexion. Reconnecte-toi, ou installe la Bible pour la lire partout.'
                    : chapterState.code === 'not_installed'
                      ? 'Le texte de ce livre n’est pas encore installé dans l’application.'
                      : chapterState.message}
                </p>
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setReloadToken((t) => t + 1)}
                    className="bg-white text-black text-xs font-medium px-4 py-2 rounded-full"
                  >
                    Réessayer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOffline(true)}
                    className="control text-white/80 text-xs font-medium px-4 py-2 rounded-full"
                  >
                    Installer la Bible
                  </button>
                </div>
              </div>
            )}

            {chapterState.status === 'ready' && (
              <div className="space-y-0.5">
                {chapterState.chapter.verses.map((v) => {
                  const isSelected = selected.includes(v.verse)
                  const note = notes.find((n) => n.id === verseKey(bookId, chapterNumber, v.verse))
                  const saved = isSaved(favorites, book, chapterNumber, v.verse)
                  return (
                    <div key={v.id} id={`verse-${v.verse}`}>
                      <button
                        type="button"
                        onClick={() => toggleVerse(v.verse)}
                        className={`w-full flex gap-3 text-left rounded-lg px-2 py-2 transition-colors ${
                          isSelected ? 'bg-white/15' : highlight === v.verse ? 'bg-amber-200/10' : ''
                        }`}
                        aria-pressed={isSelected}
                      >
                        <span className="text-white/30 text-xs mt-1 w-6 shrink-0 text-right">{v.verse}</span>
                        <span className={`text-white/85 leading-relaxed flex-1 ${TEXT_SIZES[prefs.textSize]}`}>
                          {v.text}
                        </span>
                        <span className="flex flex-col gap-1.5 mt-1 shrink-0 w-3">
                          {saved && <Bookmark size={12} className="text-rose-300 fill-rose-300" />}
                          {note && <StickyNote size={12} className="text-amber-200/80" />}
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
              type="button"
              onClick={() => step(-1)}
              disabled={isFirst}
              className="control text-white/70 text-sm px-5 py-3 rounded-full disabled:opacity-30"
            >
              Précédent
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={isLast}
              className="control text-white/70 text-sm px-5 py-3 rounded-full disabled:opacity-30"
            >
              Suivant
            </button>
          </div>
        </>
      )}

      {tab === 'lire' && hasSelection && (
        <div className="fixed bottom-4 left-4 right-4 z-40 bg-night-900 border border-white/15 rounded-2xl p-3 max-w-3xl mx-auto shadow-lg shadow-black/50">
          {noteEditor ? (
            <div>
              <div className="text-white/60 text-xs mb-2">
                Note · {formatReference(book, chapterNumber, noteEditor.verse)}
              </div>
              <textarea
                value={noteEditor.text}
                onChange={(e) => setNoteEditor({ verse: noteEditor.verse, text: e.target.value })}
                rows={3}
                autoFocus
                placeholder="Ce que ce verset te dit…"
                className="w-full bg-white/5 rounded-lg p-3 text-sm text-white placeholder:text-white/30 outline-none resize-none"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={commitNote}
                  className="bg-white text-black text-xs font-medium px-4 py-2 rounded-full"
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => setNoteEditor(null)}
                  className="control text-white/70 text-xs px-4 py-2 rounded-full"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onSaveSelection}
                className={`flex items-center gap-2 text-xs font-medium px-4 h-10 rounded-full shrink-0 ${
                  allSelectedSaved ? 'control text-rose-200' : 'bg-white text-black'
                }`}
              >
                <Bookmark size={15} className={allSelectedSaved ? 'fill-rose-300 text-rose-300' : ''} />
                {allSelectedSaved ? 'Enregistré' : 'Enregistrer'}
              </button>
              <div className="flex-1 min-w-0 text-white/50 text-xs truncate px-1">{selectionReference()}</div>
              <button
                type="button"
                onClick={openNoteEditor}
                disabled={selectedVerses.length !== 1}
                className="control text-white w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 shrink-0"
                aria-label="Écrire une note"
              >
                <StickyNote size={15} />
              </button>
              <button
                type="button"
                onClick={() => void copySelection()}
                className="control text-white w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                aria-label="Copier"
              >
                <Copy size={15} />
              </button>
              <button
                type="button"
                onClick={() => void shareSelection()}
                className="control text-white w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                aria-label="Partager"
              >
                <Share2 size={15} />
              </button>
              <button
                type="button"
                onClick={() => setSelected([])}
                className="text-white/50 hover:text-white w-9 h-10 flex items-center justify-center shrink-0"
                aria-label="Désélectionner"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {sheet && (
        <SaveSheet
          mode={sheet.kind === 'selection' ? 'save' : 'move'}
          title={sheet.kind === 'selection' ? selectionReference() : sheet.favorite.reference}
          folders={folderNames}
          current={sheet.kind === 'move' ? sheet.favorite.folder : undefined}
          onPick={commitSheet}
          onClose={() => setSheet(null)}
        />
      )}

      {toast && (
        <div
          role="status"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] bg-night-900 border border-white/15 rounded-full px-4 py-2.5 text-white text-xs shadow-lg shadow-black/50 max-w-[90vw] text-center"
        >
          {toast}
        </div>
      )}
    </PageContainer>
  )
}
