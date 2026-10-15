import { BookMarked, BookOpen, HeartHandshake, Route, Search, Sparkles } from 'lucide-react'
import Hero from '../components/Hero'
import DailyVerseCard from '../components/DailyVerseCard'
import type { BibleIntentInput, ViewId } from '../types'

interface Props {
  onNavigate: (id: ViewId, intent?: BibleIntentInput) => void
}

interface QuickLink {
  label: string
  desc: string
  icon: typeof BookOpen
  go: (onNavigate: Props['onNavigate']) => void
}

const quickLinks: QuickLink[] = [
  { label: 'Lire', desc: 'Reprendre où tu t’es arrêté', icon: BookOpen, go: (n) => n('bible', { tab: 'lire' }) },
  { label: 'Chercher', desc: 'Un mot, une phrase, un verset', icon: Search, go: (n) => n('bible', { tab: 'chercher' }) },
  { label: 'Enregistrés', desc: 'Tes versets et tes notes', icon: BookMarked, go: (n) => n('bible', { tab: 'enregistres' }) },
  { label: 'Prière', desc: 'Écrire et suivre tes prières', icon: HeartHandshake, go: (n) => n('prayer') },
  { label: 'Méditation', desc: 'Quelques minutes de silence', icon: Sparkles, go: (n) => n('meditation') },
  { label: '40 jours', desc: 'Traverser les Évangiles', icon: Route, go: (n) => n('journey') },
]

export default function Home({ onNavigate }: Props) {
  return (
    <div>
      <Hero onNavigate={onNavigate} />

      <section className="px-5 sm:px-8 py-14 sm:py-24 max-w-5xl mx-auto">
        <div className="flex justify-center mb-14">
          <DailyVerseCard onNavigate={onNavigate} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {quickLinks.map(({ label, desc, icon: Icon, go }) => (
            <button
              key={label}
              type="button"
              onClick={() => go(onNavigate)}
              className="surface rounded-2xl p-5 text-left hover:bg-white/[0.07] transition-colors"
            >
              <Icon size={18} className="text-white/70 mb-3" strokeWidth={1.5} />
              <div className="text-white text-sm font-medium">{label}</div>
              <div className="text-white/45 text-xs mt-1">{desc}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
