interface Props {
  size?: number
  strokeWidth?: number
  className?: string
}

export default function CrossIcon({ size = 22, strokeWidth = 1.5, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="12" y1="2.5" x2="12" y2="21.5" />
      <line x1="6" y1="8" x2="18" y2="8" />
    </svg>
  )
}
