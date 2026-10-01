/**
 * Historique 1945-2024 et réformes des retraites. Avant 1985, points très approximatifs
 * (ordres de grandeur : 4 cotisants par retraité vers 1960, dépenses ≈ 5 % du PIB à la fin des
 * années 1950, croissance de la productivité ≈ 5 %/an pendant les Trente Glorieuses).
 *
 * ⚠️ Les séries chiffrées sont des **points d'ancrage approximatifs** (comptes rendus des
 * rapports du COR, DREES, Cour des comptes), interpolés entre deux points. Les séries
 * officielles annuelles (base de données du rapport annuel du COR, « Panorama » DREES)
 * n'étaient pas téléchargeables depuis l'environnement de développement : à substituer.
 * Les définitions peuvent différer légèrement de celles du modèle (ex. cotisants par retraité),
 * d'où de petites marches entre 2024 (observé) et 2025 (modèle).
 */

export type Point = readonly [annee: number, valeur: number];

export interface SerieHistorique {
  points: Point[];
  source: string;
}

export const HISTORIQUE = {
  /** Dépenses de retraite, tous régimes, en % du PIB. */
  depensesPctPib: {
    points: [
      [1950, 0.03],
      [1959, 0.054],
      [1970, 0.065],
      [1980, 0.095],
      [1985, 0.106],
      [1990, 0.11],
      [1995, 0.119],
      [2000, 0.116],
      [2005, 0.124],
      [2009, 0.134],
      [2010, 0.136],
      [2013, 0.14],
      [2016, 0.139],
      [2019, 0.136],
      [2020, 0.147],
      [2021, 0.141],
      [2022, 0.136],
      [2023, 0.136],
      [2024, 0.139],
    ],
    source: 'COR (rapports annuels), FIPECO ; 2020 : 14,7 %, 2024 : 13,9 % ; +2 pts de PIB entre 1995 et 2024 ; 1985-1990 approximatifs',
  },
  /** Solde du système de retraite, en % du PIB (série COR à partir de 2002 ; avant : très approximatif). */
  soldePctPib: {
    points: [
      [1985, 0.0],
      [1990, -0.001],
      [1993, -0.004],
      [1995, -0.003],
      [1998, -0.001],
      [2000, 0.002],
      [2002, 0.001],
      [2005, -0.001],
      [2008, -0.004],
      [2010, -0.007],
      [2012, -0.006],
      [2014, -0.004],
      [2016, -0.002],
      [2018, -0.001],
      [2019, -0.001],
      [2020, -0.006],
      [2021, -0.001],
      [2022, 0.001],
      [2023, 0.001],
      [2024, -0.001],
    ],
    source:
      'COR ; 2010 : −0,7 %, 2018 : −0,1 %, 2023 : +0,1 %, 2024 : −0,1 % ; années intermédiaires approximatives ; avant 2002 (déficits du régime général du début des années 1990, excédents vers 2000) : ordres de grandeur seulement',
  },
  /** Pension moyenne / revenu d'activité moyen (définition COR). */
  pensionRelative: {
    points: [
      [1960, 0.33],
      [1970, 0.37],
      [1980, 0.42],
      [1985, 0.44],
      [1990, 0.46],
      [1995, 0.48],
      [2000, 0.49],
      [2005, 0.5],
      [2010, 0.515],
      [2015, 0.525],
      [2020, 0.54],
      [2024, 0.545],
    ],
    source: 'COR (rapports annuels) ; progression liée à l’arrivée de générations aux carrières plus complètes (effet noria) ; ordres de grandeur',
  },
  /** Croissance de la productivité apparente du travail (moyenne glissante sur 5 ans). */
  productivite: {
    points: [
      [1950, 0.05],
      [1960, 0.05],
      [1973, 0.045],
      [1980, 0.028],
      [1985, 0.02],
      [1990, 0.018],
      [1995, 0.015],
      [2000, 0.013],
      [2005, 0.01],
      [2010, 0.006],
      [2015, 0.008],
      [2019, 0.007],
      [2022, 0.001],
      [2024, 0.0],
    ],
    source:
      'INSEE (comptes nationaux), COR ; moyenne glissante pour lisser les crises (2009, 2020) ; recul de la productivité depuis 2019 ; ordres de grandeur',
  },
  /** Nombre de cotisants pour un retraité. */
  ratioCotisantsRetraites: {
    points: [
      [1950, 4.5],
      [1960, 4.0],
      [1970, 3.0],
      [1980, 2.6],
      [1985, 2.4],
      [1990, 2.3],
      [1995, 2.2],
      [2000, 2.1],
      [2005, 2.05],
      [2010, 1.9],
      [2015, 1.82],
      [2020, 1.76],
      [2023, 1.79],
      [2024, 1.78],
    ],
    source: 'COR, INSEE ; 2000 : 2,1 ; 2023 : 1,79 (30,4 M de cotisants pour 17,1 M de retraités)',
  },
  /** Âge moyen conjoncturel de départ à la retraite (DREES). */
  ageMoyenDepart: {
    points: [
      [1950, 64.5],
      [1970, 64.0],
      [1980, 63.0],
      [1985, 61.0],
      [1990, 61.0],
      [1995, 61.0],
      [2000, 60.9],
      [2004, 60.6],
      [2010, 60.5],
      [2013, 61.2],
      [2016, 62.0],
      [2019, 62.3],
      [2021, 62.6],
      [2022, 62.67],
      [2023, 62.75],
      [2024, 62.9],
    ],
    source: 'DREES ; 62 ans et 9 mois fin 2023, +2 ans et 3 mois depuis 2010, −1 mois entre 2004 et 2010',
  },
  /** Espérance de vie à 60 ans, moyenne hommes-femmes (INSEE). */
  esperanceVie60: {
    points: [
      [1950, 17.0],
      [1960, 17.6],
      [1970, 18.5],
      [1980, 19.8],
      [1985, 20.7],
      [1990, 21.4],
      [1995, 22.3],
      [2000, 23.0],
      [2005, 23.9],
      [2010, 24.8],
      [2015, 25.3],
      [2019, 25.7],
      [2020, 25.1],
      [2022, 25.4],
      [2024, 25.7],
    ],
    source: 'INSEE, bilans démographiques (moyenne simple des espérances de vie à 60 ans des hommes et des femmes)',
  },
  /** Espérance de vie sans incapacité à 65 ans, moyenne hommes-femmes (DREES). */
  esperanceVieSansIncapacite65: {
    points: [
      [2008, 9.4],
      [2019, 10.8],
      [2021, 11.9],
      [2022, 11.0],
      [2023, 11.3],
      [2024, 11.2],
    ],
    source:
      'DREES, Études et résultats (2023 : 12,0 ans femmes, 10,5 ans hommes ; 2024 : 11,8 et 10,5 ; +1 an et 10-11 mois depuis 2008) ; 2019 approximatif',
  },
  /** Âge légal d'ouverture des droits (régime général), par année civile. */
  ageLegal: {
    points: [
      [1945, 65],
      [1982, 65],
      [1983, 60],
      [2011, 60],
      [2017, 62],
      [2023, 62],
      [2025, 62.75],
    ],
    source: 'Législation : âge du taux plein de 65 ans de 1945 à 1982 (départ possible dès 60 ans avec forte minoration), 60 ans à partir de 1983, réformes de 2010 et 2023',
  },
} satisfies Record<string, SerieHistorique>;

