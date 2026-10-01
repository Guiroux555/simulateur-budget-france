---
title: Étendre le contrat de module avec un écart de PIB en volume
date: 2026-10-01
priority: high
---

Décision dans `.planning/notes/branchement-modules-synthese.md`. Préalable à la page de synthèse (phase B).

- `src/socle/module.ts` : ajouter à `AnneeResume` un champ d'écart de PIB en volume par rapport à la
  référence du module (par exemple `ecartPibVolumePct`, fraction : 0.001 = +0,1 %). Le documenter
  comme **effet mécanique seulement** (actifs supplémentaires × productivité du socle, sans élasticité).
- Module retraites (`src/modules/retraites/module.ts`, `resume()`) :
  - écart de PIB = PIB(scénario) / PIB(référence) − 1, année par année. Le moteur le calcule déjà
    (`engine/modele.ts:141`, `pib = masse / partMasse`), rien ne vaut 0 par défaut ;
  - écart de solde exprimé en **% du PIB de la référence** : (solde en € du scénario − solde en €
    de la référence) / PIB de la référence. Aujourd'hui c'est une différence de ratios, chacun sur
    son propre PIB, ce qui mélange effet budgétaire et effet de dénominateur ;
  - documenter le changement de définition de `ecartSoldeReferencePctPib` dans `src/socle/module.ts`.
- `tests/module.test.ts` : vérifier la présence du champ, sa finitude sur toutes les années, et que
  le scénario de référence donne des écarts nuls (solde et PIB), donc une synthèse au repos égale
  à la trajectoire de la Commission.
- Ajouter un test : un report de l'âge légal donne un écart de PIB positif.
- Vérifier que `npm run calibration` et `npm run verification` donnent des sorties inchangées.

## Fait (2026-10-01)

- `src/socle/module.ts` : champ `ecartPibVolumePct` ajouté ; définition de `ecartSoldeReferencePctPib`
  documentée (part du PIB de la référence).
- `src/modules/retraites/module.ts` : écart de solde = (solde € scénario − solde € référence) / PIB
  de la référence ; écart de PIB = PIB(scénario) / PIB(référence) − 1.
- `tests/module.test.ts` : écarts nuls au repos ; nouveau test sur un report de l'âge légal à 66 ans.
- `npm run calibration` et `npm run verification` : sorties identiques.

Ordres de grandeur (âge légal 66 ans en 2035) : PIB +0,42 % en 2030, +1,33 % en 2035, +2,08 % en
2070 ; écart de solde +0,22 pt en 2030, +0,67 pt en 2035, +0,46 pt en 2070 (contre +0,50 pt avec
l'ancienne définition, qui mélangeait l'effet de dénominateur).
