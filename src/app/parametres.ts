/**
 * Paramètres de l'interface : une forme simple et sérialisable (lien permanent), traduite
 * en scénario du moteur. Les unités sont celles affichées (%, points, années).
 */
import {
  AGE_LEGAL_REFERENCE,
  ANNEE_BASE,
  ANNEE_FIN,
  HYPOTHESES_COR_2026,
  LEVIERS_NEUTRES,
  valeurA,
  type ModeCapitalisation,
  type Scenario,
  type Trajectoire,
} from '../engine';
import { TENDANCE_OBSERVEE } from './productivite';

export interface ParametresUI {
  // Hypothèses (le monde)
  fecondite: number; // ICF à partir de 2028
  ecartEsperanceVie: number; // années d'écart à la référence en 2070
  soldeMigratoire: number; // milliers / an
  productivite: number; // % / an à long terme
  /** Point de départ de la trajectoire (% / an en 2024) ; null = transition du scénario de référence. */
  productiviteDepart: number | null;
  chomage: number; // % à long terme
  inflation: number; // % / an
  // Leviers
  ageLegalCible: number | null; // null = législation actuelle
  ageLegalAnnee: number; // année où la cible est atteinte
  dureeSupplementaire: number; // années
  hausseCotisation: number; // points de masse salariale
  ressourcesExternes: number; // points de PIB
  sousIndexation: number; // points / an (positif = sous-indexation)
  sousIndexationFin: number; // dernière année de sous-indexation
  anneesGel: number[];
  ajustementPensions: number; // % sur les pensions nouvelles
  emploiSeniors: number; // points de taux d'emploi 55-69 ans
  capitalisationTaux: number; // points de masse salariale
  capitalisationMode: ModeCapitalisation;
  capitalisationRendement: number; // % réel / an
  // Équilibre
  soldeCible: number; // % du PIB
}

/** Année d'entrée en vigueur des mesures (après l'élection de 2027). */
export const ANNEE_MESURES = 2028;

export const PARAMETRES_REFERENCE: ParametresUI = {
  fecondite: 1.45,
  ecartEsperanceVie: 0,
  soldeMigratoire: 150,
  productivite: 0.7,
  productiviteDepart: null,
  chomage: 7,
  inflation: 1.75,
  ageLegalCible: null,
  ageLegalAnnee: 2035,
  dureeSupplementaire: 0,
  hausseCotisation: 0,
  ressourcesExternes: 0,
  sousIndexation: 0,
  sousIndexationFin: 2035,
  anneesGel: [],
  ajustementPensions: 0,
  emploiSeniors: 0,
  capitalisationTaux: 0,
  capitalisationMode: 'substitutif',
  capitalisationRendement: 3,
  soldeCible: 0,
};

/** Rampe : 0 jusqu'à `debut`, `valeur` atteinte en `fin` (incluse), constante ensuite. */
function rampe(valeur: number, debut: number, fin: number): Trajectoire {
  if (valeur === 0) return [];
  if (fin <= debut) return [[debut - 1, 0], [debut, valeur]];
  return [[debut - 1, 0], [fin, valeur]];
}

/** Créneau : `valeur` de `debut` à `fin` incluses, 0 ailleurs. */
function creneau(valeur: number, debut: number, fin: number): Trajectoire {
  if (valeur === 0 || fin < debut) return [];
  return [[debut - 0.001, 0], [debut, valeur], [fin, valeur], [fin + 0.001, 0]];
}

const ref = HYPOTHESES_COR_2026;

export function versScenario(p: ParametresUI): Scenario {
  const e2025 = valeurA(ref.esperanceVie, ANNEE_BASE);
  const e2070 = valeurA(ref.esperanceVie, 2070) + p.ecartEsperanceVie;
  const prodLT = p.productivite / 100;
  const ageLegal: Trajectoire | null =
    p.ageLegalCible === null
      ? null
      : [
          ...AGE_LEGAL_REFERENCE.filter(([a]) => a < ANNEE_MESURES),
          [Math.max(ANNEE_MESURES, p.ageLegalAnnee), p.ageLegalCible],
        ];
  return {
    anneeDebut: ANNEE_BASE,
    anneeFin: ANNEE_FIN,
    hypotheses: {
      fecondite: [
        [2025, 1.56],
        [2028, p.fecondite],
      ],
      esperanceVie: [
        [2025, e2025],
        [2070, e2070],
      ],
      soldeMigratoire: [
        [2025, 120_000],
        [2026, p.soldeMigratoire * 1000],
      ],
      productivite:
        p.productiviteDepart === null
          ? [
              // Transition simplifiée vers l'hypothèse de long terme, calée sur les soldes du COR.
              [2025, Math.min(0.004, prodLT)],
              [2032, prodLT],
            ]
          : [
              // Départ du dernier niveau observé, puis convergence vers le niveau de long terme.
              [TENDANCE_OBSERVEE.anneeDepart, p.productiviteDepart / 100],
              [TENDANCE_OBSERVEE.anneeConvergence, prodLT],
            ],
      chomage: [
        [2025, 0.075],
        [2030, p.chomage / 100],
      ],
      inflation: [[2025, p.inflation / 100]],
    },
    leviers: {
      ...LEVIERS_NEUTRES,
      ageLegal,
      dureeSupplementaire: rampe(p.dureeSupplementaire, ANNEE_MESURES, 2035),
      hausseTauxCotisation: rampe(p.hausseCotisation / 100, ANNEE_MESURES, ANNEE_MESURES + 2),
      ressourcesExternes: rampe(p.ressourcesExternes / 100, ANNEE_MESURES, ANNEE_MESURES),
      sousIndexation: creneau(-p.sousIndexation / 100, ANNEE_MESURES, p.sousIndexationFin),
      anneesGel: p.anneesGel,
      ajustementPensionLiquidation: rampe(p.ajustementPensions / 100, ANNEE_MESURES, ANNEE_MESURES),
      hausseEmploiSeniors: rampe(p.emploiSeniors / 100, ANNEE_MESURES, 2035),
      capitalisation:
        p.capitalisationTaux > 0
          ? {
              taux: p.capitalisationTaux / 100,
              mode: p.capitalisationMode,
              anneeDebut: ANNEE_MESURES,
              rendementReel: p.capitalisationRendement / 100,
              dureeRente: 22,
            }
          : null,
    },
  };
}

// --- Lien permanent : seuls les paramètres différents de la référence sont encodés.

export function versUrl(p: ParametresUI): string {
  const diff: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p)) {
    const r = (PARAMETRES_REFERENCE as unknown as Record<string, unknown>)[k];
    if (JSON.stringify(v) !== JSON.stringify(r)) diff[k] = v;
  }
  return Object.keys(diff).length ? encodeURIComponent(JSON.stringify(diff)) : '';
}

export function depuisUrl(fragment: string): Partial<ParametresUI> {
  if (!fragment) return {};
  try {
    const brut = JSON.parse(decodeURIComponent(fragment)) as Record<string, unknown>;
    const propre: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(brut)) {
      const r = (PARAMETRES_REFERENCE as unknown as Record<string, unknown>)[k];
      const nullable = k === 'ageLegalCible' || k === 'productiviteDepart';
      if (k in PARAMETRES_REFERENCE && (typeof v === typeof r || (nullable && (v === null || typeof v === 'number'))))
        propre[k] = v;
    }
    return propre as Partial<ParametresUI>;
  } catch {
    return {};
  }
}
