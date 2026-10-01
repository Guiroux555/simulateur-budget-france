---
title: Vérifier les fiches pays du DSM 2025 (séries annuelles France)
date: 2026-10-01
priority: high
---

Préalable au critère de calibrage du module dette (voir `.planning/notes/module-dette-horizon-reference.md`).

Depuis un réseau qui n'est pas bloqué, ouvrir l'Excel « Debt Sustainability Monitor 2025 – Country fiches
tables and graphs » (page https://economy-finance.ec.europa.eu/publications/debt-sustainability-monitor-2025_en)
et vérifier, pour la France :

- dette en % du PIB, année par année, jusqu'en 2036 ;
- solde primaire, taux d'intérêt implicite *r*, croissance nominale *g*, effet boule de neige ;
- hypothèses du scénario de référence (prévisions d'automne 2025, coûts du vieillissement).

Si les séries existent : les ranger dans `data/` avec la date et la licence (§8 de l'idéation).
Si elles n'existent pas : traiter la question « Calibrage de repli » de `.planning/research/questions.md`.
