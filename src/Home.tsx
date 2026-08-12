import { BookOpen, HeartHandshake, Sparkles, Route } from 'lucide-react'
import Hero from '../components/Hero'
import DailyVerseCard from '../components/DailyVerseCard'
import type { ViewId } from '../types'

interface Props {
  onNavigate: (id: ViewId) => void
}

const quickLinks: { id: ViewId; label: string; icon: typeof BookOpen; desc: string }[] = [
  { id: 'bible', label: 'La Parole', icon: BookOpen, desc: 'Lire et rechercher la Bible' },
  { id: 'prayer', label: 'Prière', icon: HeartHandshake, desc: 'Écrire et suivre vos prières' },
  { id: 'meditation', label: 'Méditation', icon: Sparkles, desc: 'Un temps de silence guidé' },
  { id: 'journey', label: '40 jours', icon: Route, desc: 'Parcourir les Évangiles' },
]

export default function Home({ onNavigate }: Props) {
  return (
    <div>
      <Hero onNavigate={onNavigate} />

      <section className="px-5 sm:px-8 py-16 sm:py-24 max-w-5xl mx-auto">
        <div className="flex justify-center mb-16">
          <DailyVerseCard onNavigate={onNavigate} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickLinks.map(({ id, label, icon: Icon, desc }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className="liquid-glass-panel rounded-2xl p-5 text-left hover:bg-white/[0.06] transition-colors"
            >
              <Icon size={18} className="text-white/70 mb-3" strokeWidth={1.5} />
              <div className="text-white text-sm font-medium">{label}</div>
              <div className="text-white/40 text-xs mt-1">{desc}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
