import { useDeferredValue, useMemo } from 'react';
import { Courbes } from '../charts/Courbes';
import { ans, pct, pctSigne } from '../format';
import type { ParametresUI } from '../parametres';
import { ageEquilibre, HYPOTHESES, variantes, type DefinitionHypothese } from '../sensibilite';

/** Couleurs ordinales (une teinte, du clair au foncé) pour des valeurs ordonnées. */
function couleursOrdinales(n: number): string[] {
  const indices = n === 3 ? [1, 3, 4] : n === 2 ? [2, 4] : [1, 2, 3, 4];
  return indices.slice(0, n).map((i) => `var(--ord-${i})`);
}

const ANNEES = [2045, 2070] as const;

function BlocHypothese({ parametres, def }: { parametres: ParametresUI; def: DefinitionHypothese }) {
  const vars = useMemo(() => variantes(parametres, def), [parametres, def]);
  const couleurs = couleursOrdinales(vars.length);
  const ages = useMemo(() => vars.map((v) => ageEquilibre(v.simulation, 2070, parametres.soldeCible / 100)), [vars, parametres.soldeCible]);
  const solde = (i: number, a: number) => vars[i].simulation.annees.find((r) => r.annee === a)!.soldePctPib;
  const ecart2070 = Math.max(...vars.map((_, i) => solde(i, 2070))) - Math.min(...vars.map((_, i) => solde(i, 2070)));

  return (
    <div className="bloc-sensibilite">
      <Courbes
        titre={`${def.titre} : solde selon l’hypothèse`}
        sousTitre={def.explication}
        series={vars.map((v, i) => ({
          id: String(v.valeur),
          nom: v.libelle + (v.retenue ? ' ← retenue' : ''),
          couleur: couleurs[i],
          valeurs: v.simulation.annees.map((r) => ({ x: r.annee, y: r.soldePctPib })),
          epaisseur: v.retenue ? 3 : 1.75,
        }))}
        format={(v) => pct(v)}
        zero
        hauteur={230}
      />
      <div className="tableau-defilant">
        <table className="tableau compact">
          <thead>
            <tr>
              <th>{def.entete}</th>
              {ANNEES.map((a) => (
                <th key={a}>Solde {a}</th>
              ))}
              <th>Âge requis en 2070</th>
            </tr>
          </thead>
          <tbody>
            {vars.map((v, i) => (
              <tr key={v.valeur} className={v.retenue ? 'ligne-retenue' : undefined}>
                <td>
                  <span className="pastille" style={{ background: couleurs[i] }} /> {def.formatCourt(v.valeur)}
                  {v.valeur === def.reference ? ' (COR)' : ''}
                </td>
                {ANNEES.map((a) => (
                  <td key={a}>{pctSigne(solde(i, a))}</td>
                ))}
                <td>{ans(ages[i])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="note">
        Entre l’hypothèse la plus défavorable et la plus favorable, le solde 2070 varie de{' '}
        <strong>{pct(ecart2070)}</strong> du PIB.
      </p>
    </div>
  );
}

/** Le scénario choisi, simulé sous plusieurs hypothèses de productivité, de chômage et de natalité. */
export function Sensibilite({ parametres: immediats }: { parametres: ParametresUI }) {
  // Les 11 simulations suivent les curseurs sans bloquer la saisie.
  const parametres = useDeferredValue(immediats);
  return (
    <div className="sensibilite">
      <p className="chapeau">
        Mêmes mesures, hypothèses différentes : ces incertitudes ne dépendent pas (seulement) des choix politiques, mais
        elles pèsent sur l’équilibre autant que la plupart des mesures. La ligne « retenue » correspond à votre réglage
        actuel.
      </p>
      <div className="grille-sensibilite">
        {HYPOTHESES.map((def) => (
          <BlocHypothese key={def.cle} parametres={parametres} def={def} />
        ))}
      </div>
    </div>
  );
}
