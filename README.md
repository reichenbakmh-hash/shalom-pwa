# SHALOM PWA

React, TypeScript, Vite, Tailwind CSS, vite-plugin-pwa. Application locale : toutes les données utilisateur sont dans le navigateur.

## Installation

```
npm install
```

## Préparer la Bible Louis Segond 1910

Le texte n'est pas fourni dans le dépôt. Il se prépare en deux commandes (connexion requise pour la première) :

```
npm run bible:import
npm run bible:check
```

- `bible:import` télécharge les 66 livres et écrit `public/bible/<livre>.json` et `public/bible/manifest.json`.
- `bible:check` contrôle 66 livres, 1 189 chapitres, l'absence de chapitres ou versets vides, de doublons, la cohérence avec le manifeste, des versets de référence et le total usuel de 31 102 versets. En cas de succès, il marque le corpus `verified: true`.
- Options : `--dir <dossier>` (dossier de sortie), `--reference <fichier.json>` (comptes de versets attendus par livre : `{ "gen": [31, 25, …] }`), `--allow-total-mismatch` (versification légitimement différente).
- Sans texte installé, l'application s'ouvre et l'indique clairement ; elle n'affiche jamais de faux versets.

Source et licence : voir `docs/BIBLE-SOURCE.md`.

## Format des données

- `src/data/bible-books.json` : liste canonique des 66 livres (identifiants USFM en minuscules : `gen`, `psa`, `jhn`, `rev`…). Utilisée par le lecteur et les scripts.
- `public/bible/<id>.json` : `{ "id": "gen", "chapters": [["verset 1", "verset 2"], …] }`. Le chapitre N est `chapters[N-1]`, le verset M est l'élément `M-1`.
- `public/bible/manifest.json` : version (empreinte du contenu), source, licence, comptes de versets, tailles, état `verified`.

## Hors connexion

- Le shell de l'application est précaché par le service worker (ouverture depuis l'écran d'accueil en mode avion).
- Les livres sont téléchargés depuis le panneau « Hors connexion » de La Parole (progression, annulation, confirmation) dans le cache `shalom-bible`, indépendant des mises à jour de l'application.
- Un livre consulté en ligne est aussi mis en cache au passage.
- Favoris, notes et historique sont dans le `localStorage` (clés `shalom:favorites`, `shalom:bible_notes`, `shalom:bible_reading_history`) et ne sont jamais touchés par une mise à jour du texte.
- Une nouvelle version du texte (nouvelle empreinte dans le manifeste) est signalée ; le texte installé reste lisible jusqu'à la mise à jour.

## Développement et compilation

```
npm run dev
npm run build
npm run build:release
```

`build:release` exécute d'abord `bible:check` : la compilation s'arrête si le corpus est incomplet.

## Déploiement

Le dossier `dist/` est statique (Vercel, Cloudflare Pages, etc.). Aucun Worker n'est nécessaire ; `db/wrangler.toml` ne sert qu'aux commandes D1.
