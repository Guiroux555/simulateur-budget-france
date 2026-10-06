import { useMemo } from 'react';
import { Courbes } from '../commun/charts/Courbes';
import { Tuile } from '../commun/composants';
import { FenetreContext } from '../commun/fenetre';
import { pct, points } from '../commun/format';
import { MODULES } from '../modules';
import { depuisLienDette, REFERENCE_DETTE } from '../modules/dette/engine';
import { AvertissementProvisoire } from '../modules/dette/app/App';
import { calculerSynthese, resumesDesModules, type AnneeSynthese } from './calcul';

const REF = REFERENCE_DETTE;
const FENETRE = { debut: REF.anneeDepart, fin: REF.annees.at(-1)! };

interface Props {
  /** Lien (scénario encodé) de chaque page, par identifiant ; absent = référence. */
  liens: Readonly<Record<string, string>>;
  /** Ouvre la page d'un module avec son scénario. */
  allerA: (page: string) => void;
}

export function Synthese({ liens, allerA }: Props) {
  const synthese = useMemo(
    () => calculerSynthese(resumesDesModules(liens), REF, depuisLienDette(liens.dette ?? '')),
    [liens],
  );
  const fin = synthese.annees.at(-1)!;
  const depart = { x: REF.anneeDepart, y: REF.detteDepartPctPib };
  const serie = (f: (a: AnneeSynthese) => number) => [depart, ...synthese.annees.map((a) => ({ x: a.annee, y: f(a) }))];
  const effetDette = fin.detteModuleDetteSeulPctPib - fin.detteReferencePctPib;
  const effetBudgetaire = fin.detteEffetBudgetaireSeulPctPib - fin.detteModuleDetteSeulPctPib;
  const effetCroissance = fin.dettePctPib - fin.detteEffetBudgetaireSeulPctPib;
  const lignes = [
    ...MODULES.map((m) => ({ id: m.id, libelle: m.libelle, modifie: Boolean(liens[m.id]) })),
    { id: 'dette', libelle: 'Dette : hypothèses de taux et de croissance, effort budgétaire', modifie: Boolean(liens.dette) },
  ];

  return (
    <FenetreContext.Provider value={FENETRE}>
      <AvertissementProvisoire />
      <section className="expert-resultats" aria-label="Synthèse">
        <h2>Vos scénarios, réunis : quel effet sur la dette ?</h2>
        <p className="explication">
          La synthèse part de la trajectoire de référence et y ajoute l’effet de chaque module réglé : son effet sur le solde
          public et son effet sur la croissance, présentés séparément. Un module non réglé compte pour sa référence.
        </p>

        <table className="tableau compact">
          <thead>
            <tr>
              <th>Module</th>
              <th>Scénario</th>
              <th aria-label="Action" />
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => (
              <tr key={l.id}>
                <td>{l.libelle}</td>
                <td>{l.modifie ? 'Scénario modifié' : 'Référence'}</td>
                <td>
                  <button type="button" className="bouton lien" onClick={() => allerA(l.id)}>
                    Modifier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="tuiles">
          <Tuile
            libelle={`Dette en ${fin.annee}`}
            valeur={pct(fin.dettePctPib)}
            detail={`Référence : ${pct(fin.detteReferencePctPib)}`}
            ton={fin.dettePctPib > fin.detteReferencePctPib + 0.0005 ? 'deficit' : fin.dettePctPib < fin.detteReferencePctPib - 0.0005 ? 'excedent' : 'neutre'}
          />
          <Tuile libelle="Module dette" valeur={points(effetDette)} detail="Hypothèses de taux et de croissance, effort budgétaire" />
          <Tuile libelle="Effet budgétaire des autres modules" valeur={points(effetBudgetaire)} detail="Écarts de solde, hors effet sur la croissance" />
          <Tuile libelle="Effet via la croissance" valeur={points(effetCroissance)} detail="PIB plus élevé : dette plus faible en % du PIB" />
          <Tuile libelle={`Solde public en ${fin.annee}`} valeur={pct(fin.soldePctPib)} ton={fin.soldePctPib < 0 ? 'deficit' : 'excedent'} />
        </div>

        <Courbes
          titre="Dette publique"
          sousTitre="En % du PIB"
          series={[
            { id: 'ref', nom: 'Référence', couleur: 'var(--ref)', valeurs: serie((a) => a.detteReferencePctPib), pointille: true },
            ...(liens.dette ? [{ id: 'dette', nom: 'Module dette seul', couleur: 'var(--series-3)', valeurs: serie((a) => a.detteModuleDetteSeulPctPib) }] : []),
            { id: 'budget', nom: 'Avec l’effet budgétaire des autres modules', couleur: 'var(--series-2)', valeurs: serie((a) => a.detteEffetBudgetaireSeulPctPib) },
            { id: 'total', nom: 'Avec aussi l’effet via la croissance', couleur: 'var(--series-1)', valeurs: serie((a) => a.dettePctPib), epaisseur: 3 },
          ]}
          format={(v) => pct(v)}
          separation={REF.anneeDepart}
          hauteur={260}
        />

        <div className="tableau-defilant">
          <table className="tableau compact">
            <caption className="note">Contribution de chaque module, par année : effet sur le solde (points de PIB) / effet sur le PIB</caption>
            <thead>
              <tr>
                <th>Année</th>
                <th>Dette</th>
                <th>Référence</th>
                {MODULES.map((m) => (
                  <th key={m.id}>{m.libelle}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {synthese.annees.map((a) => (
                <tr key={a.annee}>
                  <td>{a.annee}</td>
                  <td className="fort">{pct(a.dettePctPib)}</td>
                  <td>{pct(a.detteReferencePctPib)}</td>
                  {a.contributions.map((c) => (
                    <td key={c.module}>
                      {points(c.ecartSoldePctPib, 2)} / {points(c.ecartPibVolumePct, 2).replace('pt', '%')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note">
          Conventions : les écarts de solde sont rapportés au PIB de la référence de chaque module ; l’effet sur la croissance est
          mécanique (actifs supplémentaires × productivité) ; le reste du budget reste constant en % du PIB. Source de la
          référence : {synthese.source}.
        </p>
      </section>
    </FenetreContext.Provider>
  );
}
