import { useState } from 'react'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import PageContainer from '../components/PageContainer'
import { journey40 } from '../data/journey40'
import { storage, STORAGE_KEYS } from '../lib/storage'
import type { JourneyProgress } from '../types'

export default function Journey() {
  const [progress, setProgress] = useState<JourneyProgress>(() =>
    storage.get<JourneyProgress>(STORAGE_KEYS.journeyProgress, { completedDays: [] }),
  )
  const firstIncomplete = journey40.findIndex((d) => !progress.completedDays.includes(d.day))
  const [dayIndex, setDayIndex] = useState(firstIncomplete === -1 ? 0 : firstIncomplete)

  const current = journey40[dayIndex]
  const isDone = progress.completedDays.includes(current.day)

  function completeDay() {
    if (isDone) return
    const next: JourneyProgress = {
      completedDays: [...progress.completedDays, current.day],
      lastCompletedAt: new Date().toISOString(),
    }
    storage.set(STORAGE_KEYS.journeyProgress, next)
    setProgress(next)
    if (dayIndex < journey40.length - 1) setDayIndex(dayIndex + 1)
  }

  return (
    <PageContainer title="40 jours avec les Évangiles" subtitle="Un jour à la fois, à votre rythme.">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/50 text-xs">
          {progress.completedDays.length} / {journey40.length} jours complétés
        </span>
        <span className="text-white/50 text-xs">Jour {current.day} / 40</span>
      </div>
      <div className="w-full h-1 bg-white/10 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-white/70 transition-all duration-500"
          style={{ width: `${(progress.completedDays.length / journey40.length) * 100}%` }}
        />
      </div>

      <div className="liquid-glass-panel rounded-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setDayIndex((i) => Math.max(0, i - 1))}
            disabled={dayIndex === 0}
            className="text-white/40 hover:text-white disabled:opacity-20 transition-colors"
            aria-label="Jour précédent"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-white/40 text-xs uppercase tracking-widest">Jour {current.day}</span>
          <button
            onClick={() => setDayIndex((i) => Math.min(journey40.length - 1, i + 1))}
            disabled={dayIndex === journey40.length - 1}
            className="text-white/40 hover:text-white disabled:opacity-20 transition-colors"
            aria-label="Jour suivant"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <h3 className="text-white text-xl font-medium text-center">{current.title}</h3>
        <p className="text-white/50 text-sm text-center mt-1">{current.reference}</p>
        <p className="text-white/70 text-sm leading-relaxed mt-5">{current.passageSummary}</p>

        <div className="mt-6 space-y-5">
          <div>
            <span className="text-white/40 text-xs uppercase tracking-widest">Méditation</span>
            <p className="text-white/75 text-sm leading-relaxed mt-1.5">{current.meditation}</p>
          </div>
          <div>
            <span className="text-white/40 text-xs uppercase tracking-widest">Réflexion</span>
            <p className="text-white/75 text-sm leading-relaxed mt-1.5 italic">{current.reflectionQuestion}</p>
          </div>
          <div>
            <span className="text-white/40 text-xs uppercase tracking-widest">Prière</span>
            <p className="text-white/75 text-sm leading-relaxed mt-1.5">{current.prayer}</p>
          </div>
          <div>
            <span className="text-white/40 text-xs uppercase tracking-widest">Action du jour</span>
            <p className="text-white/75 text-sm leading-relaxed mt-1.5">{current.action}</p>
          </div>
        </div>

        <button
          onClick={completeDay}
          disabled={isDone}
          className={`w-full mt-8 flex items-center justify-center gap-2 text-sm font-medium px-5 py-3 rounded-full transition-colors ${
            isDone ? 'bg-white/10 text-white/40' : 'bg-white text-black hover:bg-white/90'
          }`}
        >
          <Check size={15} /> {isDone ? 'Journée terminée' : 'Terminer cette journée'}
        </button>
      </div>
    </PageContainer>
  )
}
