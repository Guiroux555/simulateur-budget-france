import { cloneElement, useState, type ComponentProps, type ReactElement } from 'react';
import type { ResultatSimulation } from '../../engine';
import { ANNEE_DEBUT_HISTORIQUE, serieObservee } from '../historique';
import { LIBELLE_TENDANCE, SOURCES_PRODUCTIVITE, TENDANCE_OBSERVEE } from '../productivite';
import { Courbes, type Serie } from '../../../../commun/charts/Courbes';

type PropsCourbes = ComponentProps<typeof Courbes>;

interface Props {
  /** Graphique du solde (élément `<Courbes>`), tel qu'il serait affiché seul. */
  children: ReactElement<PropsCourbes>;
  /** Simulations dont on trace l'hypothèse de productivité (la première est la principale). */
  productivite: Array<{ nom: string; simulation: ResultatSimulation; couleur: string; pointille?: boolean }>;
  /** Même scénario simulé avec la tendance observée de productivité, tracé sur le solde. */
  soldeTendance?: ResultatSimulation;
  /** Fourchette de productivité testée (hypothèses défavorable et favorable). */
  fourchette?: { nom: string; bas: ResultatSimulation; haut: ResultatSimulation };
  historique: boolean;
}

const pctAn = (v: number) => `${(v * 100).toFixed(1).replace('.', ',')} %`;

/**
 * Solde du système et, juste en dessous sur le même axe des années, la croissance de la
 * productivité : deux grandeurs d'unités différentes, donc deux panneaux alignés plutôt
 * qu'un double axe. Le survol est synchronisé.
 */
export function SoldeProductivite({ children: solde, productivite, soldeTendance, fourchette, historique }: Props) {
  const [survol, setSurvol] = useState<number | null>(null);
  const domaineX: [number, number] = [historique ? ANNEE_DEBUT_HISTORIQUE : 2025, 2070];
  const serie = (s: ResultatSimulation) => s.annees.map((r) => ({ x: r.annee, y: r.productivite }));

  // Une seule courbe si toutes les simulations partagent la même hypothèse.
  const distinctes = productivite.filter(
    (p, i) => i === 0 || p.simulation.annees.some((r, j) => Math.abs(r.productivite - productivite[0].simulation.annees[j].productivite) > 1e-9),
  );
  const t = TENDANCE_OBSERVEE;
  const tendance = [
    { x: t.anneeDepart, y: t.depart / 100 },
    { x: t.anneeConvergence, y: t.longTerme / 100 },
    { x: 2070, y: t.longTerme / 100 },
  ];
  const suitTendance = (sim: ResultatSimulation) =>
    [2025, t.anneeConvergence, 2070].every((a) => {
      const r = sim.annees.find((x) => x.annee === a)!;
      const attendu = tendance.find((p) => p.x >= a)!;
      const avant = [...tendance].reverse().find((p) => p.x <= a)!;
      const y = attendu.x === avant.x ? attendu.y : avant.y + ((attendu.y - avant.y) * (a - avant.x)) / (attendu.x - avant.x);
      return Math.abs(r.productivite - y) < 1e-9;
    });
  const tendanceDejaTracee = distinctes.some((p) => suitTendance(p.simulation));
  const series: Serie[] = [
    ...(historique ? [serieObservee('productivite', 'Observée')] : []),
    ...(tendanceDejaTracee ? [] : [{ id: 'tendance', nom: LIBELLE_TENDANCE, couleur: 'var(--series-3)', pointille: true, valeurs: tendance }]),
    ...distinctes.map((p, i) => ({
      id: `prod-${i}`,
      nom: p.nom,
      couleur: p.couleur,
      pointille: p.pointille,
      valeurs: serie(p.simulation),
    })),
  ];

  return (
    <div className="solde-productivite">
      {cloneElement(solde, {
        domaineX,
        survol,
        onSurvol: setSurvol,
        series:
          soldeTendance && !suitTendance(productivite[0].simulation)
            ? [
                ...solde.props.series,
                {
                  id: 'solde-tendance',
                  nom: `Même scénario, productivité selon la tendance observée (${t.longTerme.toFixed(1).replace('.', ',')} %)`,
                  couleur: 'var(--series-3)',
                  pointille: true,
                  valeurs: soldeTendance.annees.map((r) => ({ x: r.annee, y: r.soldePctPib })),
                },
              ]
            : solde.props.series,
      })}
      <Courbes
        titre="Gains de productivité du travail"
        sousTitre="Croissance annuelle — moteur des salaires, donc des cotisations ; les pensions, elles, suivent les prix"
        series={series}
        bande={
          fourchette
            ? { nom: fourchette.nom, couleur: 'var(--series-1)', bas: serie(fourchette.bas), haut: serie(fourchette.haut) }
            : undefined
        }
        format={pctAn}
        zero
        domaine={[0, 0.015]}
        hauteur={170}
        separation={solde.props.separation}
        domaineX={domaineX}
        survol={survol}
        onSurvol={setSurvol}
      />
      <details className="sources">
        <summary>D’où viennent ces hypothèses ?</summary>
        <p>
          La projection de référence reprend l’hypothèse de <strong>long terme du COR</strong> (0,7 % par an). La
          transition 2025-2032 est une <strong>simplification du simulateur</strong>, calée pour reproduire les soldes
          publiés par le COR ; le COR indique viser ce rythme à partir de 2040 environ. La{' '}
          <strong>tendance observée</strong> part du niveau quasi nul de {t.anneeDepart} et rejoint en {t.anneeConvergence}{' '}
          la moyenne {t.periode[0]}-{t.periode[1]} ({t.longTerme.toFixed(1).replace('.', ',')} % par an) : c’est un simple
          prolongement du passé récent, pas une prévision.
        </p>
        <ul>
          {SOURCES_PRODUCTIVITE.map((src) => (
            <li key={src.nom}>
              <a href={src.url} target="_blank" rel="noreferrer">
                {src.nom}
              </a>{' '}
              : {src.hypothese}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
