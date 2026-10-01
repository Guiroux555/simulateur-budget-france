import { useId, useState } from 'react';
import { graduations, useLargeur } from './useLargeur';

export interface Serie {
  id: string;
  nom: string;
  /** Variable CSS de couleur, ex. `var(--series-1)`. */
  couleur: string;
  /** Points triés par x croissant ; les séries peuvent couvrir des périodes différentes. */
  valeurs: ReadonlyArray<{ x: number; y: number }>;
  pointille?: boolean;
  /** Épaisseur du trait (2 par défaut). */
  epaisseur?: number;
  /** Valeurs approximatives (affichées « ≈ » dans l'info-bulle) ; points d'ancrage marqués. */
  approximatif?: boolean;
}

export interface RepereReforme {
  annee: number;
  court: string;
  nom: string;
}

/** Zone d'incertitude entre deux bornes (mêmes abscisses). */
export interface Bande {
  nom: string;
  couleur: string;
  bas: ReadonlyArray<{ x: number; y: number }>;
  haut: ReadonlyArray<{ x: number; y: number }>;
}

interface Props {
  titre: string;
  bande?: Bande;
  sousTitre?: string;
  series: Serie[];
  format: (v: number) => string;
  /** Inclure zéro dans l'échelle et tracer la ligne de zéro. */
  zero?: boolean;
  /** Valeurs supplémentaires à inclure dans l'échelle. */
  domaine?: [number, number];
  hauteur?: number;
  /** Marqueurs verticaux simples (ex. entrée en vigueur des mesures). */
  reperes?: Array<{ x: number; libelle: string }>;
  /** Réformes passées, affichées en repères étiquetés au-dessus du tracé. */
  reformes?: RepereReforme[];
  /** Année séparant l'observé (fond grisé) de la projection. */
  separation?: number;
}

const MARGE = { haut: 12, droite: 16, bas: 26, gauche: 52 };
const HAUTEUR_REFORMES = 40;

/** Valeur d'une série en x (interpolation linéaire), ou null hors de sa période. */
function valeurEn(s: Serie, x: number): number | null {
  const v = s.valeurs;
  if (!v.length || x < v[0].x || x > v[v.length - 1].x) return null;
  for (let i = 0; i < v.length; i++) {
    if (v[i].x === x) return v[i].y;
    if (v[i].x > x) {
      const a = v[i - 1];
      const b = v[i];
      return a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
    }
  }
  return null;
}

const LARGEUR_CARACTERE = 5.8;
const RANGS = 3;

/**
 * Place les étiquettes des réformes sur au plus trois rangées sans chevauchement ;
 * une réforme sans place garde son repère vertical (nom visible au survol).
 */
function placerEtiquettes(reformes: RepereReforme[], sx: (x: number) => number, largeur: number) {
  const finRang = Array<number>(RANGS).fill(-Infinity);
  return reformes.map((reforme) => {
    const x = sx(reforme.annee);
    const l = reforme.court.length * LARGEUR_CARACTERE;
    const ancre: 'start' | 'middle' | 'end' = x + l / 2 > largeur - 4 ? 'end' : x - l / 2 < MARGE.gauche - 20 ? 'start' : 'middle';
    const gauche = ancre === 'start' ? x : ancre === 'end' ? x - l : x - l / 2;
    const rang = finRang.findIndex((fin) => gauche > fin + 4);
    if (rang >= 0) finRang[rang] = gauche + l;
    return { reforme, rang: rang >= 0 ? rang : null, ancre };
  });
}

