// SHALOM — Import de la Bible Louis Segond 1910 (domaine public) dans D1
// -----------------------------------------------------------------------
// Source : api.getbible.net, traduction "ls1910" (Louis Segond 1910, domaine public).
// Ce script tourne sur VOTRE machine (Node 18+, fetch natif) et génère des
// fichiers .sql que vous exécutez ensuite avec wrangler d1 execute.
//
// Usage :
//   node import-bible.mjs
//   -> écrit ./db/seed/00-books.sql, 01-<livre>.sql, 02-<livre>.sql, ...
//
// Puis, pour charger dans D1 (un fichier à la fois, dans l'ordre) :
//   for f in db/seed/*.sql; do
//     npx wrangler d1 execute shalom-db --remote --file="$f"
//   done
//
// IMPORTANT : la structure JSON exacte retournée par getbible.net peut varier
// selon la version de l'API. Ce script logue un échantillon de la première
// réponse avant de lancer l'import complet — vérifiez la sortie avant de
// laisser tourner les 66 livres. Si la structure diffère, ajustez la fonction
// extractChapters() ci-dessous en conséquence.

import { mkdir, writeFile } from 'node:fs/promises'

const TRANSLATION = 'ls1910'
const OUT_DIR = './db/seed'

// Canon des 66 livres protestants, dans l'ordre. `num` = numéro utilisé par
// l'API getbible.net (1 = Genèse ... 66 = Apocalypse, convention standard).
const BOOKS = [
  { num: 1, id: 'ge', name: 'Genèse', testament: 'ancien', chapters: 50 },
  { num: 2, id: 'exo', name: 'Exode', testament: 'ancien', chapters: 40 },
  { num: 3, id: 'lev', name: 'Lévitique', testament: 'ancien', chapters: 27 },
  { num: 4, id: 'nom', name: 'Nombres', testament: 'ancien', chapters: 36 },
  { num: 5, id: 'deu', name: 'Deutéronome', testament: 'ancien', chapters: 34 },
  { num: 6, id: 'jos', name: 'Josué', testament: 'ancien', chapters: 24 },
  { num: 7, id: 'jug', name: 'Juges', testament: 'ancien', chapters: 21 },
  { num: 8, id: 'rut', name: 'Ruth', testament: 'ancien', chapters: 4 },
  { num: 9, id: '1sa', name: '1 Samuel', testament: 'ancien', chapters: 31 },
  { num: 10, id: '2sa', name: '2 Samuel', testament: 'ancien', chapters: 24 },
  { num: 11, id: '1ro', name: '1 Rois', testament: 'ancien', chapters: 22 },
  { num: 12, id: '2ro', name: '2 Rois', testament: 'ancien', chapters: 25 },
  { num: 13, id: '1ch', name: '1 Chroniques', testament: 'ancien', chapters: 29 },
  { num: 14, id: '2ch', name: '2 Chroniques', testament: 'ancien', chapters: 36 },
  { num: 15, id: 'esd', name: 'Esdras', testament: 'ancien', chapters: 10 },
  { num: 16, id: 'neh', name: 'Néhémie', testament: 'ancien', chapters: 13 },
  { num: 17, id: 'est', name: 'Esther', testament: 'ancien', chapters: 10 },
  { num: 18, id: 'job', name: 'Job', testament: 'ancien', chapters: 42 },
  { num: 19, id: 'psa', name: 'Psaumes', testament: 'ancien', chapters: 150 },
  { num: 20, id: 'pro', name: 'Proverbes', testament: 'ancien', chapters: 31 },
  { num: 21, id: 'ecc', name: 'Ecclésiaste', testament: 'ancien', chapters: 12 },
  { num: 22, id: 'can', name: 'Cantique des cantiques', testament: 'ancien', chapters: 8 },
  { num: 23, id: 'esa', name: 'Ésaïe', testament: 'ancien', chapters: 66 },
  { num: 24, id: 'jer', name: 'Jérémie', testament: 'ancien', chapters: 52 },
  { num: 25, id: 'lam', name: 'Lamentations', testament: 'ancien', chapters: 5 },
  { num: 26, id: 'eze', name: 'Ézéchiel', testament: 'ancien', chapters: 48 },
  { num: 27, id: 'dan', name: 'Daniel', testament: 'ancien', chapters: 12 },
  { num: 28, id: 'ose', name: 'Osée', testament: 'ancien', chapters: 14 },
  { num: 29, id: 'joe', name: 'Joël', testament: 'ancien', chapters: 3 },
  { num: 30, id: 'amo', name: 'Amos', testament: 'ancien', chapters: 9 },
  { num: 31, id: 'abd', name: 'Abdias', testament: 'ancien', chapters: 1 },
  { num: 32, id: 'jon', name: 'Jonas', testament: 'ancien', chapters: 4 },
  { num: 33, id: 'mic', name: 'Michée', testament: 'ancien', chapters: 7 },
  { num: 34, id: 'nah', name: 'Nahum', testament: 'ancien', chapters: 3 },
  { num: 35, id: 'hab', name: 'Habacuc', testament: 'ancien', chapters: 3 },
  { num: 36, id: 'sop', name: 'Sophonie', testament: 'ancien', chapters: 3 },
  { num: 37, id: 'agg', name: 'Aggée', testament: 'ancien', chapters: 2 },
  { num: 38, id: 'zac', name: 'Zacharie', testament: 'ancien', chapters: 14 },
  { num: 39, id: 'mal', name: 'Malachie', testament: 'ancien', chapters: 4 },
  { num: 40, id: 'mat', name: 'Matthieu', testament: 'nouveau', chapters: 28 },
  { num: 41, id: 'mar', name: 'Marc', testament: 'nouveau', chapters: 16 },
  { num: 42, id: 'luc', name: 'Luc', testament: 'nouveau', chapters: 24 },
  { num: 43, id: 'jn', name: 'Jean', testament: 'nouveau', chapters: 21 },
  { num: 44, id: 'act', name: 'Actes', testament: 'nouveau', chapters: 28 },
  { num: 45, id: 'rom', name: 'Romains', testament: 'nouveau', chapters: 16 },
  { num: 46, id: '1co', name: '1 Corinthiens', testament: 'nouveau', chapters: 16 },
  { num: 47, id: '2co', name: '2 Corinthiens', testament: 'nouveau', chapters: 13 },
  { num: 48, id: 'gal', name: 'Galates', testament: 'nouveau', chapters: 6 },
  { num: 49, id: 'eph', name: 'Éphésiens', testament: 'nouveau', chapters: 6 },
  { num: 50, id: 'phi', name: 'Philippiens', testament: 'nouveau', chapters: 4 },
  { num: 51, id: 'col', name: 'Colossiens', testament: 'nouveau', chapters: 4 },
  { num: 52, id: '1th', name: '1 Thessaloniciens', testament: 'nouveau', chapters: 5 },
  { num: 53, id: '2th', name: '2 Thessaloniciens', testament: 'nouveau', chapters: 3 },
  { num: 54, id: '1ti', name: '1 Timothée', testament: 'nouveau', chapters: 6 },
  { num: 55, id: '2ti', name: '2 Timothée', testament: 'nouveau', chapters: 4 },
  { num: 56, id: 'tit', name: 'Tite', testament: 'nouveau', chapters: 3 },
  { num: 57, id: 'phm', name: 'Philémon', testament: 'nouveau', chapters: 1 },
  { num: 58, id: 'heb', name: 'Hébreux', testament: 'nouveau', chapters: 13 },
  { num: 59, id: 'jac', name: 'Jacques', testament: 'nouveau', chapters: 5 },
  { num: 60, id: '1pi', name: '1 Pierre', testament: 'nouveau', chapters: 5 },
  { num: 61, id: '2pi', name: '2 Pierre', testament: 'nouveau', chapters: 3 },
  { num: 62, id: '1jn', name: '1 Jean', testament: 'nouveau', chapters: 5 },
  { num: 63, id: '2jn', name: '2 Jean', testament: 'nouveau', chapters: 1 },
  { num: 64, id: '3jn', name: '3 Jean', testament: 'nouveau', chapters: 1 },
  { num: 65, id: 'jud', name: 'Jude', testament: 'nouveau', chapters: 1 },
  { num: 66, id: 'apo', name: 'Apocalypse', testament: 'nouveau', chapters: 22 },
]