/**
 * Part des années restant à vivre à 65 ans passées sans incapacité (DREES 2023 : 50,8 % pour les
 * femmes, 52,9 % pour les hommes). Hypothèse de projection : part constante.
 */
export const PART_SANS_INCAPACITE_65 = 0.52;

function interpoler(points: ReadonlyArray<Point>, x: number): number {
  for (let i = 1; i < points.length; i++) {
    if (x <= points[i][0]) {
      const [x0, y0] = points[i - 1];
      const [x1, y1] = points[i];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return points[points.length - 1][1];
}

/** Ressources du système en % du PIB, déduites des dépenses et du solde (ressources = dépenses + solde). */
export const RESSOURCES_HISTORIQUES: SerieHistorique = {
  points: HISTORIQUE.soldePctPib.points.map(([a, solde]) => [a, interpoler(HISTORIQUE.depensesPctPib.points, a) + solde] as const),
  source: 'Calcul : dépenses + solde',
};

export interface Reforme {
  annee: number;
  /** Libellé court pour les graphiques. */
  court: string;
  nom: string;
  mesures: string[];
}

/** Principales réformes des retraites depuis la naissance de la répartition. */
export const REFORMES: Reforme[] = [
  {
    annee: 1941,
    court: 'AVTS',
    nom: 'Allocation aux vieux travailleurs salariés',
    mesures: [
      'Les cotisations des assurances sociales (1930), placées jusque-là en capitalisation, servent à payer directement les pensions : naissance de la répartition',
      'Les réserves avaient été laminées par l’inflation et la crise des années 1930',
    ],
  },
  {
    annee: 1945,
    court: 'Sécurité sociale',
    nom: 'Création de la Sécurité sociale',
    mesures: [
      'Ordonnances d’octobre 1945 : assurance vieillesse par répartition pour les salariés (régime général)',
      'Pension de 20 % du salaire à 60 ans, 40 % à 65 ans après 30 ans d’assurance',
      'Les régimes existants (fonctionnaires, mineurs, cheminots, marins…) sont maintenus',
    ],
  },
  {
    annee: 1947,
    court: 'Agirc',
    nom: 'Création de l’Agirc',
    mesures: ['Régime complémentaire des cadres, créé et géré par les partenaires sociaux'],
  },
  {
    annee: 1956,
    court: 'Minimum vieillesse',
    nom: 'Fonds national de solidarité',
    mesures: ['Création du minimum vieillesse, financé par l’impôt, pour les personnes âgées aux faibles ressources'],
  },
  {
    annee: 1961,
    court: 'Arrco',
    nom: 'Création de l’Arrco',
    mesures: ['Régime complémentaire des salariés non cadres ; généralisation des complémentaires en 1972'],
  },
  {
    annee: 1971,
    court: 'Boulin',
    nom: 'Loi Boulin',
    mesures: [
      'Durée d’assurance pour le taux plein portée à 37,5 ans (150 trimestres)',
      'Taux plein relevé à 50 % du salaire des 10 meilleures années',
    ],
  },
  {
    annee: 1983,
    court: 'Retraite à 60 ans',
    nom: 'Ordonnance de 1982 (entrée en vigueur en 1983)',
    mesures: ['Âge légal abaissé de 65 à 60 ans au régime général, avec 37,5 ans de cotisation pour le taux plein'],
  },
  {
    annee: 1987,
    court: 'Indexation prix',
    nom: 'Indexation des pensions sur les prix',
    mesures: ['Revalorisation des pensions du régime général alignée sur l’inflation et non plus sur les salaires (inscrite dans la loi en 1993)'],
  },
  {
    annee: 1993,
    court: 'Balladur',
    nom: 'Réforme Balladur (régime général)',
    mesures: [
      'Durée de cotisation pour le taux plein portée de 37,5 à 40 ans',
      'Salaire de référence calculé sur les 25 meilleures années au lieu des 10',
      'Pensions revalorisées sur les prix et non plus sur les salaires',
    ],
  },
  {
    annee: 1995,
    court: 'Juppé',
    nom: 'Plan Juppé',
    mesures: ['Volet retraites des régimes spéciaux retiré après les grèves de novembre-décembre 1995'],
  },
  {
    annee: 1999,
    court: 'FRR',
    nom: 'Création du Fonds de réserve pour les retraites',
    mesures: ['Fonds destiné à lisser le choc démographique ; ses ressources sont affectées à la CADES à partir de 2011'],
  },
  {
    annee: 2003,
    court: 'Fillon',
    nom: 'Réforme Fillon',
    mesures: [
      'Fonction publique alignée sur 40 ans de cotisation',
      'Durée requise indexée sur l’espérance de vie (41 ans en 2012)',
      'Création de la surcote et du dispositif carrières longues',
    ],
  },
  {
    annee: 2008,
    court: 'Rég. spéciaux',
    nom: 'Réforme des régimes spéciaux',
    mesures: ['SNCF, RATP, industries électriques et gazières alignées sur 40 ans de cotisation'],
  },
  {
    annee: 2010,
    court: 'Woerth',
    nom: 'Réforme Woerth',
    mesures: [
      'Âge légal relevé de 60 à 62 ans (génération 1955)',
      'Âge d’annulation de la décote relevé de 65 à 67 ans',
    ],
  },
  {
    annee: 2014,
    court: 'Touraine',
    nom: 'Réforme Touraine',
    mesures: [
      'Durée de cotisation portée progressivement à 43 ans (génération 1973)',
      'Compte pénibilité ; revalorisation des pensions décalée d’avril à octobre',
    ],
  },
  {
    annee: 2019,
    court: 'Agirc-Arrco',
    nom: 'Fusion Agirc-Arrco',
    mesures: [
      'Fusion des régimes complémentaires du privé, coefficient de solidarité temporaire',
      'Projet de système universel par points présenté puis abandonné (mars 2020)',
    ],
  },
  {
    annee: 2023,
    court: 'Borne',
    nom: 'Réforme de 2023',
    mesures: [
      'Âge légal relevé progressivement de 62 à 64 ans (3 mois par génération)',
      'Accélération du passage à 43 ans de cotisation (génération 1965)',
      'Fermeture des principaux régimes spéciaux aux nouveaux embauchés',
    ],
  },
  {
    annee: 2026,
    court: 'Suspension',
    nom: 'Suspension (LFSS 2026)',
    mesures: [
      'Âge légal gelé à 62 ans et 9 mois et durée à 170 trimestres jusqu’en 2028',
      'Reprise ensuite du calendrier, décalé d’un trimestre par génération',
    ],
  },
];
