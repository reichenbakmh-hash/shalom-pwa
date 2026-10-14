import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))

export const books = JSON.parse(readFileSync(resolve(root, 'src/data/bible-books.json'), 'utf8'))

export function argValue(name, fallback) {
  const index = process.argv.indexOf(name)
  if (index === -1) return fallback
  return process.argv[index + 1] ?? fallback
}

export function hasFlag(name) {
  return process.argv.includes(name)
}

export function bibleDir() {
  return resolve(argValue('--dir', resolve(root, 'public/bible')))
}

export const TRANSLATION = 'LSG1910'
export const TRANSLATION_NAME = 'Louis Segond 1910'
export const SOURCE_URL = 'https://api.getbible.net/v2/ls1910'
export const LICENSE = 'Domaine public (traduction Louis Segond, révision de 1910)'
