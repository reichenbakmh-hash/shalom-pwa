# Source et licence de la Bible

## Traduction

Louis Segond, révision de 1910 (LSG1910), texte français.

## Source numérique retenue

API publique getBible, traduction `ls1910` : `https://api.getbible.net/v2/ls1910/<numéro du livre>.json` (1 = Genèse … 66 = Apocalypse).

## Licence : points à confirmer

- La traduction Louis Segond (révision de 1910) est généralement considérée comme appartenant au domaine public.
- Les conditions d'utilisation et de redistribution propres à getBible n'ont pas pu être consultées pendant le développement (réseau indisponible dans l'environnement de travail). Elles doivent être vérifiées avant toute publication.
- Si une autre source est préférée, placez ses fichiers au format getBible dans un dossier et lancez `npm run bible:import -- --from <dossier>` (fichiers nommés `1.json` … `66.json`), puis mettez à jour ce document et le champ `LICENSE` de `scripts/bible-common.mjs`.

## Attribution

Le lecteur affiche « Louis Segond 1910 — Domaine public » dans le panneau hors connexion. Si la source exige une attribution supplémentaire, ajoutez-la dans `scripts/bible-common.mjs` (constante `LICENSE`) : elle est reprise automatiquement dans le manifeste et dans l'interface.

## Garde-fous

Le texte n'est jamais généré ni complété par l'application. Le manifeste `public/bible/manifest.json` porte `verified: false` après l'import ; seul `npm run bible:check` le passe à `true`, et uniquement si tous les contrôles réussissent. L'application refuse de télécharger un corpus non vérifié.
