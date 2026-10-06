import { describe, expect, it } from 'vitest';
import donnees from '../data/repartition/apu-france.json';
import { arrondirEnConservantTotal, empruntPour100, pour100, type DonneesRepartition } from '../src/accueil/repartition';

const D = donnees as DonneesRepartition;
const somme = (v: readonly number[]) => v.reduce((s, x) => s + x, 0);

describe('« Où vont 100 € » : arrondis', () => {
  it('les montants arrondis totalisent exactement le total demandé', () => {
    expect(somme(arrondirEnConservantTotal([1, 1, 1], 100))).toBe(100);
    expect(arrondirEnConservantTotal([1, 1, 1], 100)).toEqual([34, 33, 33]);
    expect(arrondirEnConservantTotal([0.5, 0.5], 3)).toEqual([2, 1]);
    expect(arrondirEnConservantTotal([0, 0], 100)).toEqual([0, 0]);
  });

  it('chaque montant arrondi reste à moins d’un euro de sa valeur exacte', () => {
    for (const lignes of [pour100(D.depenses.postes), pour100(D.recettes.postes)]) {
      expect(somme(lignes.map((l) => l.euros))).toBe(100);
      for (const l of lignes) expect(Math.abs(l.euros - l.eurosExacts)).toBeLessThan(1);
      lignes.forEach((l, i) => i > 0 && expect(l.mdEuros).toBeLessThanOrEqual(lignes[i - 1].mdEuros));
    }
  });
});

describe('« Où vont 100 € » : cohérence des données', () => {
  it('les postes de chaque ventilation retrouvent son total publié, à 1 % près', () => {
    for (const v of [D.depenses, D.recettes]) expect(Math.abs(somme(v.postes.map((p) => p.mdEuros)) / v.totalMdEuros - 1)).toBeLessThan(0.01);
  });

  it('une ventilation de l’année des grandeurs d’ensemble retrouve leur total', () => {
    if (D.recettes.annee === D.annee) expect(D.recettes.totalMdEuros).toBeCloseTo(D.recettesMdEuros, 6);
    if (D.depenses.annee === D.annee) expect(D.depenses.totalMdEuros).toBeCloseTo(D.depensesMdEuros, 6);
  });

  it('grandeurs d’ensemble cohérentes : dépenses − recettes = déficit publié', () => {
    expect(D.depensesMdEuros - D.recettesMdEuros).toBeCloseTo(152.5, 6);
  });

  it('identifiants uniques, montants positifs, liens vers des pages existantes', () => {
    for (const postes of [D.depenses.postes, D.recettes.postes]) {
      expect(new Set(postes.map((p) => p.id)).size).toBe(postes.length);
      for (const p of postes) {
        expect(p.mdEuros).toBeGreaterThan(0);
        if (p.page) expect(['retraites', 'dette', 'synthese']).toContain(p.page);
      }
    }
  });

  it('la part financée par l’emprunt correspond au déficit', () => {
    expect(empruntPour100(D)).toBeCloseTo(((D.depensesMdEuros - D.recettesMdEuros) / D.depensesMdEuros) * 100, 12);
    expect(empruntPour100({ depensesMdEuros: 100, recettesMdEuros: 95 })).toBeCloseTo(5, 12);
  });
});
