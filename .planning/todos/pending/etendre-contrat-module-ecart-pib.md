---
title: Étendre le contrat de module avec un écart de PIB en volume
date: 2026-10-01
priority: high
---

Décision dans `.planning/notes/branchement-modules-synthese.md`. Préalable à la page de synthèse (phase B).

- `src/socle/module.ts` : ajouter à `AnneeResume` un champ d'écart de PIB en volume par rapport à la
  référence du module (par exemple `ecartPibVolumePct`, fraction : 0.001 = +0,1 %). Le documenter
  comme **effet mécanique seulement** (actifs supplémentaires × productivité du socle, sans élasticité).
- Module retraites : renvoyer 0 tant que l'effet emploi n'est pas branché (voir la question
  « Effet mécanique du report d'âge sur l'emploi » de `.planning/research/questions.md`).
- `tests/module.test.ts` : vérifier la présence du champ, sa valeur nulle au scénario de référence,
  et sa finitude sur toutes les années.
- Vérifier que `npm run calibration` et `npm run verification` donnent des sorties inchangées.
