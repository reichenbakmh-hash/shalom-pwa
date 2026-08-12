import { useEffect, useRef, useState } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import PageContainer from '../components/PageContainer'
import { getVerseForDate } from '../data/dailyVerses'
import { storage, STORAGE_KEYS } from '../lib/storage'
import type { MeditationSession } from '../types'

const durations = [3, 5, 10, 15]

function uid() {
  return `med-${Date.now()}`
}

export default function Meditation() {
  const verse = getVerseForDate()
  const [duration, setDuration] = useState(5)
  const [secondsLeft, setSecondsLeft] = useState(duration * 60)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [reflection, setReflection] = useState('')
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    setSecondsLeft(duration * 60)
    setFinished(false)
    setRunning(false)
  }, [duration])

  useEffect(() => {
    if (running) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            window.clearInterval(intervalRef.current!)
            setRunning(false)
            setFinished(true)
            return 0
          }
          return s - 1
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
  }, [running])

  function reset() {
    setRunning(false)
    setFinished(false)
    setSecondsLeft(duration * 60)
  }

  function saveSession() {
    const sessions = storage.get<MeditationSession[]>(STORAGE_KEYS.meditationSessions, [])
    const session: MeditationSession = {
      id: uid(),
      themeId: verse.reference,
      durationMinutes: duration,
      reflection: reflection.trim() || undefined,
      completedAt: new Date().toISOString(),
    }
    storage.set(STORAGE_KEYS.meditationSessions, [session, ...sessions])
    setReflection('')
    reset()
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')
  const progress = 1 - secondsLeft / (duration * 60)

  return (
    <PageContainer title="Méditation" subtitle="Un espace de silence pour laisser la Parole s'enraciner.">
      <div className="liquid-glass-panel rounded-2xl p-6 sm:p-8 text-center">
        <span className="text-white/40 text-xs uppercase tracking-widest">{verse.reference}</span>
        <p className="text-white/80 text-sm leading-relaxed mt-3 max-w-md mx-auto">{verse.text}</p>

        <div className="flex justify-center gap-2 my-8">
          {durations.map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`px-3.5 py-2 rounded-full text-xs transition-colors ${
                duration === d ? 'bg-white text-black' : 'liquid-glass text-white/60'
              }`}
            >
              {d} min
            </button>
          ))}
        </div>

        <div className="relative w-44 h-44 mx-auto mb-8">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 46}
              strokeDashoffset={2 * Math.PI * 46 * (1 - progress)}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-white text-3xl font-light tabular-nums">
            {mm}:{ss}
          </div>
        </div>

        {!finished ? (
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setRunning((r) => !r)}
              className="bg-white text-black w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/90 transition-colors"
              aria-label={running ? 'Mettre en pause' : 'Démarrer'}
            >
              {running ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>
            <button
              onClick={reset}
              className="liquid-glass text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors"
              aria-label="Réinitialiser"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        ) : (
          <div className="text-left animate-fadeIn">
            <p className="text-white/70 text-sm text-center mb-4">
              Qu'est-ce que cette Parole fait naître en toi aujourd'hui ?
            </p>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Écris librement…"
              rows={4}
              className="w-full bg-white/5 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none resize-none mb-4"
            />
            <div className="flex justify-center gap-2">
              <button
                onClick={saveSession}
                className="bg-white text-black text-sm font-medium px-5 py-2.5 rounded-full hover:bg-white/90 transition-colors"
              >
                Enregistrer la session
              </button>
              <button onClick={reset} className="liquid-glass text-white text-sm px-5 py-2.5 rounded-full">
                Recommencer
              </button>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
