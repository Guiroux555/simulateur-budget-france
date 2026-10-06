/**
 * Page de synthèse : rassemble les scénarios choisis dans chaque module et en déduit la dette.
 *
 * La synthèse part de la trajectoire de référence de la dette et y ajoute les écarts de chaque
 * module à sa propre référence (voir §4 de `docs/budget/IDEATION.md`) :
 *  - écarts de solde : additionnés (ils sont tous en part du PIB de la référence) ;
 *  - écarts de PIB : multipliés (chaque module déplace le niveau du PIB).
 * Au repos (tous les modules à leur référence), elle redonne exactement la trajectoire de référence.
 */
import type { ModuleBudgetaire, ResumeModule } from '../socle/module';
import { MODULES } from '../modules';
import { projeterDette, REFERENCE_PROVISOIRE } from '../modules/dette/engine';
import type { EcartAnnee, ReferenceDette } from '../modules/dette/engine';

export interface ContributionModule {
  module: string;
  /** Effet budgétaire, en part du PIB de la référence du module. */
  ecartSoldePctPib: number;
  /** Effet via la croissance : écart de niveau du PIB en volume. */
  ecartPibVolumePct: number;
}

export interface AnneeSynthese {
  annee: number;
  dettePctPib: number;
  detteReferencePctPib: number;
  /** Dette avec les seuls effets budgétaires des modules (sans leur effet sur la croissance). */
  detteEffetBudgetaireSeulPctPib: number;
  soldePrimairePctPib: number;
  soldePctPib: number;
  contributions: ContributionModule[];
}

export interface Synthese {
  source: string;
  provisoire: boolean;
  annees: AnneeSynthese[];
}

/** Résumé de chaque module pour le scénario encodé dans son lien (lien absent = référence). */
export function resumesDesModules(liens: Readonly<Record<string, string>> = {}): ResumeModule[] {
  return (MODULES as readonly ModuleBudgetaire<unknown, unknown>[]).map((m) => {
    const reference = m.simuler(m.scenarioReference());
    const scenario = m.simuler(m.scenarioDepuisLien(liens[m.id] ?? ''));
    return m.resume(scenario, reference);
  });
}

function contributionsA(resumes: readonly ResumeModule[], annee: number): ContributionModule[] {
  return resumes.map((r) => {
    const a = r.annees.find((x) => x.annee === annee);
    // Une année hors de l'horizon du module compte pour sa référence.
    return { module: r.module, ecartSoldePctPib: a?.ecartSoldeReferencePctPib ?? 0, ecartPibVolumePct: a?.ecartPibVolumePct ?? 0 };
  });
}

function ecartTotal(contributions: readonly ContributionModule[], avecCroissance: boolean): EcartAnnee {
  return {
    ecartSoldePctPibReference: contributions.reduce((s, c) => s + c.ecartSoldePctPib, 0),
    ecartPibNiveau: avecCroissance ? contributions.reduce((p, c) => p * (1 + c.ecartPibVolumePct), 1) - 1 : 0,
  };
}

export function calculerSynthese(resumes: readonly ResumeModule[], reference: ReferenceDette = REFERENCE_PROVISOIRE): Synthese {
  const toutesAnnees = [reference.anneeDepart, ...reference.annees];
  const contributions = new Map(toutesAnnees.map((a) => [a, contributionsA(resumes, a)]));
  const ecarts = (avecCroissance: boolean) =>
    new Map(toutesAnnees.map((a) => [a, ecartTotal(contributions.get(a)!, avecCroissance)]));

  const detteRef = projeterDette(reference);
  const dette = projeterDette(reference, ecarts(true));
  const detteBudget = projeterDette(reference, ecarts(false));

  return {
    source: reference.source,
    provisoire: reference.provisoire,
    annees: dette.map((d, i) => ({
      annee: d.annee,
      dettePctPib: d.dettePctPib,
      detteReferencePctPib: detteRef[i].dettePctPib,
      detteEffetBudgetaireSeulPctPib: detteBudget[i].dettePctPib,
      soldePrimairePctPib: d.soldePrimairePctPib,
      soldePctPib: d.soldePctPib,
      contributions: contributions.get(d.annee)!,
    })),
  };
}
