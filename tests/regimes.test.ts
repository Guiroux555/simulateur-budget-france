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

describe('cotisations et population par régime', () => {
  it('fournit cotisations, cotisants et retraités pour les régimes comparés', () => {
    const compares = REGIMES.filter((r) => r.id !== 'autres-complementaires');
    for (const r of compares) {
      expect(r.cotisations).toBeGreaterThan(0);
      expect(r.cotisants).toBeGreaterThan(0);
      expect(r.retraites).toBeGreaterThan(0);
    }
  });
  it('les régimes subventionnés couvrent moins de la moitié de leurs pensions par cotisations', () => {
    for (const r of REGIMES.filter((x) => x.subventionEtat > 0)) expect(r.cotisations! / r.depenses).toBeLessThan(0.5);
  });
});

describe('régimes dans le temps (estimations)', () => {
  it('les parts somment à 100 % et les soldes retrouvent le solde total chaque année', async () => {
    const { regimesDansLeTemps } = await import('../src/app/regimesTemps');
    const { simuler } = await import('../src/engine/modele');
    const { scenarioReference } = await import('../src/engine/reference');
    const sim = simuler(scenarioReference());
    const d = regimesDansLeTemps(sim);
    for (const a of [2000, 2024, 2045, 2070]) {
      const lignes = d.regimes.map((r) => r.annees.find((l) => l.annee === a)!);
      expect(lignes.reduce((s, l) => s + l.part, 0)).toBeCloseTo(100, 6);
      if (a >= 2025) expect(lignes.reduce((s, l) => s + l.soldePctPib, 0)).toBeCloseTo(sim.annees.find((r) => r.annee === a)!.soldePctPib, 9);
    }
    // Régimes spéciaux fermés : plus de cotisants à terme.
    const spec = d.regimes.find((r) => r.id === 'speciaux')!.annees.find((l) => l.annee === 2070)!;
    expect(spec.ratio).toBe(0);
  });
});
