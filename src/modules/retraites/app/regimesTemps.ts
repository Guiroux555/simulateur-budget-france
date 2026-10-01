/**
 * Séries par régime 2000-2070 (estimations), cohérentes avec l'agrégat du simulateur.
 */
import type { ResultatSimulation } from '../engine';
import { HISTORIQUE, type Point } from '../engine/donnees/historique';
import { REGIMES } from '../engine/donnees/regimes';
import { etatsPyramidesHistoriques } from './pyramidesHistoriques';
import { TRAJECTOIRES_REGIMES } from '../engine/donnees/regimesTemps';
import { valeurA } from '../../../socle/trajectoire';

export const ANNEE_DEBUT_REGIMES = 2000;
export const ANNEE_FIN_REGIMES = 2070;
const ANNEE_BASCULE = 2025;

export interface SerieRegime {
  id: string;
  /** Par année : part des dépenses (%), dépenses (% PIB), solde (% PIB), cotisants par retraité. */
  annees: Array<{
    annee: number;
    part: number;
    /** Part avant les leviers des régimes par points (sert à estimer les effectifs). */
    partBase: number;
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

/** Leviers propres aux régimes par points (Agirc-Arrco, professions libérales, Ircantec…). */
export interface LeviersRegimes {
  /** Revalorisation annuelle de la valeur de service du point par rapport à l'inflation (fraction ; −0.01 = prix − 1 pt). */
  revalorisationPoint: number;
  /** Variation du rendement des nouveaux points acquis (fraction ; −0.1 = 10 % de droits en moins par euro cotisé). */
  rendementPoint: number;
}

export const LEVIERS_REGIMES_NEUTRES: LeviersRegimes = { revalorisationPoint: 0, rendementPoint: 0 };

/** Régimes fonctionnant par points. */
export const REGIMES_PAR_POINTS = new Set(['agirc-arrco', 'liberaux', 'autres-complementaires']);
const ANNEE_EFFET = 2026;

export interface RegimesDansLeTemps {
  regimes: SerieRegime[];
  /** Totaux tous régimes, leviers par points compris (% du PIB). */
  totaux: Array<{ annee: number; soldePctPib: number; depensesPctPib: number }>;
}

const interp = (p: ReadonlyArray<Point>, x: number) => valeurA(p, x);

export function regimesDansLeTemps(simulation: ResultatSimulation, leviers: LeviersRegimes = LEVIERS_REGIMES_NEUTRES): RegimesDansLeTemps {
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
        partBase: part,
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
  const totaux = appliquerLeviersPoints(series, leviers, totalDepenses, totalSolde);
  enrichir(series, simulation);
  return { regimes: series, totaux };
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
      const retraites = regime.retraites * (l.partBase / l2024.partBase) * (retraitesTotal(l.annee) / r2024);
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

/**
 * Effet des leviers des régimes par points : la valeur du point (revalorisation des pensions en cours)
 * agit sur toutes les pensions, le rendement sur les droits acquis à partir de 2026 (montée en charge
 * sur 40 ans). À cotisations inchangées, l'écart de dépenses se reporte sur le solde du régime.
 */
function appliquerLeviersPoints(
  series: SerieRegime[],
  leviers: LeviersRegimes,
  totalDepenses: (a: number) => number,
  totalSolde: (a: number) => number,
) {
  const totaux: RegimesDansLeTemps['totaux'] = [];
  for (let a = ANNEE_DEBUT_REGIMES; a <= ANNEE_FIN_REGIMES; a++) {
    let ecartDepenses = 0;
    const lignes = series.map((s) => s.annees.find((l) => l.annee === a)!);
    if (a >= ANNEE_EFFET) {
      const n = a - ANNEE_EFFET + 1;
      const facteur = Math.pow(1 + leviers.revalorisationPoint, n) * (1 + leviers.rendementPoint * Math.min(1, n / 40));
      series.forEach((s, i) => {
        if (!REGIMES_PAR_POINTS.has(s.id)) return;
        const l = lignes[i];
        const nouvelles = l.depensesPctPib * facteur;
        ecartDepenses += nouvelles - l.depensesPctPib;
        l.soldePctPib -= nouvelles - l.depensesPctPib;
        l.depensesPctPib = nouvelles;
      });
    }
    const depenses = totalDepenses(a) + ecartDepenses;
    for (const l of lignes) l.part = (100 * l.depensesPctPib) / depenses;
    totaux.push({ annee: a, depensesPctPib: depenses, soldePctPib: totalSolde(a) - ecartDepenses });
  }
  return totaux;
}
