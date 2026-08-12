import { useState } from 'react'
import { Send, BookOpen, Sparkles, HeartHandshake, Compass, GraduationCap } from 'lucide-react'
import PageContainer from '../components/PageContainer'
import { storage, STORAGE_KEYS } from '../lib/storage'
import type { AIMessage } from '../types'

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

// Réponse de démonstration côté front — à remplacer par un appel au Worker
// Cloudflare (POST /api/ai) qui interroge le modèle et journalise dans
// la table `ai_conversations`. La clé API ne doit jamais être exposée ici.
function buildDemoAnswer(mode: AIMessage['mode'], prompt: string): string {
  const base =
    "Ceci est un aperçu de démonstration. Une fois connectée au backend, Shalom AI répondra ici en distinguant clairement : Texte biblique · Contexte historique · Interprétation · Suggestion de réflexion."
  const byMode: Record<AIMessage['mode'], string> = {
    comprendre: `Sur « ${prompt} » : ${base}`,
    mediter: `Quelques questions pour méditer « ${prompt} » suivront ici. ${base}`,
    prier: `Une structure de prière autour de « ${prompt} » s'affichera ici. ${base}`,
    explorer: `Des passages liés au thème « ${prompt} » apparaîtront ici. ${base}`,
    etudier: `Contexte historique et culturel de « ${prompt} » à venir ici. ${base}`,
  }
  return byMode[mode]
}

export default function AIChat() {
  const [mode, setMode] = useState<AIMessage['mode']>('comprendre')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<AIMessage[]>(() =>
    storage.get<AIMessage[]>(STORAGE_KEYS.aiConversation, []),
  )

  function persist(next: AIMessage[]) {
    setMessages(next)
    storage.set(STORAGE_KEYS.aiConversation, next)
  }

  function send() {
    if (!input.trim()) return
    const userMsg: AIMessage = { id: uid(), role: 'user', mode, content: input.trim(), createdAt: new Date().toISOString() }
    const answer: AIMessage = {
      id: uid() + '-a',
      role: 'assistant',
      mode,
      content: buildDemoAnswer(mode, input.trim()),
      createdAt: new Date().toISOString(),
    }
    persist([...messages, userMsg, answer])
    setInput('')
  }

  return (
    <PageContainer
      title="Shalom AI"
      subtitle="Une assistante d'étude et de réflexion chrétienne — jamais une autorité spirituelle."
    >
      <div className="liquid-glass-panel rounded-xl p-3 mb-4 text-white/50 text-xs leading-relaxed">
        Shalom AI aide à comprendre, méditer, prier, explorer et étudier la Parole. Elle ne remplace ni le
        discernement personnel, ni la prière, ni l'accompagnement d'une communauté de foi, et ne présente
        jamais ses réponses comme une parole divine.
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
      </div>

      <div className="liquid-glass-panel rounded-xl flex items-center gap-2 p-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={`Posez une question à Shalom AI (mode : ${modes.find((m) => m.id === mode)?.label})…`}
          className="bg-transparent outline-none text-sm text-white placeholder:text-white/30 w-full px-2"
        />
        <button
          onClick={send}
          className="bg-white text-black w-9 h-9 rounded-full flex items-center justify-center shrink-0 hover:bg-white/90 transition-colors"
          aria-label="Envoyer"
        >
          <Send size={14} />
        </button>
      </div>
    </PageContainer>
  )
}
