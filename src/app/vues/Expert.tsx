import { useState } from 'react';
import type { EquilibreAnnee, ResultatAnnee, ResultatSimulation } from '../../engine';
import { Courbes } from '../charts/Courbes';
import { Pyramide } from '../charts/Pyramide';
import { Curseur } from '../composants';
import { ans, effortFinancement, milliards, nombre, pct, points } from '../format';
import { ANNEE_MESURES, PARAMETRES_REFERENCE as REF, type ParametresUI } from '../parametres';
import { appliquerPreset, PRESETS } from '../presets';
import { avecHistorique, serieObservee } from '../historique';

interface Props {
  parametres: ParametresUI;
  setParametres: (p: ParametresUI) => void;
  reference: ResultatSimulation;
  scenario: ResultatSimulation;
  equilibreScenario: EquilibreAnnee[];
  historique: boolean;
}

const serie = (s: ResultatSimulation, f: (r: ResultatAnnee) => number) => s.annees.map((r) => ({ x: r.annee, y: f(r) }));
const dec = (d: number) => (v: number) => v.toFixed(d).replace('.', ',');

export function Expert({ parametres: p, setParametres, reference, scenario, equilibreScenario, historique }: Props) {
  const maj = (m: Partial<ParametresUI>) => setParametres({ ...p, ...m });
  const [anneePyramide, setAnneePyramide] = useState(2050);
  const [vueTableau, setVueTableau] = useState(false);
  const mode = p.capitalisationTaux > 0 ? p.capitalisationMode : undefined;
  const compare = (id: string, f: (r: ResultatAnnee) => number) => [
    { id: `ref-${id}`, nom: 'Législation actuelle', couleur: 'var(--ref)', valeurs: serie(reference, f), pointille: true },
    { id: `moi-${id}`, nom: 'Scénario', couleur: 'var(--series-1)', valeurs: serie(scenario, f) },
  ];
  const rPyr = scenario.annees.find((r) => r.annee === anneePyramide)!;

  return (
    <div className="expert">
      <aside className="panneau panneau-expert" aria-label="Paramètres">
        <label className="champ">
          Partir d’un scénario-type
          <select value="" onChange={(e) => e.target.value && setParametres(appliquerPreset(PRESETS.find((x) => x.id === e.target.value)!))}>
            <option value="">Choisir…</option>
            {PRESETS.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nom}
              </option>
            ))}
          </select>
        </label>

        <details open>
          <summary>Hypothèses démographiques</summary>
          <Curseur libelle="Fécondité (dès 2028)" valeur={p.fecondite} min={1.2} max={2.1} pas={0.05} reference={REF.fecondite} format={(v) => `${dec(2)(v)} enfant/femme`} onChange={(v) => maj({ fecondite: v })} />
          <Curseur libelle="Espérance de vie en 2070" valeur={p.ecartEsperanceVie} min={-3} max={3} pas={0.5} reference={0} format={(v) => (v === 0 ? 'Référence' : `${v > 0 ? '+' : ''}${dec(1)(v)} an`)} onChange={(v) => maj({ ecartEsperanceVie: v })} aide="Écart à la trajectoire de référence calée sur le COR." />
          <Curseur libelle="Solde migratoire" valeur={p.soldeMigratoire} min={0} max={300} pas={10} reference={REF.soldeMigratoire} format={(v) => `${nombre(v * 1000)} / an`} onChange={(v) => maj({ soldeMigratoire: v })} />
        </details>

        <details open>
          <summary>Hypothèses économiques</summary>
          <Curseur libelle="Productivité (long terme)" valeur={p.productivite} min={0} max={1.8} pas={0.1} reference={REF.productivite} format={(v) => `${dec(1)(v)} % / an`} onChange={(v) => maj({ productivite: v })} />
          <Curseur libelle="Chômage (dès 2030)" valeur={p.chomage} min={4} max={11} pas={0.5} reference={REF.chomage} format={(v) => `${dec(1)(v)} %`} onChange={(v) => maj({ chomage: v })} />
          <Curseur libelle="Inflation" valeur={p.inflation} min={0} max={4} pas={0.25} reference={REF.inflation} format={(v) => `${dec(2)(v)} % / an`} onChange={(v) => maj({ inflation: v })} aide="N’intervient que pour le gel des pensions (le modèle est en euros constants)." />
        </details>

        <details open>
          <summary>Âge et durée</summary>
          <label className="case">
            <input type="checkbox" checked={p.ageLegalCible !== null} onChange={(e) => maj({ ageLegalCible: e.target.checked ? 64 : null })} />
            Modifier l’âge légal
          </label>
          <Curseur libelle="Âge légal cible" valeur={p.ageLegalCible ?? 64} min={60} max={70} pas={0.25} reference={64} format={(v) => ans(v)} onChange={(v) => maj({ ageLegalCible: v })} desactive={p.ageLegalCible === null} />
          <Curseur libelle="Atteint en" valeur={p.ageLegalAnnee} min={ANNEE_MESURES} max={2050} pas={1} format={String} onChange={(v) => maj({ ageLegalAnnee: v })} desactive={p.ageLegalCible === null} />
          <Curseur libelle="Durée de cotisation requise" valeur={p.dureeSupplementaire} min={-3} max={3} pas={0.25} reference={0} format={(v) => (v === 0 ? 'Inchangée (43 ans)' : `${v > 0 ? '+' : ''}${dec(2)(v)} an`)} onChange={(v) => maj({ dureeSupplementaire: v })} aide="Montée en charge de 2028 à 2035." />
          <Curseur libelle="Emploi des 55-69 ans" valeur={p.emploiSeniors} min={0} max={15} pas={1} reference={0} format={(v) => `+${v} pt`} onChange={(v) => maj({ emploiSeniors: v })} aide="Hausse du taux d’activité des seniors non retraités (2028-2035)." />
        </details>

        <details open>
          <summary>Prélèvements</summary>
          <Curseur libelle="Hausse des cotisations" valeur={p.hausseCotisation} min={-2} max={8} pas={0.25} reference={0} format={(v) => points(v / 100, 2)} onChange={(v) => maj({ hausseCotisation: v })} aide="Points de masse des revenus d’activité, montée en charge 2028-2030." />
          <Curseur libelle="Recettes affectées (CSG, TVA, État…)" valeur={p.ressourcesExternes} min={-1} max={3} pas={0.1} reference={0} format={(v) => `${points(v / 100)} de PIB`} onChange={(v) => maj({ ressourcesExternes: v })} />
        </details>

        <details open>
          <summary>Pensions</summary>
          <Curseur libelle="Sous-indexation" valeur={p.sousIndexation} min={-1} max={3} pas={0.25} reference={0} format={(v) => (v === 0 ? 'Indexation sur les prix' : `Prix ${v > 0 ? '−' : '+'} ${dec(2)(Math.abs(v))} pt`)} onChange={(v) => maj({ sousIndexation: v })} />
          <Curseur libelle="…jusqu’en" valeur={p.sousIndexationFin} min={ANNEE_MESURES} max={2070} pas={1} format={String} onChange={(v) => maj({ sousIndexationFin: v })} desactive={p.sousIndexation === 0} />
          <fieldset className="choix">
            <legend>Années de gel</legend>
            <div className="cases">
              {[2028, 2029, 2030, 2031, 2032].map((a) => (
                <label key={a} className="case">
                  <input
                    type="checkbox"
                    checked={p.anneesGel.includes(a)}
                    onChange={(e) => maj({ anneesGel: e.target.checked ? [...p.anneesGel, a].sort() : p.anneesGel.filter((x) => x !== a) })}
                  />
                  {a}
                </label>
              ))}
            </div>
          </fieldset>
          <Curseur libelle="Niveau des pensions nouvelles" valeur={p.ajustementPensions} min={-15} max={10} pas={1} reference={0} format={(v) => `${v > 0 ? '+' : ''}${v} %`} onChange={(v) => maj({ ajustementPensions: v })} aide="Règles de calcul (décote, salaire de référence, points…) à partir de 2028." />
        </details>

        <details open>
          <summary>Capitalisation</summary>
          <Curseur libelle="Cotisation de capitalisation" valeur={p.capitalisationTaux} min={0} max={10} pas={0.5} reference={0} format={(v) => (v === 0 ? 'Aucune' : `${dec(1)(v)} pt`)} onChange={(v) => maj({ capitalisationTaux: v })} />
          <label className="champ">
            Mode
            <select value={p.capitalisationMode} onChange={(e) => maj({ capitalisationMode: e.target.value as ParametresUI['capitalisationMode'] })}>
              <option value="substitutif">Substitutif (pris sur les cotisations)</option>
              <option value="additionnel">Additionnel (en plus)</option>
              <option value="fonds-reserve">Fonds de réserve collectif</option>
            </select>
          </label>
          <Curseur libelle="Rendement réel net" valeur={p.capitalisationRendement} min={0} max={6} pas={0.25} reference={REF.capitalisationRendement} format={(v) => `${dec(2)(v)} % / an`} onChange={(v) => maj({ capitalisationRendement: v })} />
        </details>

        <details open>
          <summary>Équilibre visé</summary>
          <Curseur libelle="Solde cible" valeur={p.soldeCible} min={-2} max={1} pas={0.1} reference={0} format={(v) => `${points(v / 100)} de PIB`} onChange={(v) => maj({ soldeCible: v })} aide="Utilisé par le tableau « effort pour atteindre le solde cible »." />
        </details>
      </aside>

      <div className="expert-resultats">
        <div className="barre-outils">
          <button type="button" className={`bouton secondaire${vueTableau ? '' : ' actif'}`} onClick={() => setVueTableau(false)}>
            Graphiques
          </button>
          <button type="button" className={`bouton secondaire${vueTableau ? ' actif' : ''}`} onClick={() => setVueTableau(true)}>
            Tableau
          </button>
          <button type="button" className="bouton secondaire" onClick={() => exporterCsv(scenario, equilibreScenario)}>
            Exporter en CSV
          </button>
        </div>

        {vueTableau ? (
          <TableauDonnees scenario={scenario} equilibre={equilibreScenario} mode={mode} />
        ) : (
          <>
            <div className="grille-graphiques">
              <Courbes titre="Solde" sousTitre="% du PIB" {...avecHistorique(historique, 'soldePctPib', compare('solde', (r) => r.soldePctPib))} format={(v) => pct(v)} zero reperes={[{ x: ANNEE_MESURES, libelle: 'mesures' }]} />
              <Courbes
                titre="Dépenses et ressources du scénario"
                sousTitre="% du PIB"
                {...avecHistorique(historique, null, [
                  ...(historique ? [serieObservee('depensesPctPib', 'Dépenses observées')] : []),
                  { id: 'dep', nom: 'Dépenses', couleur: 'var(--series-2)', valeurs: serie(scenario, (r) => r.depensesPctPib) },
                  { id: 'res', nom: 'Ressources', couleur: 'var(--series-1)', valeurs: serie(scenario, (r) => r.ressourcesPctPib) },
                ])}
                format={(v) => pct(v)}
              />
              <Courbes titre="Pension relative (y c. capitalisation)" sousTitre="Pension moyenne / revenu d’activité moyen" series={compare('prel', (r) => r.pensionRelativeTotale)} format={(v) => pct(v, 0)} />
              <Courbes titre="Âge moyen de départ" sousTitre="Années" {...avecHistorique(historique, 'ageMoyenDepart', compare('age', (r) => r.ageMoyenDepart))} format={dec(1)} />
              <Courbes titre="Cotisants par retraité" {...avecHistorique(historique, 'ratioCotisantsRetraites', compare('ratio', (r) => r.ratioCotisantsRetraites))} format={dec(2)} />
              <Courbes titre="Dette cumulée du système" sousTitre="% du PIB" series={compare('dette', (r) => r.detteCumuleePctPib)} format={(v) => pct(v, 0)} zero />
              {p.capitalisationTaux > 0 && (
                <Courbes
                  titre="Fonds de capitalisation"
                  sousTitre="Encours, en % du PIB"
                  series={[{ id: 'fonds', nom: 'Encours', couleur: 'var(--series-1)', valeurs: serie(scenario, (r) => r.fondsCapitalisation / r.pib) }]}
                  format={(v) => pct(v, 0)}
                />
              )}
              <div>
                <Pyramide annee={anneePyramide} population={rPyr.pyramide} retraites={rPyr.pyramideRetraites} ageLegal={rPyr.ageLegal} hauteur={280} />
                <div className="controle-annee">
                  <input type="range" min={2025} max={2070} value={anneePyramide} aria-label="Année de la pyramide" onChange={(e) => setAnneePyramide(Number(e.target.value))} />
                  <span className="annee">{anneePyramide}</span>
                </div>
              </div>
            </div>

            <h3>Effort sur un seul levier pour atteindre le solde cible ({points(p.soldeCible / 100)} de PIB)</h3>
            <div className="tableau-defilant">
              <table className="tableau">
                <thead>
                  <tr>
                    <th>Année</th>
                    <th>Solde du scénario</th>
                    <th>Hausse de prélèvement</th>
                    <th>ou pension relative</th>
                    <th>ou âge moyen de départ</th>
                  </tr>
                </thead>
                <tbody>
                  {equilibreScenario
                    .filter((e) => e.annee % 5 === 0)
                    .map((e) => {
                      const r = scenario.annees.find((x) => x.annee === e.annee)!;
                      return (
                        <tr key={e.annee}>
                          <td>{e.annee}</td>
                          <td>{pct(r.soldePctPib)}</td>
                          <td>{points(e.hausseTauxNecessaire)}</td>
                          <td>{pct(e.pensionRelativeNecessaire)}</td>
                          <td>{ans(e.ageDepartNecessaire)}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const COLONNES: Array<[string, (r: ResultatAnnee) => number | string]> = [
  ['annee', (r) => r.annee],
  ['population', (r) => Math.round(r.population)],
  ['rapport_20_64_sur_65plus', (r) => r.rapportDemographique.toFixed(3)],
  ['age_legal', (r) => r.ageLegal.toFixed(2)],
  ['age_moyen_depart', (r) => r.ageMoyenDepart.toFixed(2)],
  ['cotisants', (r) => Math.round(r.cotisants)],
  ['retraites', (r) => Math.round(r.retraites)],
  ['pib_mds_euros_2025', (r) => r.pib.toFixed(1)],
  ['depenses_mds', (r) => r.depenses.toFixed(1)],
  ['ressources_mds', (r) => r.ressources.toFixed(1)],
  ['solde_mds', (r) => r.solde.toFixed(1)],
  ['solde_pct_pib', (r) => (r.soldePctPib * 100).toFixed(3)],
  ['pension_relative_pct', (r) => (r.pensionRelative * 100).toFixed(2)],
  ['pension_relative_totale_pct', (r) => (r.pensionRelativeTotale * 100).toFixed(2)],
  ['dette_pct_pib', (r) => (r.detteCumuleePctPib * 100).toFixed(2)],
  ['fonds_capitalisation_mds', (r) => r.fondsCapitalisation.toFixed(1)],
];

function exporterCsv(s: ResultatSimulation, eq: EquilibreAnnee[]) {
  const entete = [...COLONNES.map(([n]) => n), 'hausse_taux_equilibre_pt', 'pension_relative_equilibre_pct', 'age_depart_equilibre'];
  const lignes = s.annees.map((r, i) =>
    [...COLONNES.map(([, f]) => f(r)), (eq[i].hausseTauxNecessaire * 100).toFixed(3), (eq[i].pensionRelativeNecessaire * 100).toFixed(2), eq[i].ageDepartNecessaire.toFixed(2)].join(';'),
  );
  const blob = new Blob([[entete.join(';'), ...lignes].join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'simulation-retraites.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

function TableauDonnees({ scenario, equilibre, mode }: { scenario: ResultatSimulation; equilibre: EquilibreAnnee[]; mode?: string }) {
  return (
    <div className="tableau-defilant">
      <table className="tableau compact">
        <thead>
          <tr>
            <th>Année</th>
            <th>Âge départ</th>
            <th>Cotisants / retraité</th>
            <th>Dépenses</th>
            <th>Ressources</th>
            <th>Solde</th>
            <th>Solde (Md€ 2025)</th>
            <th>Pension relative</th>
            <th>Prélèvements totaux</th>
            <th>Dette</th>
            <th>Âge d’équilibre</th>
          </tr>
        </thead>
        <tbody>
          {scenario.annees.map((r, i) => (
            <tr key={r.annee}>
              <td>{r.annee}</td>
              <td>{dec(1)(r.ageMoyenDepart)}</td>
              <td>{dec(2)(r.ratioCotisantsRetraites)}</td>
              <td>{pct(r.depensesPctPib)}</td>
              <td>{pct(r.ressourcesPctPib)}</td>
              <td>{pct(r.soldePctPib)}</td>
              <td>{milliards(r.solde)}</td>
              <td>{pct(r.pensionRelativeTotale)}</td>
              <td>{pct(effortFinancement(r, mode))}</td>
              <td>{pct(r.detteCumuleePctPib, 0)}</td>
              <td>{dec(1)(equilibre[i].ageDepartNecessaire)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
