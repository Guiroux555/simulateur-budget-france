# Simulateur de financement des retraites — Idéation

> Statut : **idéation validée** — décisions de cadrage en §0 ; moteur de calcul v0 disponible
> (voir [`METHODOLOGIE.md`](METHODOLOGIE.md)). Objectif du document : cadrer le produit, le modèle
> économique sous-jacent, les données et un périmètre de MVP avant toute implémentation.
> Les chiffres cités sont des **ordres de grandeur** à recalibrer sur les sources officielles
> (COR, INSEE, DREES, Cour des comptes) lors de la phase données.

---

## 0. Décisions de cadrage (octobre 2026)

| Question | Décision |
|---|---|
| Public prioritaire | **Les deux**, avec deux présentations distinctes sur le même moteur : un parcours guidé grand public (quelques curseurs, explications) et un mode expert (toutes les hypothèses et tous les leviers, export). |
| Niveau de détail | **Système pris dans son ensemble** (tous régimes agrégés, base + complémentaires). |
| Comparateur des programmes 2027 | **Dans un second temps**, après une première version pédagogique. |
| Cadre du projet | **Projet personnel**, avec un objectif de neutralité : aucune orientation politique, mêmes hypothèses pour tous, sources affichées. |

---

## 1. Le problème

À l'approche de la présidentielle 2027, les retraites redeviennent un sujet central : réforme de 2023
(âge légal 62 → 64 ans), suspension votée fin 2025 dans la LFSS 2026, échec du « conclave » des
partenaires sociaux, et des candidats qui proposent des choses très différentes (retour à 60/62 ans,
âge à 65-67 ans, système par points, part de capitalisation, gel ou sous-indexation des pensions…).

Le débat public souffre de trois défauts :

1. **Chiffres isolés et non comparables** : « 15 Md€ de déficit en 2035 », « 0,4 % du PIB »… sans
   les hypothèses (productivité, chômage, fécondité) qui changent tout.
2. **Leviers présentés un par un**, alors que l'équilibre résulte d'un arbitrage entre eux.
3. **Effets générationnels invisibles** : qui paie, qui reçoit, à quelle génération ?

**Proposition de valeur** : un simulateur web, gratuit, transparent et politiquement neutre, qui
permet à chacun de *régler lui-même* hypothèses et leviers et de voir immédiatement l'effet sur le
solde du système, le niveau de vie relatif des retraités et l'effort demandé à chaque génération.

## 2. Publics cibles

| Public | Besoin principal | Mode d'usage |
|---|---|---|
| Citoyen·ne curieux·se | Comprendre « pourquoi il y a un déficit » et ce que changent les propositions | Parcours guidé, 3 curseurs, langage simple |
| Journaliste / fact-checker | Vérifier un chiffre de candidat, sous quelles hypothèses il tient | Comparateur de programmes, lien permanent partageable |
| Étudiant·e / enseignant·e | Support pédagogique sur l'équation d'équilibre | Mode « explique-moi », schémas |
| Militant·e / équipe de campagne | Tester des variantes chiffrées | Mode expert, export CSV |
| Économiste | Auditer le modèle | Code et données ouverts, notes de méthode |

## 3. Le cœur du modèle : l'équation d'équilibre

Tout le produit s'articule autour de l'identité comptable utilisée par le COR :

```
Solde = Cotisations − Pensions

Équilibre  ⇔  taux de prélèvement × (nb cotisants / nb retraités) = pension moyenne / revenu d'activité moyen
              \_______________/   \___________________________/   \_________________________________/
                 levier 1                 levier 2 (âge,                     levier 3 (indexation,
              (cotisations,              durée, emploi,                     règles de calcul,
               CSG, impôts)               démographie)                       niveau des pensions)
```

Avec la croissance comme **paramètre caché** : comme les pensions sont indexées sur les prix et les
salaires sur la productivité, une croissance plus forte fait baisser la pension relative et améliore
le solde (et inversement). C'est pourquoi les projections du COR divergent tant selon l'hypothèse
de productivité.

