/**
 * Pyramide des âges au 1er janvier 2025 (France entière, deux sexes).
 *
 * ⚠️ PROVISOIRE : les serveurs de l'INSEE n'étant pas accessibles depuis l'environnement
 * de développement initial, la pyramide est **reconstruite** à partir :
 *  - de l'historique approximatif des naissances annuelles (ordres de grandeur INSEE) ;
 *  - d'une mortalité historique paramétrique (espérance de vie de la période) ;
 *  - d'un solde migratoire historique moyen ;
 * puis recalée sur les effectifs par grands groupes d'âges publiés (bilan démographique
 * INSEE 2025 / COR 2026). À remplacer par la pyramide officielle INSEE
 * (« Pyramide des âges au 1er janvier », âge détaillé) dès que possible.
 */
import { AGE_MAX, NB_AGES, PROFIL_MIGRATIONS, sommeAges, tableMortalite } from '../demographie';

/** Naissances annuelles approximatives (milliers), France entière. Points interpolés linéairement. */
const NAISSANCES_MILLIERS: Array<[number, number]> = [
  [1830, 980],
  [1860, 980],
  [1880, 920],
  [1900, 830],
  [1913, 790],
  [1915, 420],
  [1918, 430],
  [1919, 450],
  [1920, 830],
  [1930, 760],
  [1939, 620],
  [1942, 580],
  [1945, 650],
  [1946, 860],
  [1950, 880],
  [1960, 850],
  [1964, 900],
  [1971, 910],
  [1973, 880],
  [1976, 740],
  [1980, 800],
  [1985, 800],
  [1990, 790],
  [1994, 740],
  [2000, 810],
  [2010, 830],
  [2014, 820],
  [2017, 770],
  [2020, 735],
  [2021, 742],
  [2022, 726],
  [2023, 678],
  [2024, 663],
  [2025, 645],
];

/** Espérance de vie à la naissance (deux sexes) de la période, ordres de grandeur. */
const ESPERANCE_VIE_HISTORIQUE: Array<[number, number]> = [
  [1830, 38],
  [1860, 40],
  [1880, 42],
  [1900, 46],
  [1913, 50],
  [1920, 54],
  [1940, 58],
  [1946, 63],
  [1950, 66.5],
  [1970, 72.2],
  [1990, 76.8],
  [2010, 81.4],
  [2019, 82.7],
  [2020, 82.2],
  [2024, 83.1],
];

/** Solde migratoire historique annuel moyen (personnes). */
const SOLDE_MIGRATOIRE_HISTORIQUE: Array<[number, number]> = [
  [1950, 60_000],
  [1962, 250_000],
  [1965, 120_000],
  [1975, 50_000],
  [2000, 70_000],
  [2010, 60_000],
  [2020, 110_000],
  [2024, 150_000],
];

/** Effectifs au 1er janvier 2025 par grands groupes (millions) — cibles de recalage, à vérifier (INSEE). */
export const CIBLES_2025 = {
  moins20: 15.7,
  de20a64: 37.8,
  plus65: 15.1,
} as const;

