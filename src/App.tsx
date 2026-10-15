import { useState } from 'react'
import Navbar from './components/Navbar'
import MobileMenu from './components/MobileMenu'
import Home from './pages/Home'
import Bible from './pages/Bible'
import PrayerPage from './pages/Prayer'
import Meditation from './pages/Meditation'
import Journey from './pages/Journey'
import JournalPage from './pages/Journal'
import Explore from './pages/Explore'
import Profile from './pages/Profile'
import type { BibleIntent, BibleIntentInput, ViewId } from './types'

export default function App() {
  const [view, setView] = useState<ViewId>('home')
  const [menuOpen, setMenuOpen] = useState(false)
  const [bibleIntent, setBibleIntent] = useState<BibleIntent | null>(null)

  function navigate(id: ViewId, intent?: BibleIntentInput) {
    setBibleIntent(intent ? { ...intent, nonce: Date.now() } : null)
    setView(id)
    setMenuOpen(false)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="relative w-full min-h-screen bg-night-950">
      <Navbar current={view} onNavigate={navigate} menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((m) => !m)} />
      {menuOpen && <MobileMenu current={view} onNavigate={navigate} />}

      {view === 'home' && <Home onNavigate={navigate} />}
      {view === 'bible' && <Bible intent={bibleIntent} />}
      {view === 'prayer' && <PrayerPage />}
      {view === 'meditation' && <Meditation />}
      {view === 'journey' && <Journey onNavigate={navigate} />}
      {view === 'journal' && <JournalPage />}
      {view === 'explore' && <Explore onNavigate={navigate} />}
      {view === 'profile' && <Profile onNavigate={navigate} />}
    </div>
  )
}
