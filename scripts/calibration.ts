/**
 * Compare le scénario de référence du modèle aux chiffres publiés par le COR (juin 2026).
 * Usage : npm run calibration
 */
import cor from '../data/cor-2026-reference.json';
import { equilibre } from '../src/modules/retraites/engine/equilibre';
import { simuler } from '../src/modules/retraites/engine/modele';
import { scenarioReference } from '../src/modules/retraites/engine/reference';

const sim = simuler(scenarioReference());
const eq = equilibre(sim);
const an = (a: number) => sim.annees.find((r) => r.annee === a)!;
const eqA = (a: number) => eq.find((r) => r.annee === a)!;
const pct = (x: number) => `${(x * 100).toFixed(1)} %`;

type Ligne = { indicateur: string; annee: number; cor: string; modele: string; ecart: string };
const lignes: Ligne[] = [];
const ajouter = (indicateur: string, annee: number, cible: number, valeur: number, format: (x: number) => string, enPoints = true) =>
  lignes.push({
    indicateur,
    annee,
    cor: format(cible),
    modele: format(valeur),
    ecart: enPoints ? `${((valeur - cible) * 100).toFixed(2)} pt` : (valeur - cible).toFixed(2),
  });

const c = cor.cibles;
for (const [a, v] of Object.entries(c.depensesPctPib)) ajouter('Dépenses / PIB', +a, v, an(+a).depensesPctPib, pct);
for (const [a, v] of Object.entries(c.ressourcesPctPib)) ajouter('Ressources / PIB', +a, v, an(+a).ressourcesPctPib, pct);
for (const [a, v] of Object.entries(c.soldePctPib)) ajouter('Solde / PIB', +a, v, an(+a).soldePctPib, pct);
for (const [a, v] of Object.entries(c.pensionRelative)) ajouter('Pension relative', +a, v, an(+a).pensionRelative, pct);
for (const [a, v] of Object.entries(c.rapportDemographique20_64sur65plus))
  ajouter('20-64 ans / 65 ans et +', +a, v, an(+a).rapportDemographique, (x) => x.toFixed(2), false);
for (const [a, v] of Object.entries(c.ageMoyenDepartEquilibre))
  ajouter('Âge de départ d’équilibre', +a, v, eqA(+a).ageDepartNecessaire, (x) => x.toFixed(1), false);
ajouter('Hausse de taux d’équilibre', 2070, c.hausseTauxPrelevementEquilibre2070, eqA(2070).hausseTauxNecessaire, pct);

console.table(lignes);
console.log('\nTrajectoire du modèle (scénario de référence) :');
console.table(
  sim.annees
    .filter((r) => r.annee % 5 === 0)
    .map((r) => ({
      annee: r.annee,
      'pop (M)': (r.population / 1e6).toFixed(1),
      'naiss. (k)': (r.naissances / 1e3).toFixed(0),
      'cotisants (M)': (r.cotisants / 1e6).toFixed(1),
      'retraités (M)': (r.retraites / 1e6).toFixed(1),
      'cot/ret': r.ratioCotisantsRetraites.toFixed(2),
      'âge départ': r.ageMoyenDepart.toFixed(1),
      'dépenses': pct(r.depensesPctPib),
      'ressources': pct(r.ressourcesPctPib),
      'solde': pct(r.soldePctPib),
      'solde Md€': r.solde.toFixed(1),
      'pension rel.': pct(r.pensionRelative),
      'dette % PIB': pct(r.detteCumuleePctPib),
    })),
);
