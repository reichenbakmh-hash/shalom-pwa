import { useMemo, useState } from 'react'
import { BookMarked, Copy, Folder, Search, Share2, Star, Trash2 } from 'lucide-react'
import IconButton from './IconButton'
import VerseCard from './VerseCard'
import { findBook, TRANSLATION_LABEL } from '../../lib/bible'
import { foldText, formatReference } from '../../lib/bibleRef'
import { favoritesToText, listFolders } from '../../lib/bibleUser'
import { copyText, shareOrCopy } from '../../lib/share'
import type { OpenTarget } from './SearchTab'
import type { BibleBookmark, BibleNote, FavoriteVerse, SavedSearch } from '../../types'

interface Props {
  favorites: FavoriteVerse[]
  notes: BibleNote[]
  bookmarks: BibleBookmark[]
  savedSearches: SavedSearch[]
  onOpen: (target: OpenTarget) => void
  onRunSearch: (query: string, scope: SavedSearch['scope']) => void
  onMove: (favorite: FavoriteVerse) => void
  onDeleteFavorite: (id: string) => void
  onDeleteNote: (note: BibleNote) => void
  onDeleteBookmark: (bookmark: BibleBookmark) => void
  onDeleteSearch: (id: string) => void
  onNotify: (message: string) => void
  onGoRead: () => void
  onGoSearch: () => void
}

type Section = 'versets' | 'notes' | 'chapitres' | 'recherches'
type FolderFilter = 'tous' | 'sans' | string

function Empty({ text, action, onAction }: { text: string; action?: string; onAction?: () => void }) {
  return (
    <div className="surface rounded-2xl p-6 text-center">
      <p className="text-white/50 text-sm leading-relaxed">{text}</p>
      {action && onAction && (
        <button type="button" onClick={onAction} className="bg-white text-black text-xs font-medium px-4 py-2 rounded-full mt-4">
          {action}
        </button>
      )}
    </div>
  )
}

