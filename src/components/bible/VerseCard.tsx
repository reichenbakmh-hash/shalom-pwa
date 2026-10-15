import type { ReactNode } from 'react'
import HighlightedText from './HighlightedText'

interface Props {
  reference: string
  text: string
  terms?: string[]
  onOpen?: () => void
  actions?: ReactNode
  footer?: ReactNode
}

export default function VerseCard({ reference, text, terms, onOpen, actions, footer }: Props) {
  const body = terms && terms.length > 0 ? <HighlightedText text={text} terms={terms} /> : text
  return (
    <div className="surface rounded-2xl pl-4 pr-2 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-white/50 text-xs font-medium">{reference}</span>
        <div className="flex items-center -mr-0.5">{actions}</div>
      </div>
      {onOpen ? (
        <button type="button" onClick={onOpen} className="block w-full text-left pr-2 pb-1 mt-0.5">
          <span className="text-white/85 text-[15px] leading-relaxed">{body}</span>
        </button>
      ) : (
        <p className="text-white/85 text-[15px] leading-relaxed pr-2 pb-1 mt-0.5">{body}</p>
      )}
      {footer && <div className="pr-2 pb-1">{footer}</div>}
    </div>
  )
}
