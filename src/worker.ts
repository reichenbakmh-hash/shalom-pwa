// SHALOM — Worker Cloudflare (API)
// Sert de proxy sécurisé entre le frontend (Pages) et l'API Anthropic,
// et donne accès à D1 (env.DB) pour les futures routes de synchronisation.
//
// Déploiement :
//   npx wrangler secret put ANTHROPIC_API_KEY
//   npx wrangler deploy
//
// Le frontend (sur *.pages.dev) appelle ce Worker (sur *.workers.dev) en
// cross-origin : les en-têtes CORS ci-dessous l'autorisent.

export interface Env {
  DB: D1Database
  ANTHROPIC_API_KEY: string
  ENVIRONMENT?: string
  // Optionnel : restreindre le CORS à votre domaine Pages une fois connu,
  // ex. "https://shalom-pwa.pages.dev". Sinon "*" (moins strict).
  ALLOWED_ORIGIN?: string
}

type AIMode = 'comprendre' | 'mediter' | 'prier' | 'explorer' | 'etudier'

interface AIRequestBody {
  mode: AIMode
  prompt: string
  // Historique court optionnel pour donner du contexte au modèle
  history?: { role: 'user' | 'assistant'; content: string }[]
}

const SYSTEM_PROMPTS: Record<AIMode, string> = {
  comprendre:
    "Tu es Shalom AI, une assistante d'étude biblique chrétienne. Explique le passage demandé de façon claire et structurée : Texte biblique (référence uniquement, ne cite pas de traduction sous licence mot pour mot au-delà de quelques mots) · Contexte historique · Interprétation · Suggestion de réflexion. Tu n'es jamais une autorité spirituelle, tu encourages toujours le discernement personnel, la prière et l'accompagnement d'une communauté de foi. Réponds en français, avec bienveillance et humilité.",
  mediter:
    "Tu es Shalom AI. Propose des questions de méditation profondes et personnelles autour du thème ou du passage donné, pour aider la personne à réfléchir et prier. Réponds en français, ton chaleureux et posé, jamais dogmatique.",
  prier:
    "Tu es Shalom AI. Aide à structurer une prière (louange, confession, gratitude, intercession, demande) autour du sujet donné, sans jamais prétendre parler au nom de Dieu. Réponds en français.",
  explorer:
    "Tu es Shalom AI. Suggère des passages bibliques liés au thème donné (références uniquement, pas de citations longues), avec une courte explication du lien thématique. Réponds en français.",
  etudier:
    "Tu es Shalom AI. Donne le contexte historique, culturel et littéraire du passage ou du thème donné, dans un style pédagogique. Réponds en français.",
}

function corsHeaders(origin: string | null, env: Env): HeadersInit {
  const allowed = env.ALLOWED_ORIGIN || '*'
  return {
    'Access-Control-Allow-Origin': allowed === '*' ? '*' : allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

function json(data: unknown, init: ResponseInit = {}, cors: HeadersInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...cors, ...(init.headers || {}) },
  })
}

async function handleAI(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  let body: AIRequestBody
  try {
    body = await request.json()
  } catch {
    return json({ error: 'JSON invalide' }, { status: 400 }, cors)
  }

  const { mode, prompt, history = [] } = body
  if (!mode || !SYSTEM_PROMPTS[mode]) {
    return json({ error: 'mode invalide' }, { status: 400 }, cors)
  }
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return json({ error: 'prompt requis' }, { status: 400 }, cors)
  }

  const messages = [
    ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: prompt },
  ]

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPTS[mode],
      messages,
    }),
  })

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text()
    console.error('Anthropic API error:', errText)
    return json({ error: "Erreur lors de l'appel au modèle" }, { status: 502 }, cors)
  }

  const data = await anthropicRes.json<{ content: { type: string; text?: string }[] }>()
  const answer = data.content
    .filter((b) => b.type === 'text' && b.text)
    .map((b) => b.text)
    .join('\n')

  // TODO (une fois l'authentification en place) : journaliser dans ai_conversations
  // via env.DB.prepare("INSERT INTO ai_conversations (id, user_id, mode, role, content) VALUES (?,?,?,?,?)")
  // pour le message utilisateur ET la réponse.

  return json({ content: answer }, {}, cors)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin')
    const cors = corsHeaders(origin, env)

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors })
    }

    if (url.pathname === '/api/health') {
      return json({ status: 'ok', environment: env.ENVIRONMENT || 'unknown' }, {}, cors)
    }

    if (url.pathname === '/api/ai' && request.method === 'POST') {
      return handleAI(request, env, cors)
    }

    return json({ error: 'Route introuvable' }, { status: 404 }, cors)
  },
}