export default function SavedTab({
  favorites,
  notes,
  bookmarks,
  savedSearches,
  onOpen,
  onRunSearch,
  onMove,
  onDeleteFavorite,
  onDeleteNote,
  onDeleteBookmark,
  onDeleteSearch,
  onNotify,
  onGoRead,
  onGoSearch,
}: Props) {
  const [section, setSection] = useState<Section>('versets')
  const [folder, setFolder] = useState<FolderFilter>('tous')
  const [filter, setFilter] = useState('')

  const folders = useMemo(() => listFolders(favorites), [favorites])
  const hasUnfiled = favorites.some((f) => !f.folder)
  const activeFolder = folder !== 'tous' && folder !== 'sans' && !folders.some((f) => f.name === folder) ? 'tous' : folder

  const visibleFavorites = useMemo(() => {
    const key = foldText(filter.trim())
    return [...favorites]
      .filter((f) => (activeFolder === 'tous' ? true : activeFolder === 'sans' ? !f.folder : f.folder === activeFolder))
      .filter((f) => !key || foldText(`${f.reference} ${f.text}`).includes(key))
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
  }, [favorites, activeFolder, filter])

  function openFavorite(f: FavoriteVerse) {
    if (f.bookId && f.chapter) {
      onOpen({ bookId: f.bookId, chapter: f.chapter, verse: f.verse, verseEnd: f.verseEnd })
      return
    }
    onNotify('Ce verset a été enregistré sans son emplacement.')
  }

  async function copyFavorite(f: FavoriteVerse) {
    const ok = await copyText(`${f.text}\n${f.reference} (${TRANSLATION_LABEL})`)
    onNotify(ok ? 'Verset copié.' : 'Copie impossible sur cet appareil.')
  }

  async function shareList() {
    const result = await shareOrCopy(favoritesToText(visibleFavorites, TRANSLATION_LABEL), 'Mes versets')
    if (result === 'copied') onNotify('Liste copiée.')
    if (result === 'failed') onNotify('Partage impossible sur cet appareil.')
  }

  const sections: { id: Section; label: string; count: number }[] = [
    { id: 'versets', label: 'Versets', count: favorites.length },
    { id: 'notes', label: 'Notes', count: notes.length },
    { id: 'chapitres', label: 'Chapitres', count: bookmarks.length },
    { id: 'recherches', label: 'Recherches', count: savedSearches.length },
  ]

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-5 -mx-1 px-1">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            aria-pressed={section === s.id}
            className={`shrink-0 px-3.5 py-2 rounded-full text-xs ${
              section === s.id ? 'bg-white text-black font-medium' : 'control text-white/70'
            }`}
          >
            {s.label} · {s.count}
          </button>
        ))}
      </div>

      {section === 'versets' && (
        <div className="animate-fadeIn">
          {favorites.length === 0 ? (
            <Empty
              text="Aucun verset enregistré. Pendant la lecture, touche un verset puis « Enregistrer ». Tu peux aussi le faire depuis une recherche."
              action="Chercher un verset"
              onAction={onGoSearch}
            />
          ) : (
            <>
              {(folders.length > 0 || favorites.length > 6) && (
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-3 -mx-1 px-1">
                  <button
                    type="button"
                    onClick={() => setFolder('tous')}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs ${
                      activeFolder === 'tous' ? 'bg-white/15 text-white' : 'control text-white/60'
                    }`}
                  >
                    Tous
                  </button>
                  {folders.map((f) => (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => setFolder(f.name)}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${
                        activeFolder === f.name ? 'bg-white/15 text-white' : 'control text-white/60'
                      }`}
                    >
                      <Folder size={11} />
                      {f.name} · {f.count}
                    </button>
                  ))}
                  {folders.length > 0 && hasUnfiled && (
                    <button
                      type="button"
                      onClick={() => setFolder('sans')}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs ${
                        activeFolder === 'sans' ? 'bg-white/15 text-white' : 'control text-white/60'
                      }`}
                    >
                      Sans dossier
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                {favorites.length > 4 && (
                  <div className="surface rounded-xl flex items-center gap-2 px-3 py-2 flex-1 min-w-0">
                    <Search size={14} className="text-white/40 shrink-0" />
                    <input
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      placeholder="Filtrer mes versets"
                      className="bg-transparent outline-none text-sm text-white placeholder:text-white/30 w-full"
                      aria-label="Filtrer mes versets"
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => void shareList()}
                  disabled={visibleFavorites.length === 0}
                  className="control ml-auto shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs text-white/80 disabled:opacity-40"
                >
                  <Share2 size={13} />
                  Partager la liste
                </button>
              </div>

              {visibleFavorites.length === 0 ? (
                <Empty text="Aucun verset ne correspond." />
              ) : (
                <div className="space-y-2.5">
                  {visibleFavorites.map((f) => (
                    <VerseCard
                      key={f.id}
                      reference={f.reference}
                      text={f.text}
                      onOpen={() => openFavorite(f)}
                      actions={
                        <>
                          <IconButton label="Changer de dossier" onClick={() => onMove(f)}>
                            <Folder size={15} />
                          </IconButton>
                          <IconButton label="Copier" onClick={() => void copyFavorite(f)}>
                            <Copy size={15} />
                          </IconButton>
                          <IconButton label="Retirer des enregistrés" onClick={() => onDeleteFavorite(f.id)}>
                            <Trash2 size={15} />
                          </IconButton>
                        </>
                      }
                      footer={
                        f.folder ? (
                          <span className="inline-flex items-center gap-1 text-white/40 text-xs">
                            <Folder size={11} />
                            {f.folder}
                          </span>
                        ) : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {section === 'notes' && (
        <div className="animate-fadeIn">
          {notes.length === 0 ? (
            <Empty text="Aucune note. Touche un verset pendant la lecture, puis l’icône de note." action="Lire" onAction={onGoRead} />
          ) : (
            <div className="space-y-2.5">
              {[...notes]
                .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                .map((n) => {
                  const book = findBook(n.bookId)
                  return (
                    <div key={n.id} className="surface rounded-2xl pl-4 pr-2 py-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => onOpen({ bookId: n.bookId, chapter: n.chapter, verse: n.verse })}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="text-white/50 text-xs font-medium mb-1">
                          {book ? formatReference(book, n.chapter, n.verse) : n.id}
                        </div>
                        <div className="text-white/85 text-[15px] leading-relaxed whitespace-pre-wrap">{n.text}</div>
                      </button>
                      <IconButton label="Supprimer la note" onClick={() => onDeleteNote(n)}>
                        <Trash2 size={15} />
                      </IconButton>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}

      {section === 'chapitres' && (
        <div className="animate-fadeIn">
          {bookmarks.length === 0 ? (
            <Empty
              text="Aucun chapitre marqué. Dans la lecture, touche l’icône de signet à côté du titre pour garder la page."
              action="Lire"
              onAction={onGoRead}
            />
          ) : (
            <div className="space-y-2.5">
              {[...bookmarks]
                .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
                .map((b) => {
                  const book = findBook(b.bookId)
                  if (!book) return null
                  return (
                    <div key={b.id} className="surface rounded-2xl pl-4 pr-2 py-1.5 flex items-center gap-2">
                      <BookMarked size={15} className="text-white/40 shrink-0" />
                      <button
                        type="button"
                        onClick={() => onOpen({ bookId: b.bookId, chapter: b.chapter })}
                        className="flex-1 text-left text-white/85 text-[15px] py-2.5"
                      >
                        {formatReference(book, b.chapter)}
                      </button>
                      <IconButton label="Retirer le signet" onClick={() => onDeleteBookmark(b)}>
                        <Trash2 size={15} />
                      </IconButton>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}

      {section === 'recherches' && (
        <div className="animate-fadeIn">
          {savedSearches.length === 0 ? (
            <Empty
              text="Aucune recherche gardée. Après une recherche, touche « Garder » pour la retrouver ici."
              action="Chercher"
              onAction={onGoSearch}
            />
          ) : (
            <div className="space-y-2.5">
              {[...savedSearches]
                .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
                .map((s) => (
                  <div key={s.id} className="surface rounded-2xl pl-4 pr-2 py-1.5 flex items-center gap-2">
                    <Star size={14} className="fill-amber-200 text-amber-200 shrink-0" />
                    <button
                      type="button"
                      onClick={() => onRunSearch(s.query, s.scope)}
                      className="flex-1 text-left py-2.5 min-w-0"
                    >
                      <span className="text-white/85 text-[15px]">{s.query}</span>
                      {s.scope !== 'tous' && (
                        <span className="text-white/40 text-xs ml-2">
                          {s.scope === 'ancien' ? 'Ancien Testament' : 'Nouveau Testament'}
                        </span>
                      )}
                    </button>
                    <IconButton label="Supprimer la recherche" onClick={() => onDeleteSearch(s.id)}>
                      <Trash2 size={15} />
                    </IconButton>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
