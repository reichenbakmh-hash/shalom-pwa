# Compte rendu

## Réalisé

- Shalom AI supprimé : page, entrées de menu (bureau et mobile), type `ai`, type `AIMessage`, Worker `src/worker.ts` (seule route utile : `/api/ai`), table `ai_conversations`, règle de cache `/api/`, clé de stockage (la conversation locale éventuelle est effacée au démarrage). Aucune dépendance npm n'était propre à l'IA.
- Identifiants des livres unifiés : `src/data/bible-books.json` est la source unique (lecteur, importeur, vérificateur). Les anciens identifiants divergents (`gn`/`ge`…) disparaissent. Les favoris existants (identifiant = référence texte) restent valides.
- Lecteur refait dans le style existant : Ancien/Nouveau Testament, liste complète des 66 livres, tous les chapitres (plus de limite à 30), chapitre précédent/suivant (franchit les livres), sélection tactile de versets, favoris, notes, copie, partage, historique, « Reprendre ma lecture », recherche par référence (Jean 3:16, 1 Co 13, Ps 23…) et recherche par mot ou expression (insensible aux accents et à la casse, `"expression exacte"` entre guillemets), états de chargement, d'erreur, de résultat vide et de chapitre indisponible.
- Hors connexion : téléchargement avec progression, annulation, vérification contre le manifeste, contrôle de l'espace disponible, erreur de quota explicite, stockage persistant demandé, détection de nouvelle version.
- Service worker : retour hors ligne vers l'application (et non vers la page de secours), polices Google mises en cache, JSON bibliques exclus du précache.
- Scripts : `scripts/import-bible.mjs`, `scripts/check-bible.mjs`, `scripts/bible-common.mjs`.

## Non réalisé / bloquant

- Le texte LSG1910 n'est PAS intégré : le réseau était coupé dans l'environnement de travail. Aucun verset n'a été saisi ou reconstitué. Tant que `npm run bible:import` puis `npm run bible:check` n'ont pas réussi, l'application affiche « Texte biblique non installé ».
- Licence de la source getBible non consultée (voir `docs/BIBLE-SOURCE.md`).
- Dépendances non installables ici : `npm install`, `tsc` complet et `vite build` n'ont pas été exécutés.

## Tests réellement exécutés

- Tests du parseur de références : 26 cas réussis.
- `tsc --strict` sur `src/lib/*` et `src/types.ts` (avec un stub pour `import.meta.env`) : aucune erreur.
- Analyse syntaxique des fichiers TSX modifiés : aucune erreur (typage React non vérifié, `@types/react` absent).
- Import et vérification sur un jeu de test synthétique (66 livres, 1 189 chapitres, texte factice, hors dépôt) : succès, et échec correct quand un chapitre est vidé.
- 15 tests de la logique du lecteur avec API navigateur simulées : lecture, hors limites, téléchargement 1→66, statut complet, lecture depuis le cache sans réseau, recherche locale, quota insuffisant, favoris, notes, historique.

## Non testés

- Rendu réel sur téléphone, mode avion avec service worker réel, compilation de production, parcours des autres pages (non modifiées, hors suppression de l'entrée IA).

## Points restants

1. `npm install`, `npm run bible:import`, `npm run bible:check`, `npm run build:release`.
2. Vérifier la licence de la source.
3. Tester en mode avion sur le téléphone après installation de la PWA et téléchargement de la Bible.
4. Optionnel : fournir un fichier `--reference` avec les comptes de versets officiels de la LSG1910.
