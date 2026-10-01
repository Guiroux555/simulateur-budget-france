import { describe, expect, it } from 'vitest';
import { FENETRE_MAX, FENETRE_MIN, zoomer } from '../src/commun/fenetre';

describe('fenêtre de temps', () => {
  it('s’élargit sans dépasser les bornes', () => {
    expect(zoomer({ debut: 1950, fin: 2065 }, 10)).toEqual({ debut: FENETRE_MIN, fin: FENETRE_MAX });
  });
  it('se réduit en gardant au moins 15 ans', () => {
    const f = zoomer({ debut: 2020, fin: 2040 }, -10);
    expect(f.fin - f.debut).toBeGreaterThanOrEqual(15);
  });
});

describe('crises économiques', () => {
  it('sont ordonnées, bornées et documentées', async () => {
    const { EVENEMENTS } = await import('../src/socle/donnees/evenements');
    let precedent = 0;
    for (const e of EVENEMENTS) {
      expect(e.fin).toBeGreaterThan(e.debut);
      expect(e.debut).toBeGreaterThanOrEqual(precedent);
      expect(e.impact.length).toBeGreaterThan(10);
      precedent = e.debut;
    }
  });
});
