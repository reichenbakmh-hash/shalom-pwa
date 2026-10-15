import { useState } from 'react'
import { Bookmark, BookOpen, Share2, Sparkles } from 'lucide-react'
import { getVerseForDate } from '../data/dailyVerses'
import { findBook, TRANSLATION_LABEL } from '../lib/bible'
import { getFavorites, isSaved, saveRange, unsaveRange } from '../lib/bibleUser'
import { usePassageText } from '../lib/passage'
import { shareOrCopy } from '../lib/share'
import type { BibleIntentInput, ViewId } from '../types'

interface Props {
  onNavigate?: (id: ViewId, intent?: BibleIntentInput) => void
}

export default function DailyVerseCard({ onNavigate }: Props) {
  const verse = getVerseForDate()
  const book = findBook(verse.bookId)
  const text = usePassageText(verse.bookId, verse.chapter, verse.verse, verse.verseEnd, verse.text)
  const [favorites, setFavorites] = useState(getFavorites)
  const [note, setNote] = useState<string | null>(null)
  const saved = book ? isSaved(favorites, book, verse.chapter, verse.verse) : false
  const last = verse.verseEnd ?? verse.verse

  function toggleSave() {
    if (!book) return
    const next = saved
      ? unsaveRange(book, verse.chapter, verse.verse, last)
      : saveRange(book, verse.chapter, verse.verse, last, text)
    if (next) {
      setFavorites(next)
      setNote(null)
    } else {
      setNote('Enregistrement impossible : stockage plein ou indisponible.')
    }
  }

  async function share() {
    const result = await shareOrCopy(`${text}\n${verse.reference} (${TRANSLATION_LABEL})`, 'Verset du jour')
    if (result === 'copied') setNote('Verset copié.')
    if (result === 'failed') setNote('Partage impossible sur cet appareil.')
  }

  return (
    <div className="surface rounded-2xl p-6 sm:p-8 max-w-xl w-full">
      <span className="text-white/40 text-xs uppercase tracking-widest">Verset du jour</span>
      <h3 className="text-white text-xl sm:text-2xl font-medium mt-2">{verse.reference}</h3>
      <p className="text-white/80 text-sm sm:text-base leading-relaxed mt-3">{text}</p>
      <p className="text-white/50 text-sm leading-relaxed mt-4">{verse.meditation}</p>

      <div className="flex flex-wrap items-center gap-2 mt-6">
        <button
          type="button"
          onClick={toggleSave}
          aria-pressed={saved}
          aria-label={saved ? 'Retirer des enregistrés' : 'Enregistrer ce verset'}
          title={saved ? 'Retirer des enregistrés' : 'Enregistrer ce verset'}
          className="control w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white"
        >
          <Bookmark size={16} className={saved ? 'fill-rose-300 text-rose-300' : ''} />
        </button>
        <button
          type="button"
          onClick={() => void share()}
          aria-label="Partager"
          title="Partager"
          className="control w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white"
        >
          <Share2 size={16} />
        </button>
        {onNavigate && (
          <>
            <button
              type="button"
              onClick={() =>
                onNavigate('bible', {
                  tab: 'lire',
                  bookId: verse.bookId,
                  chapter: verse.chapter,
                  verse: verse.verse,
                  verseEnd: verse.verseEnd,
                })
              }
              className="control flex items-center gap-1.5 px-4 h-10 rounded-full text-white/80 hover:text-white text-sm sm:ml-auto"
            >
              <BookOpen size={14} /> Lire le chapitre
            </button>
            <button
              type="button"
              onClick={() => onNavigate('meditation')}
              className="control flex items-center gap-1.5 px-4 h-10 rounded-full text-white/80 hover:text-white text-sm"
            >
              <Sparkles size={14} /> Méditer
            </button>
          </>
        )}
      </div>
      {note && (
        <p role="status" className="text-white/50 text-xs mt-3">
          {note}
        </p>
      )}
    </div>
  )
}