/** Graphique en courbes avec réticule et info-bulle au survol (une seule échelle verticale). */
export function Courbes({ titre, sousTitre, series, bande, format, zero, domaine, hauteur = 220, reperes = [], reformes = [], separation }: Props) {
  const [ref, largeur] = useLargeur<HTMLDivElement>();
  const [survol, setSurvol] = useState<number | null>(null);
  const idTitre = useId();

  const tousX = series.flatMap((s) => s.valeurs.map((v) => v.x));
  const xMin = Math.min(...tousX);
  const xMax = Math.max(...tousX);
  const reformesVisibles = reformes.filter((r) => r.annee >= xMin && r.annee <= xMax);
  const haut = MARGE.haut + (reformesVisibles.length ? HAUTEUR_REFORMES : 0);

  const tousY = [...series, ...(bande ? [{ valeurs: bande.bas }, { valeurs: bande.haut }] : [])].flatMap((s) => s.valeurs.map((v) => v.y));
  let yMin = Math.min(...tousY);
  let yMax = Math.max(...tousY);
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
  const h = hauteur - haut - MARGE.bas;
  const sx = (x: number) => MARGE.gauche + ((x - xMin) / (xMax - xMin || 1)) * l;
  const sy = (y: number) => haut + (1 - (y - y0) / (y1 - y0 || 1)) * h;
  const ticksX = graduations(xMin, xMax, Math.max(3, Math.floor(l / 80))).filter((x) => x >= xMin && x <= xMax);

  const chemin = (s: Serie) => s.valeurs.map((v, i) => `${i ? 'L' : 'M'}${sx(v.x).toFixed(1)},${sy(v.y).toFixed(1)}`).join('');

  const surMouvement = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = xMin + ((e.clientX - rect.left) / rect.width) * (xMax - xMin);
    setSurvol(Math.round(Math.min(xMax, Math.max(xMin, x))));
  };

  const bulleAGauche = survol !== null && sx(survol) > largeur * 0.55;
  const reformeSurvolee = survol === null ? undefined : reformesVisibles.find((r) => r.annee === survol);

  return (
    <figure className="graphique" aria-labelledby={idTitre}>
      <figcaption id={idTitre}>
        <span className="graphique-titre">{titre}</span>
        {sousTitre && <span className="graphique-sous-titre">{sousTitre}</span>}
      </figcaption>
      {(series.length > 1 || bande) && (
        <ul className="legende">
          {series.map((s) => (
            <li key={s.id}>
              <svg width="18" height="8" aria-hidden="true">
                <line x1="1" x2="17" y1="4" y2="4" stroke={s.couleur} strokeWidth="2.5" strokeDasharray={s.pointille ? '4 3' : undefined} strokeLinecap="round" />
              </svg>
              {s.nom}
            </li>
          ))}
          {bande && (
            <li>
              <span className="pastille carree" style={{ background: bande.couleur, opacity: 0.3 }} />
              {bande.nom}
            </li>
          )}
        </ul>
      )}
      <div ref={ref} className="graphique-zone">
        <svg width={largeur} height={hauteur} role="img" aria-label={titre}>
          {separation !== undefined && separation > xMin && separation <= xMax && (
            <g>
              <rect x={sx(xMin)} y={haut} width={sx(separation) - sx(xMin)} height={h} className="zone-observee" />
              <text x={sx(separation) - 4} y={haut + h - 6} className="etiquette-repere" textAnchor="end">
                observé
              </text>
              <text x={sx(separation) + 4} y={haut + h - 6} className="etiquette-repere">
                projection
              </text>
            </g>
          )}
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
          {placerEtiquettes(reformesVisibles, sx, largeur).map(({ reforme: r, rang, ancre }) => {
            const x = sx(r.annee);
            const yEtiquette = MARGE.haut + 2 + (rang ?? 0) * 12;
            return (
              <g key={r.annee} className={reformeSurvolee === r ? 'reforme active' : 'reforme'}>
                <line x1={x} x2={x} y1={rang === null ? haut : yEtiquette + 3} y2={haut + h} className="repere-reforme" />
                {rang !== null && (
                  <text x={x} y={yEtiquette} className="etiquette-reforme" textAnchor={ancre} dominantBaseline="middle">
                    {r.court}
                  </text>
                )}
              </g>
            );
          })}
          {reperes.map((r) => (
            <g key={r.x}>
              <line x1={sx(r.x)} x2={sx(r.x)} y1={haut} y2={haut + h} className="repere" />
              <text x={sx(r.x) + 4} y={haut + 10} className="etiquette-repere">
                {r.libelle}
              </text>
            </g>
          ))}
          {bande && (
            <path
              d={
                bande.haut.map((v, i) => `${i ? 'L' : 'M'}${sx(v.x).toFixed(1)},${sy(v.y).toFixed(1)}`).join('') +
                [...bande.bas].reverse().map((v) => `L${sx(v.x).toFixed(1)},${sy(v.y).toFixed(1)}`).join('') +
                'Z'
              }
              fill={bande.couleur}
              opacity={0.16}
            />
          )}
          {series.map((s) => (
            <g key={s.id}>
              <path d={chemin(s)} fill="none" stroke={s.couleur} strokeWidth={s.epaisseur ?? 2} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.pointille ? '5 4' : undefined} />
              {s.approximatif &&
                s.valeurs.map((v) => <circle key={v.x} cx={sx(v.x)} cy={sy(v.y)} r={2.5} fill={s.couleur} className="point-ancrage" />)}
            </g>
          ))}
          {survol !== null && (
            <g>
              <line x1={sx(survol)} x2={sx(survol)} y1={haut} y2={haut + h} className="reticule" />
              {series.map((s) => {
                const y = valeurEn(s, survol);
                return y === null ? null : <circle key={s.id} cx={sx(survol)} cy={sy(y)} r={4.5} fill={s.couleur} className="point-survol" />;
              })}
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
        {survol !== null && (
          <div
            className="bulle"
            style={{
              left: bulleAGauche ? undefined : sx(survol) + 12,
              right: bulleAGauche ? largeur - sx(survol) + 12 : undefined,
              top: haut,
            }}
          >
            <div className="bulle-titre">{survol}</div>
            {reformeSurvolee && <div className="bulle-reforme">{reformeSurvolee.nom}</div>}
            {bande &&
              (() => {
                const b = valeurEn({ id: '', nom: '', couleur: '', valeurs: bande.bas }, survol);
                const h = valeurEn({ id: '', nom: '', couleur: '', valeurs: bande.haut }, survol);
                return b === null || h === null ? null : (
                  <div className="bulle-ligne">
                    <span className="pastille carree" style={{ background: bande.couleur, opacity: 0.3 }} />
                    <span className="bulle-nom">{bande.nom}</span>
                    <span className="bulle-valeur">
                      {format(Math.min(b, h))} à {format(Math.max(b, h))}
                    </span>
                  </div>
                );
              })()}
            {series.map((s) => {
              const y = valeurEn(s, survol);
              if (y === null) return null;
              return (
                <div key={s.id} className="bulle-ligne">
                  <span className="pastille" style={{ background: s.couleur }} />
                  <span className="bulle-nom">{s.nom}</span>
                  <span className="bulle-valeur">
                    {s.approximatif ? '≈ ' : ''}
                    {format(y)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </figure>
  );
}
