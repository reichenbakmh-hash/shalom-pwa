import { useState } from 'react'
import { Send, BookOpen, Sparkles, HeartHandshake, Compass, GraduationCap } from 'lucide-react'
import PageContainer from '../components/PageContainer'
import { storage, STORAGE_KEYS } from '../lib/storage'
import type { AIMessage } from '../types'

// Remplacez par l'URL de votre Worker une fois déployé
// (idéalement via une variable d'environnement Vite : import.meta.env.VITE_API_URL)
const API_URL = 'https://shalom-api.reichenbakmh.workers.dev/'

const modes: { id: AIMessage['mode']; label: string; icon: typeof BookOpen; hint: string }[] = [
  { id: 'comprendre', label: 'Comprendre', icon: BookOpen, hint: 'Expliquer un passage biblique' },
  { id: 'mediter', label: 'Méditer', icon: Sparkles, hint: 'Des questions de réflexion' },
  { id: 'prier', label: 'Prier', icon: HeartHandshake, hint: 'Structurer une prière' },
  { id: 'explorer', label: 'Explorer', icon: Compass, hint: 'Trouver des passages liés à un thème' },
  { id: 'etudier', label: 'Étudier', icon: GraduationCap, hint: 'Contexte historique et culturel' },
]

function uid() {
  return `ai-${Date.now()}`
}

async function fetchAIAnswer(
  mode: AIMessage['mode'],
  prompt: string,
  history: { role: 'user' | 'assistant'; content: string }[],
): Promise<string> {
  const res = await fetch(`${API_URL}/api/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, prompt, history }),
  })
  if (!res.ok) {
    throw new Error(`Erreur API (${res.status})`)
  }
  const data = (await res.json()) as { content: string }
  return data.content
}

export default function AIChat() {
  const [mode, setMode] = useState<AIMessage['mode']>('comprendre')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<AIMessage[]>(() =>
    storage.get<AIMessage[]>(STORAGE_KEYS.aiConversation, []),
  )

  function persist(next: AIMessage[]) {
    setMessages(next)
    storage.set(STORAGE_KEYS.aiConversation, next)
  }

  async function send() {
    const prompt = input.trim()
    if (!prompt || loading) return
    setError(null)

    const userMsg: AIMessage = { id: uid(), role: 'user', mode, content: prompt, createdAt: new Date().toISOString() }
    const withUser = [...messages, userMsg]
    persist(withUser)
    setInput('')
    setLoading(true)

    try {
      const history = withUser.slice(-10).map((m) => ({ role: m.role, content: m.content }))
      const answerText = await fetchAIAnswer(mode, prompt, history)
      const answer: AIMessage = {
        id: uid() + '-a',
        role: 'assistant',
        mode,
        content: answerText,
        createdAt: new Date().toISOString(),
      }
      persist([...withUser, answer])
    } catch (err) {
      console.error(err)
      setError("Impossible de contacter Shalom AI pour le moment. Réessayez dans un instant.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer
      title="Shalom AI"
      subtitle="Une assistante d'étude et de réflexion chrétienne — jamais une autorité spirituelle."
    >
      <div className="liquid-glass-panel rounded-xl p-3 mb-4 text-white/50 text-xs leading-relaxed">
        Shalom AI aide à comprendre, méditer, prier, explorer et étudier la Parole.
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4">
        {modes.map(({ id, label, icon: Icon, hint }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            title={hint}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs transition-colors ${
              mode === id ? 'bg-white text-black' : 'liquid-glass text-white/60 hover:text-white'
            }`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      <div className="space-y-3 mb-4 max-h-[50vh] overflow-y-auto pr-1">
        {messages.length === 0 && (
          <p className="text-white/30 text-sm text-center py-10">
            Posez une question pour commencer — par exemple « Que signifie Jean 14:27 ? »
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`liquid-glass-panel rounded-2xl p-4 text-sm leading-relaxed ${
              m.role === 'user' ? 'text-white/90' : 'text-white/70'
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="liquid-glass-panel rounded-2xl p-4 text-sm text-white/40 italic">
            Shalom AI réfléchit…
          </div>
        )}
        {error && (
          <div className="rounded-2xl p-4 text-sm text-red-300 bg-red-500/10">{error}</div>
        )}
      </div>

      <div className="liquid-glass-panel rounded-xl flex items-center gap-2 p-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={`Posez une question à Shalom AI (mode : ${modes.find((m) => m.id === mode)?.label})…`}
          className="bg-transparent outline-none text-sm text-white placeholder:text-white/30 w-full px-2"
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading}
          className="bg-white text-black w-9 h-9 rounded-full flex items-center justify-center shrink-0 hover:bg-white/90 transition-colors disabled:opacity-40"
          aria-label="Envoyer"
        >
          <Send size={14} />
        </button>
      </div>
    </PageContainer>
  )
}
