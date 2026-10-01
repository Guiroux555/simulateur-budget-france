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

function construirePyramide(): Float64Array {
  const debut = 2025 - AGE_MAX;
  let population = new Float64Array(NB_AGES);
  for (let annee = debut; annee < 2025; annee++) {
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

/** Population par âge simple (0 à 105 ans et plus) au 1er janvier 2025. */
export function pyramide2025(): Float64Array {
  pyramide ??= construirePyramide();
  return Float64Array.from(pyramide);
}
