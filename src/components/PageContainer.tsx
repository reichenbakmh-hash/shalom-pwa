import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  children: ReactNode
}

export default function PageContainer({ title, subtitle, children }: Props) {
  return (
    <div className="min-h-screen w-full bg-night-950 relative">
      <div className="relative px-5 sm:px-8 pt-28 pb-24 max-w-3xl mx-auto animate-fadeIn">
        <h2 className="text-white text-2xl sm:text-3xl font-medium tracking-tight">{title}</h2>
        {subtitle && <p className="text-white/50 text-sm mt-2 max-w-lg">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </div>
  )
}
