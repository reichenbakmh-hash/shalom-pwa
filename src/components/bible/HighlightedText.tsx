import { useMemo } from 'react'
import { highlightSegments } from '../../lib/bibleSearch'

interface Props {
  text: string
  terms: string[]
}

export default function HighlightedText({ text, terms }: Props) {
  const segments = useMemo(() => highlightSegments(text, terms), [text, terms])
  return (
    <>
      {segments.map((s, i) => (s.match ? <mark key={i}>{s.text}</mark> : <span key={i}>{s.text}</span>))}
    </>
  )
}
