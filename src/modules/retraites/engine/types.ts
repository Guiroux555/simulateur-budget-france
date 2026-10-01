/**
 * Types du moteur de projection du système de retraite (tous régimes agrégés).
 *
 * Conventions :
 * - les montants sont en euros constants 2025 (Md€ 2025) ; l'inflation n'intervient
 *   que pour traduire les mesures d'indexation exprimées en nominal (gel des pensions) ;
 * - les taux sont exprimés en fraction (0.007 = 0,7 %), sauf mention contraire ;
 * - une « trajectoire » est une liste de points [année, valeur] interpolés linéairement,
 *   la valeur étant constante avant le premier point et après le dernier.
 */

import type { Trajectoire } from '../../../socle/trajectoire';

export type { Trajectoire };

/** Hypothèses sur « le monde » : démographie et économie. */
export interface Hypotheses {
  /** Indicateur conjoncturel de fécondité (enfants par femme). */
  fecondite: Trajectoire;
  /** Espérance de vie à la naissance, deux sexes confondus (années). */
  esperanceVie: Trajectoire;
  /** Solde migratoire annuel (personnes). */
  soldeMigratoire: Trajectoire;
  /** Croissance annuelle de la productivité du travail (réelle). */
  productivite: Trajectoire;
  /** Taux de chômage (fraction de la population active). */
  chomage: Trajectoire;
  /** Inflation annuelle (sert à traduire un gel nominal des pensions). */
  inflation: Trajectoire;
}

/** Mode d'introduction d'une part de capitalisation. */
export type ModeCapitalisation =
  /** Cotisation supplémentaire, rente qui s'ajoute à la pension par répartition. */
  | 'additionnel'
  /** Part des cotisations détournée vers des comptes individuels ; la rente remplace une part de la pension par répartition. */
  | 'substitutif'
  /** Fonds collectif (type FRR) alimenté par une cotisation dédiée et dont les revenus financent la répartition. */
  | 'fonds-reserve';

export interface LevierCapitalisation {
  /** Taux de cotisation dédié, en points de la masse des revenus d'activité (0.02 = 2 pts). */
  taux: number;
  mode: ModeCapitalisation;
  anneeDebut: number;
  /** Rendement réel annuel net de frais. */
  rendementReel: number;
  /** Durée moyenne de service de la rente (années). */
  dureeRente: number;
}

/** Leviers de politique publique. Tous neutres par défaut (= scénario de référence). */
export interface Leviers {
  /**
   * Âge légal d'ouverture des droits. `null` = législation de référence
   * (suspension LFSS 2026 puis reprise du calendrier 2023 décalé d'un trimestre).
   */
  ageLegal: Trajectoire | null;
  /** Allongement de la durée d'assurance requise par rapport à la référence (années, peut être négatif). */
  dureeSupplementaire: Trajectoire;
  /** Hausse du taux de prélèvement finançant la répartition (points de masse salariale, fraction). */
  hausseTauxCotisation: Trajectoire;
  /** Ressources externes affectées (CSG, TVA, budget de l'État…), en points de PIB (fraction). */
  ressourcesExternes: Trajectoire;
  /** Écart d'indexation des pensions liquidées par rapport aux prix (−0.01 = prix − 1 pt). */
  sousIndexation: Trajectoire;
  /** Années de gel nominal des pensions (revalorisation nulle). */
  anneesGel: ReadonlyArray<number>;
  /** Variation du taux de remplacement à la liquidation (−0.05 = pensions nouvelles 5 % plus basses). */
  ajustementPensionLiquidation: Trajectoire;
  /** Variation du taux d'emploi des 55-69 ans non retraités (points, fraction). */
  hausseEmploiSeniors: Trajectoire;
  /** Variation du taux d'activité des 20-64 ans non retraités (points, fraction) : agit sur le rapport actifs/inactifs. */
  hausseActivite: Trajectoire;
  capitalisation: LevierCapitalisation | null;
}

export interface Scenario {
  hypotheses: Hypotheses;
  leviers: Leviers;
  anneeDebut: number;
  anneeFin: number;
}

/** Résultats d'une année de projection. */
export interface ResultatAnnee {
  annee: number;
  population: number;
  /** Personnes de 20-64 ans pour une personne de 65 ans ou plus. */
  rapportDemographique: number;
  naissances: number;
  esperanceVie: number;
  ageLegal: number;
  /** Âge moyen effectif de départ à la retraite. */
  ageMoyenDepart: number;
  cotisants: number;
  retraites: number;
  /** Nombre de cotisants pour un retraité. */
  ratioCotisantsRetraites: number;
  /** Croissance de la productivité du travail retenue pour l'année (hypothèse). */
  productivite: number;
  /** Revenu d'activité moyen (€ 2025 / an). */
  revenuActiviteMoyen: number;
  /** Pension moyenne par répartition (€ 2025 / an). */
  pensionMoyenne: number;
  /** Pension moyenne par répartition / revenu d'activité moyen. */
  pensionRelative: number;
  /** Pension d'un nouveau retraité de l'année / revenu d'activité moyen (répartition seule). */
  pensionLiquidationRelative: number;
  /** Espérance de vie à 60 ans (table de l'année). */
  esperanceVie60: number;
  /** Espérance de vie à 65 ans (table de l'année). */
  esperanceVie65: number;
  /** Espérance de vie à l'âge moyen de départ (table de l'année) : durée de retraite attendue. */
  esperanceVieADepart: number;
  /** Idem, en incluant la rente de capitalisation éventuelle. */
  pensionRelativeTotale: number;
  pib: number;
  depenses: number;
  ressources: number;
  solde: number;
  depensesPctPib: number;
  ressourcesPctPib: number;
  soldePctPib: number;
  /** Dette (> 0) ou réserves (< 0) cumulées du système depuis l'année de début, Md€ 2025. */
  detteCumulee: number;
  detteCumuleePctPib: number;
  /** Encours du fonds de capitalisation, Md€ 2025. */
  fondsCapitalisation: number;
  /** Rentes de capitalisation versées dans l'année, Md€ 2025. */
  rentesCapitalisation: number;
  /** Cotisations versées au dispositif de capitalisation dans l'année, Md€ 2025. */
  cotisationsCapitalisation: number;
  /** Population par âge simple (0 à 105 ans et plus). */
  pyramide: number[];
  /** Retraités par âge simple. */
  pyramideRetraites: number[];
  /** Actifs en emploi (cotisants) par âge simple. */
  pyramideCotisants: number[];
}

export interface ResultatSimulation {
  scenario: Scenario;
  annees: ResultatAnnee[];
}
