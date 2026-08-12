import type { DailyVerse } from '../types'

// Banque de versets tournant automatiquement par jour de l'année.
// À terme : remplacée par une requête à la table `daily_verses` (D1).
export const dailyVerses: Omit<DailyVerse, 'id' | 'date'>[] = [
  {
    reference: 'Jean 14:27',
    text: "Je vous laisse la paix, je vous donne ma paix. Je ne vous donne pas comme le monde donne. Que votre cœur ne se trouble point, et ne s'alarme point.",
    meditation:
      "La paix que le Christ offre ne dépend pas des circonstances. Elle est une présence intérieure, un ancrage, quand tout le reste vacille.",
  },
  {
    reference: 'Psaume 46:11',
    text: 'Arrêtez, et sachez que je suis Dieu.',
    meditation:
      "Un appel à cesser l'agitation. Avant d'agir, avant de comprendre, il y a un espace pour simplement se tenir en présence de Dieu.",
  },
  {
    reference: 'Matthieu 11:28',
    text: 'Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos.',
    meditation:
      'Le repos promis ici n\'est pas l\'absence de fardeau, mais une présence qui porte avec nous ce que nous ne pouvons porter seuls.',
  },
  {
    reference: 'Romains 8:28',
    text: 'Nous savons, du reste, que toutes choses concourent au bien de ceux qui aiment Dieu.',
    meditation:
      "Une confiance qui ne nie pas la difficulté du présent, mais qui situe chaque saison dans une histoire plus large.",
  },
  {
    reference: 'Philippiens 4:6-7',
    text: "Ne vous inquiétez de rien; mais en toute chose faites connaître vos besoins à Dieu par des prières et des supplications, avec des actions de grâces.",
    meditation:
      "La prière comme antidote à l'inquiétude — non pas en supprimant les soucis, mais en les déposant.",
  },
  {
    reference: 'Ésaïe 41:10',
    text: "Ne crains rien, car je suis avec toi; ne promène pas des regards inquiets, car je suis ton Dieu.",
    meditation:
      "La peur recule rarement devant un raisonnement. Elle recule devant une présence.",
  },
  {
    reference: '1 Jean 4:18',
    text: "La crainte n'est pas dans l'amour, mais l'amour parfait bannit la crainte.",
    meditation:
      'Un amour qui ne réclame rien pour être mérité désarme peu à peu la peur d\'être insuffisant.',
  },
]

export function getVerseForDate(date: Date = new Date()): DailyVerse {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86_400_000,
  )
  const index = dayOfYear % dailyVerses.length
  const iso = date.toISOString().slice(0, 10)
  return { id: `dv-${iso}`, date: iso, ...dailyVerses[index] }
}
