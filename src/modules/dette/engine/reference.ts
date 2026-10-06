/**
 * Trajectoire de référence de la dette publique.
 *
 * PROVISOIRE : ordres de grandeur seulement. La référence retenue est le scénario de référence
 * du Debt Sustainability Monitor de la Commission européenne (projection sur 10 ans, publiée
 * chaque année au premier trimestre). Ses séries par pays (fiches pays du DSM 2025) n'ont pas
 * encore pu être récupérées : ces chiffres servent à construire et tester le moteur, pas à
 * publier un résultat. Voir `.planning/todos/pending/verifier-fiches-pays-dsm-2025.md`.
 */
import type { ReferenceDette } from './types';

const annees = Array.from({ length: 11 }, (_, i) => 2026 + i);

/** Interpolation linéaire entre deux valeurs sur la fenêtre, constante après `anneeFin`. */
function rampe(debut: number, fin: number, anneeFin: number): number[] {
  return annees.map((a) => (a >= anneeFin ? fin : debut + ((fin - debut) * (a - annees[0])) / (anneeFin - annees[0])));
}

export const REFERENCE_PROVISOIRE: ReferenceDette = {
  source:
    'PROVISOIRE — ordres de grandeur inspirés du rapport d’avancement annuel 2026 du PSMT (déficit ≈ 5 % du PIB en 2026, dette ≈ 118 % en 2027), en attendant les séries du Debt Sustainability Monitor 2025 de la Commission européenne',
  provisoire: true,
  anneeDepart: 2025,
  detteDepartPctPib: 1.16,
  annees,
  // Déficit primaire ≈ 2,9 % du PIB en 2026, réduit jusqu'en 2031 (fin de l'ajustement du PSMT), puis stable.
  soldePrimairePctPib: rampe(-0.029, -0.008, 2031),
  // Le taux apparent monte lentement à mesure que la dette ancienne est refinancée à des taux plus élevés.
  tauxInteretApparent: rampe(0.02, 0.029, 2036),
  croissanceNominale: rampe(0.028, 0.03, 2028),
  cibleDettePctPib: {},
};
