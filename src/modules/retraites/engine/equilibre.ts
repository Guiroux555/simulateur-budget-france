/**
 * « Triangle d'équilibre » : pour chaque année, valeur qu'il faudrait donner à UN levier,
 * les autres étant inchangés, pour que le solde du système soit nul (ou égal à une cible).
 * Même démarche que les « abaques » du COR, qui mesurent l'effort à fournir sur un seul levier.
 */
import { effectifs, partMasseSalariale } from './modele';
import { valeurA } from '../../../socle/trajectoire';
import type { ResultatAnnee, ResultatSimulation } from './types';

export interface EquilibreAnnee {
  annee: number;
  /** Hausse du taux de prélèvement nécessaire (points de masse des revenus d'activité, fraction). */
  hausseTauxNecessaire: number;
  /** Pension relative (pension moyenne / revenu d'activité moyen) compatible avec l'équilibre. */
  pensionRelativeNecessaire: number;
  /** Âge moyen effectif de départ compatible avec l'équilibre (état stationnaire, toutes générations). */
  ageDepartNecessaire: number;
}

const somme = (v: Float64Array) => v.reduce((s, x) => s + x, 0);

function ageEquilibre(r: ResultatAnnee, simulation: ResultatSimulation, partMasse: number, soldeCible: number): number {
  const { hypotheses, leviers } = simulation.scenario;
  const population = Float64Array.from(r.pyramide);
  const chomage = valeurA(hypotheses.chomage, r.annee);
  const emploiSeniors = valeurA(leviers.hausseEmploiSeniors, r.annee);
  const activite = valeurA(leviers.hausseActivite, r.annee);
  const ecart = (age: number) => {
    const eff = effectifs(population, r.annee, () => age, chomage, emploiSeniors, activite);
    const depenses = somme(eff.retraites) * r.pensionMoyenne;
    const pib = (somme(eff.cotisants) * r.revenuActiviteMoyen) / partMasse;
    return (r.ressourcesPctPib - soldeCible) * pib - depenses; // croissant avec l'âge
  };
  let lo = 55;
  let hi = 80;
  if (ecart(lo) >= 0) return lo;
  if (ecart(hi) <= 0) return hi;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (ecart(mid) < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * @param soldeCible solde visé en part de PIB (0 = équilibre ; −0.005 = déficit toléré de 0,5 pt)
 * @param annees restreint le calcul à certaines années (par défaut : toutes)
 */
export function equilibre(simulation: ResultatSimulation, soldeCible = 0, annees?: ReadonlyArray<number>): EquilibreAnnee[] {
  const partMasse = partMasseSalariale(simulation);
  const retenues = annees ? simulation.annees.filter((r) => annees.includes(r.annee)) : simulation.annees;
  return retenues.map((r) => {
    const ecartSolde = soldeCible - r.soldePctPib;
    return {
      annee: r.annee,
      hausseTauxNecessaire: ecartSolde / partMasse,
      pensionRelativeNecessaire: (r.pensionRelative * (r.ressourcesPctPib - soldeCible)) / r.depensesPctPib,
      ageDepartNecessaire: ageEquilibre(r, simulation, partMasse, soldeCible),
    };
  });
}
