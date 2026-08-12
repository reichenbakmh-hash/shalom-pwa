import { Menu, X } from 'lucide-react'
import CrossIcon from './icons/CrossIcon'
import type { ViewId } from '../types'

interface NavItem {
  id: ViewId
  label: string
}

export const navItems: NavItem[] = [
  { id: 'home', label: 'Accueil' },
  { id: 'bible', label: 'La Parole' },
  { id: 'prayer', label: 'Prière' },
  { id: 'meditation', label: 'Méditation' },
  { id: 'journey', label: 'Parcours' },
  { id: 'profile', label: 'Profil' },
]

interface Props {
  current: ViewId
  onNavigate: (id: ViewId) => void
  menuOpen: boolean
  onToggleMenu: () => void
}

export default function Navbar({ current, onNavigate, menuOpen, onToggleMenu }: Props) {
  return (
    <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 sm:px-8 py-5">
      <button
        className="flex items-center gap-2 text-white font-medium text-base"
        onClick={() => onNavigate('home')}
        aria-label="Retour à l'accueil"
      >
        <CrossIcon size={20} strokeWidth={1.4} />
        <span>SHALOM</span>
      </button>

      <nav className="liquid-glass hidden md:flex items-center gap-1 rounded-xl px-2 py-2" aria-label="Navigation principale">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              current === item.id ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white'
            }`}
            aria-current={current === item.id ? 'page' : undefined}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="hidden md:flex items-center gap-3">
        <button
          onClick={() => onNavigate('ai')}
          className="liquid-glass text-white text-sm font-medium px-4 py-2.5 rounded-full hover:bg-white/5 transition-colors"
        >
          Shalom AI
        </button>
        <button
          onClick={() => onNavigate('journal')}
          className="bg-white text-black text-sm font-medium px-4 py-2.5 rounded-full hover:bg-white/90 transition-colors"
        >
          Mon journal
        </button>
      </div>

      <button
        className="md:hidden liquid-glass text-white p-2 rounded-lg"
        aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        onClick={onToggleMenu}
      >
        {menuOpen ? <X size={18} /> : <Menu size={18} />}
      </button>
    </div>
  )
}
