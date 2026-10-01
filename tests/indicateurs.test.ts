/**
 * La projection est calculée à partir des indicateurs, pas recopiée : chaque indicateur modifié
 * seul doit déplacer la chaîne démographie → emploi → pensions → solde dans le sens attendu.
 */
import { describe, expect, it } from 'vitest';
import { simuler } from '../src/modules/retraites/engine';
import { PARAMETRES_REFERENCE, versScenario, type ParametresUI } from '../src/modules/retraites/app/parametres';

const en2070 = (p: Partial<ParametresUI> = {}) =>
  simuler(versScenario({ ...PARAMETRES_REFERENCE, ...p })).annees.find((r) => r.annee === 2070)!;
const ref = en2070();

describe('la projection réagit à chaque indicateur', () => {
  it('natalité : plus de cotisants en 2070, mêmes retraités, meilleur solde', () => {
    const r = en2070({ fecondite: 1.8 });
    expect(r.cotisants).toBeGreaterThan(ref.cotisants * 1.05);
    expect(Math.abs(r.retraites - ref.retraites) / ref.retraites).toBeLessThan(0.005);
    expect(r.soldePctPib).toBeGreaterThan(ref.soldePctPib + 0.005);
  });
  it('espérance de vie : plus de retraités, solde dégradé', () => {
    const r = en2070({ ecartEsperanceVie: 3 });
    expect(r.retraites).toBeGreaterThan(ref.retraites * 1.05);
    expect(r.soldePctPib).toBeLessThan(ref.soldePctPib - 0.005);
  });
  it('migrations : plus de cotisants', () => {
    expect(en2070({ soldeMigratoire: 300 }).cotisants).toBeGreaterThan(ref.cotisants * 1.1);
  });
  it('productivité : pension relative plus basse, solde meilleur', () => {
    const r = en2070({ productivite: 1.3 });
    expect(r.pensionRelative).toBeLessThan(ref.pensionRelative - 0.03);
    expect(r.soldePctPib).toBeGreaterThan(ref.soldePctPib + 0.01);
  });
  it('chômage et activité : agissent sur les cotisants', () => {
    expect(en2070({ chomage: 10 }).cotisants).toBeLessThan(ref.cotisants);
    expect(en2070({ chomage: 4.5 }).soldePctPib).toBeGreaterThan(ref.soldePctPib);
    expect(en2070({ hausseActivite: 5 }).cotisants).toBeGreaterThan(ref.cotisants * 1.03);
  });
  it('âge légal : départ plus tardif, moins de retraités', () => {
    const r = en2070({ ageLegalCible: 66, ageLegalAnnee: 2035 });
    expect(r.ageMoyenDepart).toBeGreaterThan(ref.ageMoyenDepart + 1);
    expect(r.retraites).toBeLessThan(ref.retraites);
  });
});
