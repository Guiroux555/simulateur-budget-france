/**
 * Les régimes de retraite : poids dans les dépenses, solde, démographie, financement et règles.
 *
 * ⚠️ Ordres de grandeur pour 2024 (sauf mention), rassemblés à partir des rapports du Sénat
 * (PLF 2025 et 2026, « Régimes sociaux et de retraite » et « CAS Pensions »), de la Cour des
 * comptes (février 2025), du COR, de la DSS (chiffres clés 2024) et des caisses. Certains montants
 * sont estimés par différence ; à remplacer par les comptes officiels par régime.
 * La somme des dépenses (≈ 400 Md€) correspond aux dépenses totales de retraite de 2024.
 */

export type FamilleRegime = 'prive' | 'complementaire' | 'fonction-publique' | 'special' | 'non-salaries';

export interface Regime {
  id: string;
  nom: string;
  sigle: string;
  famille: FamilleRegime;
  /** Qui est couvert. */
  publicCouvert: string;
  /** Pensions versées en 2024, Md€ (ordre de grandeur). */
  depenses: number;
  /**
   * Solde comptable 2024, Md€ (ressources − dépenses, transferts et subventions inclus).
   * 0 pour les régimes équilibrés par construction par l'État.
   */
  solde: number;
  /** Financement de l'État au-delà des cotisations (subvention d'équilibre), Md€ ; 0 si aucun. */
  subventionEtat: number;
  /**
   * Retraités de droit direct percevant une pension de ce régime, fin 2023, en millions
   * (DREES). Une même personne peut relever de plusieurs régimes. null si non pertinent.
   */
  retraites: number | null;
  /** Cotisations encaissées (salariés + employeurs, y compris l'État employeur), Md€, ordre de grandeur. */
  cotisations: number | null;
  /** Cotisants, en millions (ordre de grandeur). */
  cotisants: number | null;
  /** Cotisants pour un retraité (ordre de grandeur, année indiquée dans `sources`). */
  ratioDemographique: number | null;
  /** Mode de calcul de la pension, en une phrase. */
  calcul: string;
  /** Particularités favorables aux assurés. */
  avantages: string[];
  /** Contreparties ou limites, pour une lecture équilibrée. */
  contreparties: string[];
  /** Mode d'équilibre financier. */
  equilibre: string;
  statut?: string;
  sources: string;
  estime?: boolean;
}

export const LIBELLES_FAMILLES: Record<FamilleRegime, string> = {
  prive: 'Salariés du privé (base)',
  complementaire: 'Régimes complémentaires',
  'fonction-publique': 'Fonction publique',
  special: 'Régimes spéciaux',
  'non-salaries': 'Agriculteurs et professions libérales',
};

