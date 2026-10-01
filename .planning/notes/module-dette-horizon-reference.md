---
title: Module dette — horizon et référence de calibrage
date: 2026-10-01
context: Exploration (/gsd-explore) à partir de docs/budget/IDEATION.md (branche claude/clever-galileo-mhiwz3), avant la phase B
---

# Module dette — horizon et référence de calibrage

## Décisions

| Question | Décision | Raison |
|---|---|---|
| Horizon de la dette dans la synthèse | **Court** (pas 2070) | Trajectoire fiable et calibrée plutôt que soutenabilité de long terme. Les modules démographiques ne pèsent dans la synthèse que par leurs effets à court terme. |
| Fin de l'horizon | **Fenêtre glissante** : année courante + N | Ne se périme pas (une date fixe comme 2031 serait dépassée). |
| Référence de calibrage | **Debt Sustainability Monitor (Commission européenne)**, PSMT + avis HCFP en contrôle sur les premières années | Seule projection officielle qui couvre une fenêtre glissante d'environ 10 ans. |
| N | Horizon du DSM (10 ans) | Suit la référence. |

Conséquences :
- `resume()` renvoie toutes les années du module ; la synthèse lit seulement la fenêtre de la dette.
- Le §3.1 de l'idéation (« donne un sens au −2,4 % du PIB en 2070 ») ne tient plus et doit être réécrit.

## Recherche (2026-10-01)

Le proxy de l'environnement bloquait economy-finance.ec.europa.eu et tresor.economie.gouv.fr :
les constats viennent d'extraits de moteur de recherche tirés de ces sources, recoupés, et non
des documents eux-mêmes. À relire sur les pages originales.

DATA_q7Rk2mXv_START
Vérifiés (sources citées) :
- DSM 2025 (Institutional Paper 332, publié le 12/02/2026) : scénario de référence sur 10 ans, jusqu'en 2036 ; fondé sur les prévisions d'automne 2025 et l'Ageing Report 2024. https://economy-finance.ec.europa.eu/publications/debt-sustainability-monitor-2025_en
- Publication annuelle au premier trimestre : DSM 2023 (22/03/2024, IP 271), DSM 2024 (17/03/2025, IP 306), DSM 2025 (12/02/2026, IP 332).
- PSMT 2025-2029 : transmis le 31/10/2024, évalué par la Commission le 26/11/2024 (COM(2024) 716), approuvé par le Conseil le 21/01/2025 (JO C/2025/659) ; ajustement sur 7 ans (2025-2031) ; plafonds de croissance de la dépense nette : 0,8 % (2025), 1,2 % (2026-2028), 1,1 % (2029). https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:C_202500659
- Rapports d'avancement annuel : avril 2025 (avis HCFP-2025-3) et avril 2026 (avis HCFP-2026-3, 17/04/2026). Le rapport 2026 prévoit un déficit de 5,0 % du PIB en 2026 et une dette d'environ 118 % du PIB en 2027 (au-dessus du pic de 116,5 % prévu par le plan initial). https://www.hcfp.fr/liste-avis/avis-ndeg2026-3-rapport-davancement-annuel-2026
- Évaluation du plan par la Commission : projection jusqu'à 10 ans après l'ajustement, donc 2041 ; dette 112,9 % (2024), 116,5 % (2027), 113,5 % (2031), 100,9 % (2041). https://economy-finance.ec.europa.eu/document/download/c79b3b0c-340f-41db-92f8-f2cb7896190e_en?filename=FR_COM_2024_716_1_EN.pdf
DATA_q7Rk2mXv_END

DATA_Lp4wZ9cT_START
Non résolus (ne pas traiter comme des faits) :
- [non vérifiable] Le fichier Excel « DSM 2025 – Country fiches tables and graphs » (France incluse) donne-t-il des séries annuelles de solde primaire, r, g et effet boule de neige ? Fichier non ouvert.
- [non vérifiable] Les séries annuelles 2031-2041 de l'évaluation du plan sont-elles publiées ? Seuls quelques points sont confirmés.
- [non vérifiable] Édition 2026 du DSM au premier trimestre 2027 : déduction du rythme passé.
- [désaccord source / connaissance préalable] Le règlement 2024/1263 permettrait un plan révisé après un changement de gouvernement : vient de la mémoire du sous-agent, non sourcé.
DATA_Lp4wZ9cT_END

## Risque ouvert

Le critère « ± 0,1 pt par année » suppose des séries annuelles pour la France dans l'Excel des
fiches pays. Voir la tâche `verifier-fiches-pays-dsm-2025` et la question « Calibrage de repli ».
