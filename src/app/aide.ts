/**
 * Fiches d'aide du mode expert : définition de chaque indicateur, ce qu'il change dans la vie
 * réelle et la façon dont le simulateur le traite. Ordres de grandeur arrondis, à vérifier sur les
 * publications citées.
 */

export interface FicheAide {
  titre: string;
  categorie: CategorieAide;
  /** Ce que mesure l'indicateur. */
  definition: string;
  /** Ce que cela change concrètement pour les assurés, les retraités, les entreprises ou l'État. */
  vieReelle: string;
  /** Comment le simulateur l'utilise. */
  simulateur: string;
  /** Valeur de référence et source. */
  reference?: string;
}

export const CATEGORIES_AIDE = [
  'Démographie',
  'Économie',
  'Âge et durée',
  'Prélèvements',
  'Pensions',
  'Capitalisation',
  'Résultats',
] as const;
export type CategorieAide = (typeof CATEGORIES_AIDE)[number];

export const FICHES_AIDE = {
  fecondite: {
    titre: 'Fécondité',
    categorie: 'Démographie',
    definition:
      'Nombre moyen d’enfants qu’aurait une femme au cours de sa vie avec les taux de fécondité par âge de l’année (indicateur conjoncturel de fécondité).',
    vieReelle:
      'Les enfants nés aujourd’hui cotiseront dans 20 à 25 ans : la natalité n’agit sur le financement des retraites qu’à long terme. À court terme, plus de naissances signifie plus de dépenses familiales et d’éducation, pas plus de cotisants. Le seuil de remplacement des générations est d’environ 2,05 enfants par femme.',
    simulateur:
      'Appliquée à partir de 2028. Elle modifie le nombre de naissances, donc la population active à partir des années 2050 ; le nombre de retraités de 2070 (déjà nés) ne change pas.',
    reference: 'Environ 1,6 en 2024, 1,56 en 2025 ; hypothèse centrale du COR : 1,45 (INSEE, COR 2026).',
  },
  esperanceVie: {
    titre: 'Espérance de vie',
    categorie: 'Démographie',
    definition:
      'Nombre moyen d’années que vivrait une personne avec les conditions de mortalité de l’année. L’espérance de vie à 60 ans mesure les années restant à vivre à cet âge.',
    vieReelle:
      'Vivre plus longtemps allonge la durée de retraite, donc le nombre de pensions versées en même temps. C’est l’une des raisons des reculs successifs de l’âge de départ. Les écarts sont importants : environ 13 ans d’espérance de vie entre les 5 % d’hommes les plus aisés et les 5 % les plus modestes (INSEE).',
    simulateur:
      'Écart, en années, à la trajectoire de référence en 2070. Le modèle est calé sur le vieillissement projeté par le COR (paramètre de calage : 91 ans en 2070, plus que l’INSEE).',
    reference: 'Espérance de vie à 60 ans : environ 25,7 ans en 2024, moyenne femmes-hommes (INSEE).',
  },
  soldeMigratoire: {
    titre: 'Solde migratoire',
    categorie: 'Démographie',
    definition: 'Différence entre les entrées et les sorties du territoire au cours d’une année.',
    vieReelle:
      'Les personnes qui arrivent sont surtout de jeunes adultes : elles augmentent d’abord le nombre d’actifs et de cotisants, puis, des décennies plus tard, celui des retraités. L’effet net sur l’équilibre dépend de leur taux d’emploi.',
    simulateur:
      'Solde annuel à partir de 2026, réparti par âge selon un profil type (surtout 20-35 ans). Les migrants ont ensuite les mêmes taux d’activité que le reste de la population.',
    reference: 'Hypothèse centrale du COR : +150 000 par an.',
  },
  productivite: {
    titre: 'Productivité du travail',
    categorie: 'Économie',
    definition:
      'Croissance de la production par heure ou par personne en emploi. À long terme, elle détermine la progression des salaires réels.',
    vieReelle:
      'Quand la productivité progresse, les salaires (et donc les cotisations) augmentent plus vite que les prix. Les pensions déjà versées suivent les prix : leur poids dans le PIB baisse, mais l’écart de niveau de vie entre retraités et actifs se creuse. C’est le principal facteur d’incertitude des projections.',
    simulateur:
      'Croissance annuelle de long terme, atteinte en 2032 (ou en 2030 si l’on part du niveau observé en 2024, quasi nul). Elle fait évoluer les salaires, donc les cotisations et la pension relative.',
    reference: 'COR 2026 : 0,7 % (référence), variantes de 0,4 % à 1,3 % ; tendance observée 2010-2024 : environ 0,5 %.',
  },
  chomage: {
    titre: 'Taux de chômage',
    categorie: 'Économie',
    definition: 'Part des personnes sans emploi qui en cherchent un, parmi les actifs (au sens du BIT).',
    vieReelle:
      'Un chômeur ne cotise pas (ou peu) mais valide des trimestres pour sa retraite. Moins de chômage, c’est plus de cotisants et de recettes, et des carrières plus complètes.',
    simulateur: 'Taux de long terme atteint en 2030 ; il réduit le nombre de personnes en emploi, donc les cotisants.',
    reference: 'Environ 7,5 % en 2025 ; hypothèse centrale du COR : 7 % (INSEE, COR).',
  },
  inflation: {
    titre: 'Inflation',
    categorie: 'Économie',
    definition: 'Hausse générale des prix à la consommation sur un an.',
    vieReelle:
      'Les pensions de base sont revalorisées chaque année sur l’inflation : sans revalorisation (gel), une inflation de 2 % fait perdre 2 % de pouvoir d’achat aux retraités, de façon durable. Plus l’inflation est forte, plus un gel rapporte… et coûte aux retraités.',
    simulateur:
      'Le modèle raisonne en euros constants : l’inflation ne sert qu’à chiffrer les années de gel des pensions.',
    reference: 'Hypothèse du COR : 1,75 % par an à long terme.',
  },
  ageLegal: {
    titre: 'Âge légal de départ',
    categorie: 'Âge et durée',
    definition:
      'Âge minimum à partir duquel on peut demander sa retraite (hors dispositifs comme les carrières longues, l’invalidité ou les métiers pénibles).',
    vieReelle:
      'Le reculer fait partir plus tard ceux qui ont déjà tous leurs trimestres, souvent entrés tôt sur le marché du travail ; ceux qui ont commencé tard partent déjà après cet âge. Une partie des personnes concernées n’est plus en emploi à ce moment-là (chômage, invalidité, minima sociaux) : le gain pour les retraites est en partie compensé par des dépenses ailleurs.',
    simulateur:
      'Âge visé et année où il est atteint. L’âge effectif moyen bouge d’environ 0,6 an par an de recul de l’âge légal ; chaque année de départ plus tardive augmente un peu la pension (proratisation, surcote).',
    reference:
      'Législation actuelle : 62 ans et 9 mois pendant la suspension de la réforme de 2023, puis 64 ans en 2033 (LFSS 2026).',
  },
  dureeCotisation: {
    titre: 'Durée de cotisation requise',
    categorie: 'Âge et durée',
    definition:
      'Nombre de trimestres validés nécessaires pour une retraite à taux plein (sans décote). Sans cette durée, la pension est réduite, sauf à partir de l’âge d’annulation de la décote (67 ans).',
    vieReelle:
      'L’allonger touche surtout ceux qui ont commencé à travailler tard (études longues) ou ont eu des interruptions de carrière : ils doivent travailler plus longtemps ou accepter une pension plus faible.',
    simulateur:
      'Années ajoutées ou retirées, montée en charge de 2028 à 2035. L’âge effectif de départ recule d’environ 0,5 an par année de durée supplémentaire.',
    reference: '43 ans (172 trimestres) pour les générations nées à partir de 1965 (réforme de 2014, accélérée en 2023).',
  },
  emploiSeniors: {
    titre: 'Emploi des seniors',
    categorie: 'Âge et durée',
    definition: 'Part des personnes de 55 à 69 ans qui travaillent, parmi celles qui ne sont pas retraitées.',
    vieReelle:
      'La France a un taux d’emploi des 60-64 ans plus faible que ses voisins. Plus de seniors en emploi, c’est plus de cotisations et moins de dépenses de chômage ou de minima sociaux en fin de carrière. Cela suppose que les entreprises gardent ou embauchent des salariés âgés.',
    simulateur: 'Points ajoutés au taux d’activité des 55-69 ans non retraités, de 2028 à 2035.',
    reference: 'Taux d’emploi des 55-64 ans : environ 60 % en 2024 ; des 60-64 ans : environ 40 % (INSEE, DARES).',
  },
  hausseCotisation: {
    titre: 'Hausse des cotisations',
    categorie: 'Prélèvements',
    definition:
      'Augmentation du taux de cotisation retraite prélevé sur les revenus d’activité (part salariale et/ou patronale).',
    vieReelle:
      'Un point de cotisation rapporte environ 13 Md€ par an. Côté salarié, c’est une baisse du salaire net ; côté employeur, une hausse du coût du travail, avec un risque sur l’emploi et la compétitivité. Le taux actuel est déjà d’environ 28 % du salaire brut dans le privé.',
    simulateur:
      'Points de la masse des revenus d’activité, montée en charge de 2028 à 2030. Le modèle ne simule pas d’effet en retour sur l’emploi ou les salaires.',
  },
  ressourcesExternes: {
    titre: 'Recettes affectées (CSG, TVA, budget de l’État)',
    categorie: 'Prélèvements',
    definition:
      'Ressources autres que les cotisations versées au système de retraite : impôts affectés (CSG, part de TVA…) ou subventions de l’État.',
    vieReelle:
      'Financer par l’impôt répartit l’effort sur tous les revenus (y compris ceux des retraités et du capital) ou sur la consommation, plutôt que sur le seul travail. Mais ces sommes manquent ailleurs dans le budget, ou augmentent la dette publique. Un point de PIB représente environ 30 Md€.',
    simulateur: 'Points de PIB ajoutés aux ressources à partir de 2028.',
  },
  sousIndexation: {
    titre: 'Sous-indexation des pensions',
    categorie: 'Pensions',
    definition: 'Revalorisation des pensions en cours de versement inférieure à l’inflation.',
    vieReelle:
      'Pour une pension de 1 600 € par mois, revaloriser à « inflation − 1 point » fait perdre environ 16 € par mois la première année, et la perte s’accumule chaque année tant que dure la mesure. Les retraités les plus âgés, partis depuis longtemps, sont les plus touchés.',
    simulateur: 'Points retirés à la revalorisation annuelle, de 2028 jusqu’à l’année choisie.',
    reference: 'Règle actuelle : revalorisation sur l’inflation (hors tabac) chaque 1er janvier pour les régimes de base.',
  },
  gel: {
    titre: 'Gel des pensions (« année blanche »)',
    categorie: 'Pensions',
    definition: 'Absence de revalorisation des pensions une année donnée.',
    vieReelle:
      'Avec une inflation de 1,75 %, un gel fait perdre environ 28 € par mois à une pension de 1 600 €, et cette perte reste acquise les années suivantes. Il rapporte de l’ordre de 4 à 7 Md€ par an, selon l’inflation et selon que les complémentaires sont gelées ou non.',
    simulateur: 'Années cochées sans revalorisation ; l’effet dépend du curseur d’inflation.',
  },
  ajustementPensions: {
    titre: 'Niveau des pensions nouvelles',
    categorie: 'Pensions',
    definition:
      'Modification des règles de calcul des pensions liquidées à partir de 2028 : décote, salaire de référence (25 meilleures années), valeur d’achat et de service des points…',
    vieReelle:
      'Seuls les nouveaux retraités sont concernés : les pensions déjà versées ne changent pas. L’effet sur les dépenses est donc progressif, mais durable.',
    simulateur: 'Pourcentage appliqué aux pensions des nouveaux retraités à partir de 2028.',
    reference: 'Pension moyenne de droit direct : environ 1 600 € bruts par mois (DREES).',
  },
  capitalisation: {
    titre: 'Capitalisation',
    categorie: 'Capitalisation',
    definition:
      'Épargne placée sur les marchés financiers pendant la vie active, puis versée sous forme de rente à la retraite. Contrairement à la répartition, chacun (ou le fonds) finance sa propre retraite.',
    vieReelle:
      'La transition coûte cher : si une part des cotisations part vers des comptes individuels, il faut quand même payer les pensions actuelles (double charge pendant une quarantaine d’années). Les rentes dépendent des rendements financiers, incertains. Exemples : retraite complémentaire obligatoire en Suède, fonds de pension aux Pays-Bas, Fonds de réserve pour les retraites en France.',
    simulateur:
      'Points de masse salariale versés à partir de 2028 ; les rentes montent en charge sur 40 ans. Voir aussi « mode » et « rendement ».',
  },
  capitalisationMode: {
    titre: 'Mode de capitalisation',
    categorie: 'Capitalisation',
    definition:
      'Substitutif : une part des cotisations actuelles est réorientée vers des comptes individuels. Additionnel : une cotisation nouvelle s’ajoute. Fonds de réserve : l’épargne est collective et sert à payer les pensions du système par répartition.',
    vieReelle:
      'Substitutif : moins de recettes immédiates pour la répartition, donc déficit plus élevé pendant la transition. Additionnel : prélèvement supplémentaire sur les actifs. Fonds de réserve : lisse le choc démographique sans créer de droits individuels.',
    simulateur: 'Détermine si la cotisation est retirée des ressources, ajoutée en plus, ou si les rentes viennent abonder le système.',
  },
  capitalisationRendement: {
    titre: 'Rendement réel net de la capitalisation',
    categorie: 'Capitalisation',
    definition: 'Rendement annuel des placements après inflation et frais de gestion.',
    vieReelle:
      'Sur 40 ans, l’écart entre 2 % et 4 % de rendement double presque le capital accumulé. Les rendements passés des marchés d’actions sont plus élevés, mais avec de fortes variations : une crise juste avant le départ réduit durablement la rente.',
    simulateur: 'Rendement réel appliqué chaque année au fonds ; rente versée sur environ 22 ans.',
    reference: 'Hypothèse par défaut : 3 % par an.',
  },
  soldeCible: {
    titre: 'Solde cible',
    categorie: 'Résultats',
    definition:
      'Solde du système que l’on se fixe comme objectif : 0 pour l’équilibre, un nombre négatif pour un déficit toléré.',
    vieReelle:
      'Accepter un déficit revient à le financer par la dette, donc par les générations futures, ou par le budget de l’État.',
    simulateur: 'Sert au tableau « effort pour atteindre le solde cible » : âge, prélèvement ou niveau de pension nécessaire.',
  },
  solde: {
    titre: 'Solde du système de retraite',
    categorie: 'Résultats',
    definition: 'Ressources moins dépenses de l’ensemble des régimes, en % du PIB.',
    vieReelle:
      'Un déficit doit être couvert par l’emprunt, le budget de l’État ou les réserves. 0,1 point de PIB représente environ 3 Md€.',
    simulateur:
      'Calculé chaque année à partir de la démographie, de l’emploi et des pensions ; les ressources suivent la convention du COR (part du PIB à législation inchangée).',
    reference: 'COR 2026 (référence) : environ −0,2 % du PIB en 2030, −0,9 % en 2045, −2,4 % en 2070.',
  },
  depensesRessources: {
    titre: 'Dépenses et ressources',
    categorie: 'Résultats',
    definition:
      'Dépenses : pensions versées par tous les régimes. Ressources : cotisations, impôts affectés et transferts. Les deux en % du PIB.',
    vieReelle:
      'Les retraites représentent environ 14 % du PIB, le premier poste de la protection sociale (environ 400 Md€ par an).',
    simulateur: 'Les dépenses découlent du nombre de retraités et de la pension moyenne ; les ressources de la masse des revenus d’activité.',
  },
  pensionRelative: {
    titre: 'Pension relative',
    categorie: 'Résultats',
    definition: 'Pension moyenne de l’ensemble des retraités rapportée au revenu d’activité moyen des actifs.',
    vieReelle:
      'C’est l’indicateur du niveau de vie des retraités par rapport aux actifs. Aujourd’hui, le niveau de vie moyen des retraités est proche de celui de l’ensemble de la population ; une baisse de la pension relative le ferait diminuer relativement aux actifs, même si les pensions augmentent en euros.',
    simulateur: 'Inclut les rentes de capitalisation le cas échéant.',
    reference: 'Environ 55 % en 2025 ; projeté à environ 45 % en 2070 par le COR à législation inchangée.',
  },
  ratioCotisants: {
    titre: 'Cotisants par retraité',
    categorie: 'Résultats',
    definition: 'Nombre de personnes en emploi qui cotisent, pour une personne retraitée.',
    vieReelle:
      'C’est le cœur de la répartition : moins il y a de cotisants par retraité, plus chacun doit cotiser ou plus les pensions doivent baisser pour un même équilibre. Il était d’environ 4 dans les années 1960.',
    simulateur: 'Calculé à partir de la pyramide des âges, des taux d’activité par âge et des âges de départ.',
    reference: 'Environ 1,7 aujourd’hui (COR).',
  },
  actifsInactifs: {
    titre: 'Actifs en emploi pour un inactif',
    categorie: 'Résultats',
    definition: 'Nombre de personnes en emploi pour une personne sans emploi (jeunes, chômeurs, retraités, autres inactifs).',
    vieReelle:
      'Mesure la charge totale portée par ceux qui travaillent, pas seulement celle des retraites : moins d’enfants à charge peut compenser en partie davantage de retraités.',
    simulateur:
      'Les emplois comptés sont les cotisants du modèle : les retraités qui travaillent (cumul emploi-retraite) ne sont pas inclus, d’où une valeur inférieure à celle de l’INSEE (environ 0,78).',
  },
  dette: {
    titre: 'Dette accumulée du système',
    categorie: 'Résultats',
    definition: 'Somme des déficits annuels depuis 2025, intérêts compris, en % du PIB (négatif : réserves).',
    vieReelle:
      'Une dette de retraite est remboursée plus tard par les actifs ou les contribuables futurs (comme la dette sociale portée par la CADES).',
    simulateur: 'Cumul des soldes avec un taux d’intérêt réel de 1 %.',
  },
  ages: {
    titre: 'Âges : entrée, départ, espérance de vie',
    categorie: 'Résultats',
    definition:
      'Âge moyen d’entrée dans la vie active, âge légal, âge moyen effectif de départ et âge atteint en moyenne par les personnes de 60 ans (60 + espérance de vie à 60 ans).',
    vieReelle:
      'L’écart entre départ et espérance de vie donne la durée moyenne de retraite ; l’écart entre entrée et départ, la durée de vie active. La part des années de retraite sans incapacité (environ la moitié après 65 ans) compte autant que leur nombre.',
    simulateur: 'L’âge d’entrée est descriptif (non utilisé par le modèle) ; l’âge de départ découle de l’âge légal, de la durée requise et des comportements.',
  },
  fondsCapitalisation: {
    titre: 'Fonds de capitalisation',
    categorie: 'Résultats',
    definition: 'Montant épargné et placé grâce aux cotisations de capitalisation, en % du PIB.',
    vieReelle:
      'Un fonds important rend les retraites plus dépendantes des marchés financiers, mais finance aussi l’économie (actions, obligations).',
    simulateur: 'Cotisations accumulées avec le rendement réel, moins les rentes versées.',
  },
  pyramide: {
    titre: 'Pyramide des âges',
    categorie: 'Résultats',
    definition:
      'Population par âge, répartie entre actifs en emploi, retraités et personnes ni en emploi ni retraitées (jeunes, chômeurs, inactifs).',
    vieReelle:
      'Les générations nombreuses du baby-boom (nées de 1946 à 1974) partent à la retraite jusqu’au milieu des années 2030 : c’est la principale cause de la dégradation du rapport cotisants/retraités.',
    simulateur: 'Projetée année par année (naissances, décès, migrations) ; reconstituée avant 2025.',
  },
  effortEquilibre: {
    titre: 'Effort pour atteindre le solde cible',
    categorie: 'Résultats',
    definition:
      'Ce qu’il faudrait faire avec un seul levier en plus pour atteindre le solde cible : relever l’âge moyen de départ, augmenter les prélèvements, ou baisser la pension relative.',
    vieReelle:
      'En pratique, les réformes combinent plusieurs leviers ; ce tableau montre l’ampleur de chacun pris seul, pour comparer les ordres de grandeur.',
    simulateur: 'Calculé année par année, sans effet de long terme (l’âge nécessaire suppose un ajustement immédiat).',
  },
} satisfies Record<string, FicheAide>;

export type CleAide = keyof typeof FICHES_AIDE;
