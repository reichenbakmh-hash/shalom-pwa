import { useState } from 'react'
import { Bell } from 'lucide-react'
import PageContainer from '../components/PageContainer'
import { storage, STORAGE_KEYS } from '../lib/storage'
import type {
  JourneyProgress,
  Prayer,
  JournalEntry,
  MeditationSession,
  FavoriteVerse,
  NotificationSettings,
} from '../types'

const defaultNotifications: NotificationSettings = {
  dailyVerse: { enabled: true, time: '07:00' },
  reading: { enabled: true, time: '07:15' },
  prayer: { enabled: false, time: '12:00' },
  meditation: { enabled: false, time: '20:00' },
  journey: { enabled: true, time: '07:30' },
}

const labels: Record<keyof NotificationSettings, string> = {
  dailyVerse: 'Verset du jour',
  reading: 'Lecture quotidienne',
  prayer: 'Rappel de prière',
  meditation: 'Rappel de méditation',
  journey: 'Parcours 40 jours',
}

export default function Profile() {
  const journeyProgress = storage.get<JourneyProgress>(STORAGE_KEYS.journeyProgress, { completedDays: [] })
  const prayers = storage.get<Prayer[]>(STORAGE_KEYS.prayers, [])
  const journal = storage.get<JournalEntry[]>(STORAGE_KEYS.journal, [])
  const meditations = storage.get<MeditationSession[]>(STORAGE_KEYS.meditationSessions, [])
  const favorites = storage.get<FavoriteVerse[]>(STORAGE_KEYS.favorites, [])

  const [notif, setNotif] = useState<NotificationSettings>(() =>
    storage.get<NotificationSettings>(STORAGE_KEYS.notificationSettings, defaultNotifications),
  )

  function updateNotif(key: keyof NotificationSettings, patch: Partial<NotificationSettings[typeof key]>) {
    const next = { ...notif, [key]: { ...notif[key], ...patch } }
    setNotif(next)
    storage.set(STORAGE_KEYS.notificationSettings, next)
  }

  const stats = [
    { label: 'Jours du parcours', value: journeyProgress.completedDays.length },
    { label: 'Prières', value: prayers.length },
    { label: 'Méditations', value: meditations.length },
    { label: 'Entrées de journal', value: journal.length },
    { label: 'Versets favoris', value: favorites.length },
    { label: 'Prières répondues', value: prayers.filter((p) => p.status === 'reponse').length },
  ]

  return (
    <PageContainer title="Mon chemin" subtitle="Un aperçu de votre parcours spirituel.">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="liquid-glass-panel rounded-xl p-4 text-center">
            <div className="text-white text-2xl font-light">{s.value}</div>
            <div className="text-white/40 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {favorites.length > 0 && (
        <div className="mb-10">
          <h3 className="text-white/60 text-xs uppercase tracking-widest mb-3">Versets favoris</h3>
          <div className="space-y-2">
            {favorites.slice(0, 5).map((f) => (
              <div key={f.id} className="liquid-glass-panel rounded-xl p-4">
                <span className="text-white/40 text-xs">{f.reference}</span>
                <p className="text-white/75 text-sm mt-1">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Bell size={14} className="text-white/50" />
          <h3 className="text-white/60 text-xs uppercase tracking-widest">Notifications</h3>
        </div>
        <div className="liquid-glass-panel rounded-2xl divide-y divide-white/10">
          {(Object.keys(labels) as (keyof NotificationSettings)[]).map((key) => (
            <div key={key} className="flex items-center justify-between gap-3 p-4">
              <div>
                <div className="text-white text-sm">{labels[key]}</div>
                {notif[key].enabled && (
                  <input
                    type="time"
                    value={notif[key].time}
                    onChange={(e) => updateNotif(key, { time: e.target.value })}
                    className="bg-white/5 text-white/60 text-xs rounded-md px-2 py-1 mt-1.5 outline-none"
                  />
                )}
              </div>
              <button
                role="switch"
                aria-checked={notif[key].enabled}
                onClick={() => updateNotif(key, { enabled: !notif[key].enabled })}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                  notif[key].enabled ? 'bg-white' : 'bg-white/15'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-night-950 transition-transform ${
                    notif[key].enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
