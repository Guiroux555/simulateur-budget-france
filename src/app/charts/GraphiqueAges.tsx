import type { ResultatSimulation } from '../../engine';
import { AGE_ENTREE_VIE_ACTIVE_PROJETE, HISTORIQUE, PART_SANS_INCAPACITE_65 } from '../../engine/donnees/historique';
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
export function GraphiqueAges({ simulation, reference, historique, hauteur = 400 }: Props) {
  const proj = (f: (r: ResultatSimulation['annees'][number]) => number, s = simulation) => s.annees.map((r) => ({ x: r.annee, y: f(r) }));
  const fin = ANNEE_PROJECTION - 1;
  const e60Observee = historique ? annuel(HISTORIQUE.esperanceVie60.points.map(([a, v]) => [a, 60 + v] as const), ANNEE_DEBUT_HISTORIQUE, fin) : [];
  const departObserve = historique ? annuel(HISTORIQUE.ageMoyenDepart.points, ANNEE_DEBUT_HISTORIQUE, fin) : [];
  const e60 = [...e60Observee, ...proj((r) => 60 + r.esperanceVie60)];
  const depart = [...departObserve, ...proj((r) => r.ageMoyenDepart)];
  // Âge atteint sans incapacité par les personnes de 65 ans : observé (DREES, depuis 2008), puis
  // projeté en supposant constante la part des années vécues sans incapacité.
  const pointsSante = HISTORIQUE.esperanceVieSansIncapacite65.points;
  const santeObservee = historique ? annuel(pointsSante.map(([a, v]) => [a, 65 + v] as const), pointsSante[0][0], fin) : [];
  const santeProjetee = proj((r) => 65 + PART_SANS_INCAPACITE_65 * r.esperanceVie65);
  const sante = [...santeObservee, ...santeProjetee];

  // Âge d'entrée dans la vie active : observé (ordres de grandeur), puis hypothèse de stabilité.
  const entreeObservee = historique ? annuel(HISTORIQUE.ageEntreeVieActive.points, ANNEE_DEBUT_HISTORIQUE, fin) : [];
  const entreeProjetee = proj(() => AGE_ENTREE_VIE_ACTIVE_PROJETE);
  const entree = [...entreeObservee, ...entreeProjetee];

  const series: Serie[] = [
    ...(historique
      ? [{ id: 'entree-obs', nom: 'Entrée dans la vie active, observée', couleur: 'var(--series-5)', approximatif: true, valeurs: HISTORIQUE.ageEntreeVieActive.points.map(([x, y]) => ({ x, y })) }]
      : []),
    { id: 'entree-proj', nom: 'Entrée dans la vie active, hypothèse', couleur: 'var(--series-5)', pointille: true, valeurs: entreeProjetee },
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
    ...(historique
      ? [
          {
            id: 'sante-obs',
            nom: 'Âge atteint sans incapacité, observé',
            couleur: 'var(--series-7)',
            approximatif: true,
            valeurs: pointsSante.map(([x, y]) => ({ x, y: 65 + y })),
          },
        ]
      : []),
    {
      id: 'sante-proj',
      nom: 'Âge atteint sans incapacité, projeté',
      couleur: 'var(--series-7)',
      pointille: true,
      valeurs: santeProjetee,
    },
  ];

  // Zone « durée de retraite » sur les années communes aux deux courbes.
  const annees = new Set(depart.map((p) => p.x));
  const haut = e60.filter((p) => annees.has(p.x));
  const xs = new Set(haut.map((p) => p.x));
  const bas = depart.filter((p) => xs.has(p.x));
  const anneesSante = new Set(sante.map((p) => p.x));
  const hautSante = sante.filter((p) => annees.has(p.x));
  const basSante = depart.filter((p) => anneesSante.has(p.x));

  const anneesEntree = new Set(entree.map((p) => p.x));
  const hautCarriere = depart.filter((p) => anneesEntree.has(p.x));
  const xsCarriere = new Set(hautCarriere.map((p) => p.x));
  const basCarriere = entree.filter((p) => xsCarriere.has(p.x));

  return (
    <Courbes
      titre="Vie active, départ et espérance de vie"
      sousTitre="Zones colorées : vie active (de l’âge moyen d’entrée à l’âge moyen de départ, indicatif : générations différentes), durée moyenne de retraite (jusqu’à l’âge atteint en moyenne par les personnes de 60 ans), dont années sans incapacité (DREES)"
      series={series}
      bande={[
        { nom: 'Vie active', couleur: 'var(--series-5)', bas: basCarriere, haut: hautCarriere, formatValeur: (b, h) => ans(h - b), opacite: 0.1 },
        { nom: 'Durée de retraite', couleur: 'var(--series-3)', bas, haut, formatValeur: (b, h) => ans(h - b) },
        { nom: 'dont sans incapacité', couleur: 'var(--series-7)', bas: basSante, haut: hautSante, formatValeur: (b, h) => ans(h - b), opacite: 0.2 },
      ]}
      {...(historique ? { separation: ANNEE_PROJECTION, reformes: REPERES_REFORMES } : {})}
      format={(v) => ans(v)}
      formatAxe={(v) => v.toFixed(0)}
      domaine={[14, 92]}
      hauteur={hauteur}
    />
  );
}
