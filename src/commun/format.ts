const nf = (d: number) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });

/** 0.0123 → « 1,2 % ». */
export const pct = (x: number, d = 1) => `${nf(d).format(x * 100)} %`;
/** Écart en points : 0.012 → « +1,2 pt ». */
export const points = (x: number, d = 1) => `${x > 0.00005 ? '+' : x < -0.00005 ? '−' : ''}${nf(d).format(Math.abs(x * 100))} pt`;
