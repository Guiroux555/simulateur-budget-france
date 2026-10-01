import type { ModuleBudgetaire } from '../../socle/module';
import { depuisUrl, PARAMETRES_REFERENCE, versScenario } from './app/parametres';
import { ANNEE_BASE, ANNEE_FIN, simuler, type ResultatSimulation, type Scenario } from './engine';

/** Module retraites vu de la page de synthèse : solde du système de retraite (convention COR). */
export const moduleRetraites: ModuleBudgetaire<Scenario, ResultatSimulation> = {
  id: 'retraites',
  libelle: 'Retraites',
  horizon: { debut: ANNEE_BASE, fin: ANNEE_FIN },
  scenarioReference: () => versScenario(PARAMETRES_REFERENCE),
  scenarioDepuisLien: (etat) => versScenario({ ...PARAMETRES_REFERENCE, ...depuisUrl(etat) }),
  simuler,
  resume(resultat, reference) {
    return {
      module: 'retraites',
      annees: resultat.annees.map((a, i) => {
        const ref = reference.annees[i] ?? a;
        return {
          annee: a.annee,
          depensesPctPib: a.depensesPctPib,
          recettesPctPib: a.ressourcesPctPib,
          soldePctPib: a.soldePctPib,
          ecartSoldeReferencePctPib: (a.solde - ref.solde) / ref.pib,
          // Le PIB du moteur suit la masse des revenus d'activité : un report d'âge l'augmente.
          ecartPibVolumePct: a.pib / ref.pib - 1,
        };
      }),
    };
  },
};
