/**
 * Page « Où vont 100 € de dépense publique ? » : répartition de la dépense et des recettes des
 * administrations publiques (comptes nationaux), ramenée à 100 €.
 */

export interface Poste {
  id: string;
  libelle: string;
  /** Montant, en milliards d'euros. */
  mdEuros: number;
  /** Précision affichée sous le libellé (ce que recouvre le poste). */
  detail?: string;
  /** Page du simulateur qui traite ce poste, s'il y en a une. */
  page?: string;
}

/** Une répartition (dépenses ou recettes), avec son année et sa source propres. */
export interface Ventilation {
  annee: number;
  source: string;
  url: string;
  /** Total publié pour cette année et cette ventilation (Md€). */
  totalMdEuros: number;
  postes: Poste[];
}

export interface DonneesRepartition {
  /** Année des grandeurs d'ensemble (dépenses, recettes, dette, PIB). */
  annee: number;
  source: string;
  url: string;
  /** « vérifié » quand les chiffres ont été relus sur les publications elles-mêmes. */
  statut: 'vérifié' | 'à vérifier';
  note?: string;
  pibMdEuros: number;
  depensesMdEuros: number;
  recettesMdEuros: number;
  detteMdEuros: number;
  depenses: Ventilation;
  recettes: Ventilation;
}

/**
 * Arrondit des montants à l'unité en conservant leur total (méthode du plus fort reste) : les
 * euros affichés pour « 100 € » totalisent toujours exactement 100.
 */
export function arrondirEnConservantTotal(valeurs: readonly number[], total: number): number[] {
  const somme = valeurs.reduce((s, v) => s + v, 0);
  if (somme <= 0) return valeurs.map(() => 0);
  const exacts = valeurs.map((v) => (v / somme) * total);
  const entiers = exacts.map(Math.floor);
  let reste = total - entiers.reduce((s, v) => s + v, 0);
  const ordre = exacts.map((v, i) => ({ i, r: v - Math.floor(v) })).sort((a, b) => b.r - a.r || a.i - b.i);
  for (const { i } of ordre) {
    if (reste <= 0) break;
    entiers[i] += 1;
    reste -= 1;
  }
  return entiers;
}

export interface LignePour100 extends Poste {
  /** Euros sur 100, arrondis à l'unité (le total fait 100). */
  euros: number;
  /** Euros sur 100, non arrondis. */
  eurosExacts: number;
}

/** Répartition de postes pour 100 €, triée par montant décroissant. */
export function pour100(postes: readonly Poste[]): LignePour100[] {
  const tries = [...postes].sort((a, b) => b.mdEuros - a.mdEuros);
  const total = tries.reduce((s, p) => s + p.mdEuros, 0);
  const euros = arrondirEnConservantTotal(
    tries.map((p) => p.mdEuros),
    100,
  );
  return tries.map((p, i) => ({ ...p, euros: euros[i], eurosExacts: (p.mdEuros / total) * 100 }));
}

/** Sur 100 € dépensés, combien sont financés par l'emprunt (déficit). */
export const empruntPour100 = (d: Pick<DonneesRepartition, 'depensesMdEuros' | 'recettesMdEuros'>) =>
  ((d.depensesMdEuros - d.recettesMdEuros) / d.depensesMdEuros) * 100;
