import { cloneElement, useState, type ComponentProps, type ReactElement } from 'react';
import type { ResultatSimulation } from '../../engine';
import { ANNEE_DEBUT_HISTORIQUE, serieObservee } from '../historique';
import { Courbes, type Serie } from './Courbes';

type PropsCourbes = ComponentProps<typeof Courbes>;

interface Props {
  /** Graphique du solde (élément `<Courbes>`), tel qu'il serait affiché seul. */
  children: ReactElement<PropsCourbes>;
  /** Simulations dont on trace l'hypothèse de productivité (la première est la principale). */
  productivite: Array<{ nom: string; simulation: ResultatSimulation; couleur: string; pointille?: boolean }>;
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
export function SoldeProductivite({ children: solde, productivite, fourchette, historique }: Props) {
  const [survol, setSurvol] = useState<number | null>(null);
  const domaineX: [number, number] = [historique ? ANNEE_DEBUT_HISTORIQUE : 2025, 2070];
  const serie = (s: ResultatSimulation) => s.annees.map((r) => ({ x: r.annee, y: r.productivite }));

  // Une seule courbe si toutes les simulations partagent la même hypothèse.
  const distinctes = productivite.filter(
    (p, i) => i === 0 || p.simulation.annees.some((r, j) => Math.abs(r.productivite - productivite[0].simulation.annees[j].productivite) > 1e-9),
  );
  const series: Serie[] = [
    ...(historique ? [serieObservee('productivite', 'Observée')] : []),
    ...distinctes.map((p, i) => ({
      id: `prod-${i}`,
      nom: distinctes.length === 1 ? 'Hypothèse retenue' : p.nom,
      couleur: p.couleur,
      pointille: p.pointille,
      valeurs: serie(p.simulation),
    })),
  ];

  return (
    <div className="solde-productivite">
      {cloneElement(solde, { domaineX, survol, onSurvol: setSurvol })}
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
    </div>
  );
}
