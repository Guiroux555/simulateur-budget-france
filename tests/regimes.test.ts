import { describe, expect, it } from 'vitest';
import { REGIMES, TOTAUX_2024 } from '../src/engine/donnees/regimes';

describe('données par régime', () => {
  it('la somme des dépenses retrouve le total 2024', () => {
    const total = REGIMES.reduce((s, r) => s + r.depenses, 0);
    expect(total).toBeCloseTo(TOTAUX_2024.depenses, 0);
  });
  it('la somme des soldes retrouve le solde 2024 du COR', () => {
    const total = REGIMES.reduce((s, r) => s + r.solde, 0);
    expect(total).toBeCloseTo(TOTAUX_2024.solde, 1);
  });
  it('chaque régime a au moins un avantage, une contrepartie et une source', () => {
    for (const r of REGIMES) {
      expect(r.avantages.length).toBeGreaterThan(0);
      expect(r.contreparties.length).toBeGreaterThan(0);
      expect(r.sources.length).toBeGreaterThan(0);
    }
  });
});
