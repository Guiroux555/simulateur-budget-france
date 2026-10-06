import { describe, expect, it } from 'vitest';
import { projeterDette, REFERENCE_PROVISOIRE, type ReferenceDette } from '../src/modules/dette/engine';

const ref = REFERENCE_PROVISOIRE;
const ecartsConstants = (soldePct: number, pibNiveau: number) =>
  new Map([ref.anneeDepart, ...ref.annees].map((a) => [a, { ecartSoldePctPibReference: soldePct, ecartPibNiveau: a === ref.anneeDepart ? 0 : pibNiveau }]));

describe('module dette : moteur', () => {
  it('la référence couvre une fenêtre de 10 ans après l’année de départ, séries complètes', () => {
    expect(ref.annees[0]).toBe(ref.anneeDepart + 1);
    expect(ref.annees.length).toBe(11);
    ref.annees.forEach((a, i) => i > 0 && expect(a).toBe(ref.annees[i - 1] + 1));
    for (const serie of [ref.soldePrimairePctPib, ref.tauxInteretApparent, ref.croissanceNominale])
      expect(serie.length).toBe(ref.annees.length);
  });

  it('applique l’identité dette(t) = dette(t−1) × (1 + r) / (1 + g) − solde primaire', () => {
    const p = projeterDette(ref);
    let prec = ref.detteDepartPctPib;
    p.forEach((a, i) => {
      const attendu = (prec * (1 + ref.tauxInteretApparent[i])) / (1 + ref.croissanceNominale[i]) - ref.soldePrimairePctPib[i];
      expect(a.dettePctPib).toBeCloseTo(attendu, 12);
      expect(a.soldePctPib).toBeCloseTo(a.soldePrimairePctPib - a.chargeInteretsPctPib, 12);
      prec = a.dettePctPib;
    });
  });

  it('au solde primaire stabilisant, la dette reste constante en part du PIB', () => {
    const r = 0.03;
    const g = 0.02;
    const d0 = 1.1;
    const stable: ReferenceDette = {
      ...ref,
      detteDepartPctPib: d0,
      tauxInteretApparent: ref.annees.map(() => r),
      croissanceNominale: ref.annees.map(() => g),
      soldePrimairePctPib: ref.annees.map(() => (d0 * (r - g)) / (1 + g)),
    };
    const p = projeterDette(stable);
    for (const a of p) {
      expect(a.dettePctPib).toBeCloseTo(d0, 12);
      expect(a.soldePrimaireStabilisantPctPib).toBeCloseTo(a.soldePrimairePctPib, 12);
    }
  });

  it('un écart de solde de +1 pt par an réduit la dette selon l’identité (écart cumulé × (1 + r) / (1 + g) + 1 pt)', () => {
    const base = projeterDette(ref);
    const avec = projeterDette(ref, ecartsConstants(0.01, 0));
    let ecart = 0;
    avec.forEach((a, i) => {
      ecart = (ecart * (1 + ref.tauxInteretApparent[i])) / (1 + ref.croissanceNominale[i]) + 0.01;
      expect(base[i].dettePctPib - a.dettePctPib).toBeCloseTo(ecart, 12);
    });
  });

  it('un PIB durablement plus élevé de 1 % réduit la dette en part du PIB, sans changer le solde', () => {
    const base = projeterDette(ref);
    const avec = projeterDette(ref, ecartsConstants(0, 0.01));
    expect(avec[0].croissanceNominale).toBeGreaterThan(base[0].croissanceNominale);
    avec.forEach((a, i) => {
      expect(a.dettePctPib).toBeLessThan(base[i].dettePctPib);
      expect(a.soldePrimairePctPib).toBeCloseTo(base[i].soldePrimairePctPib, 12);
      if (i > 0) expect(a.croissanceNominale).toBeCloseTo(base[i].croissanceNominale, 12);
    });
  });

  it('calibrage : une référence non provisoire doit fournir la dette publiée, à ± 0,1 pt', () => {
    const cibles = Object.entries(ref.cibleDettePctPib);
    if (cibles.length === 0) {
      expect(ref.provisoire).toBe(true);
      return;
    }
    const p = projeterDette(ref);
    for (const [annee, cible] of cibles) {
      const a = p.find((x) => x.annee === +annee)!;
      expect(Math.abs(a.dettePctPib - cible)).toBeLessThanOrEqual(0.001);
    }
  });
});
