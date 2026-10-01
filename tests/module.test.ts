import { describe, expect, it } from 'vitest';
import { MODULES } from '../src/modules';
import { moduleRetraites } from '../src/modules/retraites/module';
import { simuler } from '../src/modules/retraites/engine';
import { PARAMETRES_REFERENCE, versUrl } from '../src/modules/retraites/app/parametres';

describe('contrat de module', () => {
  it('les identifiants des modules sont uniques', () => {
    const ids = MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('chaque module : le lien vide restitue la référence, dont l’écart à elle-même est nul', () => {
    for (const m of MODULES) {
      const reference = m.simuler(m.scenarioReference());
      const depuisLien = m.simuler(m.scenarioDepuisLien(''));
      const resume = m.resume(depuisLien, reference);
      expect(resume.module).toBe(m.id);
      expect(resume.annees[0].annee).toBe(m.horizon.debut);
      expect(resume.annees.at(-1)?.annee).toBe(m.horizon.fin);
      for (const a of resume.annees) {
        expect(a.ecartSoldeReferencePctPib).toBe(0);
        expect(a.ecartPibVolumePct).toBe(0);
        expect(a.soldePctPib).toBeCloseTo(a.recettesPctPib - a.depensesPctPib, 10);
      }
    }
  });

  it('retraites : le résumé suit le scénario encodé dans le lien du module', () => {
    const lien = versUrl({ ...PARAMETRES_REFERENCE, hausseCotisation: 1 });
    expect(lien).not.toBe('');
    const reference = moduleRetraites.simuler(moduleRetraites.scenarioReference());
    const scenario = moduleRetraites.simuler(moduleRetraites.scenarioDepuisLien(lien));
    const resume = moduleRetraites.resume(scenario, reference);
    const r2070 = resume.annees.at(-1)!;
    expect(r2070.ecartSoldeReferencePctPib).toBeGreaterThan(0);
    expect(r2070.soldePctPib).toBeCloseTo(simuler(moduleRetraites.scenarioDepuisLien(lien)).annees.at(-1)!.soldePctPib, 12);
  });

  it('retraites : un report de l’âge légal augmente le PIB, l’écart de solde est rapporté au PIB de la référence', () => {
    const lien = versUrl({ ...PARAMETRES_REFERENCE, ageLegalCible: 66 });
    const reference = moduleRetraites.simuler(moduleRetraites.scenarioReference());
    const scenario = moduleRetraites.simuler(moduleRetraites.scenarioDepuisLien(lien));
    const resume = moduleRetraites.resume(scenario, reference);
    const i = resume.annees.findIndex((a) => a.annee === 2045);
    const a = resume.annees[i];
    const s = scenario.annees[i];
    const r = reference.annees[i];
    for (const x of resume.annees) {
      expect(Number.isFinite(x.ecartPibVolumePct)).toBe(true);
      expect(Number.isFinite(x.ecartSoldeReferencePctPib)).toBe(true);
    }
    expect(a.ecartPibVolumePct).toBeGreaterThan(0);
    expect(a.ecartPibVolumePct).toBeCloseTo(s.pib / r.pib - 1, 12);
    expect(a.ecartSoldeReferencePctPib).toBeCloseTo((s.solde - r.solde) / r.pib, 12);
    expect(a.ecartSoldeReferencePctPib).toBeGreaterThan(0);
  });
});
