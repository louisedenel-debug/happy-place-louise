// Aide à la rédaction : trois types d'actualité, avec un exemple à adapter et une liste de repères.
// Textes repris de la maquette (design/Main.dc.html).

export type HelpKind = "arr" | "res" | "con";

export type HelpExample = {
  title: string;
  body: string;
  checkTitle: string;
  checks: { label: string; hint: string }[];
  att: string;
};

export const HELP_EXAMPLES: Record<HelpKind, HelpExample> = {
  arr: {
    title: "Bienvenue à Inès Lambert, nouvelle conseillère Relation clients",
    body: "Inès rejoint l'équipe Relation clients le lundi 9 novembre. Elle a passé quatre ans dans un cabinet de conseil à Lyon, où elle accompagnait des clients sur leurs projets de transformation.\n\nElle prendra en charge le portefeuille des clients de la région Ouest, avec Camille comme référente pendant son premier mois.\n\nPour l'accueillir, nous organisons un petit-déjeuner d'équipe à 9 h 30 en salle Horizon. Passez lui dire bonjour !",
    checkTitle: "Dans une annonce d'arrivée",
    checks: [
      { label: "Qui arrive", hint: "Prénom, nom et poste." },
      { label: "Quand", hint: "La date de début." },
      { label: "Son parcours", hint: "Une phrase sur ce qu'elle a fait avant." },
      { label: "Son rôle", hint: "Ce qu'elle va prendre en charge et avec qui." },
      { label: "Comment l'accueillir", hint: "Un moment prévu ou un message à lui envoyer." }
    ],
    att: "Conseillé : une photo d'Inès."
  },
  res: {
    title: "L'équipe Relation clients dépasse son objectif de satisfaction",
    body: "Au troisième trimestre, la satisfaction client de l'équipe atteint 92 %, pour un objectif de 88 %. Le délai moyen de première réponse est passé de 6 h à 3 h 30.\n\nCe résultat vient de deux changements : la réponse sous 4 h et le suivi partagé des dossiers sensibles. Merci à toute l'équipe, et en particulier à Hugo et Sofia, qui ont mis en place ce suivi.\n\nProchain objectif : 90 % au quatrième trimestre.",
    checkTitle: "Dans une annonce de résultat",
    checks: [
      { label: "Le chiffre", hint: "Le résultat, et l'objectif à comparer." },
      { label: "L'évolution", hint: "Avant et après, pour que le gain se voie." },
      { label: "La cause", hint: "Ce qui a permis ce résultat." },
      { label: "Des remerciements", hint: "Les personnes qui y ont contribué, par leur nom." },
      { label: "La suite", hint: "Le prochain objectif." }
    ],
    att: "Conseillé : le graphique du trimestre."
  },
  con: {
    title: "Contrat signé avec Maison Delorme",
    body: "Nous avons signé un contrat de trois ans avec Maison Delorme, qui nous confie le suivi de ses 40 points de vente. Le contrat démarre le 1er janvier.\n\nKarim pilotera le projet, avec Sofia et Hugo. Ce contrat change trois choses pour nous : une équipe dédiée de quatre personnes, un point hebdomadaire avec le client, et un nouveau tableau de bord de suivi.\n\nBravo à Karim et à toute l'équipe pour ce résultat.",
    checkTitle: "Dans une annonce de contrat",
    checks: [
      { label: "Le client", hint: "Son nom, si le contrat n'est pas confidentiel." },
      { label: "Le contrat", hint: "La durée, le périmètre et la date de début." },
      { label: "Qui pilote", hint: "Les personnes en charge du projet." },
      { label: "Ce que ça change", hint: "L'effet concret pour les collègues." },
      { label: "Des remerciements", hint: "Ceux qui ont mené la négociation." }
    ],
    att: "Conseillé : le logo ou une photo de la signature."
  }
};
export const HELP_TYPES: { kind: HelpKind; label: string; hint: string; icon: string }[] = [
  { kind: "arr", label: "Un nouveau collègue.", hint: "Tout le monde sait qui contacter.", icon: "person_add" },
  { kind: "res", label: "Un objectif atteint.", hint: "On reconnaît le travail fait.", icon: "trending_up" },
  { kind: "con", label: "Un nouveau client.", hint: "On voit ce que ça change.", icon: "handshake" },
];

export function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/** Message sous le champ de contenu : l'idéal est de 60 à 120 mots. */
export function wordMessage(n: number): string {
  const verdict = n < 60 ? "un peu court" : n > 120 ? "un peu long" : "bonne longueur";
  return `${n} mot${n > 1 ? "s" : ""} · ${verdict} (idéal : 60 à 120 mots)`;
}
