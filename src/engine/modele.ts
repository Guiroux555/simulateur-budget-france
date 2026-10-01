/**
 * Modèle de projection annuelle du système de retraite (tous régimes agrégés).
 *
 * Mécanique, pour chaque année :
 *  1. démographie : population par âge simple, avancée d'un an par composantes ;
 *  2. départs : part des retraités par âge = loi logistique autour de l'âge moyen effectif
 *     de départ de la génération concernée ;
 *  3. cotisants : non-retraités × taux d'activité par âge × (1 − chômage) ;
 *  4. pensions : suivies par âge ; le stock est revalorisé (prix ± mesures), les nouveaux
 *     retraités entrent avec une pension calculée sur leurs revenus d'activité passés ;
 *  5. PIB proportionnel à la masse des revenus d'activité ; ressources en % du PIB.
 */
import { avancerPopulation, esperanceVieA, NB_AGES, sommeAges, tableMortalite } from './demographie';
import { pyramide2025 } from './donnees/population2025';
import { AGE_LEGAL_REFERENCE, ANNEE_BASE, CALIBRAGE } from './reference';
import { valeurA } from './trajectoire';
import type { Hypotheses, Leviers, ResultatAnnee, ResultatSimulation, Scenario } from './types';

const AGE_PIVOT_GENERATION = 63;

export function ageLegal(leviers: Leviers, annee: number): number {
  return valeurA(leviers.ageLegal ?? AGE_LEGAL_REFERENCE, annee);
}

/** Âge moyen effectif de départ des personnes atteignant l'âge de la retraite l'année donnée. */
export function ageMoyenDepart(leviers: Leviers, annee: number): number {
  const ref = valeurA(AGE_LEGAL_REFERENCE, annee) + valeurA(CALIBRAGE.ecartAgeEffectif, annee);
  const reportLegal = ageLegal(leviers, annee) - valeurA(AGE_LEGAL_REFERENCE, annee);
  return (
    ref +
    CALIBRAGE.transmissionAgeLegal * reportLegal +
    CALIBRAGE.transmissionDuree * valeurA(leviers.dureeSupplementaire, annee)
  );
}

/** Part des personnes d'âge `age` déjà parties à la retraite, pour un âge moyen de départ donné. */
export function partRetraites(age: number, ageMoyen: number): number {
  return 1 / (1 + Math.exp(-(age + 0.5 - ageMoyen) / CALIBRAGE.dispersionDepart));
}

export interface Effectifs {
  partRetraites: Float64Array;
  retraites: Float64Array;
  cotisants: Float64Array;
}

/**
 * Retraités et cotisants par âge.
 * @param ageDepart âge moyen de départ en fonction de l'année de passage à la retraite de la génération
 */
export function effectifs(
  population: Float64Array,
  annee: number,
  ageDepart: (anneeGeneration: number) => number,
  chomage: number,
  hausseEmploiSeniors: number,
): Effectifs {
  const part = new Float64Array(NB_AGES);
  const retraites = new Float64Array(NB_AGES);
  const cotisants = new Float64Array(NB_AGES);
  for (let a = 0; a < NB_AGES; a++) {
    if (a >= 45) {
      const anneeGeneration = annee - Math.max(0, a - AGE_PIVOT_GENERATION);
      part[a] = partRetraites(a, ageDepart(anneeGeneration));
    }
    retraites[a] = population[a] * part[a];
    let activite = valeurA(CALIBRAGE.activiteParAge, a);
    if (a >= 55 && a < 70) activite = Math.min(0.95, activite + hausseEmploiSeniors);
    cotisants[a] = population[a] * (1 - part[a]) * activite * (1 - chomage);
  }
  return { partRetraites: part, retraites, cotisants };
}

const somme = (v: Float64Array) => v.reduce((s, x) => s + x, 0);

function indexationReelle(leviers: Leviers, hyp: Hypotheses, annee: number): number {
  if (leviers.anneesGel.includes(annee)) return 1 / (1 + valeurA(hyp.inflation, annee));
  return 1 + valeurA(leviers.sousIndexation, annee);
}

