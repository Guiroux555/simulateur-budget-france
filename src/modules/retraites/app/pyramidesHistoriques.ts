/**
 * Pyramides 1945-2024 réparties entre actifs en emploi, retraités et autres, pour prolonger
 * l'animation de la pyramide dans le passé. Reconstitution approximative : population
 * rétro-projetée depuis 2025, départs selon l'âge moyen observé (DREES), chômage observé,
 * puis effectif d'actifs recalé sur le nombre observé de cotisants par retraité.
 */
import type { ResultatAnnee } from '../engine';
import { HISTORIQUE } from '../engine/donnees/historique';
import { pyramidesHistoriques } from '../../../socle/donnees/population2025';
import { effectifs } from '../engine/modele';
import { valeurA } from '../../../socle/trajectoire';

export type EtatPyramide = Pick<
  ResultatAnnee,
  'annee' | 'population' | 'pyramide' | 'pyramideRetraites' | 'pyramideCotisants' | 'cotisants' | 'retraites' | 'ratioCotisantsRetraites' | 'ageLegal'
> & { reconstitue?: boolean };

/** Taux de chômage observé (INSEE, au sens du BIT, ordres de grandeur). */
const CHOMAGE_OBSERVE = [
  [1950, 0.02],
  [1970, 0.025],
  [1975, 0.04],
  [1980, 0.065],
  [1985, 0.1],
  [1990, 0.085],
  [1994, 0.105],
  [2000, 0.085],
  [2008, 0.074],
  [2013, 0.103],
  [2015, 0.104],
  [2019, 0.084],
  [2022, 0.073],
  [2024, 0.074],
] as const;

const somme = (v: Float64Array) => v.reduce((s, x) => s + x, 0);

let cache: Map<number, EtatPyramide> | null = null;

export function etatsPyramidesHistoriques(): Map<number, EtatPyramide> {
  if (cache) return cache;
  const ageDepart = (annee: number) => valeurA(HISTORIQUE.ageMoyenDepart.points, annee);
  const out = new Map<number, EtatPyramide>();
  for (const [annee, population] of pyramidesHistoriques()) {
    const eff = effectifs(population, annee, ageDepart, valeurA(CHOMAGE_OBSERVE, annee), 0);
    const retraites = somme(eff.retraites);
    // Recalage du nombre d'actifs en emploi sur le rapport observé cotisants / retraités.
    const ratioObserve = valeurA(HISTORIQUE.ratioCotisantsRetraites.points, annee);
    const facteur = (ratioObserve * retraites) / somme(eff.cotisants);
    const cotisants = Array.from(eff.cotisants, (c, a) => Math.min(population[a] - eff.retraites[a], c * facteur));
    const totalCotisants = cotisants.reduce((s, x) => s + x, 0);
    out.set(annee, {
      annee,
      population: somme(population),
      pyramide: Array.from(population),
      pyramideRetraites: Array.from(eff.retraites),
      pyramideCotisants: cotisants,
      cotisants: totalCotisants,
      retraites,
      ratioCotisantsRetraites: totalCotisants / retraites,
      ageLegal: valeurA(HISTORIQUE.ageLegal.points, annee),
      reconstitue: true,
    });
  }
  cache = out;
  return out;
}

/** Personnes en emploi pour une personne sans emploi (retraités, jeunes, chômeurs, autres inactifs). */
export function ratioActifsInactifs(e: Pick<EtatPyramide, 'population' | 'cotisants'>): number {
  return e.cotisants / (e.population - e.cotisants);
}

/** Série reconstituée 1945-2024 du rapport actifs en emploi / inactifs. */
export function serieActifsInactifsHistorique(): Array<{ x: number; y: number }> {
  return [...etatsPyramidesHistoriques().values()].sort((a, b) => a.annee - b.annee).map((e) => ({ x: e.annee, y: ratioActifsInactifs(e) }));
}
