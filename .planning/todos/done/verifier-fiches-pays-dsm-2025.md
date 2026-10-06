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

## Fait (2026-10-06)

Excel fourni par l'utilisateur (`DSM_2025_country_fiches_tables_and_graphs.xlsx`, un onglet par pays).
Onglet FR, scénario de référence 2024-2036 : dette brute, solde primaire, charge d'intérêts, effet
boule de neige, ajustements stock-flux (lignes 45-65), croissance réelle, inflation et taux
d'intérêt implicite (lignes 152-159). Séries extraites dans `data/commission/dsm-2025-fr.json`
(libellés contrôlés). L'Excel lui-même n'est pas versionné (5 Mo).

Résultat : le moteur reproduit la dette de la Commission à 0,0004 point près sur 2026-2036, et la
charge d'intérêts au millième. Dette 2036 : 144,0 % du PIB (la référence provisoire disait 124,4 %).
