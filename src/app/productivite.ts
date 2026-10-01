/**
 * Hypothèses de productivité : sources et trajectoire « tendance observée ».
 */
import { HISTORIQUE } from '../engine/donnees/historique';
import { valeurA } from '../engine/trajectoire';

const PERIODE_TENDANCE: [number, number] = [2010, 2024];

function moyenneObservee(de: number, a: number): number {
  let s = 0;
  for (let x = de; x <= a; x++) s += valeurA(HISTORIQUE.productivite.points, x);
  return s / (a - de + 1);
}

/**
 * Prolongement de la tendance observée : part du dernier niveau observé (2024) et rejoint
 * en 2030 la moyenne 2010-2024 (crise de 2009 incluse via la moyenne glissante, recul post-Covid inclus).
 */
export const TENDANCE_OBSERVEE = {
  periode: PERIODE_TENDANCE,
  /** Niveau de long terme, en % par an, arrondi au dixième. */
  longTerme: Math.round(moyenneObservee(...PERIODE_TENDANCE) * 1000) / 10,
  /** Point de départ : dernier niveau observé, en % par an. */
  depart: Math.round(valeurA(HISTORIQUE.productivite.points, PERIODE_TENDANCE[1]) * 1000) / 10,
  anneeDepart: 2024,
  anneeConvergence: 2030,
};

/** Libellé court pour les boutons de choix. */
export const LIBELLE_TENDANCE_COURT = `Tendance observée (${TENDANCE_OBSERVEE.longTerme.toFixed(1).replace('.', ',')} %)`;

export const LIBELLE_TENDANCE = `Tendance observée ${PERIODE_TENDANCE[0]}-${PERIODE_TENDANCE[1]} (${TENDANCE_OBSERVEE.longTerme.toFixed(1).replace('.', ',')} %)`;

export interface SourceProductivite {
  nom: string;
  hypothese: string;
  url: string;
}

/** Sources citées dans l'interface à propos des hypothèses de productivité. */
export const SOURCES_PRODUCTIVITE: SourceProductivite[] = [
  {
    nom: 'COR, rapport annuel de juin 2026',
    hypothese: '0,7 %/an à long terme (scénario de référence, inchangé depuis 2025 ; variantes étudiées autour)',
    url: 'https://www.cor-retraites.fr/rapports-du-cor/rapport-annuel-cor-juin-2026-evolutions-perspectives-retraites-france',
  },
  {
    nom: 'Cour des comptes, février 2025',
    hypothese: '0,7 %/an jugé le plus réaliste ; le COR retenait encore 1,0 % en 2024',
    url: 'https://www.ccomptes.fr/sites/default/files/2025-02/20250220-Situation-financiere-et-perspectives-du-systeme-de%20retraites_0.pdf',
  },
  {
    nom: 'Banque de France, projections macroéconomiques',
    hypothese: 'productivité ≈ 6 % sous sa tendance 2010-2019 fin 2024, dont ≈ 4 % de perte durable ; rattrapage seulement partiel',
    url: 'https://www.banque-france.fr/en/publications-and-statistics/publications/macroeconomic-projections-december-2024',
  },
  {
    nom: 'Commission européenne, Ageing Report 2024 (fiche France)',
    hypothese: '≈ 1,2 %/an en moyenne jusqu’en 2070 (hypothèse commune aux pays de l’UE, plus favorable)',
    url: 'https://economy-finance.ec.europa.eu/document/download/e412927a-ea31-406d-bb6c-c925914123e9_en',
  },
];
