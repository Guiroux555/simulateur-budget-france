/**
 * Compare la trajectoire de dette du moteur au scénario de référence de la Commission
 * (Debt Sustainability Monitor 2025, fiche France).
 * Usage : npm run calibration:dette
 */
import { projeterDette, REFERENCE_DETTE as R } from '../src/modules/dette/engine';

const pct = (x: number) => `${(x * 100).toFixed(2)} %`;
const lignes = projeterDette(R).map((a) => {
  const cible = R.cibleDettePctPib[a.annee];
  return { annee: a.annee, commission: pct(cible), modele: pct(a.dettePctPib), ecart: `${((a.dettePctPib - cible) * 100).toFixed(3)} pt` };
});
console.log(R.source);
console.table(lignes);
