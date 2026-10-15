import { useMemo, useState } from 'react'
import { Bookmark, BookOpen } from 'lucide-react'
import PageContainer from '../components/PageContainer'
import IconButton from '../components/bible/IconButton'
import { themes } from '../data/themes'
import { getFavorites, isSaved, saveRange, unsaveRange } from '../lib/bibleUser'
import { resolveReference, usePassageText } from '../lib/passage'
import type { BibleIntentInput, FavoriteVerse, ThemePassage, ViewId } from '../types'

interface Props {
  onNavigate: (id: ViewId, intent?: BibleIntentInput) => void
}

interface PassageProps {
  passage: ThemePassage
  favorites: FavoriteVerse[]
  onFavorites: (next: FavoriteVerse[]) => void
  onNavigate: Props['onNavigate']
}

function Passage({ passage, favorites, onFavorites, onNavigate }: PassageProps) {
  const resolved = useMemo(() => resolveReference(passage.reference), [passage.reference])
  const text = usePassageText(resolved?.book.id, resolved?.chapter, resolved?.verse, resolved?.verseEnd, passage.text)
  const first = resolved?.verse ?? null
  const last = resolved?.verseEnd ?? first
  const saved = resolved && first ? isSaved(favorites, resolved.book, resolved.chapter, first) : false

  function toggle() {
    if (!resolved || !first || !last) return
    const next = saved
      ? unsaveRange(resolved.book, resolved.chapter, first, last)
      : saveRange(resolved.book, resolved.chapter, first, last, text)
    if (next) onFavorites(next)
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-white/50 text-xs font-medium">{passage.reference}</span>
        {resolved && first && (
          <div className="flex items-center -mr-2.5">
            <IconButton
              label="Lire dans la Bible"
              onClick={() =>
                onNavigate('bible', {
                  tab: 'lire',
                  bookId: resolved.book.id,
                  chapter: resolved.chapter,
                  verse: first,
                  verseEnd: resolved.verseEnd ?? undefined,
                })
              }
            >
              <BookOpen size={15} />
            </IconButton>
            <IconButton label={saved ? 'Retirer des enregistrés' : 'Enregistrer'} onClick={toggle}>
              <Bookmark size={16} className={saved ? 'fill-rose-300 text-rose-300' : ''} />
            </IconButton>
          </div>
        )}
      </div>
      <p className="text-white/80 text-[15px] leading-relaxed">{text}</p>
    </div>
  )
}

export default function Explore({ onNavigate }: Props) {
  const [activeId, setActiveId] = useState(themes[0].id)
  const [favorites, setFavorites] = useState(getFavorites)
  const active = themes.find((t) => t.id === activeId) ?? themes[0]

  return (
    <PageContainer title="Explorer" subtitle="Des passages et des prières classés par thème.">
      <div className="flex flex-wrap gap-1.5 mb-8">
        {themes.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveId(t.id)}
            aria-pressed={activeId === t.id}
            className={`px-3.5 py-2 rounded-full text-xs transition-colors ${
              activeId === t.id ? 'bg-white text-black font-medium' : 'control text-white/60 hover:text-white'
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      <div className="surface rounded-2xl p-6 sm:p-8 animate-fadeIn" key={active.id}>
        <h3 className="text-white text-xl font-medium">{active.title}</h3>

        <div className="mt-6 space-y-5">
          {active.passages.map((p) => (
            <Passage key={p.reference} passage={p} favorites={favorites} onFavorites={setFavorites} onNavigate={onNavigate} />
          ))}
        </div>

        <div className="mt-7">
          <span className="text-white/40 text-xs uppercase tracking-widest">À méditer</span>
          {active.meditations.map((m, i) => (
            <p key={i} className="text-white/70 text-sm leading-relaxed mt-1.5">
              {m}
            </p>
          ))}
        </div>

        <div className="mt-6">
          <span className="text-white/40 text-xs uppercase tracking-widest">Prière</span>
          {active.prayers.map((p, i) => (
            <p key={i} className="text-white/70 text-sm leading-relaxed mt-1.5">
              {p}
            </p>
          ))}
        </div>

        <div className="mt-6">
          <span className="text-white/40 text-xs uppercase tracking-widest">Pour y réfléchir</span>
          {active.reflectionQuestions.map((q, i) => (
            <p key={i} className="text-white/70 text-sm leading-relaxed mt-1.5">
              {q}
            </p>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