export const REGIMES: Regime[] = [
  {
    id: 'cnav',
    nom: 'Régime général',
    sigle: 'CNAV (Assurance retraite)',
    famille: 'prive',
    publicCouvert:
      'Salariés du privé, contractuels de droit privé, et depuis 2020 les indépendants (artisans, commerçants) ; les salariés agricoles lui sont adossés financièrement',
    depenses: 166,
    solde: -3.6,
    subventionEtat: 0,
    retraites: 14.2,
    cotisations: 125,
    cotisants: 20.0,
    ratioDemographique: 1.41,
    calcul: '50 % du salaire annuel moyen des 25 meilleures années (dans la limite du plafond de la Sécurité sociale), proratisé selon la durée cotisée',
    avantages: [
      'Départ anticipé pour carrière longue (début de carrière avant 16, 18, 20 ou 21 ans)',
      'Trimestres pour enfants (jusqu’à 8 par enfant pour les mères) et assurance vieillesse des parents au foyer',
      'Majoration de 10 % de la pension pour 3 enfants ou plus',
      'Minimum contributif pour les petites carrières, trimestres validés pendant le chômage, la maladie ou l’invalidité',
    ],
    contreparties: [
      'Calcul sur 25 années et non sur la fin de carrière',
      'Salaire pris en compte limité au plafond de la Sécurité sociale (le complément relève de l’Agirc-Arrco)',
    ],
    equilibre: 'Cotisations, CSG et impôts affectés, transferts (prise en charge du chômage par l’Unédic, Fonds de solidarité vieillesse)',
    sources: 'DSS, chiffres clés 2024 ; recueil statistique du régime général 2024 ; ratio : rapport démographique des régimes de base 2024',
    estime: true,
  },
  {
    id: 'agirc-arrco',
    nom: 'Retraite complémentaire du privé',
    sigle: 'Agirc-Arrco',
    famille: 'complementaire',
    publicCouvert: 'Salariés du privé (complément obligatoire du régime général)',
    depenses: 98.1,
    solde: 1.6,
    subventionEtat: 0,
    retraites: 12.2,
    cotisations: 101.4,
    cotisants: 18.3,
    ratioDemographique: 1.5,
    calcul: 'Régime par points : cotisations converties en points (prix d’achat), pension = points × valeur de service',
    avantages: [
      'Couvre les salaires au-delà du plafond de la Sécurité sociale',
      'Réserves importantes (≈ 68 Md€, environ 9 mois de prestations)',
      'Pilotage paritaire : les partenaires sociaux ajustent la valeur du point pour rester à l’équilibre',
      'Majorations pour enfants, points gratuits pendant le chômage indemnisé',
    ],
    contreparties: [
      'Rendement du point fixé par les partenaires sociaux (revalorisations parfois inférieures à l’inflation)',
      'Coefficient de solidarité temporaire (−10 % pendant 3 ans) en cas de départ dès le taux plein, supprimé en 2023',
    ],
    equilibre: 'Autonome : cotisations et réserves, sans subvention publique ; excédentaire',
    sources: 'Agirc-Arrco, comptes 2024 (pensions 98,1 Md€, excédent 1,6 Md€) ; IFRAP (réserves) ; ratio estimé',
  },
  {
    id: 'fpe',
    nom: 'Fonctionnaires de l’État (civils et militaires)',
    sigle: 'SRE – CAS « Pensions »',
    famille: 'fonction-publique',
    publicCouvert: 'Fonctionnaires de l’État, magistrats, militaires',
    depenses: 62,
    solde: 0,
    subventionEtat: 0,
    retraites: 2.0,
    cotisations: 62,
    cotisants: 1.8,
    ratioDemographique: 0.9,
    calcul: '75 % du traitement indiciaire des 6 derniers mois (hors primes) pour une carrière complète, proratisé selon la durée',
    avantages: [
      'Base de calcul : les 6 derniers mois de traitement',
      'Catégories « actives » (policiers, surveillants pénitentiaires, contrôleurs aériens…) : départ anticipé jusqu’à 5 ans plus tôt',
      'Militaires : pension à jouissance immédiate après 17 ans de service (27 ans pour les officiers) et bonifications',
      'Bonifications pour enfants nés avant 2004, minimum garanti',
    ],
    contreparties: [
      'Primes exclues du calcul (sauf un petit régime additionnel, le RAFP, plafonné à 20 % du traitement) : le taux de remplacement global est proche de celui du privé selon le COR',
      'Pas de régime complémentaire équivalent à l’Agirc-Arrco',
    ],
    equilibre:
      'Équilibré par construction : l’État employeur verse une contribution dont le taux s’ajuste (78,28 % du traitement pour les civils, 126,07 % pour les militaires en 2025, 82,28 % pour les civils en 2026)',
    sources: 'Sénat, PLF 2025-2026 (CAS « Pensions » ≈ 68 Md€ y compris invalidité et anciens combattants) ; décret n° 2025-61 ; montant des pensions de retraite estimé',
    estime: true,
  },
  {
    id: 'cnracl',
    nom: 'Fonctionnaires territoriaux et hospitaliers',
    sigle: 'CNRACL',
    famille: 'fonction-publique',
    publicCouvert: 'Fonctionnaires des collectivités locales et des hôpitaux publics',
    depenses: 27,
    solde: -3.0,
    subventionEtat: 0,
    retraites: 1.4,
    cotisations: 24.4,
    cotisants: 2.2,
    ratioDemographique: 1.5,
    calcul: '75 % du traitement indiciaire des 6 derniers mois (hors primes) pour une carrière complète',
    avantages: [
      'Base de calcul : les 6 derniers mois de traitement',
      'Catégories actives (sapeurs-pompiers, une partie des soignants recrutés avant 2010…) : départ anticipé',
      'Bonifications pour enfants nés avant 2004',
    ],
    contreparties: [
      'Primes exclues du calcul (hors RAFP)',
      'Démographie en dégradation rapide (contractuels plus nombreux, départs massifs) : hausse de 12 points des cotisations employeurs de 2025 à 2028',
    ],
    equilibre: 'Cotisations des agents et des employeurs publics locaux (taux employeur porté de 31,65 % en 2024 à 43,65 % en 2028) ; déficit structurel',
    sources: 'CNRACL, rapport annuel 2024 (déficit ≈ 3 Md€) ; décret n° 2025-86 ; ratio : ordre de grandeur',
    estime: true,
  },
  {
    id: 'speciaux',
    nom: 'Régimes spéciaux (SNCF, RATP, IEG, mines, marins, notaires, Banque de France…)',
    sigle: 'Régimes spéciaux',
    famille: 'special',
    publicCouvert: 'Agents statutaires d’entreprises et professions historiques',
    depenses: 16,
    solde: 0,
    subventionEtat: 5.9,
    retraites: 0.65,
    cotisations: 5,
    cotisants: 0.4,
    ratioDemographique: 0.6,
    calcul: 'Le plus souvent 75 % de la rémunération des 6 derniers mois, avec des règles propres à chaque régime',
    avantages: [
      'Base de calcul sur la fin de carrière',
      'Âges d’ouverture historiquement plus précoces (ex. 52 ou 57 ans à la SNCF avant 2008), progressivement relevés',
      'Prise en compte d’une partie des primes selon les régimes',
    ],
    contreparties: [
      'Fermés aux nouveaux embauchés (SNCF depuis 2020, RATP, IEG et Banque de France depuis septembre 2023) : régimes en extinction',
      'Âges et durées alignés progressivement sur le droit commun par les réformes de 2008, 2010, 2014 et 2023',
    ],
    equilibre:
      'Subventions d’équilibre de l’État (2025 : SNCF 3,3 Md€, mines 0,9, RATP 0,9, marins 0,8) ; les IEG sont adossées au régime général et à l’Agirc-Arrco',
    statut: 'En extinction',
    sources:
      'Sénat, PLF 2025-2026 (subventions représentant 63 % des ressources des régimes spéciaux) ; rapports démographiques 2024 : SNCF ≈ 0,5, RATP 0,72, IEG 0,73, marins 0,30, mines ≈ 0',
    estime: true,
  },
  {
    id: 'msa-exploitants',
    nom: 'Exploitants agricoles',
    sigle: 'MSA non-salariés',
    famille: 'non-salaries',
    publicCouvert: 'Chefs d’exploitation, conjoints collaborateurs et aides familiaux',
    depenses: 8,
    solde: 0,
    subventionEtat: 0,
    retraites: 1.2,
    cotisations: 2.5,
    cotisants: 0.42,
    ratioDemographique: 0.35,
    calcul: 'Pension forfaitaire et proportionnelle (points) au régime de base, complétée par un régime complémentaire obligatoire',
    avantages: [
      'Pension minimale portée à 85 % du Smic net pour une carrière complète de chef d’exploitation (loi Chassaigne, 2020)',
      'Calcul sur les 25 meilleures années en cours de mise en place',
    ],
    contreparties: ['Cotisations historiquement faibles, donc pensions parmi les plus basses', 'Très fort déséquilibre démographique'],
    equilibre:
      'Financement majoritairement extérieur : impôts affectés et compensation démographique versée par les autres régimes ; équilibré par intégration financière',
    sources: 'MSA ; Sénat ; montant et ratio en ordre de grandeur',
    estime: true,
  },
  {
    id: 'liberaux',
    nom: 'Professions libérales et avocats',
    sigle: 'CNAVPL (10 sections) et CNBF',
    famille: 'non-salaries',
    publicCouvert: 'Médecins, pharmaciens, architectes, experts-comptables, notaires, avocats…',
    depenses: 6,
    solde: 1.0,
    subventionEtat: 0,
    retraites: 0.4,
    cotisations: 7,
    cotisants: 0.8,
    ratioDemographique: 2.0,
    calcul: 'Régime de base par points commun (CNAVPL) et régimes complémentaires propres à chaque profession',
    avantages: [
      'Démographie jeune et réserves importantes',
      'Régimes complémentaires gérés par la profession, adaptés à ses revenus',
    ],
    contreparties: [
      'Contributeurs nets à la compensation démographique (ils financent une partie des régimes déséquilibrés)',
      'Montants très variables selon la profession',
    ],
    equilibre: 'Autonome, excédentaire ; verse la compensation démographique',
    sources: 'Ordres de grandeur ; à compléter par les comptes de la CNAVPL et de la CNBF',
    estime: true,
  },
  {
    id: 'autres-complementaires',
    nom: 'Autres complémentaires (Ircantec, RAFP, indépendants…)',
    sigle: 'Ircantec, RAFP, RCI…',
    famille: 'complementaire',
    publicCouvert: 'Contractuels de la fonction publique, primes des fonctionnaires, indépendants, navigants…',
    depenses: 16.9,
    solde: 2.3,
    subventionEtat: 0,
    retraites: null,
    cotisations: null,
    cotisants: null,
    ratioDemographique: null,
    calcul: 'Régimes par points',
    avantages: [
      'Ircantec : complément des contractuels publics',
      'RAFP : seul régime par capitalisation obligatoire, sur les primes des fonctionnaires',
      'Réserves importantes pour le régime complémentaire des indépendants',
    ],
    contreparties: ['Montants modestes par rapport aux régimes de base'],
    equilibre: 'Autonomes, globalement excédentaires',
    sources: 'Montant obtenu par différence (complémentaires totales ≈ 112,5 Md€, dont Agirc-Arrco 87,2 %) ; solde estimé pour retrouver le solde global 2024',
    estime: true,
  },
];

