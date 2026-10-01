---
title: Branchement des modules sur la page de synthèse
date: 2026-10-01
context: Exploration (/gsd-explore), suite de notes/module-dette-horizon-reference.md, avant la phase B
---

# Branchement des modules sur la page de synthèse

## Décisions

| Question | Décision | Raison |
|---|---|---|
| Branchement des modules | **Écarts** ajoutés au scénario de référence de la Commission (DSM) | Au repos, la synthèse redonne exactement la trajectoire de la Commission : calibrage garanti par construction. |
| « Reste des APU » (§4 de l'idéation) | **Supprimé** | Les postes non modélisés sont déjà dans le scénario de la Commission. |
| Contenu d'un écart | Effet sur le solde **et** effet sur la croissance (PIB en volume), **affichés séparément** dans la synthèse | Ne pas sous-estimer les réformes qui augmentent l'activité, sans bouclage caché (§4). |
| Règle pour l'effet sur la croissance | **Mécanique seulement** : actifs supplémentaires × productivité du socle, sans élasticité comportementale | Traçable, cohérent avec le socle ; évite qu'un module juge lui-même l'effet macroéconomique de ses leviers. |
| Calibrage du module dette | Son moteur retrouve la dette de la Commission à partir des séries de la Commission (*r*, *g*, solde primaire) | Le calibrage de la synthèse est déjà garanti ; reste à vérifier le moteur. |

## Conséquences sur le contrat de module

- `resume()` : la synthèse n'utilise que les écarts à la référence du module, par année :
  `ecartSoldeReferencePctPib` (existant) et un nouvel écart de PIB en volume.
- Le module dette applique l'écart de PIB à *g* et l'écart de solde au solde primaire.

## Limites à écrire dans la note de méthode

1. **Compatibilité des références** : on suppose que le scénario de référence du COR (juin 2026)
   et l'hypothèse retraites de la Commission (Ageing Report 2024) sont compatibles. Non vérifié.
2. **Plein emploi des actifs supplémentaires** : l'effet mécanique suppose que chaque actif
   supplémentaire trouve un emploi. Il surestime l'effet d'un report d'âge (chômage, invalidité
   des seniors). Le futur module chômage pourra le corriger (voir limite n° 5 du module retraites).
