import { HISTORIQUE, REFORMES } from '../engine/donnees/historique';
import type { ResultatAnnee, ResultatSimulation } from '../engine';
import type { RepereReforme, Serie } from './charts/Courbes';

export const ANNEE_DEBUT_HISTORIQUE = 1995;
export const ANNEE_PROJECTION = 2025;

type CleHistorique = keyof typeof HISTORIQUE;

/** Série observée (points d'ancrage approximatifs). */
export function serieObservee(cle: CleHistorique, nom = 'Observé'): Serie {
  return {
    id: `hist-${cle}`,
    nom,
    couleur: 'var(--hist)',
    approximatif: true,
    valeurs: HISTORIQUE[cle].points.filter(([a]) => a >= ANNEE_DEBUT_HISTORIQUE && a < ANNEE_PROJECTION).map(([x, y]) => ({ x, y })),
  };
}

/** Réformes à afficher en repères sur un graphique couvrant la période. */
export const REPERES_REFORMES: RepereReforme[] = REFORMES.filter((r) => r.annee >= ANNEE_DEBUT_HISTORIQUE).map(({ annee, court, nom }) => ({
  annee,
  court,
  nom,
}));

export const serieProjetee = (s: ResultatSimulation, f: (r: ResultatAnnee) => number) => s.annees.map((r) => ({ x: r.annee, y: f(r) }));

/**
 * Prolonge une série projetée par la série observée correspondante lorsque l'historique est affiché.
 * Renvoie les séries à tracer et les options d'axe (séparation, réformes).
 */
export function avecHistorique(
  afficher: boolean,
  cle: CleHistorique | null,
  series: Serie[],
): { series: Serie[]; separation?: number; reformes: RepereReforme[] } {
  if (!afficher) return { series, reformes: [] };
  return {
    series: cle ? [serieObservee(cle), ...series] : series,
    separation: ANNEE_PROJECTION,
    reformes: REPERES_REFORMES,
  };
}
