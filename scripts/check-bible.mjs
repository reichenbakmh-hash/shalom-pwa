import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { argValue, bibleDir, books, hasFlag } from './bible-common.mjs'

const dir = bibleDir()
const referenceFile = argValue('--reference', null)
const EXPECTED_VERSES = 31102

const ANCHORS = [
  ['gen', 1, 31],
  ['est', 10, 3],
  ['oba', 1, 21],
  ['psa', 117, 2],
  ['psa', 119, 176],
  ['mat', 28, 20],
  ['jhn', 3, 36],
  ['3jn', 1, 14],
  ['jud', 1, 25],
  ['rev', 22, 21],
]

const errors = []
const warnings = []

function fail(message) {
  errors.push(message)
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch {
    return null
  }
}

async function main() {
  const manifestPath = resolve(dir, 'manifest.json')
  const manifest = await readJson(manifestPath)
  if (!manifest) {
    console.error(`Aucun manifeste lisible dans ${dir}. Lancez d'abord : npm run bible:import`)
    process.exit(1)
  }

  const reference = referenceFile ? await readJson(resolve(referenceFile)) : null
  if (referenceFile && !reference) fail(`Fichier de référence illisible : ${referenceFile}`)

  const hash = createHash('sha256')
  const manifestBooks = []
  let totalChapters = 0
  let totalVerses = 0
  const counts = new Map()

  for (const book of books) {
    const path = resolve(dir, `${book.id}.json`)
    let raw
    try {
      raw = await readFile(path, 'utf8')
    } catch {
      fail(`Fichier manquant : ${book.id}.json (${book.name})`)
      continue
    }
    let data
    try {
      data = JSON.parse(raw)
    } catch {
      fail(`JSON invalide : ${book.id}.json`)
      continue
    }
    hash.update(raw)
    if (data.id !== book.id) fail(`${book.id}.json : identifiant "${data.id}" au lieu de "${book.id}"`)
    if (!Array.isArray(data.chapters)) {
      fail(`${book.id}.json : champ chapters absent`)
      continue
    }
    if (data.chapters.length !== book.chapterCount) {
      fail(`${book.name} : ${data.chapters.length} chapitres, ${book.chapterCount} attendus`)
    }
    const seenChapters = new Set()
    const verseCounts = []
    data.chapters.forEach((chapter, index) => {
      const label = `${book.name} ${index + 1}`
      if (!Array.isArray(chapter) || chapter.length === 0) {
        fail(`${label} : chapitre vide ou invalide`)
        verseCounts.push(0)
        return
      }
      chapter.forEach((text, v) => {
        if (typeof text !== 'string' || text.trim() === '') fail(`${label}:${v + 1} : verset vide`)
        else if (text !== text.trim()) fail(`${label}:${v + 1} : espaces superflus`)
      })
      const signature = chapter.join('\u0001')
      if (seenChapters.has(signature)) fail(`${label} : contenu identique à un autre chapitre du même livre`)
      seenChapters.add(signature)
      verseCounts.push(chapter.length)
    })
    counts.set(book.id, verseCounts)
    totalChapters += data.chapters.length
    totalVerses += verseCounts.reduce((a, b) => a + b, 0)
    manifestBooks.push({
      id: book.id,
      chapters: data.chapters.length,
      verses: verseCounts,
      bytes: Buffer.byteLength(raw),
    })
    if (reference?.[book.id]) {
      const expected = reference[book.id]
      verseCounts.forEach((n, i) => {
        if (expected[i] !== n) fail(`${book.name} ${i + 1} : ${n} versets, ${expected[i]} attendus (référence)`)
      })
      if (expected.length !== verseCounts.length) fail(`${book.name} : nombre de chapitres différent de la référence`)
    }
  }

  if (books.length !== 66) fail(`Canon interne : ${books.length} livres au lieu de 66`)
  if (totalChapters !== 1189) fail(`Total : ${totalChapters} chapitres au lieu de 1189`)
  for (const [id, chapter, expected] of ANCHORS) {
    const actual = counts.get(id)?.[chapter - 1]
    if (actual !== expected) fail(`Contrôle ${id} ${chapter} : ${actual ?? 'absent'} versets, ${expected} attendus`)
  }
  if (totalVerses !== EXPECTED_VERSES) {
    const message = `Total de versets : ${totalVerses} (valeur usuelle : ${EXPECTED_VERSES}).`
    if (hasFlag('--allow-total-mismatch')) warnings.push(`${message} Accepté via --allow-total-mismatch.`)
    else fail(`${message} Utilisez --allow-total-mismatch seulement si la versification de la source diffère légitimement.`)
  }

  const computedVersion = `ls1910-${hash.digest('hex').slice(0, 12)}`
  const verified = errors.length === 0
  const next = {
    ...manifest,
    version: computedVersion,
    verified,
    totals: { books: manifestBooks.length, chapters: totalChapters, verses: totalVerses },
    books: manifestBooks,
    ...(verified ? { verifiedAt: new Date().toISOString() } : {}),
  }
  if (!verified) delete next.verifiedAt
  await writeFile(manifestPath, JSON.stringify(next))

  console.log(`Livres : ${manifestBooks.length}/66 — Chapitres : ${totalChapters}/1189 — Versets : ${totalVerses}`)
  for (const w of warnings) console.log(`Avertissement : ${w}`)
  if (errors.length) {
    console.log(`\n${errors.length} erreur(s) :`)
    for (const e of errors.slice(0, 50)) console.log(` - ${e}`)
    if (errors.length > 50) console.log(` … et ${errors.length - 50} autres`)
    console.log('\nCorpus NON vérifié : l’application refusera de l’installer hors connexion.')
    process.exit(1)
  }
  console.log(`\nCorpus vérifié (version ${computedVersion}).`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
