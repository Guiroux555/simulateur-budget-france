/**
 * Scénario du module dette : hypothèses « du monde » (taux d'intérêt, croissance) et leviers
 * (effort budgétaire), appliqués à la trajectoire de référence.
 */
import { projeterDette } from './modele';
import type { ReferenceDette } from './types';

export interface ScenarioDette {
  /** Levier : amélioration supplémentaire du solde primaire chaque année (fraction du PIB, cumulée). */
  ajustementAnnuel: number;
  /** Levier : nombre d'années pendant lesquelles l'ajustement s'ajoute ; l'effort atteint reste ensuite acquis. */
  dureeAjustement: number;
  /** Hypothèse : écart de taux d'intérêt sur les nouveaux emprunts (fraction : 0.01 = +1 point). */
  ecartTaux: number;
  /** Hypothèse : écart de croissance nominale du PIB, chaque année (fraction). */
  ecartCroissance: number;
}

export const SCENARIO_DETTE_REFERENCE: ScenarioDette = { ajustementAnnuel: 0, dureeAjustement: 5, ecartTaux: 0, ecartCroissance: 0 };

/**
 * Maturité moyenne de la dette (années) : un choc de taux sur les nouveaux emprunts ne se transmet
 * au taux apparent qu'à mesure que la dette est refinancée (≈ 1/8,5 du stock par an).
 */
export const MATURITE_MOYENNE = 8.5;

/** Effort cumulé (fraction du PIB) à la k-ième année de projection (k = 0 pour la première). */
export function effortCumule(s: ScenarioDette, k: number): number {
  return s.ajustementAnnuel * Math.min(k + 1, Math.max(0, s.dureeAjustement));
}

/** Trajectoire de référence modifiée par le scénario. */
export function appliquerScenario(reference: ReferenceDette, s: ScenarioDette): ReferenceDette {
  return {
    ...reference,
    soldePrimairePctPib: reference.soldePrimairePctPib.map((v, k) => v + effortCumule(s, k)),
    tauxInteretApparent: reference.tauxInteretApparent.map((v, k) => v + s.ecartTaux * Math.min(1, (k + 1) / MATURITE_MOYENNE)),
    croissanceNominale: reference.croissanceNominale.map((v) => v + s.ecartCroissance),
  };
}

/**
 * Triangle d'équilibre : ajustement annuel nécessaire pour que la dette cesse d'augmenter en part
 * du PIB à l'année cible, l'effort étant étalé jusqu'à cette année. Null si hors de la fenêtre.
 */
export function ajustementPourStabiliser(reference: ReferenceDette, s: ScenarioDette, anneeCible: number): number | null {
  const k = reference.annees.indexOf(anneeCible);
  if (k < 0) return null;
  const hausse = (a: number) => {
    const p = projeterDette(appliquerScenario(reference, { ...s, ajustementAnnuel: a, dureeAjustement: k + 1 }));
    const prec = k === 0 ? reference.detteDepartPctPib : p[k - 1].dettePctPib;
    return p[k].dettePctPib - prec;
  };
  // La hausse de dette décroît avec l'ajustement : recherche par dichotomie.
  let bas = -0.05;
  let haut = 0.05;
  if (hausse(bas) <= 0) return bas;
  if (hausse(haut) > 0) return null;
  for (let i = 0; i < 60; i++) {
    const m = (bas + haut) / 2;
    if (hausse(m) > 0) bas = m;
    else haut = m;
  }
  return haut;
}

// --- Lien permanent : seuls les paramètres différents de la référence sont encodés.

export function versLienDette(s: ScenarioDette): string {
  const diff: Partial<ScenarioDette> = {};
  for (const k of Object.keys(SCENARIO_DETTE_REFERENCE) as Array<keyof ScenarioDette>)
    if (s[k] !== SCENARIO_DETTE_REFERENCE[k]) diff[k] = s[k];
  return Object.keys(diff).length ? encodeURIComponent(JSON.stringify(diff)) : '';
}

export function depuisLienDette(lien: string): ScenarioDette {
  const s = { ...SCENARIO_DETTE_REFERENCE };
  if (!lien) return s;
  try {
    const brut = JSON.parse(decodeURIComponent(lien)) as Record<string, unknown>;
    for (const k of Object.keys(SCENARIO_DETTE_REFERENCE) as Array<keyof ScenarioDette>) {
      const v = brut[k];
      if (typeof v === 'number' && Number.isFinite(v)) s[k] = v;
    }
  } catch {
    /* lien illisible : scénario de référence */
  }
  return s;
}