/** Totaux 2024 tous régimes (COR). */
export const TOTAUX_2024 = {
  depenses: 400,
  /** Retraités de droit direct, tous régimes, fin 2023 (millions, DREES). */
  retraites: 17.2,
  /** Solde 2024 hors produits financiers, Md€. */
  solde: -1.7,
  source:
    'COR, rapport juin 2025 (dépenses ≈ 400 Md€, solde −1,7 Md€) ; DREES, Les retraités et les retraites (17,2 M de retraités de droit direct fin 2023, dont 14,2 M à la CNAV, 12,2 M à l’Agirc-Arrco, 1,2 M à la MSA non-salariés, ≈ 3,8 M dans la fonction publique)',
};

/**
 * Sources et méthodes des cotisations et cotisants par régime.
 * Agirc-Arrco : cotisations 2024 = 101,4 Md€ (communiqué Agirc-Arrco, mars 2025).
 * CNRACL : 24,4 Md€ de cotisations pour ≈ 2,2 M de cotisants (2023).
 * CNAV : estimation à partir des taux (15,45 % sous plafond + 2,42 % déplafonné) et de la masse
 * salariale du privé (≈ 120-130 Md€), y compris exonérations compensées par l'État.
 * Fonctionnaires de l'État : cotisations salariales (11,1 %) et contribution de l'État employeur,
 * dont le taux s'ajuste pour équilibrer le régime (cotisations ≈ pensions par construction).
 * Régimes spéciaux, exploitants agricoles, professions libérales : ordres de grandeur.
 * Cotisants : rapport démographique × retraités lorsque l'effectif n'est pas publié.
 */
