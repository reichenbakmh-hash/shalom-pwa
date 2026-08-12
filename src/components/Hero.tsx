import type { ViewId } from '../types'

const BG_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzzbokvigwjottwixh07lwa1p/hf_20260511_230229_7c9bc431-46cf-489a-948d-e8144d8eb5d4.mp4'
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1508672019048-805c876b67e2?q=80&w=1600&auto=format&fit=crop'

interface Props {
  onNavigate: (id: ViewId) => void
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
      {/* voile pour lisibilité + cohérence "nuit / lumière" */}
      <div className="absolute inset-0 bg-gradient-to-t from-night-950/80 via-night-950/20 to-night-950/40" />

      <div className="absolute bottom-0 left-0 z-20 px-6 sm:px-12 pb-10 sm:pb-16 max-w-2xl">
        <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-medium leading-tight tracking-tight mb-4">
          Marche dans la foi, demeure dans la grâce.
        </h1>
        <p className="text-white/60 text-sm leading-relaxed mb-7 max-w-md">
          Une expérience quotidienne pour méditer la Parole, nourrir votre foi, approfondir votre
          relation avec Dieu et avancer avec espérance.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('journey')}
            className="bg-white text-black text-sm sm:text-base font-medium px-6 sm:px-7 py-3 rounded-full hover:bg-white/90 transition-colors"
          >
            Commencer
          </button>
          <button
            onClick={() => onNavigate('bible')}
            className="liquid-glass text-white text-sm sm:text-base font-medium px-6 sm:px-7 py-3 rounded-full hover:bg-white/5 transition-colors"
          >
            Explorer la Parole
          </button>
        </div>
      </div>
    </div>
  )
}
