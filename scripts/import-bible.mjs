import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { argValue, bibleDir, books, LICENSE, SOURCE_URL, TRANSLATION, TRANSLATION_NAME } from './bible-common.mjs'

const fromDir = argValue('--from', null)
const outDir = bibleDir()

function cleanVerse(text) {
  return String(text).replace(/\s+/g, ' ').trim()
}

function extractChapters(data, book) {
  const raw = data.chapters ?? data.book?.chapters
  if (!raw) throw new Error(`Structure inattendue pour ${book.name} : champ "chapters" absent.`)
  const list = Array.isArray(raw) ? raw : Object.values(raw)
  const byNumber = new Map()
  for (const entry of list) {
    const number = Number(entry.chapter ?? entry.chapter_nr ?? entry.nr ?? entry.number)
    const versesRaw = Array.isArray(entry.verses) ? entry.verses : Object.values(entry.verses ?? {})
    const verses = new Map()
    for (const v of versesRaw) {
      const verse = Number(v.verse ?? v.verse_nr ?? v.nr)
      if (!Number.isInteger(verse)) throw new Error(`Numéro de verset invalide dans ${book.name} ${number}.`)
      if (verses.has(verse)) throw new Error(`Verset en double : ${book.name} ${number}:${verse}.`)
      verses.set(verse, cleanVerse(v.text))
    }
    if (!Number.isInteger(number)) throw new Error(`Numéro de chapitre invalide dans ${book.name}.`)
    if (byNumber.has(number)) throw new Error(`Chapitre en double : ${book.name} ${number}.`)
    const ordered = []
    for (let n = 1; n <= verses.size; n++) {
      if (!verses.has(n)) throw new Error(`Verset manquant : ${book.name} ${number}:${n}.`)
      ordered.push(verses.get(n))
    }
    byNumber.set(number, ordered)
  }
  const chapters = []
  for (let n = 1; n <= byNumber.size; n++) {
    if (!byNumber.has(n)) throw new Error(`Chapitre manquant : ${book.name} ${n}.`)
    chapters.push(byNumber.get(n))
  }
  return chapters
}

async function readBook(book, attempt = 1) {
  if (fromDir) {
    return JSON.parse(await readFile(resolve(fromDir, `${book.order}.json`), 'utf8'))
  }
  const url = `${SOURCE_URL}/${book.order}.json`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (error) {
    if (attempt >= 3) throw new Error(`Échec du téléchargement de ${book.name} (${url}) : ${error.message}`)
    await new Promise((r) => setTimeout(r, 800 * attempt))
    return readBook(book, attempt + 1)
  }
}

async function main() {
  await mkdir(outDir, { recursive: true })
  const hash = createHash('sha256')
  const manifestBooks = []
  let totalChapters = 0
  let totalVerses = 0

  for (const book of books) {
    process.stdout.write(`→ ${book.order}/66 ${book.name}… `)
    const data = await readBook(book)
    const chapters = extractChapters(data, book)
    if (chapters.length !== book.chapterCount) {
      throw new Error(`${book.name} : ${chapters.length} chapitres reçus, ${book.chapterCount} attendus.`)
    }
    const content = JSON.stringify({ id: book.id, chapters })
    await writeFile(resolve(outDir, `${book.id}.json`), content)
    hash.update(content)
    const verses = chapters.map((c) => c.length)
    manifestBooks.push({ id: book.id, chapters: chapters.length, verses, bytes: Buffer.byteLength(content) })
    totalChapters += chapters.length
    totalVerses += verses.reduce((a, b) => a + b, 0)
    console.log(`${chapters.length} chapitres, ${verses.reduce((a, b) => a + b, 0)} versets`)
    if (!fromDir) await new Promise((r) => setTimeout(r, 150))
  }

  const manifest = {
    translation: TRANSLATION,
    translationName: TRANSLATION_NAME,
    language: 'fr',
    version: `ls1910-${hash.digest('hex').slice(0, 12)}`,
    source: fromDir ? `Fichiers locaux au format getBible (${SOURCE_URL})` : SOURCE_URL,
    license: LICENSE,
    generatedAt: new Date().toISOString(),
    verified: false,
    totals: { books: books.length, chapters: totalChapters, verses: totalVerses },
    books: manifestBooks,
  }
  await writeFile(resolve(outDir, 'manifest.json'), JSON.stringify(manifest))
  console.log(`\nImport terminé : ${books.length} livres, ${totalChapters} chapitres, ${totalVerses} versets.`)
  console.log('Lancez maintenant : npm run bible:check')
}

main().catch((error) => {
  console.error(`\nErreur d'import : ${error.message}`)
  process.exit(1)
})