export function simuler(scenario: Scenario): ResultatSimulation {
  const { hypotheses: hyp, leviers } = scenario;
  if (scenario.anneeDebut !== ANNEE_BASE) {
    throw new Error(`La projection doit démarrer en ${ANNEE_BASE} (année des données de base).`);
  }

  const ageDepartLevier = (a: number) => ageMoyenDepart(leviers, Math.max(a, ANNEE_BASE));
  const ageDepartRef = (a: number) =>
    valeurA(AGE_LEGAL_REFERENCE, Math.max(a, ANNEE_BASE)) +
    valeurA(CALIBRAGE.ecartAgeEffectif, Math.max(a, ANNEE_BASE));

  let population = pyramide2025();
  let naissances = 0;

  // --- Année de base : calage des grandeurs monétaires.
  const eff0 = effectifs(population, ANNEE_BASE, ageDepartLevier, valeurA(hyp.chomage, ANNEE_BASE), 0);
  const effRef0 = effectifs(population, ANNEE_BASE, ageDepartRef, valeurA(hyp.chomage, ANNEE_BASE), 0);
  const retraitesRef0 = somme(effRef0.retraites);
  const pensionMoyenneBase = (CALIBRAGE.depensesBase * 1e9) / retraitesRef0;
  const revenuBase = pensionMoyenneBase / CALIBRAGE.pensionRelativeBase;
  const pibBase = CALIBRAGE.depensesBase / CALIBRAGE.depensesPctPibBase;
  /** Part de la masse des revenus d'activité dans le PIB. */
  const partMasse = (somme(effRef0.cotisants) * revenuBase) / 1e9 / pibBase;
  const tauxPrelevementTotal = valeurA(CALIBRAGE.ressourcesReferencePctPib, ANNEE_BASE) / partMasse;

  // Profil initial des pensions par âge (les plus âgés ont des pensions plus faibles).
  let pensions = new Float64Array(NB_AGES);
  const ageRefBase = ageDepartRef(ANNEE_BASE);
  for (let a = 0; a < NB_AGES; a++) pensions[a] = Math.pow(1 + CALIBRAGE.penteStockInitial, -(a - ageRefBase));
  const normalisation =
    (CALIBRAGE.depensesBase * 1e9) / effRef0.retraites.reduce((s, r, a) => s + r * pensions[a], 0);
  for (let a = 0; a < NB_AGES; a++) pensions[a] *= normalisation;
  const pensionLiquidationBase = normalisation; // pension d'un nouveau retraité en 2025

  // Revenus d'activité moyens réels par année (passé reconstitué, futur projeté).
  const revenus = new Map<number, number>();
  const revenuA = (annee: number): number =>
    revenus.get(annee) ?? revenuBase * Math.pow(1 + CALIBRAGE.croissanceHistoriqueSalaires, annee - ANNEE_BASE);
  revenus.set(ANNEE_BASE, revenuBase);
  const K = CALIBRAGE.decalageSalaireReference;
  const coefLiquidation = pensionLiquidationBase / revenuA(ANNEE_BASE - K);

  const cap = leviers.capitalisation;
  let fonds = 0;
  let dette = 0;
  let retraitesPrec = eff0.retraites;
  let qPrec = tableMortalite(valeurA(hyp.esperanceVie, ANNEE_BASE));

  const annees: ResultatAnnee[] = [];
  for (let t = ANNEE_BASE; t <= scenario.anneeFin; t++) {
    const chomage = valeurA(hyp.chomage, t);
    if (t > ANNEE_BASE) revenus.set(t, revenuA(t - 1) * (1 + valeurA(hyp.productivite, t)));
    const revenu = revenuA(t);

    const eff = effectifs(population, t, ageDepartLevier, chomage, valeurA(leviers.hausseEmploiSeniors, t));
    const cotisants = somme(eff.cotisants);
    const retraites = somme(eff.retraites);
    const masse = (cotisants * revenu) / 1e9;
    const pib = masse / partMasse;

    // Capitalisation : flux de l'année.
    let cotisationsCap = 0;
    let rentes = 0;
    let reductionDroits = 0;
    if (cap && t >= cap.anneeDebut) {
      const anciennete = t - cap.anneeDebut;
      const maturite = Math.min(1, anciennete / CALIBRAGE.maturiteCapitalisation);
      cotisationsCap = cap.taux * masse;
      rentes =
        cap.mode === 'fonds-reserve'
          ? fonds * cap.rendementReel
          : (fonds * (1 + cap.rendementReel) * maturite) / cap.dureeRente;
      fonds = fonds * (1 + cap.rendementReel) + cotisationsCap - rentes;
      if (cap.mode === 'substitutif') reductionDroits = (cap.taux / tauxPrelevementTotal) * maturite;
    }

    // Pensions par âge.
    let liquidation = pensionLiquidationBase;
    if (t > ANNEE_BASE) {
      const indexation = indexationReelle(leviers, hyp, t);
      const gainAge =
        CALIBRAGE.gainPensionParAnnee * (ageMoyenDepart(leviers, t) - ageDepartRef(t) - CALIBRAGE.transmissionDuree * valeurA(leviers.dureeSupplementaire, t));
      liquidation =
        coefLiquidation *
        revenuA(t - K) *
        (1 + gainAge) *
        (1 + valeurA(leviers.ajustementPensionLiquidation, t)) *
        (1 - reductionDroits) *
        Math.pow(1 - CALIBRAGE.erosionLiquidation, t - ANNEE_BASE);
      const nouvelles = new Float64Array(NB_AGES);
      for (let a = 1; a < NB_AGES; a++) {
        const survivants =
          retraitesPrec[a - 1] * (1 - qPrec[a - 1]) + (a === NB_AGES - 1 ? retraitesPrec[a] * (1 - qPrec[a]) : 0);
        const pensionSurvivants = pensions[a - 1] * indexation;
        const cible = eff.retraites[a];
        if (cible <= 0) continue;
        if (cible > survivants) {
          nouvelles[a] = (survivants * pensionSurvivants + (cible - survivants) * liquidation) / cible;
        } else {
          nouvelles[a] = pensionSurvivants;
        }
      }
      pensions = nouvelles;
    }

    let depenses = eff.retraites.reduce((s, r, a) => s + r * pensions[a], 0) / 1e9;
    let ressources =
      (valeurA(CALIBRAGE.ressourcesReferencePctPib, t) + valeurA(leviers.ressourcesExternes, t)) * pib +
      valeurA(leviers.hausseTauxCotisation, t) * masse;
    if (cap?.mode === 'fonds-reserve') ressources += rentes;
    if (cap?.mode === 'substitutif') ressources -= cotisationsCap;

    const solde = ressources - depenses;
    dette = dette * (1 + CALIBRAGE.tauxInteretReel) - solde;
    const pensionMoyenne = (depenses * 1e9) / retraites;
    const rentesIndividuelles = cap && cap.mode !== 'fonds-reserve' ? rentes : 0;
    const plus65 = sommeAges(population, 65, NB_AGES);

    annees.push({
      annee: t,
      population: somme(population),
      rapportDemographique: sommeAges(population, 20, 64) / plus65,
      naissances,
      esperanceVie: valeurA(hyp.esperanceVie, t),
      ageLegal: ageLegal(leviers, t),
      ageMoyenDepart: ageMoyenDepart(leviers, t),
      cotisants,
      retraites,
      ratioCotisantsRetraites: cotisants / retraites,
      revenuActiviteMoyen: revenu,
      pensionMoyenne,
      pensionRelative: pensionMoyenne / revenu,
      pensionLiquidationRelative: liquidation / revenu,
      esperanceVieADepart: esperanceVieA(tableMortalite(valeurA(hyp.esperanceVie, t)), Math.round(ageMoyenDepart(leviers, t))),
      pensionRelativeTotale: ((depenses + rentesIndividuelles) * 1e9) / retraites / revenu,
      pib,
      depenses,
      ressources,
      solde,
      depensesPctPib: depenses / pib,
      ressourcesPctPib: ressources / pib,
      soldePctPib: solde / pib,
      detteCumulee: dette,
      detteCumuleePctPib: dette / pib,
      fondsCapitalisation: fonds,
      rentesCapitalisation: rentes,
      cotisationsCapitalisation: cotisationsCap,
      pyramide: Array.from(population),
      pyramideRetraites: Array.from(eff.retraites),
    });

    // Passage à l'année suivante.
    const q = tableMortalite(valeurA(hyp.esperanceVie, t));
    const etat = avancerPopulation(population, q, valeurA(hyp.fecondite, t), valeurA(hyp.soldeMigratoire, t));
    population = etat.population;
    naissances = etat.naissances;
    retraitesPrec = eff.retraites;
    qPrec = q;
  }

  return { scenario, annees };
}

/** Constantes dérivées du calage, utiles aux solveurs. */
export function partMasseSalariale(resultat: ResultatSimulation): number {
  const r = resultat.annees[0];
  return (r.cotisants * r.revenuActiviteMoyen) / 1e9 / r.pib;
}
