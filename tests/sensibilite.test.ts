import { describe, expect, it } from 'vitest';
import { PARAMETRES_REFERENCE } from '../src/app/parametres';
import { fourchette, HYPOTHESES, variantes } from '../src/app/sensibilite';

const solde = (s: { annees: { annee: number; soldePctPib: number }[] }, a: number) => s.annees.find((r) => r.annee === a)!.soldePctPib;

describe('sensibilité aux hypothèses', () => {
  it.each(HYPOTHESES.map((h) => [h.cle, h] as const))('%s : le solde 2070 varie dans le sens attendu', (_, def) => {
    const v = variantes(PARAMETRES_REFERENCE, def);
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
