# Étendre la méthode « retraites » à tout le budget — Idéation

> Statut : **idéation validée** — décisions de cadrage en §0 ; une question reste ouverte (§9).
> Point de départ : le module retraites (voir [`../retraites/IDEATION.md`](../retraites/IDEATION.md)
> et [`../retraites/METHODOLOGIE.md`](../retraites/METHODOLOGIE.md)). Objectif : dégager de ce
> module une **méthode reproductible**, puis l'appliquer aux autres grands postes des finances
> publiques en partageant un socle commun (démographie, macroéconomie, dette).
> Les chiffres cités sont des **ordres de grandeur** à recalibrer sur les sources officielles.

---

## 0. Décisions de cadrage (octobre 2026)

| Question | Décision |
|---|---|
| Ambition | **Une série de modules indépendants** (un par sujet, chacun utilisable seul), et **une page de synthèse** qui rassemble les résultats des scénarios choisis dans chaque module (effet sur le solde public et la dette). |
| Ordre des modules | **Dette et solde public**, puis **santé**. |
| Horizon de projection | **Propre à chaque sujet** : 2070 pour les sujets démographiques (retraites, santé, autonomie, éducation), un horizon plus court pour les sujets budgétaires (dette, fiscalité, défense), fixé dans la fiche de chaque module. La page de synthèse affiche la période commune. |
| Niveau de détail fiscal | **Ouvert** (voir §9). |
| Identité | **Le « Simulateur des retraites » devient un module du « Simulateur du budget »**, avec une adresse par module. |

---

## 1. Ce que le module retraites a établi : la méthode en 10 points

Le module retraites n'est pas seulement un simulateur : c'est une façon de faire. La rendre
explicite permet de l'appliquer à chaque nouveau sujet comme une liste de contrôle.

| # | Principe | Dans le module retraites | À reproduire pour chaque sujet |
|---|---|---|---|
| 1 | **Une question citoyenne** | « Comment équilibrer le système de retraite d'ici 2070 ? » | Une phrase, compréhensible sans jargon. |
| 2 | **Une identité comptable** | Taux de prélèvement × (cotisants / retraités) = pension / revenu d'activité | L'équation qui structure tout le reste ; chaque levier y a une place. |
| 3 | **« Le monde » séparé des « solutions »** | Hypothèses (productivité, chômage, fécondité…) ≠ leviers (âge, taux, indexation…) | Deux panneaux distincts ; les hypothèses ne sont jamais présentées comme des choix. |
| 4 | **Un scénario de référence officiel** | COR, juin 2026 | Calibrer sur la projection d'une institution reconnue, écarts publiés. |
| 5 | **Un critère d'acceptation chiffré** | ± 0,1 pt de PIB sur les cibles COR, verrouillé par les tests | `npm run calibration` et tests de non-régression pour chaque module. |
| 6 | **Le triangle d'équilibre** | Âge, taux ou pension nécessaire pour un solde cible | Pour chaque module, résoudre le levier manquant. |
| 7 | **Le temps long** | Historique depuis 1945, réformes, crises, fenêtre réglable, projection 2070 | Mettre la projection en perspective du passé observé. |
| 8 | **L'incertitude affichée** | Fourchettes productivité / chômage / natalité, poids de chaque critère | Montrer ce qui fait bouger le résultat, pas une courbe unique. |
| 9 | **Le détail descriptif, le modèle agrégé** | Régimes décrits (fiches, polypension) mais modèle tous régimes | Décrire les sous-ensembles sans complexifier le moteur. |
| 10 | **Neutralité et transparence** | Sources datées, limites listées, vocabulaire du COR, lien permanent | Même charte, même note de méthode, mêmes conventions. |

S'y ajoutent des acquis d'interface à réutiliser tels quels : présentations **Découvrir**
(parcours en 3 étapes) et **Mode expert** ; état du scénario dans l'URL ; export CSV ; couleur fixe
par entité ; bandes de crises ; fenêtre de temps ; fichier HTML unique ; écran d'erreur lisible ;
script de vérification des indicateurs.

## 2. Le paysage : où va l'argent public

