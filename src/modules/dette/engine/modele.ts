/**
 * Projection de la dette publique en part du PIB.
 *
 * Identité, pour chaque année t :
 *   dette(t) = dette(t−1) × (1 + r) / (1 + g) − solde primaire(t) + ajustement stock-flux(t)
 * avec r le taux d'intérêt apparent et g la croissance nominale (convention de la Commission).
 *
 * Écarts apportés par la page de synthèse (voir `.planning/notes/branchement-modules-synthese.md`) :
 *  - un écart de niveau du PIB E(t) modifie la croissance : (1 + g') = (1 + g) × (1 + E(t)) / (1 + E(t−1)) ;
 *  - un écart de solde ΔS(t), exprimé en part du PIB de la référence, s'ajoute au solde primaire
 *    après conversion au PIB du scénario : ΔS(t) / (1 + E(t)) ;
 *  - le reste du budget reste constant en part du PIB.
 */
import type { AnneeDette, EcartAnnee, ReferenceDette } from './types';

const AUCUN_ECART: EcartAnnee = { ecartSoldePctPibReference: 0, ecartPibNiveau: 0 };

/**
 * @param ecarts écarts par année ; une année absente vaut zéro. L'écart de l'année de départ
 *   (dernière année observée) sert de point de départ au niveau du PIB.
 */
export function projeterDette(reference: ReferenceDette, ecarts: ReadonlyMap<number, EcartAnnee> = new Map()): AnneeDette[] {
  const ecartA = (annee: number) => ecarts.get(annee) ?? AUCUN_ECART;
  let dette = reference.detteDepartPctPib;
  let niveauPrec = ecartA(reference.anneeDepart).ecartPibNiveau;
  return reference.annees.map((annee, i) => {
    const e = ecartA(annee);
    const r = reference.tauxInteretApparent[i];
    const g = (1 + reference.croissanceNominale[i]) * ((1 + e.ecartPibNiveau) / (1 + niveauPrec)) - 1;
    const soldePrimaire = reference.soldePrimairePctPib[i] + e.ecartSoldePctPibReference / (1 + e.ecartPibNiveau);
    const facteur = (1 + r) / (1 + g);
    const chargeInterets = (dette * r) / (1 + g);
    const effetBouleDeNeige = dette * (facteur - 1);
    const soldePrimaireStabilisant = effetBouleDeNeige;
    dette = dette * facteur - soldePrimaire + reference.ajustementStockFluxPctPib[i];
    niveauPrec = e.ecartPibNiveau;
    return {
      annee,
      dettePctPib: dette,
      soldePrimairePctPib: soldePrimaire,
      chargeInteretsPctPib: chargeInterets,
      soldePctPib: soldePrimaire - chargeInterets,
      tauxInteretApparent: r,
      croissanceNominale: g,
      effetBouleDeNeigePctPib: effetBouleDeNeige,
      soldePrimaireStabilisantPctPib: soldePrimaireStabilisant,
    };
  });
}
