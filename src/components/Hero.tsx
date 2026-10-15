import type { BibleIntentInput, ViewId } from '../types'

const BG_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzzbokvigwjottwixh07lwa1p/hf_20260511_230229_7c9bc431-46cf-489a-948d-e8144d8eb5d4.mp4'
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1508672019048-805c876b67e2?q=80&w=1600&auto=format&fit=crop'

interface Props {
  onNavigate: (id: ViewId, intent?: BibleIntentInput) => void
}

export default function Hero({ onNavigate }: Props) {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster={FALLBACK_IMAGE}
        src={BG_VIDEO}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-night-950/55" />

      <div className="absolute bottom-0 left-0 z-20 px-6 sm:px-12 pb-10 sm:pb-16 max-w-2xl">
        <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-medium leading-tight tracking-tight mb-4">
          Un moment avec la Parole, chaque jour.
        </h1>
        <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-7 max-w-md">
          Lis un passage, prie, note ce que tu retiens. Tout reste sur ton téléphone.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('journey')}
            className="bg-white text-black text-sm sm:text-base font-medium px-6 sm:px-7 py-3 rounded-full hover:bg-white/90 transition-colors"
          >
            Commencer le parcours
          </button>
          <button
            type="button"
            onClick={() => onNavigate('bible', { tab: 'lire' })}
            className="control text-white text-sm sm:text-base font-medium px-6 sm:px-7 py-3 rounded-full hover:bg-white/5 transition-colors"
          >
            Ouvrir la Bible
          </button>
        </div>
      </div>
    </div>
  )
}
