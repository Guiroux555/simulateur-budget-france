import { describe, expect, it } from 'vitest';
import { PARAMETRES_REFERENCE } from '../src/modules/retraites/app/parametres';
import { fourchette, HYPOTHESES, variantes } from '../src/modules/retraites/app/sensibilite';

const solde = (s: { annees: { annee: number; soldePctPib: number }[] }, a: number) => s.annees.find((r) => r.annee === a)!.soldePctPib;

describe('sensibilité aux hypothèses', () => {
  it.each(HYPOTHESES.map((h) => [h.cle, h] as const))('%s : le solde 2070 varie dans le sens attendu', (_, def) => {
    const v = variantes(PARAMETRES_REFERENCE, def).filter((x) => !x.speciale);
    const soldes = v.map((x) => solde(x.simulation, 2070));
    for (let i = 1; i < soldes.length; i++) {
      if (def.hausseFavorable) expect(soldes[i]).toBeGreaterThan(soldes[i - 1]);
      else expect(soldes[i]).toBeLessThan(soldes[i - 1]);
    }
    expect(v.filter((x) => x.retenue)).toHaveLength(1);
  });

  it('la fourchette encadre le scénario central', () => {
    const { pessimiste, optimiste } = fourchette(PARAMETRES_REFERENCE);
    for (const a of [2045, 2070]) {
      const central = variantes(PARAMETRES_REFERENCE, HYPOTHESES[0]).find((x) => x.retenue)!.simulation;
      expect(solde(pessimiste, a)).toBeLessThan(solde(central, a));
      expect(solde(optimiste, a)).toBeGreaterThan(solde(central, a));
    }
  });
});

describe('trajectoire de productivité « tendance observée »', () => {
  it('part du niveau observé en 2024 et rejoint la moyenne 2010-2024 en 2030', async () => {
    const { TENDANCE_OBSERVEE } = await import('../src/modules/retraites/app/productivite');
    const { simuler } = await import('../src/modules/retraites/engine/modele');
    const { versScenario } = await import('../src/modules/retraites/app/parametres');
    expect(TENDANCE_OBSERVEE.longTerme).toBeGreaterThan(0.3);
    expect(TENDANCE_OBSERVEE.longTerme).toBeLessThan(0.7);
    const s = simuler(
      versScenario({ ...PARAMETRES_REFERENCE, productivite: TENDANCE_OBSERVEE.longTerme, productiviteDepart: TENDANCE_OBSERVEE.depart }),
    );
    const prod = (a: number) => s.annees.find((r) => r.annee === a)!.productivite;
    expect(prod(2025)).toBeLessThan(prod(2030));
    expect(prod(2030)).toBeCloseTo(TENDANCE_OBSERVEE.longTerme / 100, 9);
    expect(prod(2070)).toBeCloseTo(TENDANCE_OBSERVEE.longTerme / 100, 9);
    // Moins de productivité que l'hypothèse du COR : solde plus dégradé.
    expect(solde(s, 2070)).toBeLessThan(solde(variantes(PARAMETRES_REFERENCE, HYPOTHESES[0])[1].simulation, 2070));
  });
});