Les administrations publiques (APU) dépensent ≈ **57 % du PIB** (≈ 1 650 Md€) et prélèvent
≈ **51 % du PIB** de recettes (dont ≈ 43 % de prélèvements obligatoires). Le déficit est de l'ordre
de 5 % du PIB, la dette d'environ 115 % du PIB (≈ 3 400 Md€). Répartition indicative des
dépenses (≈ % du PIB) :

| Poste | ≈ % PIB | Moteur principal | Lien avec la démographie |
|---|---|---|---|
| Retraites | 14 | Âge, pension relative | Très fort (déjà fait) |
| Santé (assurance maladie, hôpital) | 8–9 | Âge × coût par âge × progrès médical | Très fort |
| Autonomie / dépendance | 1,5 | Effectif des 80 ans et + × prévalence | Très fort, croissant |
| Famille | 2 | Naissances, prestations | Fort (fécondité) |
| Chômage | 1,5–2 | Chômage × indemnisation | Moyen (cycle) |
| Solidarité (RSA, prime d'activité, AAH, minimum vieillesse) | 2 | Pauvreté, barèmes | Moyen |
| Logement (APL et aides) | 1 | Loyers, barèmes | Faible |
| Éducation, enseignement supérieur | 5–6 | Élèves × dépense par élève | Fort (natalité en baisse) |
| Défense | 2 | Loi de programmation militaire, engagements OTAN | Nul |
| Charge d'intérêts de la dette | 2 | Taux × dette | Indirect |
| Collectivités (hors transferts ci-dessus) | ≈ 8–9 | Investissement local, règle d'or | Faible |
| Autres missions de l'État (sécurité, justice, écologie, recherche…) | ≈ 8–9 | Choix budgétaires | Faible |

Ce tableau montre l'**atout du module retraites** : le moteur démographique (pyramide par âge
simple 1945-2070) sert directement à la santé, l'autonomie, la famille et l'éducation, qui
représentent ensemble ≈ 17 points de PIB de plus.

## 3. Les sujets candidats, fiche par fiche

Chaque fiche applique les points 1 à 6 de la méthode. Les deux colonnes « référence » indiquent la
projection officielle sur laquelle calibrer.

### 3.1 Dette et solde public — le module de synthèse

- **Question** : « Peut-on stabiliser la dette publique, et à quel prix ? »
- **Identité** : dette(t+1) / PIB = dette(t) / PIB × (1 + r) / (1 + g) − solde primaire / PIB.
  L'effet « boule de neige » dépend de l'écart entre taux d'intérêt apparent *r* et croissance
  nominale *g*.
- **Monde** : croissance potentielle (même productivité que les retraites), inflation, taux
  d'intérêt à 10 ans, prime de risque.
- **Leviers** : solde primaire (alimenté par tous les autres modules), rythme d'ajustement,
  cible de dette.
- **Triangle d'équilibre** : solde primaire stabilisant la dette ; année de stabilisation pour un
  effort donné ; taux d'intérêt maximal supportable.
- **Référence** : plan budgétaire et structurel à moyen terme (PSMT) et ses rapports d'avancement,
  avis du Haut Conseil des finances publiques, Cour des comptes (« Situation et perspectives des
  finances publiques »), analyse de soutenabilité de la dette de la Commission européenne.
- **Intérêt** : c'est le module qui **additionne tous les autres**. Il donne enfin un sens au
  solde des retraites (« −2,4 % du PIB en 2070 » pèse combien dans la dette ?).

### 3.2 Santé — le cousin direct des retraites

- **Question** : « Comment financer la santé d'une population qui vieillit ? »
- **Identité** : dépenses = Σ_âges population(âge) × dépense moyenne par âge × (1 + excès de
  croissance des coûts)^t ; recettes = CSG + cotisations + taxes affectées.
- **Monde** : espérance de vie, part des années gagnées en bonne santé (« vieillissement en bonne
  santé » vs « expansion de la morbidité »), progrès technique et prix relatifs des soins,
  productivité.
- **Leviers** : taux de progression de l'ONDAM, reste à charge des ménages (franchises, tickets
  modérateurs), partage assurance maladie / complémentaires, prévention, recettes affectées.