**Idée produit clé — le « triangle d'équilibre »** : l'utilisateur fixe deux leviers, le simulateur
calcule le troisième nécessaire pour atteindre un solde cible (0 %, ou un déficit toléré). Exemple :
« Si je veux revenir à 62 ans et ne pas baisser les pensions, de combien faut-il augmenter les
cotisations en 2035 ? en 2050 ? ».

### Ordres de grandeur à afficher (à recalibrer)

- Dépenses de retraite : ≈ 14 % du PIB (≈ 400 Md€/an), ≈ 17 M de retraités.
- Ratio cotisants / retraités : ≈ 1,7 aujourd'hui, ≈ 1,2–1,3 vers 2070 selon le COR.
- Déficit : ≈ 0,2 % du PIB en 2025, se creusant ensuite (COR 2025, Cour des comptes 2025).
- Sensibilités indicatives :
  - +1 pt de taux de cotisation ≈ +10 Md€/an ;
  - 1 pt de sous-indexation pendant un an ≈ 3,5–4 Md€ d'économie pérenne ;
  - +1 an d'âge effectif de départ ≈ 8–10 Md€/an à maturité (net des effets chômage/invalidité).

## 4. Hypothèses réglables (« le monde »)

Regroupées en un panneau, avec des **préréglages COR** (scénarios de productivité 0,7 % / 1,0 % / 1,3 %)
et un préréglage « personnalisé ».

| Domaine | Variable | Plage indicative | Source de référence |
|---|---|---|---|
| Démographie | Fécondité (ICF) | 1,4 – 2,0 | INSEE (≈ 1,6 en 2024, en baisse) |
| | Espérance de vie à 60 ans | scénarios bas / central / haut | INSEE projections |
| | Solde migratoire | 0 – +150 k/an | INSEE (central ≈ +70 k) |
| Économie | Gains de productivité | 0,4 % – 1,6 % | COR |
| | Taux de chômage de long terme | 4,5 % – 10 % | COR (central ≈ 7 %) |
| | Inflation | 1 % – 3 % | BCE / Banque de France |
| | Taux d'emploi des seniors (55-64) | | DARES |
| Marchés (capitalisation) | Rendement réel des actifs | 0 % – 5 % | historique, avec volatilité |

Afficher en permanence l'**incertitude** : graphes en éventail (« fan charts ») plutôt qu'une courbe
unique, pour éviter la fausse précision.

## 5. Leviers de politique publique (« les solutions »)

Chaque levier = un module avec paramètres, calendrier de montée en charge et effets de bord explicites.

1. **Âge légal d'ouverture des droits** (60 → 67 ans) et vitesse de transition par génération.
2. **Durée d'assurance requise** pour le taux plein (40 → 45 ans / 160 → 180 trimestres).
3. **Âge d'annulation de la décote** (67 ans aujourd'hui).
4. **Carrières longues / pénibilité** : dérogations et leur coût.
5. **Taux de cotisation** (salariés / employeurs) et **assiette** (élargissement aux primes,
   intéressement, revenus du capital, « cotisation sur les robots »…).
6. **Fiscalisation** : CSG, TVA sociale, transferts du budget de l'État.
7. **Indexation des pensions** : sur les prix, sur les salaires, prix − x pt, gel (« année blanche »),
   indexation différenciée selon le montant.
8. **Règles de calcul** : 25 meilleures années, salaire de référence, système par points / comptes
   notionnels (réforme systémique).
9. **Capitalisation** : part obligatoire ou facultative, taux de cotisation dédié, fonds souverain
   (type FRR / AP-fonden suédois), utilisation des réserves (FRR, Agirc-Arrco).
   → **Point d'attention** : modéliser le *coût de transition* (une génération paie à la fois les
   retraites en cours en répartition et sa propre épargne) et le risque de marché.
10. **Emploi** : effet d'une hausse du taux d'emploi des seniors, des femmes, des jeunes.
11. **Mesures de solidarité** : minimum contributif, pension minimale à X % du SMIC.
12. **Mesures annexes** : régimes spéciaux, cumul emploi-retraite, réversion.

