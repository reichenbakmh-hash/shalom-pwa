import type { BibleIntentInput, ViewId } from '../types'
import { navItems } from './Navbar'

interface Props {
  current: ViewId
  onNavigate: (id: ViewId, intent?: BibleIntentInput) => void
}

const extraItems: { id: ViewId; label: string }[] = [
  { id: 'journal', label: 'Mon journal' },
  { id: 'explore', label: 'Explorer' },
]

export default function MobileMenu({ current, onNavigate }: Props) {
  return (
    <div className="absolute top-[72px] left-4 right-4 z-30 md:hidden bg-night-900 border border-white/10 shadow-lg shadow-black/50 rounded-2xl p-3 flex flex-col gap-1 animate-fadeIn">
      {[...navItems, ...extraItems].map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id, item.id === 'bible' ? { tab: 'lire' } : undefined)}
          className={`flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm transition-colors ${
            current === item.id ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
