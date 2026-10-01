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
| Cotisants | Non-retraités × taux d'activité par âge × (1 − chômage). | `modele.ts` |
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
| Dépenses / PIB | 2045 | 14,2 % | 14,2 % | +0,04 pt |
| Dépenses / PIB | 2070 | 15,3 % | 15,4 % | +0,06 pt |
| Solde / PIB | 2030 | −0,2 % | −0,3 % | −0,13 pt |
| Solde / PIB | 2045 | −0,9 % | −0,9 % | −0,04 pt |
| Solde / PIB | 2070 | −2,4 % | −2,5 % | −0,06 pt |
| Pension relative | 2025 | 54,6 % | 54,6 % | 0,0 pt |
| Pension relative | 2070 | 45,3 % | 42,4 % | **−2,9 pt** |
| 20-64 ans / 65 ans et + | 2070 | 1,62 | 1,63 | +0,01 |
| Âge de départ d'équilibre | 2030 / 2045 / 2070 | 64,2 / 65,6 / 67,6 | 63,9 / 65,6 / 67,4 | ≤ 0,3 an |
| Hausse de prélèvement d'équilibre | 2070 | 5,6 pts | 5,5 pts | −0,1 pt |

Les tests (`npm test`) verrouillent ces écarts pour détecter toute dérive.

## 3. Limites connues (à traiter avant publication)

1. **Pension relative 2070 trop basse de ~3 pts** : le modèle compte un peu moins de retraités par
   cotisant que le COR en fin de période et compense par une pension plus basse. Effet : les
   leviers jouant sur le niveau des pensions sont légèrement sous-estimés en fin de période.
2. **Espérance de vie 2070 = 91 ans** : paramètre de calage. La mortalité simplifiée (sexes
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

## 5. Historique 1995-2024 et réformes

`src/engine/donnees/historique.ts` contient, pour la mise en perspective, des **points d'ancrage
approximatifs** (dépenses et solde en % du PIB, cotisants par retraité, âge moyen conjoncturel de
départ, âge légal) et la liste des réformes depuis 1993 (Balladur, Juppé, Fillon, régimes spéciaux,
Woerth, Touraine, Agirc-Arrco, 2023, suspension LFSS 2026). Les graphiques relient ces points ;
ils ne sont pas utilisés par le modèle. À remplacer par les séries annuelles officielles (base de
données du rapport annuel du COR, Panorama DREES « Les retraités et les retraites »). Les
définitions diffèrent légèrement de celles du modèle, d'où de petites marches entre 2024 et 2025.
