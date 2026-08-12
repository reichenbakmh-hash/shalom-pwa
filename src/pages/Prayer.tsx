import { useState } from 'react'
import { Plus, Search, Check, X, Heart } from 'lucide-react'
import PageContainer from '../components/PageContainer'
import { storage, STORAGE_KEYS } from '../lib/storage'
import type { Prayer, PrayerCategory } from '../types'

const categories: PrayerCategory[] = [
  'Gratitude', 'Famille', 'Études', 'Travail', 'Projets', 'Relations', 'Difficultés', 'Espérance', 'Autre',
]

function uid() {
  return `pr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export default function PrayerPage() {
  const [prayers, setPrayers] = useState<Prayer[]>(() => storage.get<Prayer[]>(STORAGE_KEYS.prayers, []))
  const [showForm, setShowForm] = useState(false)
  const [query, setQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<PrayerCategory | 'Toutes'>('Toutes')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<PrayerCategory>('Gratitude')

  function persist(next: Prayer[]) {
    setPrayers(next)
    storage.set(STORAGE_KEYS.prayers, next)
  }

  function addPrayer() {
    if (!title.trim() || !content.trim()) return
    const newPrayer: Prayer = {
      id: uid(),
      title: title.trim(),
      content: content.trim(),
      category,
      createdAt: new Date().toISOString(),
      status: 'en_attente',
      favorite: false,
    }
    persist([newPrayer, ...prayers])
    setTitle('')
    setContent('')
    setShowForm(false)
  }

  function markAnswered(id: string) {
    const note = prompt('Note sur la réponse à cette prière (facultatif) :') ?? ''
    persist(prayers.map((p) => (p.id === id ? { ...p, status: 'reponse', answerNote: note || p.answerNote } : p)))
  }

  function toggleFavorite(id: string) {
    persist(prayers.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p)))
  }

  function remove(id: string) {
    persist(prayers.filter((p) => p.id !== id))
  }

  const filtered = prayers.filter(
    (p) =>
      (filterCategory === 'Toutes' || p.category === filterCategory) &&
      (p.title.toLowerCase().includes(query.toLowerCase()) || p.content.toLowerCase().includes(query.toLowerCase())),
  )

  return (
    <PageContainer title="Ma prière" subtitle="Déposez vos prières, suivez-les, et gardez trace des réponses.">
      <button
        onClick={() => setShowForm((s) => !s)}
        className="bg-white text-black text-sm font-medium px-4 py-2.5 rounded-full hover:bg-white/90 transition-colors flex items-center gap-2 mb-6"
      >
        {showForm ? <X size={15} /> : <Plus size={15} />}
        {showForm ? 'Annuler' : 'Nouvelle prière'}
      </button>

      {showForm && (
        <div className="liquid-glass-panel rounded-2xl p-5 mb-6 space-y-3 animate-fadeIn">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre"
            className="w-full bg-white/5 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Écrivez votre prière…"
            rows={4}
            className="w-full bg-white/5 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none resize-none"
          />
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                  category === c ? 'bg-white text-black' : 'liquid-glass text-white/60'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <button
            onClick={addPrayer}
            className="bg-white text-black text-sm font-medium px-4 py-2 rounded-full hover:bg-white/90 transition-colors"
          >
            Enregistrer
          </button>
        </div>
      )}

      <div className="liquid-glass-panel rounded-xl flex items-center gap-2 px-4 py-2.5 mb-4">
        <Search size={15} className="text-white/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher dans mes prières…"
          className="bg-transparent outline-none text-sm text-white placeholder:text-white/30 w-full"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-6">
        {(['Toutes', ...categories] as const).map((c) => (
          <button
            key={c}
            onClick={() => setFilterCategory(c)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs transition-colors ${
              filterCategory === c ? 'bg-white/15 text-white' : 'liquid-glass text-white/50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-white/30 text-sm text-center py-10">Aucune prière pour l'instant. Écrivez la première.</p>
        )}
        {filtered.map((p) => (
          <div key={p.id} className="liquid-glass-panel rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-white text-sm font-medium">{p.title}</h4>
                  <span className="text-[10px] uppercase tracking-wide text-white/40 liquid-glass px-2 py-0.5 rounded-full">
                    {p.category}
                  </span>
                </div>
                <p className="text-white/60 text-xs mt-1">
                  {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <button onClick={() => toggleFavorite(p.id)} className={p.favorite ? 'text-white' : 'text-white/30'}>
                <Heart size={15} fill={p.favorite ? 'currentColor' : 'none'} />
              </button>
            </div>
            <p className="text-white/75 text-sm mt-3 leading-relaxed">{p.content}</p>

            <div className="flex items-center gap-2 mt-4">
              {p.status === 'en_attente' ? (
                <button
                  onClick={() => markAnswered(p.id)}
                  className="liquid-glass flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-white/70 hover:text-white transition-colors"
                >
                  <Check size={12} /> Marquer comme répondue
                </button>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white/15 text-white">
                  <Check size={12} /> Réponse reçue
                </span>
              )}
              <button
                onClick={() => remove(p.id)}
                className="text-white/30 hover:text-white/70 text-xs ml-auto transition-colors"
              >
                Supprimer
              </button>
            </div>
            {p.answerNote && (
              <p className="text-white/50 text-xs mt-2 italic border-t border-white/10 pt-2">
                Réponse : {p.answerNote}
              </p>
            )}
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
