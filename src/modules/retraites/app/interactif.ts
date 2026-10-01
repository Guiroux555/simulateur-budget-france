/**
 * Mode interactif des régimes : quelques critères réglables, simulation complète (modèle agrégé +
 * séries par régime) et poids de chaque critère pris isolément.
 */
import { simuler, type ResultatSimulation } from '../engine';
import { versScenario, type ParametresUI } from './parametres';
import { regimesDansLeTemps, type RegimesDansLeTemps } from './regimesTemps';
import { ratioActifsInactifs } from './pyramidesHistoriques';

export interface CriteresInteractifs {
  /** Croissance de la productivité à long terme (% / an). */
  productivite: number;
  /** Chômage de long terme (%). */
  chomage: number;
  /** Variation du taux d'activité des 20-64 ans (points). */
  activite: number;
  /** Âge légal visé en 2035 ; null = législation actuelle (64 ans en 2033). */
  ageLegal: number | null;
  /** Enfants par femme. */
  fecondite: number;
  /** Revalorisation de la valeur du point par rapport à l'inflation (points par an). */
  revalorisationPoint: number;
  /** Variation du rendement des nouveaux points (%). */
  rendementPoint: number;
}

export type CleCritere = keyof CriteresInteractifs;

export const LIBELLES_CRITERES: Record<CleCritere, string> = {
  productivite: 'Productivité',
  chomage: 'Chômage',
  activite: 'Taux d’activité (actifs/inactifs)',
  ageLegal: 'Âge de départ',
  fecondite: 'Natalité',
  revalorisationPoint: 'Valeur du point (revalorisation)',
  rendementPoint: 'Rendement du point',
};

export function criteresDepuis(p: ParametresUI): CriteresInteractifs {
  return {
    productivite: p.productivite,
    chomage: p.chomage,
    activite: p.hausseActivite,
    ageLegal: p.ageLegalCible,
    fecondite: p.fecondite,
    revalorisationPoint: 0,
    rendementPoint: 0,
  };
}

export interface ResultatInteractif {
  simulation: ResultatSimulation;
  regimes: RegimesDansLeTemps;
}

export function simulerInteractif(base: ParametresUI, c: CriteresInteractifs): ResultatInteractif {
  const p: ParametresUI = {
    ...base,
    productivite: c.productivite,
    productiviteDepart: c.productivite === base.productivite ? base.productiviteDepart : null,
    chomage: c.chomage,
    hausseActivite: c.activite,
    ageLegalCible: c.ageLegal,
    ageLegalAnnee: c.ageLegal === null ? base.ageLegalAnnee : c.ageLegal < 64 ? 2028 : 2035,
    fecondite: c.fecondite,
  };
  const simulation = simuler(versScenario(p));
  const regimes = regimesDansLeTemps(simulation, {
    revalorisationPoint: c.revalorisationPoint / 100,
    rendementPoint: c.rendementPoint / 100,
  });
  return { simulation, regimes };
}

export const soldeTotal = (r: ResultatInteractif, annee: number) => r.regimes.totaux.find((t) => t.annee === annee)!.soldePctPib;
export const actifsInactifs = (r: ResultatInteractif, annee: number) => ratioActifsInactifs(r.simulation.annees.find((a) => a.annee === annee)!);

/**
 * Effet de chaque critère pris isolément sur le solde tous régimes (points de PIB), par rapport aux
 * critères de départ ; plus l'effet de l'ensemble (qui peut différer de la somme : interactions).
 */
export function poidsCriteres(base: ParametresUI, depart: CriteresInteractifs, courant: CriteresInteractifs, annee: number) {
  const ref = soldeTotal(simulerInteractif(base, depart), annee);
  const cles = (Object.keys(LIBELLES_CRITERES) as CleCritere[]).filter((k) => courant[k] !== depart[k]);
  const effets = cles.map((k) => ({
    cle: k,
    libelle: LIBELLES_CRITERES[k],
    effet: soldeTotal(simulerInteractif(base, { ...depart, [k]: courant[k] }), annee) - ref,
  }));
  const ensemble = cles.length ? soldeTotal(simulerInteractif(base, courant), annee) - ref : 0;
  return { reference: ref, effets, ensemble };
}
