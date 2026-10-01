import { useId, useState } from 'react';
import { graduations, useLargeur } from './useLargeur';

interface Props {
  annee: number;
  population: number[];
  retraites: number[];
  ageLegal: number;
  hauteur?: number;
}

const MARGE = { haut: 8, droite: 24, bas: 26, gauche: 56 };

/** Population par âge (sexes confondus), en distinguant retraités et non-retraités. */
export function Pyramide({ annee, population, retraites, ageLegal, hauteur = 320 }: Props) {
  const [ref, largeur] = useLargeur<HTMLDivElement>();
  const [survol, setSurvol] = useState<number | null>(null);
  const idTitre = useId();
  const ages = population.length;
  const l = largeur - MARGE.gauche - MARGE.droite;
  const h = hauteur - MARGE.haut - MARGE.bas;
  const ticksX = graduations(0, Math.max(...population) * 1.05, Math.max(2, Math.floor(l / 110)));
  const xMax = ticksX[ticksX.length - 1];
  const sx = (v: number) => MARGE.gauche + (v / xMax) * l;
  const hBarre = h / ages;
  const sy = (age: number) => MARGE.haut + h - (age + 1) * hBarre;

  return (
    <figure className="graphique" aria-labelledby={idTitre}>
      <figcaption id={idTitre}>
        <span className="graphique-titre">Population par âge en {annee}</span>
        <span className="graphique-sous-titre">Effectifs par âge simple, sexes confondus</span>
      </figcaption>
      <ul className="legende">
        <li>
          <span className="pastille carree" style={{ background: 'var(--series-1)' }} />
          Non retraités
        </li>
        <li>
          <span className="pastille carree" style={{ background: 'var(--series-2)' }} />
          Retraités
        </li>
      </ul>
      <div ref={ref} className="graphique-zone">
        <svg width={largeur} height={hauteur} role="img" aria-label={`Population par âge en ${annee}`}>
          {ticksX.map((t) => (
            <g key={t}>
              <line x1={sx(t)} x2={sx(t)} y1={MARGE.haut} y2={MARGE.haut + h} className="grille" />
              <text x={sx(t)} y={hauteur - 6} className="etiquette-axe" textAnchor="middle">
                {t === 0 ? '0' : `${(t / 1000).toFixed(0)} k`}
              </text>
            </g>
          ))}
          {[0, 20, 40, 60, 80, 100].map((a) => (
            <text key={a} x={MARGE.gauche - 8} y={sy(a) + hBarre / 2} className="etiquette-axe" textAnchor="end" dominantBaseline="middle">
              {a} ans
            </text>
          ))}
          {population.map((p, a) => {
            const r = retraites[a];
            const y = sy(a);
            const hb = Math.max(1, hBarre - 0.6);
            return (
              <g key={a} opacity={survol === null || survol === a ? 1 : 0.55}>
                <rect x={sx(0)} y={y} width={Math.max(0, sx(p - r) - sx(0))} height={hb} fill="var(--series-1)" />
                {r > 0 && <rect x={sx(p - r)} y={y} width={Math.max(0, sx(p) - sx(p - r))} height={hb} fill="var(--series-2)" />}
              </g>
            );
          })}
          <line x1={MARGE.gauche} x2={largeur - MARGE.droite} y1={sy(ageLegal) + hBarre} y2={sy(ageLegal) + hBarre} className="repere" />
          <text x={largeur - MARGE.droite} y={sy(ageLegal) + hBarre - 4} className="etiquette-repere" textAnchor="end">
            âge légal {ageLegal.toFixed(ageLegal % 1 ? 2 : 0).replace('.', ',')} ans
          </text>
          <rect
            x={0}
            y={MARGE.haut}
            width={largeur}
            height={h}
            fill="transparent"
            onPointerMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const age = Math.floor(((rect.bottom - e.clientY) / rect.height) * ages);
              setSurvol(Math.min(ages - 1, Math.max(0, age)));
            }}
            onPointerLeave={() => setSurvol(null)}
          />
        </svg>
        {survol !== null && (
          <div className="bulle" style={{ left: MARGE.gauche + 12, top: Math.max(0, sy(survol) - 70) }}>
            <div className="bulle-titre">{survol === ages - 1 ? `${survol} ans et plus` : `${survol} ans`}</div>
            <div className="bulle-ligne">
              <span className="pastille" style={{ background: 'var(--series-1)' }} />
              <span className="bulle-nom">Non retraités</span>
              <span className="bulle-valeur">{Math.round((population[survol] - retraites[survol]) / 1000).toLocaleString('fr-FR')} k</span>
            </div>
            <div className="bulle-ligne">
              <span className="pastille" style={{ background: 'var(--series-2)' }} />
              <span className="bulle-nom">Retraités</span>
              <span className="bulle-valeur">{Math.round(retraites[survol] / 1000).toLocaleString('fr-FR')} k</span>
            </div>
          </div>
        )}
      </div>
    </figure>
  );
}
