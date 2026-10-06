/**
 * Trajectoire de référence de la dette publique : scénario de référence (baseline) du Debt
 * Sustainability Monitor 2025 de la Commission européenne, fiche pays France
 * (`data/commission/dsm-2025-fr.json`). Projection sur 10 ans, mise à jour à chaque édition annuelle.
 */
import dsm from '../../../../data/commission/dsm-2025-fr.json';
import type { ReferenceDette } from './types';

type Serie = Record<string, number>;
const s = dsm.series as Record<string, Serie>;
const ANNEE_DEPART = 2025;
const annees = Object.keys(s.dettePctPib)
  .map(Number)
  .filter((a) => a > ANNEE_DEPART)
  .sort((a, b) => a - b);
/** Valeurs de la Commission, en points de pourcentage, converties en fractions. */
const fractions = (serie: Serie) => annees.map((a) => serie[a] / 100);

export const REFERENCE_DETTE: ReferenceDette = {
  source: dsm.source,
  provisoire: false,
  anneeDepart: ANNEE_DEPART,
  detteDepartPctPib: s.dettePctPib[ANNEE_DEPART] / 100,
  annees,
  soldePrimairePctPib: fractions(s.soldePrimairePctPib),
  tauxInteretApparent: fractions(s.tauxInteretImplicitePct),
  // Croissance nominale = (1 + croissance réelle) × (1 + inflation) − 1.
  croissanceNominale: annees.map((a) => (1 + s.croissanceReellePct[a] / 100) * (1 + s.inflationPct[a] / 100) - 1),
  ajustementStockFluxPctPib: fractions(s.ajustementStockFluxPctPib),
  cibleDettePctPib: Object.fromEntries(annees.map((a) => [a, s.dettePctPib[a] / 100])),
};
