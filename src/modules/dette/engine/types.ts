/** Trajectoire de référence de la dette publique (APU, convention de Maastricht). */
export interface ReferenceDette {
  /** Origine des chiffres (institution, publication, date). */
  source: string;
  /** Vrai tant que les chiffres sont des ordres de grandeur et non les séries publiées. */
  provisoire: boolean;
  /** Dernière année observée : la projection commence l'année suivante. */
  anneeDepart: number;
  /** Dette en fin d'année de départ, en part du PIB (fraction : 1.16 = 116 %). */
  detteDepartPctPib: number;
  /** Années projetées, consécutives : la fenêtre glissante du module. */
  annees: number[];
  /** Solde primaire (hors charge d'intérêts), en part du PIB, par année. */
  soldePrimairePctPib: number[];
  /** Taux d'intérêt apparent nominal (charge d'intérêts / dette de l'année précédente). */
  tauxInteretApparent: number[];
  /** Croissance nominale du PIB. */
  croissanceNominale: number[];
  /** Dette publiée par la référence, pour le calibrage (vide tant que la référence est provisoire). */
  cibleDettePctPib: Record<number, number>;
}

/**
 * Écarts d'une année par rapport à la référence, apportés par la page de synthèse.
 * Mêmes conventions que `AnneeResume` dans le socle.
 */
export interface EcartAnnee {
  /** Écart de solde, en part du PIB de la référence (> 0 = amélioration). */
  ecartSoldePctPibReference: number;
  /** Écart de niveau du PIB en volume (0.01 = PIB supérieur de 1 % à la référence). */
  ecartPibNiveau: number;
}

/** Résultats d'une année de projection. */
export interface AnneeDette {
  annee: number;
  dettePctPib: number;
  soldePrimairePctPib: number;
  /** Charge d'intérêts, en part du PIB de l'année. */
  chargeInteretsPctPib: number;
  /** Solde public (solde primaire − charge d'intérêts). */
  soldePctPib: number;
  tauxInteretApparent: number;
  croissanceNominale: number;
  /** Variation de la dette due à l'écart entre taux d'intérêt et croissance (« boule de neige »). */
  effetBouleDeNeigePctPib: number;
  /** Solde primaire qui stabiliserait la dette en part du PIB cette année-là. */
  soldePrimaireStabilisantPctPib: number;
}
