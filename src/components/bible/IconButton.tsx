import type { ReactNode } from 'react'

interface Props {
  label: string
  onClick: () => void
  children: ReactNode
  disabled?: boolean
}

export default function IconButton({ label, onClick, children, disabled }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}
