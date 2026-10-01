/**
 * Scénarios-types : grandes familles de mesures présentes dans le débat public.
 * Volontairement génériques et non attribués à des candidats (comparateur prévu en V2).
 */
import { PARAMETRES_REFERENCE, type ParametresUI } from './parametres';

export interface Preset {
  id: string;
  nom: string;
  description: string;
  parametres: Partial<ParametresUI>;
}

export const PRESETS: Preset[] = [
  {
    id: 'reference',
    nom: 'Législation actuelle',
    description: 'Suspension de la réforme de 2023 puis reprise du calendrier vers 64 ans (référence du COR).',
    parametres: {},
  },
  {
    id: 'retour-62',
    nom: 'Retour à 62 ans',
    description: 'Âge légal ramené à 62 ans dès 2028, sans autre mesure.',
    parametres: { ageLegalCible: 62, ageLegalAnnee: 2028 },
  },
  {
    id: 'age-65',
    nom: 'Âge légal à 65 ans',
    description: 'Âge légal porté progressivement à 65 ans en 2035.',
    parametres: { ageLegalCible: 65, ageLegalAnnee: 2035 },
  },
  {
    id: 'age-67',
    nom: 'Âge légal à 67 ans',
    description: 'Âge légal porté progressivement à 67 ans en 2040.',
    parametres: { ageLegalCible: 67, ageLegalAnnee: 2040 },
  },
  {
    id: 'cotisations',
    nom: 'Hausse des prélèvements',
    description: '+2 points de cotisation et +0,3 point de PIB de recettes affectées.',
    parametres: { hausseCotisation: 2, ressourcesExternes: 0.3 },
  },
  {
    id: 'sous-indexation',
    nom: 'Sous-indexation des pensions',
    description: 'Gel des pensions en 2028 puis revalorisation inférieure de 0,5 point à l’inflation jusqu’en 2035.',
    parametres: { anneesGel: [2028], sousIndexation: 0.5, sousIndexationFin: 2035 },
  },
  {
    id: 'capitalisation',
    nom: 'Part de capitalisation',
    description: '3 points de cotisation basculés vers des comptes individuels de capitalisation (rendement réel de 3 %).',
    parametres: { capitalisationTaux: 3, capitalisationMode: 'substitutif', capitalisationRendement: 3 },
  },
  {
    id: 'fonds',
    nom: 'Fonds de réserve',
    description: 'Cotisation de 1 point affectée à un fonds collectif dont les revenus financent la répartition.',
    parametres: { capitalisationTaux: 1, capitalisationMode: 'fonds-reserve', capitalisationRendement: 3 },
  },
];


export function appliquerPreset(p: Preset): ParametresUI {
  return { ...PARAMETRES_REFERENCE, ...p.parametres };
}