Chaque levier affiche : coût / gain annuel, horizon de montée en charge, générations concernées,
effets de bord (ex. report d'âge → hausse des dépenses chômage/RSA/invalidité).

## 6. Sorties et visualisations

**Indicateurs principaux (tableau de bord)**
- Solde du système en Md€ et en % du PIB, 2025 → 2070.
- Dette cumulée (ou réserves cumulées) du système.
- Dépenses de retraite en % du PIB.
- Pension moyenne relative au revenu d'activité moyen (niveau de vie des retraités).
- Âge moyen effectif de départ, durée moyenne passée à la retraite.
- Ratio démographique cotisants / retraités.

**Vues spécifiques**
- **Pyramide des âges animée** (2025 → 2070) avec la frontière actifs / retraités qui bouge selon
  l'âge légal choisi.
- **Vue générationnelle** : pour les générations 1960, 1970… 2000 — âge de départ, durée de
  retraite, taux de remplacement, ratio « pensions perçues / cotisations versées ». Rend visibles
  les transferts entre générations.
- **Cas-types** : « Je suis né·e en 1985, cadre / ouvrier·e / carrière hachée » → âge de départ et
  pension estimée selon chaque scénario (sans se substituer à info-retraite.fr).
- **Cascade (waterfall)** : décomposition de l'écart à l'équilibre par levier.
- **Comparateur de programmes** : 2 à 4 scénarios côte à côte, mêmes hypothèses de monde.

## 7. Comparateur de programmes 2027

Une bibliothèque de scénarios « programmes » traduits en paramètres du modèle.

**Règles de neutralité (non négociables)**
- Chaque scénario cite sa **source datée** (programme officiel, interview, proposition de loi).
- Les traductions en paramètres sont **documentées** ; ce qui n'est pas précisé par le candidat est
  signalé comme « hypothèse du simulateur » et réglable.
- Mêmes hypothèses macro pour tous ; l'utilisateur peut tester « et si la croissance promise par
  le candidat se réalisait ».
- Pas de note, pas de classement, pas de vocabulaire évaluatif : on montre les conséquences chiffrées.
- Droit de réponse : un formulaire permet aux équipes de campagne de signaler une mauvaise traduction.
- Familles de propositions à couvrir au minimum : statu quo / suspension, retour à 60-62 ans,
  âge à 65-67 ans, système universel par points, introduction d'une part de capitalisation,
  financement par de nouvelles recettes, sous-indexation.

Les programmes n'étant pas finalisés, la bibliothèque sera alimentée progressivement ; il faut un
format de scénario (JSON versionné) simple à contribuer.

## 8. Architecture du modèle (proposition)

Deux niveaux, partageant les mêmes données :

**Niveau 1 — Modèle macro « COR simplifié »** (MVP)
- Projection annuelle 2025-2070 de : population par âge simple (0-105) et sexe via un modèle
  cohorte-composante (fécondité, mortalité, migrations) ; actifs occupés = population × taux
  d'activité par âge × (1 − chômage) ; retraités = fonction de l'âge légal/durée ; pension moyenne
  = stock indexé + flux de nouveaux retraités.
- Calcul instantané côté navigateur (< 50 ms) → curseurs réactifs.
- Calibrage : reproduire les trajectoires du rapport annuel du COR à ± 0,1 pt de PIB sur les
  scénarios de référence. **C'est le critère d'acceptation du modèle.**

**Niveau 2 — Cas-types et générations** (V2)
- Carrières stylisées par génération pour calculer taux de remplacement et âge de départ.
- Pas de microsimulation individuelle (hors périmètre ; cf. modèles Destinie/INSEE, Trajectoire/DREES).

**Module capitalisation** : accumulation d'un fonds avec rendement aléatoire (Monte-Carlo, quelques
centaines de tirages en Web Worker), conversion en rente, coût de transition.

## 9. Choix techniques envisagés

- **Front** : TypeScript + Vite + React (ou Svelte), application 100 % statique (hébergeable sur
  GitHub Pages), pas de backend → pas de données personnelles collectées.
- **Moteur de calcul** : package TS pur, sans dépendance UI, testé unitairement (Vitest), avec
  tests de non-régression contre les chiffres COR.
- **Graphiques** : Observable Plot ou ECharts (fan charts, pyramide animée, waterfall).
- **Données** : fichiers JSON/CSV versionnés dans le dépôt, chaque série avec source, date,
  licence ; script de mise à jour depuis INSEE (API Melodi / BDM) et annexes du COR.
