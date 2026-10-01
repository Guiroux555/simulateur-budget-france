import type { ResultatSimulation } from '../../engine';
import { HISTORIQUE } from '../../engine/donnees/historique';
import { ans } from '../format';
import { ANNEE_DEBUT_HISTORIQUE, ANNEE_PROJECTION, REPERES_REFORMES, serieObservee } from '../historique';
import { Courbes, type Serie } from './Courbes';

interface Props {
  /** Scénario affiché. */
  simulation: ResultatSimulation;
  /** Législation actuelle, tracée en pointillés pour comparaison (mode expert). */
  reference?: ResultatSimulation;
  historique: boolean;
  hauteur?: number;
}

/** Valeurs annuelles interpolées entre des points d'ancrage. */
function annuel(points: ReadonlyArray<readonly [number, number]>, de: number, a: number) {
  const out: Array<{ x: number; y: number }> = [];
  for (let x = de; x <= a; x++) {
    const i = points.findIndex(([px]) => px >= x);
    if (i < 0) break;
    if (i === 0) {
      if (points[0][0] === x) out.push({ x, y: points[0][1] });
      continue;
    }
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    out.push({ x, y: y0 + ((y1 - y0) * (x - x0)) / (x1 - x0) });
  }
  return out;
}

/**
 * Âge légal, âge moyen de départ et espérance de vie à 60 ans exprimée en âge atteint
 * (60 + espérance de vie à 60 ans) : l'écart entre les deux courbes est la durée moyenne de retraite.
 */
export function GraphiqueAges({ simulation, reference, historique, hauteur = 340 }: Props) {
  const proj = (f: (r: ResultatSimulation['annees'][number]) => number, s = simulation) => s.annees.map((r) => ({ x: r.annee, y: f(r) }));
  const fin = ANNEE_PROJECTION - 1;
  const e60Observee = historique ? annuel(HISTORIQUE.esperanceVie60.points.map(([a, v]) => [a, 60 + v] as const), ANNEE_DEBUT_HISTORIQUE, fin) : [];
  const departObserve = historique ? annuel(HISTORIQUE.ageMoyenDepart.points, ANNEE_DEBUT_HISTORIQUE, fin) : [];
  const e60 = [...e60Observee, ...proj((r) => 60 + r.esperanceVie60)];
  const depart = [...departObserve, ...proj((r) => r.ageMoyenDepart)];

  const series: Serie[] = [
    ...(historique ? [serieObservee('ageMoyenDepart', 'Âge de départ observé')] : []),
    {
      id: 'legal',
      nom: 'Âge légal',
      couleur: 'var(--series-2)',
      valeurs: [...(historique ? serieObservee('ageLegal').valeurs : []), ...proj((r) => r.ageLegal)],
      pointille: true,
    },
    ...(reference
      ? [{ id: 'ref', nom: 'Départ, législation actuelle', couleur: 'var(--ref)', valeurs: proj((r) => r.ageMoyenDepart, reference), pointille: true }]
      : []),
    { id: 'moyen', nom: reference ? 'Départ, scénario' : 'Âge de départ projeté', couleur: 'var(--series-1)', valeurs: proj((r) => r.ageMoyenDepart) },
    { id: 'e60', nom: 'Espérance de vie à 60 ans (âge atteint)', couleur: 'var(--series-3)', valeurs: e60 },
  ];

  // Zone « durée de retraite » sur les années communes aux deux courbes.
  const annees = new Set(depart.map((p) => p.x));
  const haut = e60.filter((p) => annees.has(p.x));
  const xs = new Set(haut.map((p) => p.x));
  const bas = depart.filter((p) => xs.has(p.x));

  return (
    <Courbes
      titre="Âge de départ et espérance de vie"
      sousTitre="La zone colorée représente la durée moyenne de retraite : de l’âge de départ à l’âge atteint en moyenne par les personnes de 60 ans"
      series={series}
      bande={{
        nom: 'Durée de retraite',
        couleur: 'var(--series-3)',
        bas,
        haut,
        formatValeur: (b, h) => ans(h - b),
      }}
      {...(historique ? { separation: ANNEE_PROJECTION, reformes: REPERES_REFORMES } : {})}
      format={(v) => ans(v)}
      formatAxe={(v) => v.toFixed(0)}
      domaine={[60, 90]}
      hauteur={hauteur}
    />
  );
}
