import { describe, expect, it } from 'vitest';
import cor from '../data/cor-2026-reference.json';
import { equilibre } from '../src/modules/retraites/engine/equilibre';
import { simuler } from '../src/modules/retraites/engine/modele';
import { LEVIERS_NEUTRES, scenarioReference, VARIANTES_PRODUCTIVITE } from '../src/modules/retraites/engine/reference';
import type { Leviers, ResultatSimulation } from '../src/modules/retraites/engine/types';

const reference = simuler(scenarioReference());
const annee = (s: ResultatSimulation, a: number) => s.annees.find((r) => r.annee === a)!;
const avecLeviers = (l: Partial<Leviers>) => simuler({ ...scenarioReference(), leviers: { ...LEVIERS_NEUTRES, ...l } });

describe('calibrage sur le COR 2026 (scénario de référence)', () => {
  const c = cor.cibles;
  it('reproduit les dépenses en % du PIB à 0,2 pt près', () => {
    for (const [a, v] of Object.entries(c.depensesPctPib)) expect(Math.abs(annee(reference, +a).depensesPctPib - v)).toBeLessThan(0.002);
  });
  it('reproduit le solde en % du PIB à 0,2 pt près', () => {
    for (const [a, v] of Object.entries(c.soldePctPib)) expect(Math.abs(annee(reference, +a).soldePctPib - v)).toBeLessThan(0.002);
  });
  it('reproduit le rapport démographique 20-64 / 65+', () => {
    for (const [a, v] of Object.entries(c.rapportDemographique20_64sur65plus))
      expect(Math.abs(annee(reference, +a).rapportDemographique - v)).toBeLessThan(0.05);
  });
  it('reproduit les âges de départ d’équilibre à 0,5 an près', () => {
    const eq = equilibre(reference);
    for (const [a, v] of Object.entries(c.ageMoyenDepartEquilibre))
      expect(Math.abs(eq.find((e) => e.annee === +a)!.ageDepartNecessaire - v)).toBeLessThan(0.5);
  });
  it('reproduit la hausse de prélèvement nécessaire en 2070 à 0,5 pt près', () => {
    const eq = equilibre(reference).find((e) => e.annee === 2070)!;
    expect(Math.abs(eq.hausseTauxNecessaire - c.hausseTauxPrelevementEquilibre2070)).toBeLessThan(0.005);
  });
  it('fait baisser la pension relative (écart au COR documenté : < 4 pt en 2070)', () => {
    expect(annee(reference, 2025).pensionRelative).toBeCloseTo(0.546, 3);
    expect(Math.abs(annee(reference, 2070).pensionRelative - c.pensionRelative['2070'])).toBeLessThan(0.04);
  });
});

describe('cohérence comptable', () => {
  it('solde = ressources − dépenses, et la dette cumule les déficits', () => {
    let dette = 0;
    for (const r of reference.annees) {
      expect(r.solde).toBeCloseTo(r.ressources - r.depenses, 9);
      dette = dette * 1.01 - r.solde;
      expect(r.detteCumulee).toBeCloseTo(dette, 6);
    }
  });
  it('les solveurs d’équilibre ramènent bien le solde à zéro', () => {
    const eq2070 = equilibre(reference).find((e) => e.annee === 2070)!;
    const s = avecLeviers({ hausseTauxCotisation: [[2069, 0], [2070, eq2070.hausseTauxNecessaire]] });
    expect(annee(s, 2070).soldePctPib).toBeCloseTo(0, 6);
  });
});

describe('sens de variation des leviers', () => {
  const solde = (s: ResultatSimulation, a: number) => annee(s, a).soldePctPib;

  it('relever l’âge légal améliore le solde, l’abaisser le dégrade', () => {
    expect(solde(avecLeviers({ ageLegal: [[2027, 62.75], [2035, 65]] }), 2045)).toBeGreaterThan(solde(reference, 2045));
    expect(solde(avecLeviers({ ageLegal: [[2027, 62.75], [2028, 62]] }), 2045)).toBeLessThan(solde(reference, 2045));
  });
  it('+1 pt de cotisation améliore le solde de ≈ 1 pt × part de la masse salariale', () => {
    const s = avecLeviers({ hausseTauxCotisation: [[2026, 0], [2027, 0.01]] });
    const gain = solde(s, 2030) - solde(reference, 2030);
    expect(gain).toBeGreaterThan(0.003);
    expect(gain).toBeLessThan(0.006);
  });
  it('un gel des pensions améliore durablement le solde et baisse la pension relative', () => {
    const s = avecLeviers({ anneesGel: [2026] });
    expect(solde(s, 2030)).toBeGreaterThan(solde(reference, 2030));
    expect(annee(s, 2030).pensionRelative).toBeLessThan(annee(reference, 2030).pensionRelative);
  });
  it('une productivité plus forte améliore le solde et réduit la pension relative', () => {
    const fort = simuler({ ...scenarioReference(), hypotheses: { ...scenarioReference().hypotheses, productivite: VARIANTES_PRODUCTIVITE['1,3 %'] } });
    expect(solde(fort, 2070)).toBeGreaterThan(solde(reference, 2070));
    expect(annee(fort, 2070).pensionRelative).toBeLessThan(annee(reference, 2070).pensionRelative);
  });
  it('la capitalisation substitutive crée un coût de transition puis des rentes', () => {
    const s = avecLeviers({
      capitalisation: { taux: 0.03, mode: 'substitutif', anneeDebut: 2028, rendementReel: 0.03, dureeRente: 22 },
    });
    expect(solde(s, 2030)).toBeLessThan(solde(reference, 2030) - 0.005);
    expect(annee(s, 2070).rentesCapitalisation).toBeGreaterThan(0);
    expect(annee(s, 2070).pensionRelativeTotale).toBeGreaterThan(annee(s, 2070).pensionRelative);
  });
  it('un fonds de réserve améliore le solde à long terme', () => {
    const s = avecLeviers({
      capitalisation: { taux: 0.01, mode: 'fonds-reserve', anneeDebut: 2028, rendementReel: 0.03, dureeRente: 22 },
    });
    expect(solde(s, 2070)).toBeGreaterThan(solde(reference, 2070));
  });
});