- **Triangle** : progression de l'ONDAM compatible avec l'équilibre, ou hausse de CSG nécessaire.
- **Référence** : LFSS (annexes ONDAM), comptes de la santé (DREES), rapport « Charges et produits »
  de la CNAM, Ageing Report 2024 de la Commission européenne (qui projette justement santé et
  dépendance **par âge**, avec la même démarche que le COR).
- **Réutilisation** : pyramide, espérance de vie, espérance de vie sans incapacité (déjà présente
  sur le graphique des âges), productivité.

### 3.3 Autonomie (dépendance)

- **Question** : « Combien coûtera la perte d'autonomie quand les baby-boomers auront 85 ans ? »
- **Identité** : dépenses = Σ_âges population × prévalence de la perte d'autonomie (GIR 1-4) ×
  coût moyen (domicile / établissement) ; recettes = CSA, CSG affectée à la 5ᵉ branche.
- **Leviers** : part maintenue à domicile, reste à charge en EHPAD, taux d'encadrement, nouvelle
  journée de solidarité, assurance dépendance obligatoire (lien avec la capitalisation).
- **Référence** : DREES (modèle Lieux de vie et autonomie), rapport Libault, CNSA, Ageing Report.
- **Spécificité** : effet de génération très marqué (arrivée des générations 1946-1964 à 80 ans
  entre 2026 et 2044), la pyramide animée le montre immédiatement.

### 3.4 Éducation — le « dividende démographique »

- **Question** : « Que faire des économies liées à la baisse du nombre d'élèves ? »
- **Identité** : dépenses = Σ_niveaux élèves × dépense par élève ; enseignants = élèves / taux
  d'encadrement × rémunération.
- **Monde** : naissances (fécondité, déjà dans le moteur), taux de scolarisation dans le supérieur.
- **Leviers** : taux d'encadrement (élèves par classe), rémunération des enseignants, dépense par
  étudiant, fermetures de classes.
- **Triangle** : à dépense constante en % du PIB, combien d'élèves par classe ou quel salaire ?
- **Référence** : DEPP (« L'état de l'école », projections d'effectifs), Compte de l'éducation,
  Cour des comptes.
- **Intérêt** : sujet où le vieillissement **libère** des marges, ce qui équilibre le récit
  (tout ne se dégrade pas).

### 3.5 Famille et natalité

- **Question** : « Ce que coûtent et rapportent les politiques familiales. »
- **Identité** : dépenses = enfants par tranche d'âge × prestations moyennes (allocations, accueil
  du jeune enfant, quotient familial côté fiscalité).
- **Leviers** : modulation selon les revenus, allocations dès le 1ᵉʳ enfant, congé de naissance,
  places en crèche.
- **Bouclage instructif** : un effet (incertain) sur la fécondité se répercute, avec 20 ans de
  décalage, sur les cotisants des retraites. À présenter comme hypothèse réglable, jamais imposée.
- **Référence** : CNAF, HCFEA, LFSS branche famille.

### 3.6 Chômage et emploi

- **Question** : « Combien coûte un point de chômage, et que changent les règles d'indemnisation ? »
- **Identité** : dépenses = demandeurs indemnisés × allocation moyenne ; recettes = masse
  salariale × taux de contribution.
- **Leviers** : durée d'indemnisation, contracyclicité, taux de remplacement, emploi des seniors.
- **Référence** : prévisions financières de l'Unédic, DARES.
- **Rôle transverse** : c'est ici que se règle la **limite n° 5 du module retraites** (un report
  d'âge augmente les dépenses de chômage, d'invalidité et de minima sociaux). Le couplage
  retraites → chômage devient un effet explicite, réglable et chiffré.

### 3.7 Fiscalité et prélèvements — « qui paie ? »

- **Question** : « D'où vient l'argent, et qui le paie ? »
- **Identité** : recettes = Σ assiette × taux effectif, avec des élasticités au PIB (TVA ≈ 1,
  impôt sur les sociétés > 1, impôt sur le revenu progressif).
