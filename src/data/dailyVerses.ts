import type { DailyVerse } from '../types'

type Entry = Omit<DailyVerse, 'id' | 'date'>

export const dailyVerses: Entry[] = [
  {
    bookId: 'jhn', chapter: 14, verse: 27, reference: 'Jean 14:27',
    text: "Je vous laisse la paix, je vous donne ma paix. Je ne vous donne pas comme le monde donne. Que votre coeur ne se trouble point, et ne s'alarme point.",
    meditation: "Jésus dit ça à des amis qui sentent que tout va basculer. Sa paix est pour ce soir-là, pas pour le jour où tout ira mieux.",
  },
  {
    bookId: 'psa', chapter: 46, verse: 11, reference: 'Psaume 46:11',
    text: 'Arrêtez, et sachez que je suis Dieu: Je serai exalté parmi les nations, je serai exalté sur la terre.',
    meditation: "Pose ce que tu as dans les mains. Dieu n'a pas besoin que tu t'agites pour rester Dieu.",
  },
  {
    bookId: 'mat', chapter: 11, verse: 28, reference: 'Matthieu 11:28',
    text: 'Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos.',
    meditation: "Jésus ne demande pas de trier ses fardeaux avant de venir. On vient fatigué, comme on est.",
  },
  {
    bookId: 'rom', chapter: 8, verse: 28, reference: 'Romains 8:28',
    text: "Nous savons, du reste, que toutes choses concourent au bien de ceux qui aiment Dieu, de ceux qui sont appelés selon son dessein.",
    meditation: "Paul ne dit pas que tout ce qui arrive est bon. Il dit que Dieu sait quoi faire de ce qui arrive, y compris du pire.",
  },
  {
    bookId: 'php', chapter: 4, verse: 6, verseEnd: 7, reference: 'Philippiens 4:6-7',
    text: "Ne vous inquiétez de rien; mais en toute chose faites connaître vos besoins à Dieu par des prières et des supplications, avec des actions de grâces. Et la paix de Dieu, qui surpasse toute intelligence, gardera vos coeurs et vos pensées en Jésus-Christ.",
    meditation: "Une inquiétude qui tourne en boucle pèse moins une fois dite à Dieu, à voix haute ou par écrit. Essaie avec celle d'aujourd'hui.",
  },
  {
    bookId: 'isa', chapter: 41, verse: 10, reference: 'Ésaïe 41:10',
    text: "Ne crains rien, car je suis avec toi; ne promène pas des regards inquiets, car je suis ton Dieu; je te fortifie, je viens à ton secours, je te soutiens de ma droite triomphante.",
    meditation: "Dieu ne dit pas « ne crains rien » dans le vide. Il donne la raison : il est là, avec toi.",
  },
  {
    bookId: '1jn', chapter: 4, verse: 18, reference: '1 Jean 4:18',
    text: "La crainte n'est pas dans l'amour, mais l'amour parfait bannit la crainte. Car la crainte suppose un châtiment, et celui qui craint n'est pas parfait dans l'amour.",
    meditation: "Beaucoup de peurs viennent de l'idée qu'il faut mériter l'amour. Ce verset dit que tu l'as déjà reçu.",
  },
  {
    bookId: 'psa', chapter: 23, verse: 1, verseEnd: 2, reference: 'Psaume 23:1-2',
    text: "L'Éternel est mon berger: je ne manquerai de rien. Il me fait reposer dans de verts pâturages, il me dirige près des eaux paisibles.",
    meditation: "Un berger sait ce dont chaque brebis a besoin. Qu'est-ce qui te manque aujourd'hui, et le lui as-tu dit ?",
  },
  {
    bookId: 'jos', chapter: 1, verse: 9, reference: 'Josué 1:9',
    text: "Ne t'ai-je pas ordonné: Fortifie-toi et prends courage? Ne t'effraie point et ne t'épouvante point, car l'Éternel, ton Dieu, est avec toi dans tout ce que tu entreprendras.",
    meditation: "Josué prend la suite de Moïse, il a de quoi trembler. Dieu lui répète de ne pas se laisser paralyser, et il donne une raison : je serai là.",
  },
  {
    bookId: 'pro', chapter: 3, verse: 5, verseEnd: 6, reference: 'Proverbes 3:5-6',
    text: "Confie-toi en l'Éternel de tout ton coeur, et ne t'appuie pas sur ta sagesse; reconnais-le dans toutes tes voies, et il aplanira tes sentiers.",
    meditation: "Compter sur son propre jugement marche jusqu'au jour où on ne voit plus la route. Confie à Dieu ta prochaine décision avant de la prendre.",
  },
  {
    bookId: 'jer', chapter: 29, verse: 11, reference: 'Jérémie 29:11',
    text: "Car je connais les projets que j'ai formés sur vous, dit l'Éternel, projets de paix et non de malheur, afin de vous donner un avenir et de l'espérance.",
    meditation: "Ces mots ont été écrits à des exilés, loin de chez eux. Ils parlent d'un avenir qui existe, même quand le présent est dur.",
  },
  {
    bookId: 'lam', chapter: 3, verse: 22, verseEnd: 23, reference: 'Lamentations 3:22-23',
    text: "Les bontés de l'Éternel ne sont pas épuisées, ses compassions ne sont pas à leur terme; elles se renouvellent chaque matin. Oh! que ta fidélité est grande!",
    meditation: "L'auteur écrit au milieu d'un désastre, et il trouve quand même de quoi se lever le matin. Chaque jour a sa part de bonté déjà prête.",
  },
  {
    bookId: 'psa', chapter: 121, verse: 1, verseEnd: 2, reference: 'Psaume 121:1-2',
    text: "Je lève mes yeux vers les montagnes... D'où me viendra le secours? Mon secours vient de l'Éternel, qui a fait les cieux et la terre.",
    meditation: "Devant des montagnes on se sent tout petit. Le psalmiste rappelle que celui qui les a faites s'occupe de toi.",
  },
  {
    bookId: '1pe', chapter: 5, verse: 7, reference: '1 Pierre 5:7',
    text: "et déchargez-vous sur lui de tous vos soucis, car lui-même prend soin de vous.",
    meditation: "Rien ne t'oblige à porter tes soucis en silence. Écris-en un maintenant et remets-le à Dieu.",
  },
  {
    bookId: 'mat', chapter: 6, verse: 34, reference: 'Matthieu 6:34',
    text: "Ne vous inquiétez donc pas du lendemain; car le lendemain aura soin de lui-même. À chaque jour suffit sa peine.",
    meditation: "Demain existe déjà dans ta tête, et il pèse. Jésus propose de ne vivre qu'une journée à la fois.",
  },
  {
    bookId: 'psa', chapter: 119, verse: 105, reference: 'Psaume 119:105',
    text: "Ta parole est une lampe à mes pieds, et une lumière sur mon sentier.",
    meditation: "Une lampe éclaire les prochains pas, pas toute la route. Il suffit de voir le prochain mètre.",
  },
  {
    bookId: 'isa', chapter: 40, verse: 31, reference: 'Ésaïe 40:31',
    text: "Mais ceux qui se confient en l'Éternel renouvellent leur force. Ils prennent le vol comme les aigles; ils courent, et ne se lassent point, ils marchent, et ne se fatiguent point.",
    meditation: "Les forces reviennent doucement, pas après pas, à ceux qui comptent sur Dieu.",
  },
  {
    bookId: 'psa', chapter: 27, verse: 1, reference: 'Psaume 27:1',
    text: "L'Éternel est ma lumière et mon salut: de qui aurais-je crainte? L'Éternel est le rempart de ma vie: de qui aurais-je peur?",
    meditation: "David a connu la fuite, les ennemis, les grottes. Et il écrit qu'il n'a peur de personne. Ça donne envie de savoir pourquoi.",
  },
  {
    bookId: '2co', chapter: 12, verse: 9, reference: '2 Corinthiens 12:9',
    text: "Et il m'a dit: Ma grâce te suffit, car ma puissance s'accomplit dans la faiblesse.",
    meditation: "Paul avait demandé trois fois à être délivré d'une souffrance. Dieu a répondu autre chose que ce qu'il attendait, mais il a répondu.",
  },
  {
    bookId: 'jas', chapter: 1, verse: 5, reference: 'Jacques 1:5',
    text: "Si quelqu'un d'entre vous manque de sagesse, qu'il la demande à Dieu, qui donne à tous simplement et sans reproche, et elle lui sera donnée.",
    meditation: "Pas besoin de bien formuler sa demande. Dieu donne sans faire la leçon.",
  },
  {
    bookId: 'mat', chapter: 28, verse: 20, reference: 'Matthieu 28:20',
    text: "et voici, je suis avec vous tous les jours, jusqu'à la fin du monde.",
    meditation: "C'est la dernière phrase de l'évangile de Matthieu. Jésus finit sur une promesse : tous les jours, y compris celui-ci.",
  },
  {
    bookId: 'jhn', chapter: 3, verse: 16, reference: 'Jean 3:16',
    text: "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle.",
    meditation: "Une seule phrase pour résumer l'Évangile. Le verbe qui compte est « donné ».",
  },
  {
    bookId: 'php', chapter: 4, verse: 13, reference: 'Philippiens 4:13',
    text: "Je puis tout par celui qui me fortifie.",
    meditation: "On cite souvent ce verset avant un examen. Paul l'écrit depuis la prison, pour dire qu'il tient bon dans le manque comme dans l'abondance.",
  },
  {
    bookId: 'psa', chapter: 34, verse: 19, reference: 'Psaume 34:19',
    text: "L'Éternel est près de ceux qui ont le coeur brisé, et il sauve ceux qui ont l'esprit dans l'abattement.",
    meditation: "Dieu s'approche de ceux qui sont à terre. Pas besoin de se relever d'abord.",
  },
  {
    bookId: 'rom', chapter: 15, verse: 13, reference: 'Romains 15:13',
    text: "Que le Dieu de l'espérance vous remplisse de toute joie et de toute paix dans la foi, pour que vous abondiez en espérance, par la puissance du Saint-Esprit!",
    meditation: "Paul souhaite aux Romains de la joie, de la paix et de l'espérance. Tu peux le prier pour toi, ou pour quelqu'un que tu aimes.",
  },
  {
    bookId: 'gal', chapter: 6, verse: 9, reference: 'Galates 6:9',
    text: "Ne nous lassons pas de faire le bien; car nous moissonnerons au temps convenable, si nous ne nous relâchons pas.",
    meditation: "Faire le bien fatigue quand rien ne change. Paul parle de moisson : le temps de la récolte viendra.",
  },
]

function localIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function getVerseForDate(date: Date = new Date()): DailyVerse {
  const startOfYear = new Date(date.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86_400_000)
  const index = dayOfYear % dailyVerses.length
  const iso = localIsoDate(date)
  return { id: `dv-${iso}`, date: iso, ...dailyVerses[index] }
}