function interp(points: Array<[number, number]>, x: number): number {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    if (x <= points[i][0]) {
      const [x0, y0] = points[i - 1];
      const [x1, y1] = points[i];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return points[points.length - 1][1];
}

/** Pyramides « brutes » (non recalées) au 1er janvier, conservées pour la reconstitution historique. */
const pyramidesBrutes = new Map<number, Float64Array>();

function construirePyramide(): Float64Array {
  // Départ en 1830 pour que les générations âgées de l'après-guerre soient présentes.
  const debut = 1830;
  let population = new Float64Array(NB_AGES);
  for (let annee = debut; annee < 2025; annee++) {
    if (annee >= ANNEE_DEBUT_RECONSTITUTION) pyramidesBrutes.set(annee, Float64Array.from(population));
    const q = tableMortalite(interp(ESPERANCE_VIE_HISTORIQUE, annee));
    const solde = annee >= 1946 ? interp(SOLDE_MIGRATOIRE_HISTORIQUE, annee) : 0;
    const suivante = new Float64Array(NB_AGES);
    suivante[0] = interp(NAISSANCES_MILLIERS, annee) * 1000 * (1 - q[0] / 2);
    for (let a = 1; a < NB_AGES; a++) {
      suivante[a] = population[a - 1] * (1 - q[a - 1]) + solde * PROFIL_MIGRATIONS[a];
    }
    suivante[AGE_MAX] += population[AGE_MAX] * (1 - q[AGE_MAX]);
    population = suivante;
  }
  // Recalage par grands groupes d'âges.
  const groupes: Array<[number, number, number]> = [
    [0, 19, CIBLES_2025.moins20],
    [20, 64, CIBLES_2025.de20a64],
    [65, AGE_MAX, CIBLES_2025.plus65],
  ];
  for (const [de, a, cibleMillions] of groupes) {
    const facteur = (cibleMillions * 1e6) / sommeAges(population, de, a);
    for (let x = de; x <= a; x++) population[x] *= facteur;
  }
  return population;
}

let pyramide: Float64Array | null = null;

/** Première année de la reconstitution historique des pyramides. */
export const ANNEE_DEBUT_RECONSTITUTION = 1945;

let historiques: Map<number, Float64Array> | null = null;

/**
 * Part des 65 ans et plus dans la population (INSEE, ordres de grandeur) : sert à recaler les âges
 * élevés des pyramides reconstituées, que la mortalité simplifiée du XIXᵉ siècle sous-estime.
 */
const PART_65_PLUS: Array<[number, number]> = [
  [1946, 0.111],
  [1950, 0.114],
  [1960, 0.116],
  [1970, 0.128],
  [1975, 0.134],
  [1985, 0.128],
  [1990, 0.14],
  [2000, 0.16],
  [2010, 0.168],
  [2024, 0.217],
];

/** Population totale (millions, France y compris DOM, ordres de grandeur INSEE). */
const POPULATION_TOTALE: Array<[number, number]> = [
  [1946, 41.0],
  [1950, 42.6],
  [1960, 46.5],
  [1970, 51.7],
  [1975, 53.7],
  [1985, 56.6],
  [1990, 58.0],
  [2000, 60.5],
  [2010, 64.6],
  [2020, 67.3],
  [2024, 68.4],
];

function recalerAgesEleves(population: Float64Array, annee: number): void {
  const cible = interp(PART_65_PLUS, annee);
  // Poids progressif de 55 à 65 ans pour éviter une marche dans la pyramide.
  const poids = (a: number) => (a >= 65 ? 1 : a <= 55 ? 0 : (a - 55) / 10);
  let concernes = 0;
  let total = 0;
  let plus65 = 0;
  for (let a = 0; a < NB_AGES; a++) {
    total += population[a];
    concernes += population[a] * poids(a);
    if (a >= 65) plus65 += population[a];
  }
  // Facteur f appliqué aux âges pondérés tel que la part des 65 ans et plus atteigne la cible.
  let lo = 0.5;
  let hi = 3;
  for (let i = 0; i < 50; i++) {
    const f = (lo + hi) / 2;
    const nouveau65 = plus65 * f;
    const nouveauTotal = total + (concernes * (f - 1));
    if (nouveau65 / nouveauTotal < cible) lo = f;
    else hi = f;
  }
  const f = (lo + hi) / 2;
  for (let a = 55; a < NB_AGES; a++) population[a] *= 1 + (f - 1) * poids(a);
  // Puis mise à l'échelle de l'ensemble sur la population totale connue.
  const facteurTotal = (interp(POPULATION_TOTALE, annee) * 1e6) / sommeAges(population, 0, AGE_MAX);
  for (let a = 0; a < NB_AGES; a++) population[a] *= facteurTotal;
}

/**
 * Pyramides au 1er janvier de 1985 à 2024, reconstituées par **rétro-projection** de la pyramide
 * 2025 (on « rajeunit » chaque génération en retirant les migrants et en ajoutant les décès).
 * Pour les âges élevés, dont la génération a disparu avant 2025, on raccorde la projection
 * historique brute. Reconstitution approximative, à remplacer par les pyramides INSEE.
 */
export function pyramidesHistoriques(): Map<number, Float64Array> {
  if (historiques) return historiques;
  const p2025 = pyramide2025(); // remplit aussi pyramidesBrutes
  const resultat = new Map<number, Float64Array>();
  let suivante = p2025;
  for (let annee = 2024; annee >= ANNEE_DEBUT_RECONSTITUTION; annee--) {
    const q = tableMortalite(interp(ESPERANCE_VIE_HISTORIQUE, annee));
    const solde = interp(SOLDE_MIGRATOIRE_HISTORIQUE, annee);
    const brute = pyramidesBrutes.get(annee)!;
    const courante = new Float64Array(NB_AGES);
    const limite = Math.min(100, AGE_MAX - 1 - (2025 - annee));
    for (let a = 0; a <= limite; a++) {
      courante[a] = Math.max(0, (suivante[a + 1] - solde * PROFIL_MIGRATIONS[a + 1]) / (1 - q[a]));
    }
    // Raccord des âges élevés sur la projection brute, mise à l'échelle à la frontière.
    let r = 0;
    let b = 0;
    for (let a = limite - 4; a <= limite; a++) {
      r += courante[a];
      b += brute[a];
    }
    const facteur = b > 0 ? r / b : 1;
    for (let a = limite + 1; a < NB_AGES; a++) courante[a] = brute[a] * facteur;
    // Rétro-projection conservée pour l'année suivante ; recalage appliqué à une copie.
    suivante = Float64Array.from(courante);
    recalerAgesEleves(courante, annee);
    resultat.set(annee, courante);
  }
  historiques = resultat;
  return resultat;
}

/** Population par âge simple (0 à 105 ans et plus) au 1er janvier 2025. */
export function pyramide2025(): Float64Array {
  pyramide ??= construirePyramide();
  return Float64Array.from(pyramide);
}
