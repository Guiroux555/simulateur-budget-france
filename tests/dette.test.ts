import { describe, expect, it } from 'vitest';
import {
  ajustementPourStabiliser,
  appliquerScenario,
  depuisLienDette,
  MATURITE_MOYENNE,
  projeterDette,
  REFERENCE_PROVISOIRE,
  SCENARIO_DETTE_REFERENCE,
  versLienDette,
  type ReferenceDette,
} from '../src/modules/dette/engine';

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

describe('module dette : scénario et leviers', () => {
  it('le scénario de référence ne change rien', () => {
    expect(projeterDette(appliquerScenario(ref, SCENARIO_DETTE_REFERENCE))).toEqual(projeterDette(ref));
    expect(versLienDette(SCENARIO_DETTE_REFERENCE)).toBe('');
  });

  it('le lien permanent restitue le scénario, et ignore un lien illisible', () => {
    const s = { ajustementAnnuel: 0.003, dureeAjustement: 4, ecartTaux: 0.01, ecartCroissance: -0.005 };
    expect(depuisLienDette(versLienDette(s))).toEqual(s);
    expect(depuisLienDette('%7Bpas-du-json')).toEqual(SCENARIO_DETTE_REFERENCE);
  });

  it('l’effort budgétaire s’accumule pendant sa durée puis reste acquis', () => {
    const s = { ...SCENARIO_DETTE_REFERENCE, ajustementAnnuel: 0.005, dureeAjustement: 3 };
    const a = appliquerScenario(ref, s);
    a.soldePrimairePctPib.forEach((v, k) => expect(v - ref.soldePrimairePctPib[k]).toBeCloseTo(0.005 * Math.min(k + 1, 3), 12));
  });

  it('un choc de taux se transmet progressivement au taux apparent', () => {
    const a = appliquerScenario(ref, { ...SCENARIO_DETTE_REFERENCE, ecartTaux: 0.01 });
    const ecarts = a.tauxInteretApparent.map((v, k) => v - ref.tauxInteretApparent[k]);
    expect(ecarts[0]).toBeCloseTo(0.01 / MATURITE_MOYENNE, 12);
    ecarts.forEach((e, k) => k > 0 && expect(e).toBeGreaterThanOrEqual(ecarts[k - 1] - 1e-12));
    expect(ecarts.at(-1)).toBeCloseTo(0.01, 12);
  });

  it('l’ajustement de stabilisation arrête la hausse de la dette l’année cible', () => {
    const cible = ref.annees[5];
    const aj = ajustementPourStabiliser(ref, SCENARIO_DETTE_REFERENCE, cible)!;
    expect(aj).toBeGreaterThan(0);
    const p = projeterDette(appliquerScenario(ref, { ...SCENARIO_DETTE_REFERENCE, ajustementAnnuel: aj, dureeAjustement: 6 }));
    expect(p[5].dettePctPib - p[4].dettePctPib).toBeCloseTo(0, 6);
    expect(ajustementPourStabiliser(ref, SCENARIO_DETTE_REFERENCE, 1990)).toBeNull();
  });
});
