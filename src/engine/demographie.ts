/**
 * Démographie : table de mortalité paramétrique, calendrier de fécondité,
 * profil par âge des migrations et projection par composantes (âge simple 0-105).
 *
 * La mortalité suit une loi de Gompertz-Makeham μ(x) = A + B·e^{c·x} dont le
 * paramètre B est ajusté pour reproduire l'espérance de vie à la naissance visée.
 * C'est une simplification assumée : les deux sexes sont confondus.
 */

export const AGE_MAX = 105;
export const NB_AGES = AGE_MAX + 1;

const MAKEHAM_A = 0.0002;
const GOMPERTZ_C = 0.105;

/** Mortalité infantile (quotient à 0 an) selon l'espérance de vie, interpolée sur l'historique français. */
function quotientInfantile(e0: number): number {
  const points: Array<[number, number]> = [
    [38, 0.18],
    [46, 0.14],
    [54, 0.09],
    [60, 0.06],
    [66, 0.05],
    [72, 0.018],
    [77, 0.0075],
    [80, 0.0045],
    [83, 0.0037],
    [90, 0.002],
  ];
  if (e0 <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    if (e0 <= points[i][0]) {
      const [x0, y0] = points[i - 1];
      const [x1, y1] = points[i];
      return y0 + ((y1 - y0) * (e0 - x0)) / (x1 - x0);
    }
  }
  return points[points.length - 1][1];
}

function quotients(b: number, q0: number): Float64Array {
  const q = new Float64Array(NB_AGES);
  q[0] = q0;
  for (let x = 1; x < AGE_MAX; x++) {
    const mu = MAKEHAM_A + b * Math.exp(GOMPERTZ_C * (x + 0.5));
    q[x] = Math.min(1, 1 - Math.exp(-mu));
  }
  q[AGE_MAX] = 1;
  return q;
}

function esperanceVie(q: Float64Array): number {
  let survivants = 1;
  let e = 0;
  for (let x = 0; x < NB_AGES; x++) {
    const deces = survivants * q[x];
    e += survivants - deces / 2;
    survivants -= deces;
  }
  return e;
}

const cacheTables = new Map<number, Float64Array>();

/** Quotients de mortalité par âge correspondant à une espérance de vie à la naissance. */
export function tableMortalite(e0: number): Float64Array {
  const cle = Math.round(e0 * 1000) / 1000;
  const enCache = cacheTables.get(cle);
  if (enCache) return enCache;
  const q0 = quotientInfantile(cle);
  // Bisection sur log(B) : e0 décroît quand B croît.
  let lo = Math.log(1e-9);
  let hi = Math.log(1e-2);
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (esperanceVie(quotients(Math.exp(mid), q0)) > cle) lo = mid;
    else hi = mid;
  }
  const table = quotients(Math.exp((lo + hi) / 2), q0);
  cacheTables.set(cle, table);
  return table;
}

/** Espérance de vie à un âge donné pour une table de quotients. */
export function esperanceVieA(q: Float64Array, age: number): number {
  let survivants = 1;
  let e = 0;
  for (let x = age; x < NB_AGES; x++) {
    const deces = survivants * q[x];
    e += survivants - deces / 2;
    survivants -= deces;
  }
  return e;
}

/** Calendrier de fécondité normalisé (somme = 1) sur les âges 15-49, centré sur 31 ans. */
export const CALENDRIER_FECONDITE: Float64Array = (() => {
  const f = new Float64Array(NB_AGES);
  let somme = 0;
  for (let a = 15; a <= 49; a++) {
    f[a] = Math.exp(-0.5 * ((a + 0.5 - 31) / 5.6) ** 2);
    somme += f[a];
  }
  for (let a = 15; a <= 49; a++) f[a] /= somme;
  return f;
})();

/** Part des femmes aux âges de fécondité (approximation). */
export const PART_FEMMES = 0.5;

/** Profil par âge du solde migratoire (somme = 1), concentré sur les jeunes adultes. */
export const PROFIL_MIGRATIONS: Float64Array = (() => {
  const m = new Float64Array(NB_AGES);
  let somme = 0;
  for (let a = 0; a < 70; a++) {
    m[a] = Math.exp(-(((a - 26) / 9) ** 2)) + 0.25 * Math.exp(-(((a - 5) / 5) ** 2));
    somme += m[a];
  }
  for (let a = 0; a < 70; a++) m[a] /= somme;
  return m;
})();

export interface EtatDemographique {
  population: Float64Array;
  naissances: number;
}

/**
 * Avance la population d'un an.
 * @param q quotients de mortalité de l'année écoulée
 * @param icf fécondité de l'année écoulée
 * @param solde solde migratoire de l'année écoulée
 */
export function avancerPopulation(
  population: Float64Array,
  q: Float64Array,
  icf: number,
  solde: number,
): EtatDemographique {
  let naissances = 0;
  for (let a = 15; a <= 49; a++) naissances += icf * CALENDRIER_FECONDITE[a] * PART_FEMMES * population[a];

  const suivante = new Float64Array(NB_AGES);
  suivante[0] = naissances * (1 - q[0] / 2) + solde * PROFIL_MIGRATIONS[0];
  for (let a = 1; a < NB_AGES; a++) {
    suivante[a] = population[a - 1] * (1 - q[a - 1]) + solde * PROFIL_MIGRATIONS[a];
  }
  // Groupe ouvert 105 ans et plus.
  suivante[AGE_MAX] += population[AGE_MAX] * (1 - q[AGE_MAX]);
  return { population: suivante, naissances };
}

export function sommeAges(population: Float64Array, de: number, a: number): number {
  let s = 0;
  for (let x = de; x <= Math.min(a, AGE_MAX); x++) s += population[x];
  return s;
}
