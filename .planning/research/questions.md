# Questions de recherche

## Calibrage de repli du module dette (2026-10-01)

Si l'Excel des fiches pays du DSM 2025 ne donne que quelques points pour la France (et pas de
séries annuelles), quel critère d'acceptation retenir ?

- Critère sur quelques années clés (par exemple N+1, N+5, N+10) plutôt que sur chaque année ?
- Compléter les années manquantes par des sources nationales (rapport d'avancement annuel du PSMT,
  avis HCFP, Cour des comptes), au risque de mélanger des jeux d'hypothèses ?
- Que faire entre janvier et la sortie du nouveau DSM (premier trimestre), quand la fenêtre glissante
  dépasse d'un an la référence ?

Contexte : `.planning/notes/module-dette-horizon-reference.md`.

## Effet mécanique du report d'âge sur l'emploi (2026-10-01) — résolue

Le moteur retraites calcule-t-il déjà le nombre d'actifs supplémentaires d'un report de l'âge de
départ ? Si oui :

- d'où vient ce nombre (taux d'activité par âge, hypothèse du COR, calcul propre) ?
- est-il cohérent avec les chiffres du COR pour les dernières réformes ?
- peut-on en déduire l'écart de PIB en volume (actifs supplémentaires × productivité du socle)
  sans changer les résultats calibrés du module ?

Contexte : `.planning/notes/branchement-modules-synthese.md`.

**Réponse (lecture du code, 2026-10-01)** :

- Oui. Les cotisants par âge valent population × part des non-retraités × taux d'activité par âge ×
  (1 − chômage) (`src/modules/retraites/engine/modele.ts:71`). Un report d'âge réduit la part des
  retraités, donc augmente les cotisants. Les taux d'activité par âge sont un paramètre de calibrage
  du module (`engine/reference.ts`, `activiteParAge`).
- Le PIB du module est déjà proportionnel à la masse des revenus d'activité (`modele.ts:141`) :
  l'écart de PIB s'obtient sans rien changer aux résultats calibrés.
- Les actifs supplémentaires subissent le chômage moyen et aucun ne passe en invalidité : c'est la
  limite 2 de `.planning/notes/branchement-modules-synthese.md`.
- Reste ouvert : cohérence de cet effet avec les chiffrages du COR pour les dernières réformes.