export const SOURCES_COTISATIONS =
  'Agirc-Arrco (résultats 2024), CNRACL/IGAS (2023-2024), taux légaux de cotisation et masse salariale pour la CNAV, CAS « Pensions » pour l’État ; les autres montants sont des ordres de grandeur';

export const COMPENSATION_DEMOGRAPHIQUE =
  'La compensation démographique transfère chaque année plusieurs milliards d’euros des régimes à la démographie favorable (régime général, professions libérales, fonction publique territoriale) vers ceux qui comptent peu de cotisants par retraité (exploitants agricoles, régimes en extinction).';

/** Polypension (DREES, fin 2023). */
export const POLYPENSION = {
  /** Part des retraités de droit direct percevant des pensions d'au moins deux régimes de base. */
  partPolypensionnes: 0.256,
  partHommes: 0.278,
  partFemmes: 0.235,
  /** Nombre moyen de pensions de droit direct de régimes de base par retraité. */
  pensionsBaseParRetraite: 1.3,
  source: 'DREES, Les retraités et les retraites, édition 2025 (données fin 2023)',
};

export interface ParcoursType {
  titre: string;
  description: string;
  /** Répartition indicative de la pension totale entre régimes (identifiants de REGIMES, parts en %). */
  parts: Array<{ regime: string; part: number; libelle: string }>;
}

