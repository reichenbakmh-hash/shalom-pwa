import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import PageContainer from '../components/PageContainer'
import { storage, STORAGE_KEYS } from '../lib/storage'
import type { JournalEntry } from '../types'

const categoryOptions = ['Pensée', 'Prière', 'Réflexion', 'Gratitude', 'Enseignement', 'Moment important']

function uid() {
  return `jr-${Date.now()}`
}

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>(() => storage.get<JournalEntry[]>(STORAGE_KEYS.journal, []))
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState(categoryOptions[0])
  const [tagsInput, setTagsInput] = useState('')

  function persist(next: JournalEntry[]) {
    setEntries(next)
    storage.set(STORAGE_KEYS.journal, next)
  }

  function addEntry() {
    if (!title.trim() || !content.trim()) return
    const entry: JournalEntry = {
      id: uid(),
      title: title.trim(),
      content: content.trim(),
      category,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
    }
    persist([entry, ...entries])
    setTitle('')
    setContent('')
    setTagsInput('')
    setShowForm(false)
  }

  function remove(id: string) {
    persist(entries.filter((e) => e.id !== id))
  }

  return (
    <PageContainer title="Mon journal" subtitle="Vos pensées, prières et gratitudes, gardées au fil du temps.">
      <button
        onClick={() => setShowForm((s) => !s)}
        className="bg-white text-black text-sm font-medium px-4 py-2.5 rounded-full hover:bg-white/90 transition-colors flex items-center gap-2 mb-6"
      >
        {showForm ? <X size={15} /> : <Plus size={15} />}
        {showForm ? 'Annuler' : 'Nouvelle entrée'}
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
            placeholder="Écrivez ici…"
            rows={5}
            className="w-full bg-white/5 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none resize-none"
          />
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="Tags séparés par des virgules"
            className="w-full bg-white/5 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none"
          />
          <div className="flex flex-wrap gap-1.5">
            {categoryOptions.map((c) => (
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
            onClick={addEntry}
            className="bg-white text-black text-sm font-medium px-4 py-2 rounded-full hover:bg-white/90 transition-colors"
          >
            Enregistrer
          </button>
        </div>
      )}

      <div className="space-y-3">
        {entries.length === 0 && (
          <p className="text-white/30 text-sm text-center py-10">Votre journal est vide. Écrivez votre première entrée.</p>
        )}
        {entries.map((e) => (
          <div key={e.id} className="liquid-glass-panel rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-white text-sm font-medium">{e.title}</h4>
                <p className="text-white/40 text-xs mt-1">
                  {new Date(e.createdAt).toLocaleDateString('fr-FR')} · {e.category}
                </p>
              </div>
              <button onClick={() => remove(e.id)} className="text-white/25 hover:text-white/60 text-xs shrink-0">
                Supprimer
              </button>
            </div>
            <p className="text-white/75 text-sm mt-3 leading-relaxed whitespace-pre-wrap">{e.content}</p>
            {e.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {e.tags.map((t) => (
                  <span key={t} className="text-[10px] text-white/40 liquid-glass px-2 py-0.5 rounded-full">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