function escape(text) {
  return String(text).replace(/'/g, "''")
}

// Adapte la réponse getbible.net (structure "livre entier") en une liste de
// chapitres [{ number, verses: [{ verse, text }] }]. À ajuster si le format
// observé diffère (voir le log de la première requête).
function extractChapters(bookJson) {
  if (Array.isArray(bookJson.chapters)) {
    return bookJson.chapters.map((c) => ({
      number: c.chapter ?? c.chapter_nr ?? c.number,
      verses: (c.verses || []).map((v) => ({ verse: v.verse, text: v.text })),
    }))
  }
  // Certaines réponses imbriquent sous book.chapters
  if (bookJson.book?.chapters) {
    return extractChapters(bookJson.book)
  }
  throw new Error('Structure JSON inattendue — inspectez la réponse et adaptez extractChapters().')
}

async function fetchBook(book) {
  const url = `https://api.getbible.net/v2/${TRANSLATION}/${book.num}.json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Échec ${res.status} pour ${book.name} (${url})`)
  return res.json()
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  // --- 1. Table bible_books (un seul fichier) ---
  const bookRows = BOOKS.map(
    (b, i) =>
      `('${b.id}', '${escape(b.name)}', '${b.testament}', ${i + 1}, ${b.chapters})`,
  ).join(',\n  ')
  await writeFile(
    `${OUT_DIR}/00-books.sql`,
    `INSERT INTO bible_books (id, name, testament, book_order, chapter_count) VALUES\n  ${bookRows};\n`,
  )
  console.log('✓ 00-books.sql écrit (66 livres)')

  // --- 2. Un fichier par livre : chapitres + versets ---
  for (let i = 0; i < BOOKS.length; i++) {
    const book = BOOKS[i]
    console.log(`→ Téléchargement ${book.name}…`)
    const data = await fetchBook(book)

    if (i === 0) {
      console.log('--- Échantillon de la réponse brute (vérifiez la structure) ---')
      console.log(JSON.stringify(data).slice(0, 800))
      console.log('--- fin échantillon ---')
    }

    const chapters = extractChapters(data)
    const lines = []

    for (const ch of chapters) {
      const chapterId = `${book.id}-${ch.number}`
      lines.push(`INSERT INTO bible_chapters (id, book_id, number) VALUES ('${chapterId}', '${book.id}', ${ch.number});`)
      if (ch.verses.length) {
        const verseRows = ch.verses
          .map(
            (v) =>
              `('${chapterId}-${v.verse}', '${chapterId}', 'LSG1910', ${v.verse}, '${escape(v.text)}')`,
          )
          .join(',\n  ')
        lines.push(
          `INSERT INTO bible_verses (id, chapter_id, translation, verse, text) VALUES\n  ${verseRows};`,
        )
      }
    }

    const filename = `${OUT_DIR}/${String(i + 1).padStart(2, '0')}-${book.id}.sql`
    await writeFile(filename, lines.join('\n\n') + '\n')
    console.log(`  ✓ ${filename} (${chapters.length} chapitres)`)

    // Petite pause pour ne pas surcharger l'API publique
    await new Promise((r) => setTimeout(r, 150))
  }

  console.log('\nTerminé. Chargez ensuite chaque fichier dans D1, par exemple :')
  console.log('  for f in db/seed/*.sql; do npx wrangler d1 execute shalom-db --remote --file="$f"; done')
}

main().catch((err) => {
  console.error('Erreur import :', err)
  process.exit(1)
})
