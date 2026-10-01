/**
 * Contrat commun des modules du simulateur (retraites, dette, santé…).
 *
 * Chaque module est indépendant : il ne dépend que du socle, jamais d'un autre module, et
 * fonctionne seul avec sa propre page et son propre lien permanent. La page de synthèse
 * est un simple consommateur : elle lit le scénario choisi dans chaque module (l'état encodé
 * dans son lien) et en récupère un résumé normalisé, comparable d'un module à l'autre.
 */

/** Une année du résumé d'un module, en part de PIB (fraction : 0.14 = 14 %). */
export interface AnneeResume {
  annee: number;
  depensesPctPib: number;
  recettesPctPib: number;
  soldePctPib: number;
  /** Écart de solde par rapport au scénario de référence du module (> 0 = amélioration). */
  ecartSoldeReferencePctPib: number;
}

export interface ResumeModule {
  module: string;
  annees: AnneeResume[];
}

export interface Horizon {
  debut: number;
  fin: number;
}

export interface ModuleBudgetaire<S, R> {
  /** Identifiant court, utilisé comme préfixe dans le lien permanent de la synthèse. */
  id: string;
  libelle: string;
  /** Période projetée, propre à chaque sujet (2070 pour les sujets démographiques). */
  horizon: Horizon;
  /** Scénario de référence (législation et hypothèses de l'institution de calibrage). */
  scenarioReference(): S;
  /** Scénario encodé dans le lien permanent du module (chaîne vide = référence). */
  scenarioDepuisLien(etat: string): S;
  simuler(scenario: S): R;
  /** Résumé normalisé lu par la page de synthèse. */
  resume(resultat: R, reference: R): ResumeModule;
}
