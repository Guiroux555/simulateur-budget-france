# Simulateur budget France

Outils de simulation ouverts et politiquement neutres pour éclairer le débat public sur les
finances publiques françaises.

## Module retraites (présidentielle 2027)

Projection 2025-2070 de l'équilibre du système de retraite (tous régimes), calibrée sur le
scénario de référence du Conseil d'orientation des retraites (juin 2026), avec leviers réglables :
âge légal, durée de cotisation, taux de cotisation, recettes externes, indexation / gel des
pensions, niveau des pensions, emploi des seniors, capitalisation (additionnelle, substitutive,
fonds de réserve).

- Idéation et décisions de cadrage : [`docs/retraites/IDEATION.md`](docs/retraites/IDEATION.md)
- Note de méthode et calibrage : [`docs/retraites/METHODOLOGIE.md`](docs/retraites/METHODOLOGIE.md)

```bash
npm install
npm test              # tests unitaires et de calibrage
npm run calibration   # compare le modèle aux chiffres du COR
npm run typecheck
```

Exemple d'utilisation du moteur :

```ts
import { simuler, equilibre, scenarioReference, LEVIERS_NEUTRES, type Scenario } from './src/engine';

const scenario: Scenario = {
  ...scenarioReference(),
  leviers: { ...LEVIERS_NEUTRES, ageLegal: [[2027, 62.75], [2035, 65]] },
};
const resultat = simuler(scenario);
console.log(resultat.annees.at(-1)?.soldePctPib);
console.log(equilibre(resultat).at(-1)?.ageDepartNecessaire);
```
