import { useMemo, useState } from 'react'
import { Search, BookMarked, Heart } from 'lucide-react'
import PageContainer from '../components/PageContainer'
import { bibleBooks, getChapter } from '../data/bible-sample'
import { storage, STORAGE_KEYS } from '../lib/storage'
import type { FavoriteVerse } from '../types'

export default function Bible() {
  const [testament, setTestament] = useState<'ancien' | 'nouveau'>('nouveau')
  const [selectedBook, setSelectedBook] = useState(bibleBooks.find((b) => b.id === 'jn')!)
  const [chapterNumber, setChapterNumber] = useState(14)
  const [query, setQuery] = useState('')

  const filteredBooks = useMemo(
    () => bibleBooks.filter((b) => b.testament === testament && b.name.toLowerCase().includes(query.toLowerCase())),
    [testament, query],
  )

  const chapter = getChapter(selectedBook.id, chapterNumber)

  function saveFavorite(reference: string, text: string) {
    const current = storage.get<FavoriteVerse[]>(STORAGE_KEYS.favorites, [])
    if (current.some((f) => f.reference === reference)) return
    storage.set(STORAGE_KEYS.favorites, [
      ...current,
      { id: reference, reference, text, savedAt: new Date().toISOString() },
    ])
  }

  return (
    <PageContainer
      title="La Parole"
      subtitle="Lisez, recherchez et gardez trace de vos passages préférés."
    >
      <div className="liquid-glass-panel rounded-xl flex items-center gap-2 px-4 py-3 mb-6">
        <Search size={16} className="text-white/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un livre…"
          className="bg-transparent outline-none text-sm text-white placeholder:text-white/30 w-full"
        />
      </div>

      <div className="flex gap-2 mb-6">
        {(['nouveau', 'ancien'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTestament(t)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
              testament === t ? 'bg-white text-black' : 'liquid-glass text-white/70'
            }`}
          >
            {t === 'nouveau' ? 'Nouveau Testament' : 'Ancien Testament'}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
        {filteredBooks.map((b) => (
          <button
            key={b.id}
            onClick={() => {
              setSelectedBook(b)
              setChapterNumber(1)
            }}
            className={`shrink-0 px-3.5 py-2 rounded-lg text-sm transition-colors ${
              selectedBook.id === b.id ? 'bg-white/15 text-white' : 'liquid-glass text-white/60 hover:text-white'
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <BookMarked size={16} className="text-white/40" />
        <span className="text-white/60 text-sm">
          {selectedBook.name} — chapitre {chapterNumber} / {selectedBook.chapterCount}
        </span>
      </div>

      <div className="flex gap-1.5 flex-wrap mb-6">
        {Array.from({ length: Math.min(selectedBook.chapterCount, 30) }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => setChapterNumber(n)}
            className={`w-9 h-9 rounded-lg text-xs transition-colors ${
              chapterNumber === n ? 'bg-white text-black' : 'liquid-glass text-white/50 hover:text-white'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="liquid-glass-panel rounded-2xl p-6">
        {chapter ? (
          <div className="space-y-4">
            {chapter.verses.map((v) => (
              <div key={v.id} className="flex gap-3 group">
                <span className="text-white/30 text-xs mt-1 w-5 shrink-0">{v.verse}</span>
                <p className="text-white/85 text-sm leading-relaxed flex-1">{v.text}</p>
                <button
                  onClick={() => saveFavorite(`${selectedBook.name} ${chapterNumber}:${v.verse}`, v.text)}
                  className="text-white/20 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Ajouter aux favoris"
                >
                  <Heart size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-white/40 text-sm text-center py-10">
            Ce chapitre n'est pas encore disponible dans cette version de démonstration.
            <br />
            La structure est prête pour accueillir une traduction complète sous licence.
          </div>
        )}
      </div>
    </PageContainer>
  )
}
