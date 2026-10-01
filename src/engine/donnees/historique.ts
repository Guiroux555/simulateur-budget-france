/**
 * Historique 1995-2024 et réformes des retraites.
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
      [1995, 0.119],
      [2000, 0.116],
      [2005, 0.124],
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
    source: 'COR (rapports annuels), FIPECO ; 2020 : 14,7 %, 2024 : 13,9 % ; +2 pts de PIB entre 1995 et 2024',
  },
  /** Solde du système de retraite, en % du PIB (série COR disponible à partir de 2002). */
  soldePctPib: {
    points: [
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
    source: 'COR ; 2010 : −0,7 %, 2018 : −0,1 %, 2023 : +0,1 %, 2024 : −0,1 % ; années intermédiaires approximatives',
  },
  /** Nombre de cotisants pour un retraité. */
  ratioCotisantsRetraites: {
    points: [
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
  /** Âge légal d'ouverture des droits (régime général), par année civile. */
  ageLegal: {
    points: [
      [1995, 60],
      [2011, 60],
      [2017, 62],
      [2023, 62],
      [2025, 62.75],
    ],
    source: 'Législation (réformes de 2010 et 2023)',
  },
} satisfies Record<string, SerieHistorique>;

export interface Reforme {
  annee: number;
  /** Libellé court pour les graphiques. */
  court: string;
  nom: string;
  mesures: string[];
}

/** Principales réformes des retraites depuis 1993. */
export const REFORMES: Reforme[] = [
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