- **Leviers** : barèmes (IR, TVA, IS, CSG), niches fiscales, taxation du patrimoine, cotisations
  employeur, transferts entre impôts et cotisations (« TVA sociale »).
- **Triangle** : hausse de taux d'un impôt nécessaire pour financer un objectif donné.
- **Référence** : Voies et moyens (PLF), rapport sur les prélèvements obligatoires, Conseil des
  prélèvements obligatoires.
- **Frontière** : la répartition par décile relève de la microsimulation (Ines de l'INSEE-DREES,
  OpenFisca / LexImpact). Ne pas la refaire : soit rester macro, soit **s'appuyer** sur ces outils
  ouverts et citer leurs résultats.

### 3.8 Autres sujets, plus « budgétaires » que « démographiques »

| Sujet | Identité / levier principal | Référence | Remarque |
|---|---|---|---|
| Défense | Trajectoire en % du PIB (2 %, 3 %, 3,5 % objectif OTAN 2035) | Loi de programmation militaire 2024-2030 et actualisation | Module de « coût d'objectif » : faible modélisation, fort intérêt public. |
| Masse salariale publique | Effectifs × point d'indice × glissement vieillesse-technicité | Rapport annuel sur l'état de la fonction publique | Transverse à l'éducation, la santé, la défense. |
| Collectivités | Dépenses = fonctionnement + investissement ; règle d'or ; dotations de l'État | Observatoire des finances locales | Peu de leviers nationaux directs. |
| Transition écologique | Besoin d'investissement public additionnel (rapport Pisani-Ferry–Mahfouz) | SGPE, I4CE (panorama des financements climat) | Bon cas pour le lien dette / investissement. |
| Logement | Bénéficiaires × aide moyenne, indexation des APL | CNAF, compte du logement | Petit module, réutilise les barèmes. |
| Minima sociaux | Bénéficiaires × montant, revalorisation | DREES (« Minima sociaux et prestations sociales ») | Reçoit les effets de bord des retraites et du chômage. |

## 4. Architecture proposée : un socle, des modules indépendants, une page de synthèse

```
                        ┌────────────────────────────────────────────┐
                        │  SOCLE commun                              │
                        │  démographie (pyramide 1945-2070),         │
                        │  macro (productivité, chômage, inflation,  │
                        │  PIB, taux d'intérêt), historique, crises  │
                        └───────────────┬────────────────────────────┘
          ┌─────────────┬───────────────┼──────────────┬───────────────┐
          ▼             ▼               ▼              ▼               ▼
     Retraites       Santé         Autonomie       Éducation   …  Fiscalité
   (fait, COR)   (LFSS, Ageing)  (DREES, CNSA)    (DEPP)          (PLF)
          │             │               │              │               │
          └─────────────┴───────┬───────┴──────────────┴───────────────┘
                                ▼
                 PAGE DE SYNTHÈSE : lit le scénario choisi dans chaque module,
                 additionne dépenses et recettes, solde primaire
                                ▼
                 DETTE : intérêts, boule de neige, stabilisation
```

**Indépendance des modules** : chaque module a sa propre page, son propre lien permanent et
fonctionne seul. Il ne dépend que du socle, jamais d'un autre module. La page de synthèse est un
consommateur : elle lit le scénario de chaque module (son état encodé dans l'URL) et en récupère un
**résumé** normalisé.

**Contrat commun d'un module** (interface TypeScript, à préciser) :

- `hypothesesUtilisees` : ce que le module lit dans le socle ;
- `leviersNeutres` et `simuler(socle, leviers)` → séries annuelles de dépenses et de recettes
  (Md€ 2025 et % du PIB) ;
- `equilibre(resultat, cible)` → le ou les leviers d'équilibre ;
- `CALIBRAGE` : cibles de la référence officielle, vérifiées par `npm run calibration` ;
- `resume(resultat)` → ce que lit la page de synthèse : par année, dépenses et recettes en % du PIB
  et écart à la référence du module, sur l'horizon propre au module ;
- un historique (séries + réformes) et une note de méthode `docs/<module>/METHODOLOGIE.md`.

**Postes non modélisés** : un poste « reste des APU » suit le PIB (part constante, réglable). La
synthèse est donc complète dès le premier module ajouté, et se raffine module après module.

**Couplages entre modules** : les modules restant indépendants, ils ne s'appellent pas entre eux.
Les hypothèses communes (démographie, productivité, chômage) viennent du socle ; la page de synthèse
signale quand deux modules ont été réglés avec des hypothèses différentes et propose de les
aligner. Les effets d'un module sur un autre (retraites → chômage / invalidité ; famille →
fécondité) sont calculés et affichés **dans la page de synthèse**, comme des effets explicites et
désactivables. Pas de bouclage caché.

