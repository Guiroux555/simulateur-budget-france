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
- Insee, dépenses par fonction 2024 (https://www.insee.fr/fr/statistiques/8735252) : les 10 fonctions,
  total 1 672 Md€, intérêts 60 Md€. Vérifier si la répartition 2025 est parue
  (https://www.insee.fr/fr/statistiques/8988847) et, si oui, passer à 2025.
- Part « vieillesse-survie » de la protection sociale (433 Md€ = 259 € pour 1 000 €, FIPECO seul) :
  à remplacer par la sous-fonction COFOG publiée par l'Insee.
- Détail des recettes 2025 (FIPECO seul, sauf TVA et total) : cotisations sociales 443, CSG/CRDS et
  autres prélèvements sociaux 180, impôts locaux 190 Md€. Source de référence possible : tableaux
  Insee des impôts et cotisations (https://www.insee.fr/fr/statistiques/2381408) ou annexe « Voies
  et moyens » / rapport sur les prélèvements obligatoires du PLF.

Une fois relu : passer `statut` à « vérifié » et mettre à jour les sources.
