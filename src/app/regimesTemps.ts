/**
 * Séries par régime 2000-2070 (estimations), cohérentes avec l'agrégat du simulateur.
 */
import type { ResultatSimulation } from '../engine';
import { HISTORIQUE, type Point } from '../engine/donnees/historique';
import { REGIMES } from '../engine/donnees/regimes';
import { etatsPyramidesHistoriques } from './pyramidesHistoriques';
import { CONTRIBUTIONS_EQUILIBRE_PCT_PIB, TRAJECTOIRES_REGIMES } from '../engine/donnees/regimesTemps';
import { valeurA } from '../engine/trajectoire';

export const ANNEE_DEBUT_REGIMES = 2000;
export const ANNEE_FIN_REGIMES = 2070;
const ANNEE_BASCULE = 2025;

export interface SerieRegime {
  id: string;
  /** Par année : part des dépenses (%), dépenses (% PIB), solde (% PIB), cotisants par retraité. */
  annees: Array<{
    annee: number;
    part: number;
    depensesPctPib: number;
    soldePctPib: number;
    ratio: number | null;
    /** Retraités de droit direct (millions). */
    retraites: number | null;
    /** Cotisants (millions). */
    cotisants: number | null;
    /** Cotisations / pensions. */
    couverture: number | null;
    /** Cotisation moyenne par cotisant, € 2025 par an. */
    cotisationMoyenne: number | null;
    /** Pension moyenne versée par le régime à chacun de ses retraités, € 2025 par an. */
    pensionMoyenne: number | null;
  }>;
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
      return {
        annee: a,
        part,
        depensesPctPib: (part / 100) * dep,
        soldePctPib: solde,
        ratio,
        retraites: null as number | null,
        cotisants: null as number | null,
        couverture: null as number | null,
        cotisationMoyenne: null as number | null,
        pensionMoyenne: null as number | null,
        residuel: t.soldePctPib === null,
      };
    });
    for (const l of lignes) if (l.residuel) l.soldePctPib = totalSolde(a) - soldeAutres;
    lignes.forEach(({ residuel: _r, ...l }, i) => series[i].annees.push(l));
  }
  enrichir(series, simulation);
  const contributionsEquilibre = [];
  for (let a = ANNEE_BASCULE; a <= ANNEE_FIN_REGIMES; a++) contributionsEquilibre.push({ x: a, y: interp(CONTRIBUTIONS_EQUILIBRE_PCT_PIB, a) });
  return { regimes: series, contributionsEquilibre };
}

/** PIB en volume, Md€ de 2025 (ordres de grandeur INSEE) avant la période projetée. */
const PIB_REEL: Point[] = [
  [2000, 2250],
  [2008, 2470],
  [2009, 2400],
  [2019, 2800],
  [2020, 2580],
  [2024, 2900],
];

/** Régimes dont les cotisations sont la ressource principale : la couverture suit leur solde. */
const AUTONOMES = new Set(['agirc-arrco', 'cnracl', 'liberaux']);
/** Régimes dont les cotisations suivent le nombre de cotisants (subventions ou transferts pour le reste). */
const COTISATIONS_SUIVENT_EFFECTIFS = new Set(['speciaux', 'msa-exploitants']);

/**
 * Ajoute retraités, cotisants, couverture et montants moyens, à partir des valeurs 2024 de chaque
 * régime (`regimes.ts`) et de l'évolution d'ensemble (retraités, PIB) — estimations.
 */
function enrichir(series: SerieRegime[], simulation: ResultatSimulation) {
  const historiques = etatsPyramidesHistoriques();
  const retraitesTotal = (a: number) =>
    a < ANNEE_BASCULE ? historiques.get(a)!.retraites : simulation.annees.find((r) => r.annee === a)!.retraites;
  const pib = (a: number) => (a < ANNEE_BASCULE ? interp(PIB_REEL, a) : simulation.annees.find((r) => r.annee === a)!.pib);
  const r2024 = retraitesTotal(2024);

  for (const serie of series) {
    const regime = REGIMES.find((r) => r.id === serie.id)!;
    if (regime.retraites === null || regime.cotisations === null) continue;
    const l2024 = serie.annees.find((l) => l.annee === 2024)!;
    const couverture2024 = regime.cotisations / regime.depenses;
    for (const l of serie.annees) {
      const retraites = regime.retraites * (l.part / l2024.part) * (retraitesTotal(l.annee) / r2024);
      const depenses = l.depensesPctPib * pib(l.annee); // Md€ 2025
      let couverture = couverture2024;
      if (AUTONOMES.has(serie.id)) couverture = couverture2024 + l.soldePctPib / l.depensesPctPib - l2024.soldePctPib / l2024.depensesPctPib;
      else if (COTISATIONS_SUIVENT_EFFECTIFS.has(serie.id) && l.ratio !== null && l2024.ratio)
        couverture = couverture2024 * (l.ratio / l2024.ratio);
      const cotisants = l.ratio !== null ? l.ratio * retraites : null;
      l.retraites = retraites;
      l.cotisants = cotisants;
      l.couverture = couverture;
      l.pensionMoyenne = (depenses * 1e3) / retraites;
      l.cotisationMoyenne = cotisants ? (couverture * depenses * 1e3) / cotisants : null;
    }
  }
}
