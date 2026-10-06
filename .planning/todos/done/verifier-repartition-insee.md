---
title: Relire sur l'Insee les chiffres de la page « Où vont 100 € »
date: 2026-10-06
priority: high
---

Les chiffres de `data/repartition/apu-france.json` viennent d'extraits de recherche recoupés (Insee,
FIPECO) : les pages elles-mêmes étaient inaccessibles depuis l'environnement de développement.
Tant qu'ils ne sont pas relus, la page affiche « Chiffres à vérifier » (`statut`).

À relire (ou à fournir sous forme de fichier, comme pour le DSM) :

- Insee, comptes de la Nation 2025 (https://www.insee.fr/fr/statistiques/8997691) : dépenses
  1 714,1 Md€, recettes 1 561,6 Md€, dette 3 460,5 Md€, PIB 2 991,1 Md€, prélèvements obligatoires 1 305 Md€.
- ~~Insee, dépenses par fonction 2024~~ **Fait (2026-10-06)** : vérifié sur le fichier de données de
  l'Insee Première n° 2093 (figure 2a, fourni par l'utilisateur) : 10 fonctions, total 1 672 Md€,
  intérêts 60 Md€ (dans les services généraux, 181 Md€). Le fichier ne détaille pas les sous-fonctions.
- Passer à la répartition 2025, et obtenir la sous-fonction « vieillesse » (10.2) et « survivants »
  (10.3) : jeu de données Insee « dépenses des administrations publiques ventilées par fonction
  (COFOG) », disponible sur le catalogue open data (https://catalogue-donnees.insee.fr/fr/catalogue/recherche),
  inaccessible depuis l'environnement de développement. En attendant, la part des retraites
  (≈ 26 € sur 100, FIPECO) n'est donnée qu'en précision, pas dans le graphique.
- Détail des recettes 2025 (FIPECO seul, sauf TVA et total) : cotisations sociales 443, CSG/CRDS et
  autres prélèvements sociaux 180, impôts locaux 190 Md€. Source de référence possible : tableaux
  Insee des impôts et cotisations (https://www.insee.fr/fr/statistiques/2381408) ou annexe « Voies
  et moyens » / rapport sur les prélèvements obligatoires du PLF.

Une fois relu : passer `statut` à « vérifié » et mettre à jour les sources.

## Résolu (2026-10-06, session locale)

Relu sur les données ouvertes, accessibles depuis le poste local (script reproductible :
`npm run verification:repartition`, 24 contrôles, tous à 0,1 Md€ près) :

- Grandeurs d'ensemble 2025 : Eurostat gov_10a_main, gov_10dd_edpt1, nama_10_gdp (données Insee) —
  identiques aux chiffres déjà présents ; `statut` passé à « vérifié ».
- Dépenses 2024 : Eurostat gov_10a_exp (COFOG, données Insee), au dixième de milliard. Les retraites
  ont maintenant leur propre poste : vieillesse 10.2 (392,0) + survivants 10.3 (40,6) = 432,6 Md€,
  soit 25,9 € sur 100 (le « ≈ 26 € » de FIPECO est confirmé). La COFOG 2025 n'est pas encore
  publiée (attendue début 2027).
- Recettes 2025 : refondues sur les catégories de la comptabilité nationale (Insee, API Melodi,
  DD_CNA_APU) au lieu du détail FIPECO : cotisations D61 498,7 ; TVA D211 208,8 ; IR + CSG/CRDS
  D51A 286,8 ; IS D51O 96,5 ; autres impôts 283,2 (solde des impôts et cotisations, 1 374,1) ;
  autres recettes 187,6. Le poste « impôts locaux » disparaît (pas une catégorie des comptes).

Limite constatée : dans Melodi, les cellules COFOG de DD_CNA_APU sont vides et `OTE`/`OTR` y sont
non consolidés (2 256,9 / 2 104,4 Md€ en 2025) ; d'où le recours à Eurostat pour la COFOG et les totaux.