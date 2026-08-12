import { useState } from 'react'
import PageContainer from '../components/PageContainer'
import { themes } from '../data/themes'

export default function Explore() {
  const [activeId, setActiveId] = useState(themes[0].id)
  const active = themes.find((t) => t.id === activeId)!

  return (
    <PageContainer title="Explorer" subtitle="Des passages, méditations et prières organisés par thème.">
      <div className="flex flex-wrap gap-1.5 mb-8">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveId(t.id)}
            className={`px-3.5 py-2 rounded-full text-xs transition-colors ${
              activeId === t.id ? 'bg-white text-black' : 'liquid-glass text-white/60 hover:text-white'
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      <div className="liquid-glass-panel rounded-2xl p-6 sm:p-8 animate-fadeIn" key={active.id}>
        <h3 className="text-white text-xl font-medium">{active.title}</h3>

        <div className="mt-6 space-y-4">
          {active.passages.map((p) => (
            <div key={p.reference}>
              <span className="text-white/40 text-xs uppercase tracking-widest">{p.reference}</span>
              <p className="text-white/75 text-sm leading-relaxed mt-1">{p.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <span className="text-white/40 text-xs uppercase tracking-widest">Méditation</span>
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
          <span className="text-white/40 text-xs uppercase tracking-widest">Question de réflexion</span>
          {active.reflectionQuestions.map((q, i) => (
            <p key={i} className="text-white/70 text-sm leading-relaxed mt-1.5 italic">
              {q}
            </p>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
