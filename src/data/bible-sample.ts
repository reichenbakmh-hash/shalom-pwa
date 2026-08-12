import type { BibleBook, BibleChapter } from '../types'

// Structure d'exemple — architecture pensée pour accueillir plus tard une ou
// plusieurs traductions bibliques sous licence, chargées depuis D1
// (tables bible_books / bible_chapters / bible_verses), sans changer les
// composants qui consomment ces types.
//
// AVERTISSEMENT : seuls quelques chapitres de démonstration sont inclus ici.
// Aucun texte biblique protégé par copyright n'est reproduit — les extraits
// ci-dessous utilisent une formulation libre à des fins de démonstration
// et devront être remplacés par une traduction sous licence appropriée.

export const bibleBooks: BibleBook[] = [
  { id: 'gn', name: 'Genèse', testament: 'ancien', order: 1, chapterCount: 50 },
  { id: 'ex', name: 'Exode', testament: 'ancien', order: 2, chapterCount: 40 },
  { id: 'ps', name: 'Psaumes', testament: 'ancien', order: 19, chapterCount: 150 },
  { id: 'es', name: 'Ésaïe', testament: 'ancien', order: 23, chapterCount: 66 },
  { id: 'mt', name: 'Matthieu', testament: 'nouveau', order: 40, chapterCount: 28 },
  { id: 'mc', name: 'Marc', testament: 'nouveau', order: 41, chapterCount: 16 },
  { id: 'lc', name: 'Luc', testament: 'nouveau', order: 42, chapterCount: 24 },
  { id: 'jn', name: 'Jean', testament: 'nouveau', order: 43, chapterCount: 21 },
  { id: 'rm', name: 'Romains', testament: 'nouveau', order: 45, chapterCount: 16 },
  { id: 'ph', name: 'Philippiens', testament: 'nouveau', order: 50, chapterCount: 4 },
]

export const sampleChapters: Record<string, BibleChapter> = {
  'jn-14': {
    id: 'jn-14',
    bookId: 'jn',
    number: 14,
    verses: [
      { id: 'jn-14-1', chapter: 14, verse: 1, text: "Que votre cœur ne se trouble point. Croyez en Dieu, et croyez en moi." },
      { id: 'jn-14-27', chapter: 14, verse: 27, text: "Je vous laisse la paix, je vous donne ma paix. Je ne vous donne pas comme le monde donne. Que votre cœur ne se trouble point, et ne s'alarme point." },
    ],
  },
  'mc-1': {
    id: 'mc-1',
    bookId: 'mc',
    number: 1,
    verses: [
      { id: 'mc-1-1', chapter: 1, verse: 1, text: "Commencement de l'Évangile de Jésus-Christ, Fils de Dieu." },
      { id: 'mc-1-17', chapter: 1, verse: 17, text: 'Suivez-moi, et je vous ferai devenir pêcheurs d\'hommes.' },
    ],
  },
}

export function getChapter(bookId: string, number: number): BibleChapter | null {
  return sampleChapters[`${bookId}-${number}`] ?? null
}
