# Note de méthode — moteur de projection v0

Le moteur (`src/engine/`) projette chaque année, de 2025 à 2070, l'équilibre financier du
système de retraite français **pris dans son ensemble** (tous régimes, base + complémentaires).
Il est volontairement simple, lisible et rapide (calcul complet en quelques millisecondes dans le
navigateur), et **calibré pour reproduire le scénario de référence du COR (rapport de juin 2026)**.
Il n'a pas vocation à remplacer les modèles officiels (Destinie, Trajectoire, Prisme), mais à
rendre leurs mécanismes manipulables.

## 1. Chaîne de calcul

| Étape | Méthode | Fichier |
|---|---|---|
| Démographie | Projection par composantes, âge simple 0-105 ans, sexes confondus. Mortalité de Gompertz-Makeham ajustée sur l'espérance de vie visée ; fécondité = ICF × calendrier gaussien (âge moyen 31 ans) ; solde migratoire réparti selon un profil par âge centré sur 26 ans. | `demographie.ts` |
| Pyramide 2025 | **Provisoire** : reconstruite à partir de l'historique des naissances, d'une mortalité historique et des migrations, puis recalée sur les effectifs 0-19 / 20-64 / 65+ (voir §4). | `donnees/population2025.ts` |
| Départs à la retraite | Part des retraités à chaque âge = loi logistique autour de l'âge moyen effectif de départ **de la génération** (un relèvement n'affecte que les générations qui n'ont pas encore liquidé). | `modele.ts` |
| Âge effectif | Âge légal de référence (suspension LFSS 2026 puis reprise du calendrier décalé d'un trimestre) + écart calibré ; un an d'âge légal en plus → +0,6 an d'âge effectif ; un an de durée requise en plus → +0,5 an. | `modele.ts`, `reference.ts` |
| Cotisants | Non-retraités de 15 ans et plus × taux d'activité par âge × (1 − chômage). | `modele.ts` |
| Pensions | Suivies par âge. Le stock est revalorisé sur les prix (± mesures : gel, sous-indexation). Les nouveaux retraités liquident une pension proportionnelle au revenu d'activité moyen d'il y a 14 ans (salaires portés au compte revalorisés sur les prix), avec une érosion annuelle de 0,62 % qui résume les règles indexées sur les prix. | `modele.ts` |
| PIB | Proportionnel à la masse des revenus d'activité (part calée en 2025). | `modele.ts` |
| Ressources | Trajectoire du COR en % du PIB à législation inchangée + leviers (hausse de taux, recettes externes, revenus d'un fonds de réserve). | `reference.ts` |
| Dette | Cumul des déficits, rémunéré à 1 % réel. | `modele.ts` |
| Équilibre | Pour chaque année, valeur d'un seul levier (taux, pension relative, âge) annulant le solde, comme les abaques du COR. | `equilibre.ts` |

### Pourquoi la croissance compte

Les pensions déjà liquidées suivent les prix, les revenus d'activité suivent la productivité :
plus la productivité progresse, plus la pension relative baisse et plus le solde s'améliore.
Le modèle reproduit ce mécanisme (cf. variantes 0,4 % / 0,7 % / 1,0 % / 1,3 %).

### Capitalisation (trois modes)

- **Additionnel** : cotisation supplémentaire placée en comptes individuels ; rente versée en plus de la
  pension par répartition. Neutre pour le solde de la répartition, améliore le niveau de vie des
  retraités à maturité, mais représente un effort supplémentaire des actifs.
- **Substitutif** : une part des cotisations est détournée vers les comptes ; les droits en
  répartition des nouvelles générations baissent à proportion. Fait apparaître le **coût de
  transition** (déficit accru pendant plusieurs décennies).
- **Fonds de réserve** (type FRR) : cotisation dédiée, capital conservé, rendement affecté au
  financement de la répartition.

Rendement réel déterministe à ce stade (Monte-Carlo prévu en V2), maturité de 40 ans.

## 2. Calibrage (scénario de référence, `npm run calibration`)

| Indicateur | Année | COR 2026 | Modèle | Écart |
|---|---|---|---|---|
| Dépenses / PIB | 2025 | 14,1 % | 14,1 % | 0,00 pt |
| Dépenses / PIB | 2045 | 14,2 % | 14,2 % | −0,04 pt |
| Dépenses / PIB | 2070 | 15,3 % | 15,2 % | −0,06 pt |
| Solde / PIB | 2030 | −0,2 % | −0,3 % | −0,09 pt |
| Solde / PIB | 2045 | −0,9 % | −0,9 % | +0,04 pt |
| Solde / PIB | 2070 | −2,4 % | −2,3 % | +0,06 pt |
| Pension relative | 2025 | 54,6 % | 54,6 % | 0,0 pt |
| Pension relative | 2070 | 45,3 % | 42,4 % | **−2,9 pt** |
| 20-64 ans / 65 ans et + | 2070 | 1,62 | 1,63 | +0,01 |
| Âge de départ d'équilibre | 2030 / 2045 / 2070 | 64,2 / 65,6 / 67,6 | 63,8 / 65,5 / 67,2 | ≤ 0,4 an |
| Hausse de prélèvement d'équilibre | 2070 | 5,6 pts | 5,4 pts | −0,2 pt |

Les tests (`npm test`) verrouillent ces écarts pour détecter toute dérive.

## 3. Limites connues (à traiter avant publication)

1. **Pension relative 2070 trop basse de ~3 pts** : le modèle compte un peu moins de retraités par
   cotisant que le COR en fin de période et compense par une pension plus basse. Effet : les
   leviers jouant sur le niveau des pensions sont légèrement sous-estimés en fin de période.
2. **Espérance de vie 2070 = 91 ans** : paramètre de calage. Conséquence visible sur le graphique
   « Âge de départ et espérance de vie » : l'espérance de vie à 60 ans passe de 25,7 ans en 2025
   (conforme à l'INSEE) à ≈ 32,7 ans en 2070, contre ≈ 30 ans dans les projections de l'INSEE. La mortalité simplifiée (sexes
   confondus) ne reproduit le vieillissement du COR qu'avec une espérance de vie supérieure à celle
   des projections INSEE (≈ 88-89 ans). À corriger avec les tables INSEE par sexe.
3. **Pyramide 2025 reconstituée**, non officielle.
4. **Cibles reprises de la presse** (le site du COR n'était pas accessible depuis l'environnement de
   développement) : à vérifier sur le rapport et ses annexes chiffrées.
5. **Pas d'effets de bouclage** : un report d'âge ne génère pas ici de dépenses supplémentaires de
   chômage, d'invalidité ou de minima sociaux ; la croissance ne réagit pas aux réformes.
6. **Conventions comptables** : seule la convention du rapport COR (ressources en % du PIB) est
   modélisée ; la variante « Cour des comptes » reste à ajouter.
7. Les sensibilités de transmission (âge légal → âge effectif = 0,6 ; durée → 0,5 ; gain de pension
   de 3 % par année de report) sont des hypothèses à documenter par la littérature (DREES, COR).

## 4. Données et sources

- `data/cor-2026-reference.json` : hypothèses et cibles du scénario de référence COR 2026, avec sources.
- `src/engine/donnees/population2025.ts` : pyramide provisoire et cibles de recalage.
- Prochaine étape « données » : importer la pyramide INSEE au 1er janvier 2025 par sexe et âge
  détaillé, les quotients de mortalité projetés de l'INSEE et les séries détaillées du COR.

## 5. Historique 1985-2024 et réformes

`src/engine/donnees/historique.ts` contient, pour la mise en perspective, des **points d'ancrage
approximatifs** (dépenses et solde en % du PIB, cotisants par retraité, âge moyen conjoncturel de
départ, espérance de vie à 60 ans, âge légal) et la liste des réformes depuis 1982 (retraite à
60 ans, indexation sur les prix, Balladur, Juppé, FRR, Fillon, régimes spéciaux, Woerth, Touraine,
Agirc-Arrco, 2023, suspension LFSS 2026). Les points de 1985 et 1990 sont les plus incertains ; la
série du solde ne commence qu'en 2002 (début de la série COR). Les graphiques relient ces points ;
ils ne sont pas utilisés par le modèle. À remplacer par les séries annuelles officielles (base de
données du rapport annuel du COR, Panorama DREES « Les retraités et les retraites »). Les
définitions diffèrent légèrement de celles du modèle, d'où de petites marches entre 2024 et 2025.

## 6. Sensibilité aux hypothèses

L'interface simule le scénario choisi sous plusieurs hypothèses, toutes choses égales par ailleurs
(`src/app/sensibilite.ts`) :

| Hypothèse | Valeurs testées | Référence COR |
|---|---|---|
| Productivité (long terme) | 0,4 / 0,7 / 1,0 / 1,3 %/an | 0,7 % |
| Chômage (à partir de 2030) | 4,5 / 7 / 10 % | 7 % |
| Natalité (à partir de 2028) | 1,30 / 1,45 / 1,60 / 1,80 enfant par femme | 1,45 |

La « fourchette » du graphique principal combine les valeurs extrêmes les plus défavorables
(0,4 %, 10 %, 1,30) et les plus favorables (1,3 %, 4,5 %, 1,80). Ordres de grandeur dans le
scénario de référence : l'écart de solde en 2070 entre hypothèses extrêmes atteint ≈ 3,7 pts de PIB
pour la productivité, ≈ 2,2 pts pour la natalité et ≈ 0,9 pt pour le chômage.

### Pyramides 1985-2024

Les pyramides passées sont **reconstituées par rétro-projection** de la pyramide 2025 : chaque
génération est « rajeunie » d'un an en retirant les migrants et en réintégrant les décès de
l'année (mortalité et migrations historiques approximatives). Les âges élevés, dont la génération
a disparu avant 2025, sont raccordés à une projection historique démarrant en 1880. Retraités et
actifs en emploi y sont répartis selon l'âge moyen de départ observé (DREES) et le chômage observé,
puis le nombre d'actifs est recalé sur le rapport cotisants / retraités observé. Population 1985
reconstituée : 57,8 M (INSEE : ≈ 56,5 M), dont 12,5 % de 65 ans et plus. À remplacer par les
pyramides INSEE annuelles.

La croissance de la productivité observée (moyenne glissante sur 5 ans, pour lisser 2009 et 2020)
est affichée sous le solde, dans un panneau aligné sur le même axe des années (pas de double axe :
les unités diffèrent). Elle passe d'environ 2 %/an au milieu des années 1980 à environ 0 sur
2019-2024 ; l'hypothèse de référence du COR (0,7 %/an à long terme) suppose donc un redressement.

**Source de la projection de productivité.** L'hypothèse de référence est celle du COR (0,7 %/an à
long terme, scénario de référence des rapports 2025 et 2026, jugée la plus réaliste par la Cour des
comptes en février 2025). La transition 2025-2032 (0,4 % → 0,7 %) est une simplification du
simulateur, calée sur les soldes publiés ; le COR situe l'atteinte de ce rythme vers 2040. Une
trajectoire alternative, **« tendance observée 2010-2024 »**, part du niveau observé en 2024
(≈ 0 %) et rejoint en 2030 la moyenne 2010-2024 (≈ 0,5 %/an) ; elle prolonge le passé récent
(perte de productivité post-Covid d'environ 6 % par rapport à la tendance 2010-2019 selon la Banque
de France, dont 4 points jugés durables). À l'inverse, la Commission européenne (Ageing Report 2024)
retient une hypothèse plus favorable, de l'ordre de 1,2 %/an en moyenne jusqu'en 2070.

**Âge sans incapacité.** Le graphique « Âge de départ et espérance de vie » ajoute l'âge atteint
sans incapacité par les personnes de 65 ans (65 + espérance de vie sans incapacité à 65 ans,
DREES, moyenne simple femmes-hommes : ≈ 9,4 ans en 2008, 11,2 ans en 2024). La projection suppose
constante la part des années restant à vivre à 65 ans passées sans incapacité (≈ 52 % en 2023) :
c'est une hypothèse illustrative ; elle hérite de la surestimation de l'espérance de vie en fin de
période (cf. §3). Les années de retraite « sans incapacité » sont mesurées depuis l'âge de départ.

Le solde avant 2002 (date de début de la série du COR) et la pension relative historique sont des
ordres de grandeur. La dette cumulée n'a pas d'historique : elle est par construction cumulée à
partir de 2025.

## 7. Les régimes

La section « Les régimes » (`src/engine/donnees/regimes.ts`) décrit les grands régimes (régime
général, Agirc-Arrco, fonctionnaires de l'État, CNRACL, régimes spéciaux, exploitants agricoles,
professions libérales, autres complémentaires) : dépenses 2024, solde, cotisants par retraité,
subventions de l'État, règles de calcul, avantages et contreparties. Les montants sont des ordres
de grandeur 2024 (Sénat PLF 2025-2026, Cour des comptes, COR, DSS, caisses) ; certains sont estimés
par différence pour retrouver les totaux (dépenses ≈ 400 Md€, solde −1,7 Md€). Deux présentations
du solde : comptable (convention du COR, subventions comprises) et hors subventions d'équilibre
(≈ 5,9 Md€ en 2025 pour les régimes spéciaux). La contribution de l'État employeur aux pensions
des fonctionnaires est traitée comme une cotisation d'employeur. Le graphique « Dépenses et retraités par régime » compare la part de chaque régime dans les
dépenses et la part des retraités de droit direct qui en perçoivent une pension (DREES, fin 2023 :
17,2 M au total, 14,2 M à la CNAV, 12,2 M à l'Agirc-Arrco, 1,2 M à la MSA non-salariés ; fonction
publique et régimes spéciaux répartis par estimation). Les fiches indiquent le montant moyen versé
par le régime à chacun de ses retraités (dépenses / retraités, réversions comprises) : c'est la part
versée par ce régime, pas la pension totale des personnes. Cette section est descriptive :
le modèle de projection reste agrégé (tous régimes).
