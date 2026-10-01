/**
 * Séries par régime 2000-2070 (estimations), cohérentes avec l'agrégat du simulateur.
 */
import type { ResultatSimulation } from '../engine';
import { HISTORIQUE, type Point } from '../engine/donnees/historique';
import { REGIMES } from '../engine/donnees/regimes';
import { CONTRIBUTIONS_EQUILIBRE_PCT_PIB, TRAJECTOIRES_REGIMES } from '../engine/donnees/regimesTemps';
import { valeurA } from '../engine/trajectoire';

export const ANNEE_DEBUT_REGIMES = 2000;
export const ANNEE_FIN_REGIMES = 2070;
const ANNEE_BASCULE = 2025;

export interface SerieRegime {
  id: string;
  /** Par année : part des dépenses (%), dépenses (% PIB), solde (% PIB), cotisants par retraité. */
  annees: Array<{ annee: number; part: number; depensesPctPib: number; soldePctPib: number; ratio: number | null }>;
}

export interface RegimesDansLeTemps {
  regimes: SerieRegime[];
  contributionsEquilibre: Array<{ x: number; y: number }>;
}

const interp = (p: ReadonlyArray<Point>, x: number) => valeurA(p, x);

export function regimesDansLeTemps(simulation: ResultatSimulation): RegimesDansLeTemps {
  const sim = (a: number) => simulation.annees.find((r) => r.annee === a)!;
  const totalDepenses = (a: number) => (a < ANNEE_BASCULE ? interp(HISTORIQUE.depensesPctPib.points, a) : sim(a).depensesPctPib);
  const totalSolde = (a: number) => (a < ANNEE_BASCULE ? interp(HISTORIQUE.soldePctPib.points, a) : sim(a).soldePctPib);
  const ensemble2025 = sim(ANNEE_BASCULE).ratioCotisantsRetraites;
  const evolutionEnsemble = (a: number) => sim(a).ratioCotisantsRetraites / ensemble2025;

  const ids = REGIMES.map((r) => r.id);
  const series: SerieRegime[] = ids.map((id) => ({ id, annees: [] }));
  for (let a = ANNEE_DEBUT_REGIMES; a <= ANNEE_FIN_REGIMES; a++) {
    const brutes = ids.map((id) => interp(TRAJECTOIRES_REGIMES[id].partDepenses, a));
    const somme = brutes.reduce((s, x) => s + x, 0);
    const dep = totalDepenses(a);
    let soldeAutres = 0;
    const lignes = ids.map((id, i) => {
      const t = TRAJECTOIRES_REGIMES[id];
      const part = (100 * brutes[i]) / somme;
      const solde = t.soldePctPib === null ? 0 : interp(t.soldePctPib, a);
      if (t.soldePctPib !== null) soldeAutres += solde;
      let ratio: number | null = null;
      if (t.ratioObserve.length) {
        const r2024 = interp(t.ratioObserve, 2024);
        if (a <= 2024) ratio = interp(t.ratioObserve, a);
        else if (t.projectionRatio === 'ensemble') ratio = r2024 * evolutionEnsemble(a);
        else if (t.projectionRatio === 'extinction') ratio = r2024 * Math.max(0, 1 - (a - 2024) / 38);
        else if (t.projectionRatio === 'cnracl') ratio = r2024 * evolutionEnsemble(a) * (1 - 0.25 * Math.min(1, (a - 2024) / 20));
      }
      return { annee: a, part, depensesPctPib: (part / 100) * dep, soldePctPib: solde, ratio, residuel: t.soldePctPib === null };
    });
    for (const l of lignes) if (l.residuel) l.soldePctPib = totalSolde(a) - soldeAutres;
    lignes.forEach(({ residuel: _r, ...l }, i) => series[i].annees.push(l));
  }
  const contributionsEquilibre = [];
  for (let a = ANNEE_BASCULE; a <= ANNEE_FIN_REGIMES; a++) contributionsEquilibre.push({ x: a, y: interp(CONTRIBUTIONS_EQUILIBRE_PCT_PIB, a) });
  return { regimes: series, contributionsEquilibre };
}