**Réorganisation du code** (à faire avant le deuxième module) :
`src/engine/demographie.ts` et les données historiques communes vers `src/socle/` ; le reste vers
`src/modules/retraites/` ; composants graphiques (`Courbes`, `Pyramide`, `Barres`, fenêtre,
crises) dans `src/app/commun/`. Les tests de calibrage retraites garantissent que la réorganisation
ne change aucun résultat.

## 5. Présentation : des modules indépendants, une page de synthèse

- **Une page d'accueil** « Où vont 100 € de dépense publique ? » : répartition par poste, d'où
  vient l'argent, déficit et dette, avec un lien vers chaque module.
- **Chaque module** est autonome et garde la structure éprouvée : Découvrir (comprendre → choisir
  ses mesures → qui paie ?) et Mode expert, avec son propre lien permanent.
- **La page de synthèse** rassemble les scénarios choisis dans chaque module (un module non réglé
  compte pour sa référence) et montre leur effet cumulé sur le solde public et la dette, poste par
  poste (cascade). Le triangle d'équilibre s'y généralise : « pour stabiliser la dette en 2032,
  voici l'effort restant à trouver ». Un bouton « Modifier » renvoie vers le module concerné.
- **Lien permanent de la synthèse** : il regroupe les liens de chaque module (un préfixe par
  module) ; ouvrir un module depuis la synthèse conserve le scénario.
- **Comparateur de programmes 2027** : prévu en phase 3 pour les retraites, il gagne beaucoup à être
  multi-sujets, les programmes chiffrant rarement un seul poste. Les règles de neutralité du
  module retraites (§7 de son idéation) s'appliquent à l'identique.

## 6. Priorisation proposée

Critères : poids budgétaire, réutilisation du socle existant, présence dans le débat 2027,
disponibilité d'une projection officielle pour le calibrage.

Ordre retenu (§0) : dette, puis santé ; les rangs suivants restent indicatifs.

| Rang | Module | Poids | Réutilisation | Débat 2027 | Référence | Justification |
|---|---|---|---|---|---|---|
| 1 | **Dette et solde public** (+ « reste des APU ») | ★★★ | ★★ | ★★★ | PSMT, HCFP | Donne un cadre à tout le reste ; petit modèle. |
| 2 | **Santé** | ★★★ | ★★★ | ★★ | LFSS, Ageing Report | Même démarche par âge que le COR. |
| 3 | **Autonomie** | ★ | ★★★ | ★★ | DREES, CNSA | Peu coûteux une fois la santé faite (mêmes données par âge). |
| 4 | **Fiscalité (macro)** | ★★★ | ★ | ★★★ | PLF, CPO | Indispensable au volet « qui paie ? » d'ensemble. |
| 5 | **Chômage** | ★ | ★★ | ★★ | Unédic | Corrige un défaut connu du module retraites. |
| 6 | **Éducation** | ★★ | ★★★ | ★★ | DEPP | Récit du « dividende démographique ». |
| 7 | Famille, défense, minima sociaux, logement, écologie | ★ | variable | variable | variable | Modules plus légers, en fonction du temps. |

**Plan retenu** : commencer par le **socle + module dette** (2-3 semaines), puis la **santé**,
pour disposer avant le premier tour (avril 2027) de trois modules démographiques cohérents
(retraites, santé, autonomie) reliés à la dette. Les autres sujets suivent après l'élection.

## 7. Feuille de route indicative

