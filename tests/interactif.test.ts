import { describe, expect, it } from 'vitest';
import { criteresDepuis, poidsCriteres, simulerInteractif, soldeTotal, actifsInactifs } from '../src/modules/retraites/app/interactif';
import { PARAMETRES_REFERENCE } from '../src/modules/retraites/app/parametres';

const depart = criteresDepuis(PARAMETRES_REFERENCE);

describe('mode interactif des régimes', () => {
  it('au point de départ, le solde tous régimes retrouve celui du simulateur', () => {
    const r = simulerInteractif(PARAMETRES_REFERENCE, depart);
    const sim = r.simulation.annees.find((a) => a.annee === 2070)!;
    expect(soldeTotal(r, 2070)).toBeCloseTo(sim.soldePctPib, 9);
  });

  it('chaque critère agit dans le sens attendu', () => {
    const p = poidsCriteres(
      PARAMETRES_REFERENCE,
      depart,
      { ...depart, productivite: 1.2, chomage: 9, activite: 3, ageLegal: 66, revalorisationPoint: -0.5, rendementPoint: -10 },
      2070,
    );
    const effet = (cle: string) => p.effets.find((e) => e.cle === cle)!.effet;
    expect(effet('productivite')).toBeGreaterThan(0);
    expect(effet('chomage')).toBeLessThan(0);
    expect(effet('activite')).toBeGreaterThan(0);
    expect(effet('ageLegal')).toBeGreaterThan(0);
    expect(effet('revalorisationPoint')).toBeGreaterThan(0);
    expect(effet('rendementPoint')).toBeGreaterThan(0);
  });

  it('une hausse du taux d’activité améliore le rapport actifs/inactifs', () => {
    const a = simulerInteractif(PARAMETRES_REFERENCE, depart);
    const b = simulerInteractif(PARAMETRES_REFERENCE, { ...depart, activite: 5 });
    expect(actifsInactifs(b, 2070)).toBeGreaterThan(actifsInactifs(a, 2070));
  });
});
