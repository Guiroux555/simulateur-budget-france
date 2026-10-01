/**
 * Évolution par régime, 2000-2070 — ESTIMATIONS.
 *
 * Aucune série officielle par régime n'a pu être téléchargée. Les trajectoires sont construites
 * à partir de points d'ancrage (chiffres 2024 de `regimes.ts`, points publiés lorsqu'ils existent)
 * reliés linéairement, puis mises en cohérence avec l'agrégat du simulateur :
 *  - les parts des dépenses par régime sont normalisées pour sommer à 100 % ;
 *  - le solde du régime général est calculé comme le solde total moins celui des autres régimes
 *    (cohérent avec le COR 2026 : régime général ≈ −2 % du PIB en 2070, autres régimes > −0,3 %) ;
 *  - après 2024, le nombre de cotisants par retraité de chaque régime suit l'évolution d'ensemble,
 *    sauf régimes fermés (extinction) et CNRACL (dégradation propre).
 */
import type { Point } from './historique';

export interface TrajectoireRegime {
  /** Part des dépenses totales de retraite (%), points d'ancrage avant normalisation. */
  partDepenses: Point[];
  /** Solde en % du PIB ; null pour le régime général (calculé par différence). */
  soldePctPib: Point[] | null;
  /** Cotisants pour un retraité : points observés (≤ 2024) ; projection selon `projectionRatio`. */
  ratioObserve: Point[];
  projectionRatio: 'ensemble' | 'extinction' | 'cnracl' | 'aucune';
}

export const TRAJECTOIRES_REGIMES: Record<string, TrajectoireRegime> = {
  cnav: {
    partDepenses: [[2000, 39], [2024, 41.5], [2070, 44]],
    soldePctPib: null,
    ratioObserve: [[2000, 1.6], [2010, 1.45], [2019, 1.33], [2024, 1.41]],
    projectionRatio: 'ensemble',
  },
  'agirc-arrco': {
    partDepenses: [[2000, 24], [2024, 24.5], [2070, 26]],
    soldePctPib: [[2000, 0.001], [2013, -0.0015], [2019, 0.0005], [2024, 0.0005], [2050, 0.0005], [2070, 0]],
    ratioObserve: [[2000, 1.9], [2010, 1.7], [2024, 1.5]],
    projectionRatio: 'ensemble',
  },
  fpe: {
    partDepenses: [[2000, 16], [2024, 15.5], [2070, 13]],
    soldePctPib: [[2000, 0]],
    ratioObserve: [[2000, 1.4], [2010, 1.1], [2024, 0.9]],
    projectionRatio: 'ensemble',
  },
  cnracl: {
    partDepenses: [[2000, 4.5], [2024, 6.75], [2070, 8.5]],
    // Excédentaire jusqu'en 2017, déficits ensuite ; hausse des cotisations employeurs 2025-2028.
    soldePctPib: [[2000, 0.0005], [2017, 0], [2024, -0.001], [2030, -0.0015], [2070, -0.002]],
    // CNRACL : 4,53 au début des années 1980, 1,54 en 2020, 1,44 en 2022 (rapports IGAS, CNRACL).
    ratioObserve: [[2000, 3.0], [2010, 2.2], [2020, 1.54], [2022, 1.44], [2024, 1.5]],
    projectionRatio: 'cnracl',
  },
  speciaux: {
    partDepenses: [[2000, 7], [2024, 4], [2070, 1.5]],
    soldePctPib: [[2000, 0]],
    ratioObserve: [[2000, 0.75], [2010, 0.65], [2024, 0.6]],
    projectionRatio: 'extinction',
  },
  'msa-exploitants': {
    partDepenses: [[2000, 3.5], [2024, 2], [2070, 1.2]],
    soldePctPib: [[2000, 0]],
    ratioObserve: [[2000, 0.5], [2010, 0.4], [2024, 0.35]],
    projectionRatio: 'ensemble',
  },
  liberaux: {
    partDepenses: [[2000, 1], [2024, 1.5], [2070, 2]],
    soldePctPib: [[2000, 0.0003], [2024, 0.0003], [2070, 0]],
    ratioObserve: [[2000, 2.8], [2010, 2.4], [2024, 2.0]],
    projectionRatio: 'ensemble',
  },
  'autres-complementaires': {
    partDepenses: [[2000, 5], [2024, 4.25], [2070, 3.8]],
    soldePctPib: [[2000, 0.0005], [2024, 0.0008], [2070, 0]],
    ratioObserve: [],
    projectionRatio: 'aucune',
  },
};

export const STATUT_REGIMES_TEMPS =
  'Estimations : trajectoires reconstituées à partir des chiffres 2024, de quelques points publiés (CNRACL, COR 2026) et de l’évolution d’ensemble du simulateur ; à remplacer par les séries officielles par régime.';