- **Partage** : état complet du scénario encodé dans l'URL (permalien), export CSV / PNG.
- **Accessibilité** : RGAA, données des graphes disponibles en tableau, FR d'abord, EN ensuite.
- **Licence** : code open source (MIT / EUPL), données sous Licence Ouverte Etalab.

Le dépôt s'appelle `simulateur-budget-france` : le module retraites peut être le premier d'un
simulateur budgétaire plus large (santé, dette, fiscalité) partageant le même moteur macro.

## 10. Périmètre MVP proposé

**Inclus**
1. Modèle niveau 1 calibré sur le rapport COR le plus récent (régimes agrégés, tous régimes).
2. Hypothèses : productivité, chômage, fécondité, espérance de vie, solde migratoire (+ préréglages COR).
3. Leviers : âge légal, durée de cotisation, taux de cotisation, indexation, apport de recettes
   externes, part de capitalisation (version déterministe).
4. Sorties : solde % PIB, dépenses % PIB, pension relative, ratio démographique, pyramide des âges.
5. Mode « triangle d'équilibre » (résolution du levier manquant).
6. Permalien de scénario.
7. 4-5 scénarios-types documentés (statu quo, réforme 2023 complète, retour à 62 ans,
   capitalisation partielle, sous-indexation).

Deux présentations sur le même moteur :
- **Grand public** : parcours en 3 étapes (« comprendre le déséquilibre » → « choisir mes leviers »
  → « voir qui paie »), 4-5 curseurs, vocabulaire simple, chaque chiffre expliqué.
- **Expert** : tous les paramètres, trajectoires année par année, export CSV, lien permanent.

**Exclu du MVP** : cas-types individuels, Monte-Carlo, comparateur des candidats (V2),
détail par régime (hors périmètre : le système est traité dans son ensemble).

## 11. Feuille de route indicative

| Phase | Contenu | Échéance indicative |
|---|---|---|
| 0 | Collecte données + note de méthode | T4 2026 — **v0 faite** (données officielles à importer) |
| 1 | Moteur TS calibré COR + tests | T4 2026 — **v0 faite** |
| 2 | MVP web (§10) | Janvier 2027 — **v0 faite** (deux présentations, lien permanent) |
| 3 | Comparateur de programmes, à mesure de leur publication | Février – mars 2027 |
| 4 | Vue générationnelle, cas-types, Monte-Carlo capitalisation | Mars 2027 |
| 5 | Relecture par des économistes indépendants, lancement public | Avant le 1er tour (avril 2027) |

## 12. Risques et questions ouvertes

- **Crédibilité** : un modèle trop simplifié peut produire des chiffres contestés → calibrage COR
  publié, comparaison systématique avec les sources officielles, relecture externe.
- **Neutralité perçue** : la façon de présenter (« déficit », « effort ») est politique → charte
  éditoriale, vocabulaire du COR, relecture pluraliste.
- **Périmètre comptable** : le « déficit » dépend de la convention retenue (la Cour des comptes et
  le COR, selon les conventions sur la contribution de l'État employeur, n'arrivent pas au même
  chiffre) → proposer les deux conventions et expliquer l'écart.
- **Effets de bouclage** non modélisés au MVP (report d'âge → emploi → croissance) → les afficher
  comme hypothèses réglables plutôt que de les ignorer.
- **Mise à jour** : rapport COR de juin 2027 sortira après l'élection ; prévoir un rafraîchissement
  rapide des données.
- Questions de cadrage : tranchées, voir §0. Reste ouvert : hébergement et nom de domaine.

## 13. Sources de référence

- Conseil d'orientation des retraites — rapports annuels (juin) et fiches/annexes de données.
- INSEE — projections de population, bilans démographiques annuels, comptes nationaux.
- DREES — « Les retraités et les retraites » (édition annuelle), modèle Trajectoire.
- Cour des comptes — rapport sur la situation financière des retraites (février 2025).
- Direction de la Sécurité sociale — PLFSS / LFSS, annexes « retraites ».
- Comparaisons internationales : OCDE *Pensions at a Glance* ; système suédois de comptes notionnels.
