import type { ResultatAnnee } from '../engine';

const nf = (d: number) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });

/** 0.0123 → « 1,2 % ». */
export const pct = (x: number, d = 1) => `${nf(d).format(x * 100)} %`;
/** Signe explicite : « +1,2 % » / « −0,4 % ». */
export const pctSigne = (x: number, d = 1) => `${x > 0.00005 ? '+' : x < -0.00005 ? '−' : ''}${nf(d).format(Math.abs(x * 100))} %`;
/** Écart en points : 0.012 → « +1,2 pt ». */
export const points = (x: number, d = 1) => `${x > 0.00005 ? '+' : x < -0.00005 ? '−' : ''}${nf(d).format(Math.abs(x * 100))} pt`;
export const nombre = (x: number, d = 0) => nf(d).format(x);
export const milliards = (x: number) => `${x < 0 ? '−' : x > 0 ? '+' : ''}${nf(0).format(Math.abs(x))} Md€`;
export const ans = (x: number) => `${nf(1).format(x)} ans`;
export const millions = (x: number) => `${nf(1).format(x / 1e6)} M`;

/**
 * Effort de financement total demandé aux actifs et contribuables (% du PIB) :
 * ressources de la répartition, plus cotisations de capitalisation, hors revenus d'un fonds.
 */
export function effortFinancement(r: ResultatAnnee, mode: string | undefined): number {
  let total = r.ressources;
  if (mode === 'substitutif' || mode === 'additionnel') total += r.cotisationsCapitalisation;
  if (mode === 'fonds-reserve') total += r.cotisationsCapitalisation - r.rentesCapitalisation;
  return total / r.pib;
}
