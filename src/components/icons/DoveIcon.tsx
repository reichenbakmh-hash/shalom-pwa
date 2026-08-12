interface Props {
  size?: number
  strokeWidth?: number
  className?: string
}

export default function DoveIcon({ size = 22, strokeWidth = 1.5, className }: Props) {
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
      <path d="M3 12c2.5-1.5 5-1.8 7 .3 1-2.8 3.6-4.8 6.5-4.8-1 1.4-1.3 2.6-1 3.8 2.6.2 4.7 1.6 5.5 3.2-2.6.6-5-.1-6.6-1.6.2 2.2-.6 4.1-2.4 5.6-.4-1.7-1.4-2.9-2.9-3.6C7.7 16.2 5.1 15 3 12Z" />
      <circle cx="8.6" cy="10.4" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}
