import { useCallback, useEffect, useRef, useState } from 'react'
import { CloudDownload, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react'
import {
  BibleError,
  downloadBible,
  getOfflineStatus,
  hasRemoteUpdate,
  loadManifest,
  type DownloadProgress,
  type OfflineStatus,
} from '../lib/bible'
import type { BibleManifest } from '../types'

interface Props {
  onChange: () => void
}

function formatMegabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export default function BibleOfflinePanel({ onChange }: Props) {
  const [status, setStatus] = useState<OfflineStatus | null>(null)
  const [manifest, setManifest] = useState<BibleManifest | null>(null)
  const [manifestChecked, setManifestChecked] = useState(false)
  const [progress, setProgress] = useState<DownloadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [online, setOnline] = useState(() => navigator.onLine)
  const controller = useRef<AbortController | null>(null)

  const refresh = useCallback(async () => {
    setStatus(await getOfflineStatus())
    setManifest(await loadManifest())
    setManifestChecked(true)
  }, [])

  useEffect(() => {
    void refresh()
    void hasRemoteUpdate().then(setUpdateAvailable)
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
      controller.current?.abort()
    }
  }, [refresh])

  async function start() {
    setError(null)
    const abort = new AbortController()
    controller.current = abort
    setProgress({ done: 0, total: 66, bytes: 0 })
    try {
      await downloadBible(setProgress, abort.signal)
      setUpdateAvailable(false)
      onChange()
    } catch (e) {
      if (!(e instanceof BibleError && e.code === 'aborted')) {
        setError(e instanceof BibleError ? e.message : 'Le téléchargement a échoué. Réessaie avec une connexion stable.')
      }
    } finally {
      controller.current = null
      setProgress(null)
      await refresh()
    }
  }

  const downloading = progress !== null
  const percent = progress ? Math.round((progress.done / progress.total) * 100) : 0
  const totalBytes = manifest ? manifest.books.reduce((sum, b) => sum + b.bytes, 0) : 0

  let title = 'Vérification…'
  let detail = ''
  if (status?.complete) {
    title = 'La Bible est sur ton téléphone'
    detail = `${manifest?.translationName ?? 'Louis Segond 1910'} : les ${status.total} livres se lisent sans connexion.`
  } else if (manifest?.verified) {
    title = 'Installe la Bible pour la lire sans connexion'
    detail = `${status?.installed ?? 0} livre(s) sur ${status?.total ?? 66} déjà sur l'appareil. Le téléchargement pèse environ ${formatMegabytes(totalBytes)}.`
  } else if (manifestChecked) {
    title = 'Le texte de la Bible n’est pas encore là'
    detail =
      'Les fichiers de la Louis Segond 1910 ne sont pas dans cette version de l’application. Prépare-les avec npm run bible:import (voir docs/BIBLE-SOURCE.md), puis recompile.'
  }

  return (
    <div className="surface rounded-2xl p-5 mb-6">
      <div className="flex items-start gap-3">
        {status?.complete ? (
          <CheckCircle2 size={18} className="text-emerald-300/80 mt-0.5 shrink-0" />
        ) : (
          <CloudDownload size={18} className="text-white/60 mt-0.5 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-white text-sm font-medium">{title}</div>
          <p className="text-white/50 text-xs mt-1 leading-relaxed">{detail}</p>
          {manifest && (
            <p className="text-white/30 text-[11px] mt-2">
              {manifest.translationName} — {manifest.license}
            </p>
          )}
        </div>
      </div>

      {progress && (
        <div className="mt-4">
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-white/70 transition-all" style={{ width: `${percent}%` }} />
          </div>
          <div className="flex justify-between text-white/50 text-xs mt-2">
            <span>
              {progress.done} / {progress.total} livres
            </span>
            <span>{formatMegabytes(progress.bytes)}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 mt-4 text-amber-200/90 text-xs">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {updateAvailable && !downloading && (
        <div className="flex items-center gap-2 mt-4 text-white/70 text-xs">
          <RefreshCw size={14} />
          <span>Une nouvelle version du texte est disponible.</span>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        {downloading ? (
          <button
            onClick={() => controller.current?.abort()}
            className="control text-white/80 text-xs font-medium px-4 py-2 rounded-full"
          >
            Annuler
          </button>
        ) : (
          manifest?.verified &&
          (!status?.complete || updateAvailable) && (
            <button
              onClick={() => void start()}
              disabled={!online}
              className="bg-white text-black text-xs font-medium px-4 py-2 rounded-full disabled:opacity-40"
            >
              {status?.complete
                ? 'Mettre à jour'
                : status && status.installed > 0
                  ? 'Reprendre le téléchargement'
                  : 'Télécharger la Bible'}
            </button>
          )
        )}
        {!online && !downloading && manifest?.verified && !status?.complete && (
          <span className="text-white/40 text-xs self-center">Il faut une connexion</span>
        )}
      </div>
    </div>
  )
}
