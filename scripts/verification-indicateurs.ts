/**
 * Vérifie que la projection est bien calculée à partir des indicateurs (démographie, emploi,
 * productivité, âge…) et non recopiée d'un rapport : chaque indicateur est modifié seul et l'on
 * suit toute la chaîne de calcul jusqu'au solde. `npm run verification`.
 */
import { simuler, valeurA, CALIBRAGE } from '../src/engine';
import { PARAMETRES_REFERENCE, versScenario, type ParametresUI } from '../src/app/parametres';
import { simulerInteractif, criteresDepuis, soldeTotal } from '../src/app/interactif';

const A = 2070;
const f = (v: number, d = 2) => v.toFixed(d).padStart(7);
const ligne = (nom: string, p: Partial<ParametresUI>) => {
  const s = simuler(versScenario({ ...PARAMETRES_REFERENCE, ...p }));
  const r = s.annees.find((x) => x.annee === A)!;
  console.log(
    `${nom.padEnd(28)} pop ${f(r.pyramide.reduce((a, b) => a + b, 0) / 1e6, 1)} M | cotisants ${f(r.cotisants / 1e6, 1)} M | retraités ${f(r.retraites / 1e6, 1)} M | ratio ${f(r.ratioCotisantsRetraites)} | âge départ ${f(r.ageMoyenDepart, 1)} | pension rel. ${f(r.pensionRelative * 100, 1)} % | dépenses ${f(r.depensesPctPib * 100)} % | ressources ${f(r.ressourcesPctPib * 100)} % | solde ${f(r.soldePctPib * 100)} % PIB`,
  );
  return r;
};

console.log(`Chaîne de calcul en ${A}, un indicateur modifié à la fois :\n`);
ligne('Référence (hypothèses COR)', {});
ligne('Natalité 1,8', { fecondite: 1.8 });
ligne('Natalité 1,2', { fecondite: 1.2 });
ligne('Espérance de vie +3 ans', { ecartEsperanceVie: 3 });
ligne('Solde migratoire 300 000', { soldeMigratoire: 300 });
ligne('Productivité 1,3 %', { productivite: 1.3 });
ligne('Productivité 0 %', { productivite: 0 });
ligne('Chômage 4,5 %', { chomage: 4.5 });
ligne('Chômage 10 %', { chomage: 10 });
ligne('Activité 20-64 ans +5 pts', { hausseActivite: 5 });
ligne('Emploi seniors +5 pts', { emploiSeniors: 5 });
ligne('Âge légal 66 ans', { ageLegalCible: 66, ageLegalAnnee: 2035 });

console.log('\nCe qui vient du rapport du COR (entrées exogènes, non recalculées) :');
console.log(`- ressources en % du PIB à législation inchangée : ${CALIBRAGE.ressourcesReferencePctPib.map(([a, v]) => `${a} ${(v * 100).toFixed(2)} %`).join(', ')}`);
console.log(`- érosion du taux de remplacement à la liquidation (règles indexées sur les prix) : ${(CALIBRAGE.erosionLiquidation * 100).toFixed(2)} %/an`);
console.log(`- écart âge effectif / âge légal : ${valeurA(CALIBRAGE.ecartAgeEffectif, 2070)} an`);
const sansConvention = simuler(versScenario(PARAMETRES_REFERENCE));
const r = sansConvention.annees.find((x) => x.annee === A)!;
const ecartRessources = valeurA(CALIBRAGE.ressourcesReferencePctPib, 2025) - r.ressourcesPctPib;
console.log(
  `\nPart du déficit ${A} due à la convention de ressources du COR (recul de ${(ecartRessources * 100).toFixed(2)} pt de PIB) : ` +
    `solde ${(r.soldePctPib * 100).toFixed(2)} % → ${((r.soldePctPib + ecartRessources) * 100).toFixed(2)} % à taux de prélèvement constant.`,
);

const c = criteresDepuis(PARAMETRES_REFERENCE);
const i = simulerInteractif(PARAMETRES_REFERENCE, c);
console.log(`\nCohérence mode interactif / moteur (${A}) : ${(soldeTotal(i, A) * 100).toFixed(3)} % vs ${(r.soldePctPib * 100).toFixed(3)} %`);
