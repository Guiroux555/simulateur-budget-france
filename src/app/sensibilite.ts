/**
 * Sensibilité aux hypothèses : le même scénario (mêmes mesures) simulé sous plusieurs
 * hypothèses de productivité, de chômage et de natalité.
 */
import { equilibre, simuler, type ResultatSimulation } from '../engine';
import { versScenario, type ParametresUI } from './parametres';
import { LIBELLE_TENDANCE, TENDANCE_OBSERVEE } from './productivite';

export type CleHypothese = 'productivite' | 'chomage' | 'fecondite';

export interface DefinitionHypothese {
  cle: CleHypothese;
  titre: string;
  explication: string;
  valeurs: number[];
  /** Valeur du scénario de référence du COR. */
  reference: number;
  format: (v: number) => string;
  /** Format court pour les tableaux (l'unité est dans l'en-tête). */
  formatCourt: (v: number) => string;
  /** En-tête de colonne avec l'unité. */
  entete: string;
  /** Sens favorable au solde : la valeur la plus haute est-elle favorable ? */
  hausseFavorable: boolean;
}

const virgule = (v: number, d: number) => v.toFixed(d).replace('.', ',');

export const HYPOTHESES: DefinitionHypothese[] = [
  {
    cle: 'productivite',
    titre: 'Productivité',
    explication: 'Croissance annuelle de la productivité du travail à long terme (variantes étudiées par le COR).',
    valeurs: [0.4, 0.7, 1.0, 1.3],
    reference: 0.7,
    format: (v) => `${virgule(v, 1)} %/an`,
    formatCourt: (v) => virgule(v, 1),
    entete: 'Productivité (%/an)',
    hausseFavorable: true,
  },
  {
    cle: 'chomage',
    titre: 'Chômage',
    explication: 'Taux de chômage atteint en 2030 puis stable.',
    valeurs: [4.5, 7, 10],
    reference: 7,
    format: (v) => `${virgule(v, 1)} %`,
    formatCourt: (v) => virgule(v, 1),
    entete: 'Chômage (%)',
    hausseFavorable: false,
  },
  {
    cle: 'fecondite',
    titre: 'Natalité',
    explication: 'Nombre d’enfants par femme à partir de 2028. Ses effets n’apparaissent qu’après 20 ans, quand les enfants arrivent sur le marché du travail.',
    valeurs: [1.3, 1.45, 1.6, 1.8],
    reference: 1.45,
    format: (v) => `${virgule(v, 2)} enfant/femme`,
    formatCourt: (v) => virgule(v, 2),
    entete: 'Enfants par femme',
    hausseFavorable: true,
  },
];

export interface Variante {
  valeur: number;
  libelle: string;
  retenue: boolean;
  simulation: ResultatSimulation;
  /** Variante hors gamme ordonnée (ex. tendance observée), tracée à part. */
  speciale?: boolean;
}

/** Le scénario sous chaque valeur d'une hypothèse (les autres paramètres inchangés). */
export function variantes(p: ParametresUI, def: DefinitionHypothese): Variante[] {
  const productivite = def.cle === 'productivite';
  const base = def.valeurs.map((valeur) => ({
    valeur,
    libelle: def.format(valeur) + (valeur === def.reference ? ' (COR)' : ''),
    retenue: Math.abs(p[def.cle] - valeur) < 1e-9 && !(productivite && p.productiviteDepart !== null),
    simulation: simuler(versScenario({ ...p, [def.cle]: valeur, ...(productivite ? { productiviteDepart: null } : {}) })),
  }));
  if (!productivite) return base;
  return [
    ...base,
    {
      valeur: TENDANCE_OBSERVEE.longTerme,
      libelle: LIBELLE_TENDANCE,
      retenue: p.productiviteDepart !== null,
      speciale: true,
      simulation: simuler(versScenario({ ...p, productivite: TENDANCE_OBSERVEE.longTerme, productiviteDepart: TENDANCE_OBSERVEE.depart })),
    },
  ];
}

/** Hypothèses combinées les plus défavorables et les plus favorables au solde. */
export function fourchette(p: ParametresUI): { pessimiste: ResultatSimulation; optimiste: ResultatSimulation } {
  const extremes = (favorable: boolean) =>
    Object.fromEntries(
      HYPOTHESES.map((d) => {
        const haut = Math.max(...d.valeurs);
        const bas = Math.min(...d.valeurs);
        return [d.cle, favorable === d.hausseFavorable ? haut : bas];
      }),
    ) as Pick<ParametresUI, CleHypothese>;
  return {
    pessimiste: simuler(versScenario({ ...p, ...extremes(false) })),
    optimiste: simuler(versScenario({ ...p, ...extremes(true) })),
  };
}

/** Âge moyen de départ nécessaire à l'équilibre une année donnée. */
export function ageEquilibre(s: ResultatSimulation, annee: number, soldeCible = 0): number {
  return equilibre(s, soldeCible, [annee])[0].ageDepartNecessaire;
}
