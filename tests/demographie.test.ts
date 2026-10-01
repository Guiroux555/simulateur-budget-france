import { describe, expect, it } from 'vitest';
import { esperanceVieA, sommeAges, tableMortalite } from '../src/engine/demographie';
import { CIBLES_2025, pyramide2025 } from '../src/engine/donnees/population2025';
import { valeurA } from '../src/engine/trajectoire';

describe('trajectoires', () => {
  it('interpole linéairement et reste constante aux bords', () => {
    const t = [
      [2025, 1],
      [2035, 2],
    ] as const;
    expect(valeurA(t, 2000)).toBe(1);
    expect(valeurA(t, 2030)).toBeCloseTo(1.5);
    expect(valeurA(t, 2100)).toBe(2);
    expect(valeurA([], 2030)).toBe(0);
  });
});

describe('table de mortalité', () => {
  it.each([70, 83.2, 91])('reproduit une espérance de vie de %f ans', (e0) => {
    expect(esperanceVieA(tableMortalite(e0), 0)).toBeCloseTo(e0, 2);
  });

  it('donne une espérance de vie à 60 ans plausible en 2025', () => {
    const e60 = esperanceVieA(tableMortalite(83.2), 60);
    expect(e60).toBeGreaterThan(24);
    expect(e60).toBeLessThan(28);
  });
});

describe('pyramide 2025', () => {
  const p = pyramide2025();
  it('respecte les effectifs par grands groupes', () => {
    expect(sommeAges(p, 0, 19) / 1e6).toBeCloseTo(CIBLES_2025.moins20, 6);
    expect(sommeAges(p, 20, 64) / 1e6).toBeCloseTo(CIBLES_2025.de20a64, 6);
    expect(sommeAges(p, 65, 105) / 1e6).toBeCloseTo(CIBLES_2025.plus65, 6);
  });
  it('ne contient pas d’effectif négatif', () => {
    expect(Math.min(...p)).toBeGreaterThanOrEqual(0);
  });
});

describe('pyramides reconstituées 1985-2024', () => {
  it('couvrent 40 ans, sans effectif négatif, avec une population croissante', async () => {
    const { pyramidesHistoriques } = await import('../src/engine/donnees/population2025');
    const h = pyramidesHistoriques();
    expect(h.size).toBe(40);
    let precedente = 0;
    for (let annee = 1985; annee <= 2024; annee++) {
      const p = h.get(annee)!;
      expect(Math.min(...p)).toBeGreaterThanOrEqual(0);
      const total = sommeAges(p, 0, 105);
      expect(total).toBeGreaterThan(precedente);
      precedente = total;
    }
    // Ordres de grandeur INSEE : ≈ 56-58 M d'habitants et ≈ 13 % de 65 ans et plus en 1985.
    const p1985 = h.get(1985)!;
    expect(sommeAges(p1985, 0, 105) / 1e6).toBeGreaterThan(55);
    expect(sommeAges(p1985, 0, 105) / 1e6).toBeLessThan(59);
    expect(sommeAges(p1985, 65, 105) / sommeAges(p1985, 0, 105)).toBeGreaterThan(0.11);
    expect(sommeAges(p1985, 65, 105) / sommeAges(p1985, 0, 105)).toBeLessThan(0.14);
  });
});
