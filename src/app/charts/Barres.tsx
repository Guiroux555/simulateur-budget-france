import { useId, useState } from 'react';
import { graduations, useLargeur } from './useLargeur';

export interface Barre {
  id: string;
  libelle: string;
  valeur: number;
  couleur: string;
  /** Segment empilé optionnel (ex. financement de l'État), dessiné après la valeur. */
  complement?: { valeur: number; couleur: string; libelle: string; texte?: string };
  /** Texte additionnel de l'info-bulle. */
  detail?: string;
}

interface Props {
  titre: string;
  sousTitre?: string;
  barres: Barre[];
  format: (v: number) => string;
  /** Repère vertical (ex. 1 cotisant par retraité). */
  repere?: { valeur: number; libelle: string };
  selection?: string | null;
  onSelect?: (id: string) => void;
  legende?: Array<{ libelle: string; couleur: string; motif?: boolean }>;
}

const HAUTEUR_BARRE = 26;
const ECART = 8;
const MARGE = { haut: 8, droite: 70, bas: 24 };

/** Barres horizontales (valeurs positives et négatives), avec étiquettes directes et sélection. */
export function Barres({ titre, sousTitre, barres, format, repere, selection, onSelect, legende }: Props) {
  const [ref, largeur] = useLargeur<HTMLDivElement>();
  const [survol, setSurvol] = useState<string | null>(null);
  const idTitre = useId();
  const etroit = largeur < 560;
  const gauche = etroit ? 8 : Math.min(260, largeur * 0.36);
  const hauteurLigne = HAUTEUR_BARRE + ECART + (etroit ? 16 : 0);
  const hauteur = MARGE.haut + barres.length * hauteurLigne + MARGE.bas;

  const valeurs = barres.flatMap((b) => [b.valeur, b.valeur + (b.complement?.valeur ?? 0)]);
  const min = Math.min(0, ...valeurs, repere?.valeur ?? 0);
  const max = Math.max(0, ...valeurs, repere?.valeur ?? 0);
  const ticks = graduations(min, max, Math.max(3, Math.floor((largeur - gauche) / 110)));
  const x0 = ticks[0];
  const x1 = ticks[ticks.length - 1];
  const l = largeur - gauche - MARGE.droite;
  const sx = (v: number) => gauche + ((v - x0) / (x1 - x0 || 1)) * l;
  const idMotif = `motif-${idTitre.replace(/:/g, '')}`;

  return (
    <figure className="graphique" aria-labelledby={idTitre}>
      <figcaption id={idTitre}>
        <span className="graphique-titre">{titre}</span>
        {sousTitre && <span className="graphique-sous-titre">{sousTitre}</span>}
      </figcaption>
      {legende && (
        <ul className="legende">
          {legende.map((e) => (
            <li key={e.libelle}>
              <span
                className="pastille carree"
                style={{ background: e.motif ? `repeating-linear-gradient(45deg, ${e.couleur} 0 2px, transparent 2px 5px)` : e.couleur, outline: e.motif ? `1px solid ${e.couleur}` : undefined }}
              />
              {e.libelle}
            </li>
          ))}
        </ul>
      )}
      <div ref={ref} className="graphique-zone">
        <svg width={largeur} height={hauteur} role="img" aria-label={titre}>
          <defs>
            <pattern id={idMotif} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="var(--surface-1)" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="3" />
            </pattern>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={sx(t)} x2={sx(t)} y1={MARGE.haut} y2={hauteur - MARGE.bas} className={t === 0 ? 'axe-zero' : 'grille'} />
              <text x={sx(t)} y={hauteur - 6} className="etiquette-axe" textAnchor="middle">
                {format(t)}
              </text>
            </g>
          ))}
          {repere && (
            <g>
              <line x1={sx(repere.valeur)} x2={sx(repere.valeur)} y1={MARGE.haut} y2={hauteur - MARGE.bas} className="repere" />
              <text x={sx(repere.valeur) + 4} y={MARGE.haut + 8} className="etiquette-repere">
                {repere.libelle}
              </text>
            </g>
          )}
          {barres.map((b, i) => {
            const yLigne = MARGE.haut + i * hauteurLigne;
            const y = yLigne + (etroit ? 16 : 0);
            const xa = sx(Math.min(0, b.valeur));
            const xb = sx(Math.max(0, b.valeur));
            const fin = b.valeur + (b.complement?.valeur ?? 0);
            const actif = selection === b.id || survol === b.id;
            const estompe = selection && selection !== b.id;
            return (
              <g
                key={b.id}
                className={`ligne-barre${onSelect ? ' cliquable' : ''}`}
                opacity={estompe ? 0.45 : 1}
                onPointerEnter={() => setSurvol(b.id)}
                onPointerLeave={() => setSurvol(null)}
                onClick={() => onSelect?.(b.id)}
                role={onSelect ? 'button' : undefined}
                tabIndex={onSelect ? 0 : undefined}
                aria-label={`${b.libelle} : ${format(b.valeur)}`}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect?.(b.id)}
              >
                <rect x={0} y={yLigne} width={largeur} height={hauteurLigne} fill="transparent" />
                <text
                  x={etroit ? 8 : gauche - 10}
                  y={etroit ? yLigne + 10 : y + HAUTEUR_BARRE / 2}
                  textAnchor={etroit ? 'start' : 'end'}
                  dominantBaseline="middle"
                  className={`etiquette-barre${actif ? ' active' : ''}`}
                >
                  {b.libelle}
                </text>
                {b.valeur !== 0 && <rect x={xa} y={y} width={Math.max(1, xb - xa)} height={HAUTEUR_BARRE} rx={3} fill={b.couleur} />}
                {b.complement && b.complement.valeur !== 0 && (
                  <rect
                    x={sx(Math.min(b.valeur, fin))}
                    y={y}
                    width={Math.abs(sx(fin) - sx(b.valeur))}
                    height={HAUTEUR_BARRE}
                    rx={3}
                    fill={`url(#${idMotif})`}
                    style={{ color: b.complement.couleur }}
                    stroke={b.complement.couleur}
                  />
                )}
                <text
                  x={sx(Math.max(0, fin, b.valeur)) + 6}
                  y={y + HAUTEUR_BARRE / 2}
                  dominantBaseline="middle"
                  className="valeur-barre"
                >
                  {format(b.valeur)}
                  {b.complement && b.complement.valeur !== 0 ? ` (${b.complement.texte ?? `+${format(b.complement.valeur)}`})` : ''}
                </text>
                {actif && b.detail && <title>{b.detail}</title>}
              </g>
            );
          })}
        </svg>
      </div>
    </figure>
  );
}
