import { useId, useState } from 'react';
import { graduations, useLargeur } from './useLargeur';

export interface Serie {
  id: string;
  nom: string;
  /** Variable CSS de couleur, ex. `var(--series-1)`. */
  couleur: string;
  valeurs: ReadonlyArray<{ x: number; y: number }>;
  pointille?: boolean;
}

interface Props {
  titre: string;
  sousTitre?: string;
  series: Serie[];
  format: (v: number) => string;
  /** Inclure zéro dans l'échelle et tracer la ligne de zéro. */
  zero?: boolean;
  /** Valeurs supplémentaires à inclure dans l'échelle. */
  domaine?: [number, number];
  hauteur?: number;
  /** Marqueurs verticaux (ex. année d'élection). */
  reperes?: Array<{ x: number; libelle: string }>;
}

const MARGE = { haut: 12, droite: 16, bas: 26, gauche: 52 };

/** Graphique en courbes avec réticule et info-bulle au survol (une seule échelle verticale). */
export function Courbes({ titre, sousTitre, series, format, zero, domaine, hauteur = 220, reperes = [] }: Props) {
  const [ref, largeur] = useLargeur<HTMLDivElement>();
  const [survol, setSurvol] = useState<number | null>(null);
  const idTitre = useId();

  const xs = series[0]?.valeurs.map((v) => v.x) ?? [];
  const xMin = xs[0] ?? 0;
  const xMax = xs[xs.length - 1] ?? 1;
  let yMin = Math.min(...series.flatMap((s) => s.valeurs.map((v) => v.y)));
  let yMax = Math.max(...series.flatMap((s) => s.valeurs.map((v) => v.y)));
  if (zero) {
    yMin = Math.min(0, yMin);
    yMax = Math.max(0, yMax);
  }
  if (domaine) {
    yMin = Math.min(yMin, domaine[0]);
    yMax = Math.max(yMax, domaine[1]);
  }
  const ticks = graduations(yMin, yMax, 4);
  const y0 = ticks[0];
  const y1 = ticks[ticks.length - 1];

  const l = largeur - MARGE.gauche - MARGE.droite;
  const h = hauteur - MARGE.haut - MARGE.bas;
  const sx = (x: number) => MARGE.gauche + ((x - xMin) / (xMax - xMin || 1)) * l;
  const sy = (y: number) => MARGE.haut + (1 - (y - y0) / (y1 - y0 || 1)) * h;
  const ticksX = graduations(xMin, xMax, Math.max(3, Math.floor(l / 90))).filter((x) => x >= xMin && x <= xMax);

  const chemin = (s: Serie) => s.valeurs.map((v, i) => `${i ? 'L' : 'M'}${sx(v.x).toFixed(1)},${sy(v.y).toFixed(1)}`).join('');

  const surMouvement = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = xMin + ((e.clientX - rect.left) / rect.width) * (xMax - xMin);
    setSurvol(Math.round(Math.min(xMax, Math.max(xMin, x))));
  };

  const iSurvol = survol === null ? -1 : xs.indexOf(survol);
  const bulleAGauche = survol !== null && sx(survol) > largeur * 0.6;

  return (
    <figure className="graphique" aria-labelledby={idTitre}>
      <figcaption id={idTitre}>
        <span className="graphique-titre">{titre}</span>
        {sousTitre && <span className="graphique-sous-titre">{sousTitre}</span>}
      </figcaption>
      {series.length > 1 && (
        <ul className="legende">
          {series.map((s) => (
            <li key={s.id}>
              <svg width="18" height="8" aria-hidden="true">
                <line x1="1" x2="17" y1="4" y2="4" stroke={s.couleur} strokeWidth="2.5" strokeDasharray={s.pointille ? '4 3' : undefined} strokeLinecap="round" />
              </svg>
              {s.nom}
            </li>
          ))}
        </ul>
      )}
      <div ref={ref} className="graphique-zone">
        <svg width={largeur} height={hauteur} role="img" aria-label={titre}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={MARGE.gauche} x2={largeur - MARGE.droite} y1={sy(t)} y2={sy(t)} className={zero && t === 0 ? 'axe-zero' : 'grille'} />
              <text x={MARGE.gauche - 8} y={sy(t)} className="etiquette-axe" textAnchor="end" dominantBaseline="middle">
                {format(t)}
              </text>
            </g>
          ))}
          {ticksX.map((t) => (
            <text key={t} x={sx(t)} y={hauteur - 6} className="etiquette-axe" textAnchor="middle">
              {t}
            </text>
          ))}
          {reperes.map((r) => (
            <g key={r.x}>
              <line x1={sx(r.x)} x2={sx(r.x)} y1={MARGE.haut} y2={MARGE.haut + h} className="repere" />
              <text x={sx(r.x) + 4} y={MARGE.haut + 10} className="etiquette-repere">
                {r.libelle}
              </text>
            </g>
          ))}
          {series.map((s) => (
            <path key={s.id} d={chemin(s)} fill="none" stroke={s.couleur} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.pointille ? '5 4' : undefined} />
          ))}
          {iSurvol >= 0 && (
            <g>
              <line x1={sx(survol!)} x2={sx(survol!)} y1={MARGE.haut} y2={MARGE.haut + h} className="reticule" />
              {series.map((s) => (
                <circle key={s.id} cx={sx(survol!)} cy={sy(s.valeurs[iSurvol].y)} r={4.5} fill={s.couleur} className="point-survol" />
              ))}
            </g>
          )}
          <rect
            x={MARGE.gauche}
            y={0}
            width={l}
            height={hauteur}
            fill="transparent"
            onPointerMove={surMouvement}
            onPointerDown={surMouvement}
            onPointerLeave={() => setSurvol(null)}
          />
        </svg>
        {iSurvol >= 0 && (
          <div
            className="bulle"
            style={{
              left: bulleAGauche ? undefined : sx(survol!) + 12,
              right: bulleAGauche ? largeur - sx(survol!) + 12 : undefined,
              top: MARGE.haut,
            }}
          >
            <div className="bulle-titre">{survol}</div>
            {series.map((s) => (
              <div key={s.id} className="bulle-ligne">
                <span className="pastille" style={{ background: s.couleur }} />
                <span className="bulle-nom">{s.nom}</span>
                <span className="bulle-valeur">{format(s.valeurs[iSurvol].y)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </figure>
  );
}
