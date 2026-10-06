import { useEffect, useMemo, useState } from 'react';
import { Courbes } from '../../../commun/charts/Courbes';
import { Curseur, Encadre, Tuile } from '../../../commun/composants';
import { FenetreContext } from '../../../commun/fenetre';
import { pct, points } from '../../../commun/format';
import {
  ajustementPourStabiliser,
  appliquerScenario,
  depuisLienDette,
  projeterDette,
  REFERENCE_PROVISOIRE,
  SCENARIO_DETTE_REFERENCE,
  versLienDette,
  type AnneeDette,
  type ScenarioDette,
} from '../engine';

const REF = REFERENCE_PROVISOIRE;
const FENETRE = { debut: REF.anneeDepart, fin: REF.annees.at(-1)! };
/** 0.0003 → « 0,03 point ». */
const enPoints = (x: number) => `${pct(x, 2).replace(' %', '')} point${Math.abs(x) >= 0.02 ? 's' : ''}`;
const serie = (p: AnneeDette[], f: (a: AnneeDette) => number, depart?: number) => [
  ...(depart === undefined ? [] : [{ x: REF.anneeDepart, y: depart }]),
  ...p.map((a) => ({ x: a.annee, y: f(a) })),
];

/** Avertissement affiché tant que la trajectoire de référence n'est pas celle de la Commission. */
export function AvertissementProvisoire() {
  if (!REF.provisoire) return null;
  return (
    <div className="encadre avertissement" role="note">
      <strong>Trajectoire de référence provisoire.</strong> Les chiffres de référence sont des ordres de grandeur, en attendant
      les séries du Debt Sustainability Monitor de la Commission européenne. Les écarts entre scénarios sont parlants ; les
      niveaux de dette ne sont pas des projections officielles.
    </div>
  );
}

