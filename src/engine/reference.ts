/**
 * Scénario de référence (hypothèses du COR, juin 2026) et paramètres de calibrage.
 * Voir docs/retraites/METHODOLOGIE.md.
 */
import type { Hypotheses, Leviers, Scenario, Trajectoire } from './types';
import { constante, nulle } from './trajectoire';

export const ANNEE_BASE = 2025;
export const ANNEE_FIN = 2070;

/** Hypothèses du scénario de référence du COR 2026 (productivité 0,7 %, chômage 7 %). */
export const HYPOTHESES_COR_2026: Hypotheses = {
  fecondite: [
    [2025, 1.56],
    [2028, 1.45],
  ],
  // Paramètre de calage : la mortalité simplifiée (sexes confondus, loi de Gompertz) requiert une
  // espérance de vie 2070 plus élevée que celle de l'INSEE (≈ 88-89 ans) pour reproduire le
  // vieillissement projeté par le COR (20-64 ans / 65 ans et + = 1,62 en 2070). À revoir avec
  // les tables INSEE par sexe.
  esperanceVie: [
    [2025, 83.2],
    [2070, 91.0],
  ],
  soldeMigratoire: [
    [2025, 120_000],
    [2026, 150_000],
  ],
  productivite: [
    [2025, 0.004],
    [2032, 0.007],
  ],
  chomage: [
    [2025, 0.075],
    [2030, 0.07],
  ],
  inflation: constante(0.0175),
};

/** Variantes de productivité proposées en préréglage (le COR étudie plusieurs scénarios). */
export const VARIANTES_PRODUCTIVITE: Record<string, Trajectoire> = {
  '0,4 %': [
    [2025, 0.004],
  ],
  '0,7 % (référence COR)': HYPOTHESES_COR_2026.productivite,
  '1,0 %': [
    [2025, 0.004],
    [2032, 0.01],
  ],
  '1,3 %': [
    [2025, 0.004],
    [2032, 0.013],
  ],
};

/**
 * Âge légal de référence par année civile : suspension de la réforme 2023 par la LFSS 2026
 * (62 ans et 9 mois), puis reprise du calendrier décalé d'un trimestre par génération
 * jusqu'à 64 ans (génération 1969).
 */
export const AGE_LEGAL_REFERENCE: Trajectoire = [
  [2025, 62.75],
  [2027, 62.75],
  [2028, 63.0],
  [2033, 64.0],
];

export const LEVIERS_NEUTRES: Leviers = {
  ageLegal: null,
  dureeSupplementaire: nulle,
  hausseTauxCotisation: nulle,
  ressourcesExternes: nulle,
  sousIndexation: nulle,
  anneesGel: [],
  ajustementPensionLiquidation: nulle,
  hausseEmploiSeniors: nulle,
  hausseActivite: nulle,
  capitalisation: null,
};

export function scenarioReference(): Scenario {
  return {
    hypotheses: HYPOTHESES_COR_2026,
    leviers: LEVIERS_NEUTRES,
    anneeDebut: ANNEE_BASE,
    anneeFin: ANNEE_FIN,
  };
}

/** Paramètres structurels du modèle, calibrés sur le scénario de référence du COR 2026. */
export const CALIBRAGE = {
  /** Dépenses de retraite de l'année de base (Md€). */
  depensesBase: 422,
  /** Dépenses / PIB de l'année de base. */
  depensesPctPibBase: 0.141,
  /** Pension moyenne / revenu d'activité moyen de l'année de base. */
  pensionRelativeBase: 0.546,
  /**
   * Ressources du système en % du PIB à législation inchangée (trajectoire du COR) :
   * leur recul tient aux conventions comptables (contributions de l'État, transferts).
   */
  ressourcesReferencePctPib: [
    [2025, 0.139],
    [2030, 0.1385],
    [2045, 0.133],
    [2070, 0.129],
  ] as Trajectoire,
  /** Écart entre âge moyen effectif de départ et âge légal de référence. */
  ecartAgeEffectif: [
    [2025, 0.2],
    [2040, 0.3],
    [2070, 0.3],
  ] as Trajectoire,
  /** Dispersion (échelle logistique) des âges de départ autour de la moyenne. */
  dispersionDepart: 1.0,
  /**
   * Report de l'âge effectif pour un an de report de l'âge légal : une partie des assurés part
   * déjà après l'âge légal (décote, durée), d'autres avant (carrières longues, invalidité).
   */
  transmissionAgeLegal: 0.6,
  /** Report de l'âge effectif pour un an de durée d'assurance requise en plus. */
  transmissionDuree: 0.5,
  /** Gain de pension à la liquidation par année de départ plus tardive (proratisation, surcote). */
  gainPensionParAnnee: 0.03,
  /**
   * Décalage moyen (années) entre la liquidation et les revenus d'activité qui servent de base
   * au calcul de la pension (revalorisés sur les prix) : c'est par ce canal que la croissance
   * de la productivité fait baisser la pension relative.
   */
  decalageSalaireReference: 14,
  /**
   * Érosion annuelle du taux de remplacement à la liquidation, à législation inchangée :
   * résume les règles indexées sur les prix plutôt que sur les salaires (rendement des points
   * Agirc-Arrco, minimum contributif, salaires portés au compte…). Calibrée sur la baisse de la
   * pension relative projetée par le COR.
   */
  erosionLiquidation: 0.0062,
  /** Croissance réelle annuelle passée des revenus d'activité (sert à reconstituer l'historique). */
  croissanceHistoriqueSalaires: 0.008,
  /** Décroissance de la pension moyenne avec l'âge dans le stock initial (effet noria). */
  penteStockInitial: 0.002,
  /** Taux d'activité par âge des personnes non retraitées (hors chômage). */
  activiteParAge: [
    [15, 0.08],
    [19, 0.3],
    [22, 0.62],
    [26, 0.86],
    [30, 0.89],
    [50, 0.89],
    [55, 0.84],
    [60, 0.68],
    [64, 0.6],
    [70, 0.35],
    [75, 0.0],
  ] as Trajectoire,
  /** Taux d'intérêt réel appliqué à la dette (ou aux réserves) cumulée. */
  tauxInteretReel: 0.01,
  /** Maturité (années) d'un dispositif de capitalisation par comptes individuels. */
  maturiteCapitalisation: 40,
} as const;
