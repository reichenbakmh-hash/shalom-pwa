import { useEffect, useState } from 'react'
import { Folder, X } from 'lucide-react'

interface Props {
  title: string
  mode: 'save' | 'move'
  folders: string[]
  current?: string
  onPick: (folder: string | undefined) => void
  onClose: () => void
}

export default function SaveSheet({ title, mode, folders, current, onPick, onClose }: Props) {
  const [name, setName] = useState('')

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function createFolder() {
    const value = name.trim()
    if (value) onPick(value)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Fermer" className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-3xl mx-auto bg-night-900 border-t border-white/10 rounded-t-2xl p-5 pb-8 animate-fadeIn">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="text-white text-sm font-medium">{mode === 'save' ? 'Enregistrer' : 'Changer de dossier'}</div>
            <div className="text-white/50 text-xs mt-0.5 truncate">{title}</div>
          </div>
          <button type="button" onClick={onClose} className="text-white/50 hover:text-white p-1" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => onPick(undefined)}
          className="w-full bg-white text-black text-sm font-medium px-4 py-3 rounded-xl mb-5"
        >
          {mode === 'save' ? 'Enregistrer sans dossier' : 'Retirer du dossier'}
        </button>

        {folders.length > 0 && (
          <div className="mb-5">
            <div className="text-white/40 text-xs mb-2">Ranger dans un dossier</div>
            <div className="flex flex-wrap gap-2">
              {folders.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => onPick(f)}
                  className={`control flex items-center gap-1.5 px-3 py-2 rounded-full text-xs ${
                    f === current ? 'text-white border-white/40' : 'text-white/70'
                  }`}
                >
                  <Folder size={12} />
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="text-white/40 text-xs mb-2">Nouveau dossier</div>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') createFolder()
            }}
            maxLength={40}
            placeholder="Courage, Famille, À méditer…"
            className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30"
          />
          <button
            type="button"
            onClick={createFolder}
            disabled={!name.trim()}
            className="control text-white text-sm px-4 rounded-lg disabled:opacity-40"
          >
            Créer
          </button>
        </div>
      </div>
    </div>
  )
}