export function App({ lien, onLien }: { lien: string; onLien: (lien: string) => void }) {
  const [s, setS] = useState<ScenarioDette>(() => depuisLienDette(lien));
  const maj = (m: Partial<ScenarioDette>) => setS({ ...s, ...m });
  useEffect(() => onLien(versLienDette(s)), [s, onLien]);

  const reference = useMemo(() => projeterDette(REF), []);
  const scenario = useMemo(() => projeterDette(appliquerScenario(REF, s)), [s]);
  const [anneeCible, setAnneeCible] = useState(REF.annees[5]);
  const ajustement = useMemo(() => ajustementPourStabiliser(REF, { ...s, ajustementAnnuel: 0 }, anneeCible), [s, anneeCible]);

  const fin = scenario.at(-1)!;
  const finRef = reference.at(-1)!;
  const compare = (id: string, f: (a: AnneeDette) => number, depart?: number) => [
    { id: `ref-${id}`, nom: 'Référence', couleur: 'var(--ref)', valeurs: serie(reference, f, depart), pointille: true },
    { id: `scn-${id}`, nom: 'Scénario', couleur: 'var(--series-1)', valeurs: serie(scenario, f, depart) },
  ];

  return (
    <FenetreContext.Provider value={FENETRE}>
      <AvertissementProvisoire />
      <div className="expert">
        <aside className="panneau panneau-expert" aria-label="Paramètres">
          <fieldset className="groupe-hypotheses">
            <legend>Le monde (hypothèses)</legend>
            <Curseur
              libelle="Taux d’intérêt des nouveaux emprunts"
              valeur={s.ecartTaux * 100}
              min={-2}
              max={3}
              pas={0.25}
              reference={0}
              onChange={(v) => maj({ ecartTaux: v / 100 })}
              format={(v) => points(v / 100, 2)}
              aide={`Se transmet progressivement au taux moyen de la dette, refinancée en ${String(8.5).replace('.', ',')} ans environ.`}
            />
            <Curseur
              libelle="Croissance nominale du PIB"
              valeur={s.ecartCroissance * 100}
              min={-2}
              max={2}
              pas={0.25}
              reference={0}
              onChange={(v) => maj({ ecartCroissance: v / 100 })}
              format={(v) => points(v / 100, 2)}
              aide="Écart à la croissance de la référence, chaque année (activité et inflation)."
            />
          </fieldset>
          <fieldset className="groupe-hypotheses">
            <legend>Les solutions (leviers)</legend>
            <Curseur
              libelle="Effort budgétaire supplémentaire par an"
              valeur={s.ajustementAnnuel * 100}
              min={-0.5}
              max={1}
              pas={0.05}
              reference={0}
              onChange={(v) => maj({ ajustementAnnuel: v / 100 })}
              format={(v) => `${points(v / 100, 2)} de PIB`}
              aide="Amélioration du solde primaire ajoutée chaque année, par économies ou recettes nouvelles. L’effort atteint reste acquis."
            />
            <Curseur
              libelle="Durée de l’effort"
              valeur={s.dureeAjustement}
              min={1}
              max={REF.annees.length}
              pas={1}
              reference={SCENARIO_DETTE_REFERENCE.dureeAjustement}
              onChange={(v) => maj({ dureeAjustement: v })}
              format={(v) => `${v} an${v > 1 ? 's' : ''}`}
              desactive={s.ajustementAnnuel === 0}
            />
          </fieldset>
          <button type="button" className="bouton secondaire" onClick={() => setS(SCENARIO_DETTE_REFERENCE)}>
            Revenir à la référence
          </button>
        </aside>

        <section className="expert-resultats" aria-label="Résultats">
          <h2>Comment tenir la trajectoire de la dette publique sur dix ans ?</h2>
          <p className="explication">
            Dette de l’année = dette de l’année précédente × (1 + taux d’intérêt) / (1 + croissance) − solde primaire. Quand le
            taux d’intérêt dépasse la croissance, la dette augmente d’elle-même : c’est l’effet « boule de neige ».
          </p>
          <div className="tuiles">
            <Tuile
              libelle={`Dette en ${fin.annee}`}
              valeur={pct(fin.dettePctPib)}
              detail={`${points(fin.dettePctPib - finRef.dettePctPib)} par rapport à la référence`}
              ton={fin.dettePctPib > finRef.dettePctPib + 0.0005 ? 'deficit' : fin.dettePctPib < finRef.dettePctPib - 0.0005 ? 'excedent' : 'neutre'}
            />
            <Tuile libelle={`Solde public en ${fin.annee}`} valeur={pct(fin.soldePctPib)} detail={`Référence : ${pct(finRef.soldePctPib)}`} ton={fin.soldePctPib < 0 ? 'deficit' : 'excedent'} />
            <Tuile libelle={`Charge d’intérêts en ${fin.annee}`} valeur={`${pct(fin.chargeInteretsPctPib)} du PIB`} detail={`Référence : ${pct(finRef.chargeInteretsPctPib)}`} />
            <Tuile
              libelle={`Solde primaire stabilisant en ${fin.annee}`}
              valeur={pct(fin.soldePrimaireStabilisantPctPib)}
              detail={`Solde primaire du scénario : ${pct(fin.soldePrimairePctPib)}`}
            />
          </div>

          <div className="grille-2">
            <Courbes titre="Dette publique" sousTitre="En % du PIB" series={compare('dette', (a) => a.dettePctPib, REF.detteDepartPctPib)} format={(v) => pct(v)} separation={REF.anneeDepart} />
            <Courbes
              titre="Solde primaire et solde stabilisant"
              sousTitre="En % du PIB ; au-dessus du solde stabilisant, la dette baisse"
              series={[
                { id: 'stab', nom: 'Solde primaire stabilisant', couleur: 'var(--series-2)', valeurs: serie(scenario, (a) => a.soldePrimaireStabilisantPctPib), pointille: true },
                ...compare('sp', (a) => a.soldePrimairePctPib),
              ]}
              format={(v) => pct(v)}
              zero
            />
          </div>

          <Encadre titre="Stabiliser la dette">
            <label className="champ">
              Année où la dette doit cesser d’augmenter
              <select value={anneeCible} onChange={(e) => setAnneeCible(Number(e.target.value))}>
                {REF.annees.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
            <p>
              {ajustement === null
                ? 'Hors de portée avec un effort raisonnable (plus de 5 points de PIB par an).'
                : ajustement <= 0
                  ? `Avec ces hypothèses, la dette cesse déjà d’augmenter en ${anneeCible} sans effort supplémentaire.`
                  : `Il faudrait améliorer le solde primaire de ${enPoints(ajustement)} de PIB par an de ${REF.annees[0]} à ${anneeCible}, soit ${enPoints(
                      ajustement * (REF.annees.indexOf(anneeCible) + 1),
                    )} au total, en plus de la trajectoire de référence.`}
            </p>
            {ajustement !== null && ajustement > 0 && (
              <button
                type="button"
                className="bouton principal"
                onClick={() => maj({ ajustementAnnuel: Math.round(ajustement * 10000) / 10000, dureeAjustement: REF.annees.indexOf(anneeCible) + 1 })}
              >
                Appliquer cet effort
              </button>
            )}
          </Encadre>

          <div className="tableau-defilant">
            <table className="tableau compact">
              <caption className="note">Trajectoire du scénario, en % du PIB</caption>
              <thead>
                <tr>
                  <th>Année</th>
                  <th>Dette</th>
                  <th>Référence</th>
                  <th>Solde primaire</th>
                  <th>Intérêts</th>
                  <th>Solde public</th>
                  <th>Taux apparent</th>
                  <th>Croissance nominale</th>
                </tr>
              </thead>
              <tbody>
                {scenario.map((a, i) => (
                  <tr key={a.annee}>
                    <td>{a.annee}</td>
                    <td className="fort">{pct(a.dettePctPib)}</td>
                    <td>{pct(reference[i].dettePctPib)}</td>
                    <td>{pct(a.soldePrimairePctPib)}</td>
                    <td>{pct(a.chargeInteretsPctPib)}</td>
                    <td>{pct(a.soldePctPib)}</td>
                    <td>{pct(a.tauxInteretApparent, 2)}</td>
                    <td>{pct(a.croissanceNominale, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="note">Source de la référence : {REF.source}.</p>
        </section>
      </div>
    </FenetreContext.Provider>
  );
}
