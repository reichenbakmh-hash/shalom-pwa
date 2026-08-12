import { useState } from 'react'
import { Heart, Share2, Sparkles } from 'lucide-react'
import { getVerseForDate } from '../data/dailyVerses'
import { storage, STORAGE_KEYS } from '../lib/storage'
import type { FavoriteVerse, ViewId } from '../types'

interface Props {
  onNavigate?: (id: ViewId) => void
}

export default function DailyVerseCard({ onNavigate }: Props) {
  const verse = getVerseForDate()
  const favorites = storage.get<FavoriteVerse[]>(STORAGE_KEYS.favorites, [])
  const [isFavorite, setIsFavorite] = useState(favorites.some((f) => f.reference === verse.reference))

  function toggleFavorite() {
    const current = storage.get<FavoriteVerse[]>(STORAGE_KEYS.favorites, [])
    if (isFavorite) {
      storage.set(
        STORAGE_KEYS.favorites,
        current.filter((f) => f.reference !== verse.reference),
      )
      setIsFavorite(false)
    } else {
      storage.set(STORAGE_KEYS.favorites, [
        ...current,
        { id: verse.id, reference: verse.reference, text: verse.text, savedAt: new Date().toISOString() },
      ])
      setIsFavorite(true)
    }
  }

  async function share() {
    const shareText = `${verse.reference} — ${verse.text}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Verset du jour — SHALOM', text: shareText })
      } catch {
        /* partage annulé par l'utilisateur */
      }
    } else {
      await navigator.clipboard.writeText(shareText)
    }
  }

  return (
    <div className="liquid-glass-panel rounded-2xl p-6 sm:p-8 max-w-xl w-full">
      <span className="text-white/40 text-xs uppercase tracking-widest">Verset du jour</span>
      <h3 className="text-white text-xl sm:text-2xl font-medium mt-2">{verse.reference}</h3>
      <p className="text-white/80 text-sm sm:text-base leading-relaxed mt-3">{verse.text}</p>
      <p className="text-white/50 text-sm leading-relaxed mt-4 italic">{verse.meditation}</p>

      <div className="flex items-center gap-2 mt-6">
        <button
          onClick={toggleFavorite}
          aria-pressed={isFavorite}
          aria-label="Ajouter aux favoris"
          className={`liquid-glass p-2.5 rounded-full transition-colors ${isFavorite ? 'text-white' : 'text-white/60 hover:text-white'}`}
        >
          <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={share}
          aria-label="Partager"
          className="liquid-glass p-2.5 rounded-full text-white/60 hover:text-white transition-colors"
        >
          <Share2 size={16} />
        </button>
        {onNavigate && (
          <button
            onClick={() => onNavigate('meditation')}
            className="liquid-glass flex items-center gap-1.5 px-4 py-2.5 rounded-full text-white/80 hover:text-white text-sm transition-colors ml-auto"
          >
            <Sparkles size={14} /> Méditer
          </button>
        )}
      </div>
    </div>
  )
}
