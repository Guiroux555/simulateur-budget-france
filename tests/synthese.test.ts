import { describe, expect, it } from 'vitest';
import { projeterDette, REFERENCE_DETTE, SCENARIO_DETTE_REFERENCE } from '../src/modules/dette/engine';
import { PARAMETRES_REFERENCE, versUrl } from '../src/modules/retraites/app/parametres';
import { calculerSynthese, resumesDesModules } from '../src/synthese/synthese';
import { MODULES } from '../src/modules';

describe('page de synthèse', () => {
  it('au repos, elle redonne exactement la trajectoire de référence', () => {
    const s = calculerSynthese(resumesDesModules());
    const ref = projeterDette(REFERENCE_DETTE);
    expect(s.annees.map((a) => a.annee)).toEqual(REFERENCE_DETTE.annees);
    s.annees.forEach((a, i) => {
      expect(a.dettePctPib).toBe(ref[i].dettePctPib);
      expect(a.detteReferencePctPib).toBe(ref[i].dettePctPib);
      expect(a.detteEffetBudgetaireSeulPctPib).toBe(ref[i].dettePctPib);
      expect(a.detteModuleDetteSeulPctPib).toBe(ref[i].dettePctPib);
      expect(a.contributions.map((c) => c.module)).toEqual(MODULES.map((m) => m.id));
    });
  });

  it('signale une référence provisoire', () => {
    expect(calculerSynthese(resumesDesModules()).provisoire).toBe(REFERENCE_DETTE.provisoire);
  });

  it('un report de l’âge légal réduit la dette, et l’effet via la croissance s’ajoute à l’effet budgétaire', () => {
    const lien = versUrl({ ...PARAMETRES_REFERENCE, ageLegalCible: 66 });
    const s = calculerSynthese(resumesDesModules({ retraites: lien }));
    const fin = s.annees.at(-1)!;
    const retraites = fin.contributions.find((c) => c.module === 'retraites')!;
    expect(retraites.ecartSoldePctPib).toBeGreaterThan(0);
    expect(retraites.ecartPibVolumePct).toBeGreaterThan(0);
    expect(fin.detteEffetBudgetaireSeulPctPib).toBeLessThan(fin.detteReferencePctPib);
    expect(fin.dettePctPib).toBeLessThan(fin.detteEffetBudgetaireSeulPctPib);
  });

  it('un module qui ne couvre pas une année compte pour sa référence', () => {
    const s = calculerSynthese([{ module: 'court', annees: [{ annee: 2026, depensesPctPib: 0, recettesPctPib: 0, soldePctPib: 0, ecartSoldeReferencePctPib: 0.01, ecartPibVolumePct: 0 }] }]);
    expect(s.annees[0].contributions[0].ecartSoldePctPib).toBe(0.01);
    expect(s.annees[1].contributions[0].ecartSoldePctPib).toBe(0);
  });

  it('le scénario du module dette déplace la dette sans changer la référence affichée', () => {
    const effort = { ...SCENARIO_DETTE_REFERENCE, ajustementAnnuel: 0.003 };
    const s = calculerSynthese(resumesDesModules(), REFERENCE_DETTE, effort);
    const ref = projeterDette(REFERENCE_DETTE);
    s.annees.forEach((a, i) => {
      expect(a.detteReferencePctPib).toBe(ref[i].dettePctPib);
      expect(a.detteModuleDetteSeulPctPib).toBeLessThan(ref[i].dettePctPib);
      expect(a.dettePctPib).toBe(a.detteModuleDetteSeulPctPib);
    });
  });
});
