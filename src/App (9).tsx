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
import AIChat from './pages/AIChat'
import Profile from './pages/Profile'
import type { ViewId } from './types'

export default function App() {
  const [view, setView] = useState<ViewId>('home')
  const [menuOpen, setMenuOpen] = useState(false)

  function navigate(id: ViewId) {
    setView(id)
    setMenuOpen(false)
  }

  return (
    <div className="relative w-full min-h-screen bg-night-950">
      <Navbar current={view} onNavigate={navigate} menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((m) => !m)} />
      {menuOpen && <MobileMenu current={view} onNavigate={navigate} />}

      {view === 'home' && <Home onNavigate={navigate} />}
      {view === 'bible' && <Bible />}
      {view === 'prayer' && <PrayerPage />}
      {view === 'meditation' && <Meditation />}
      {view === 'journey' && <Journey />}
      {view === 'journal' && <JournalPage />}
      {view === 'explore' && <Explore />}
      {view === 'ai' && <AIChat />}
      {view === 'profile' && <Profile />}
    </div>
  )
}