| Phase | Contenu | Échéance |
|---|---|---|
| A | Extraction du socle, contrat de module, réorganisation sans changement de résultat | Octobre 2026 |
| B | Module dette + page de synthèse + page « Où vont 100 € » | Novembre 2026 |
| C | Module santé (calibrage LFSS / Ageing Report) | Décembre 2026 – janvier 2027 |
| D | Module autonomie | Février 2027 |
| E | Comparateur de programmes multi-sujets (en parallèle de la phase 3 retraites) | Mars 2027 |
| F | Fiscalité macro, chômage, éducation | Après avril 2027 |

## 8. Risques propres à l'extension

- **Dispersion** : dix modules à moitié faits valent moins que trois modules calibrés. Règle : un
  module n'est publié que s'il passe son critère de calibrage.
- **Hétérogénéité des références** : COR, Ageing Report, PSMT n'ont ni les mêmes hypothèses ni la
  même date. Le socle impose un seul jeu d'hypothèses ; chaque module affiche l'écart à sa propre
  référence et l'explique.
- **Doubles comptes** : CSG affectée à plusieurs branches, transferts État → Sécurité sociale,
  contribution de l'État employeur aux pensions. Raisonner en APU consolidées et documenter chaque
  convention (comme pour le solde des retraites).
- **Neutralité** : plus le périmètre s'élargit, plus les choix de présentation (« dépense »,
  « effort », « niche ») sont sensibles. Reprendre le vocabulaire des institutions de référence et
  la charte éditoriale existante.
- **Complexité de l'interface** : préserver la simplicité du parcours Découvrir ; la page
  de synthèse affiche des résultats et renvoie vers les modules, elle n'empile pas leurs curseurs.
- **Données** : la limite « cibles reprises de la presse » du module retraites se reproduira ;
  prévoir dès la phase A un dossier `data/` par source avec date et licence.

## 9. Question restant ouverte : le niveau de détail de la fiscalité

Deux façons de simuler les impôts, à choisir au moment du module fiscalité (pas avant mi-2027) :

| | **Approche d'ensemble (macro)** | **Approche par foyer (microsimulation)** |
|---|---|---|
| Principe | Chaque impôt = assiette × taux effectif ; l'assiette suit le PIB (élasticité). | On applique les barèmes à un échantillon représentatif de foyers. |
| Questions traitées | « Combien rapporte +1 pt de TVA ? », « Quelle hausse de CSG pour financer X ? » | « Qui paie ? Quel décile gagne ou perd ? », effet d'un changement de barème précis. |
| Effort | Faible, même démarche que les autres modules. | Élevé, données individuelles nécessaires. |
| Outils existants | — | OpenFisca (moteur ouvert des règles socio-fiscales françaises), LexImpact (interface de l'Assemblée nationale fondée sur OpenFisca), Ines (INSEE-DREES). |

**Proposition** : commencer par l'approche d'ensemble, suffisante pour la page de synthèse, et
renvoyer vers LexImpact / OpenFisca pour les effets par foyer, sans les refaire. À rediscuter
quand le module sera engagé.

## 10. Sources de référence (par domaine)

- **Ensemble des APU** : INSEE (comptes nationaux des administrations publiques), PSMT et
  rapports d'avancement, Haut Conseil des finances publiques, Cour des comptes, Commission
  européenne (Ageing Report 2024, Debt Sustainability Monitor).
- **Santé, autonomie** : DREES (comptes de la santé, modèle Lieux de vie et autonomie), CNAM
  (« Charges et produits »), CNSA, LFSS.
- **Éducation** : DEPP (« L'état de l'école », projections d'effectifs), Compte de l'éducation.
- **Famille, solidarité, logement** : CNAF, HCFEA, DREES (« Minima sociaux et prestations sociales »).
- **Chômage** : Unédic (prévisions financières), DARES.
- **Fiscalité** : PLF (« Voies et moyens »), Conseil des prélèvements obligatoires, INSEE-DREES
  (modèle Ines), OpenFisca / LexImpact.
- **Défense, écologie** : loi de programmation militaire, SGPE, I4CE, rapport Pisani-Ferry–Mahfouz.