/**
 * Parcours illustratifs : répartitions indicatives d'une pension totale entre régimes, pour
 * montrer qu'un même retraité est payé par plusieurs caisses. Ce ne sont pas des statistiques.
 */
export const PARCOURS_TYPES: ParcoursType[] = [
  {
    titre: 'Salarié du privé non cadre, toute sa carrière',
    description: '2 régimes : base et complémentaire',
    parts: [
      { regime: 'cnav', part: 70, libelle: 'Régime général' },
      { regime: 'agirc-arrco', part: 30, libelle: 'Agirc-Arrco' },
    ],
  },
  {
    titre: 'Cadre du privé, toute sa carrière',
    description: '2 régimes ; la complémentaire pèse plus lourd car elle couvre les salaires au-delà du plafond',
    parts: [
      { regime: 'cnav', part: 45, libelle: 'Régime général' },
      { regime: 'agirc-arrco', part: 55, libelle: 'Agirc-Arrco' },
    ],
  },
  {
    titre: 'Fonctionnaire de l’État, toute sa carrière',
    description: '1 régime couvrant base et complément, plus le petit régime additionnel sur les primes (RAFP)',
    parts: [
      { regime: 'fpe', part: 95, libelle: 'Régime des fonctionnaires de l’État' },
      { regime: 'autres-complementaires', part: 5, libelle: 'RAFP' },
    ],
  },
  {
    titre: 'Salariée du privé puis fonctionnaire hospitalière',
    description: '4 régimes : polypensionnée',
    parts: [
      { regime: 'cnav', part: 28, libelle: 'Régime général' },
      { regime: 'agirc-arrco', part: 14, libelle: 'Agirc-Arrco' },
      { regime: 'cnracl', part: 54, libelle: 'CNRACL' },
      { regime: 'autres-complementaires', part: 4, libelle: 'RAFP' },
    ],
  },
  {
    titre: 'Salarié agricole puis exploitant',
    description: '3 régimes : polypensionné',
    parts: [
      { regime: 'cnav', part: 30, libelle: 'Régime général (salariés agricoles)' },
      { regime: 'agirc-arrco', part: 15, libelle: 'Agirc-Arrco' },
      { regime: 'msa-exploitants', part: 55, libelle: 'MSA exploitants (base et complémentaire)' },
    ],
  },
  {
    titre: 'Salarié puis artisan ou commerçant',
    description: '3 régimes ; la base des indépendants est gérée par le régime général depuis 2020',
    parts: [
      { regime: 'cnav', part: 55, libelle: 'Régime général (salarié et indépendant)' },
      { regime: 'agirc-arrco', part: 25, libelle: 'Agirc-Arrco' },
      { regime: 'autres-complementaires', part: 20, libelle: 'Complémentaire des indépendants (RCI)' },
    ],
  },
];
