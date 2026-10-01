import { describe, expect, it } from 'vitest';
import { simuler } from '../src/engine/modele';
import { scenarioReference } from '../src/engine/reference';
import { depuisUrl, PARAMETRES_REFERENCE, versScenario, versUrl } from '../src/app/parametres';
import { appliquerPreset, PRESETS } from '../src/app/presets';

describe('paramètres de l’interface', () => {
  it('les paramètres par défaut reproduisent le scénario de référence du moteur', () => {
    const a = simuler(versScenario(PARAMETRES_REFERENCE)).annees;
    const b = simuler(scenarioReference()).annees;
    for (let i = 0; i < a.length; i += 5) expect(a[i].soldePctPib).toBeCloseTo(b[i].soldePctPib, 6);
  });

  it('le lien permanent restitue le scénario', () => {
    for (const p of PRESETS) {
      const params = appliquerPreset(p);
      expect({ ...PARAMETRES_REFERENCE, ...depuisUrl(versUrl(params)) }).toEqual(params);
    }
    expect(versUrl(PARAMETRES_REFERENCE)).toBe('');
  });

  it('ignore un lien permanent invalide ou malveillant', () => {
    expect(depuisUrl('%%%')).toEqual({});
    expect(depuisUrl(encodeURIComponent(JSON.stringify({ fecondite: 'abc', inconnu: 3 })))).toEqual({});
  });

  it('chaque scénario-type produit une simulation finie', () => {
    for (const p of PRESETS) {
      const r = simuler(versScenario(appliquerPreset(p))).annees.at(-1)!;
      expect(Number.isFinite(r.soldePctPib)).toBe(true);
    }
  });
});
