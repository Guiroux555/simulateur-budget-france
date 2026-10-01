import { useId, useState } from 'react';
import { BoutonAide } from '../aideContexte';
import { ratioActifsInactifs, type EtatPyramide } from '../pyramidesHistoriques';
import { graduations, useLargeur } from './useLargeur';

interface Props {
  resultat: EtatPyramide;
  /** Résultat de la même année dans le scénario de référence, pour comparer le ratio. */
  reference?: EtatPyramide;
  hauteur?: number;
}

const MARGE = { haut: 8, droite: 24, bas: 26, gauche: 56 };

const CATEGORIES = [
  { id: 'cotisants', nom: 'Actifs en emploi (cotisants)', couleur: 'var(--series-1)' },
  { id: 'autres', nom: 'Ni en emploi ni retraités (jeunes, chômeurs, inactifs)', couleur: 'var(--autres)' },
  { id: 'retraites', nom: 'Retraités', couleur: 'var(--series-2)' },
] as const;

const virgule = (v: number, d = 2) => v.toFixed(d).replace('.', ',');
const millions = (v: number) => `${virgule(v / 1e6, 1)} M`;

/**
 * Population par âge (sexes confondus) répartie entre actifs en emploi, retraités et autres,
 * avec le nombre d'actifs en emploi pour un retraité.
 */
export function Pyramide({ resultat: r, reference, hauteur = 320 }: Props) {
  const [ref, largeur] = useLargeur<HTMLDivElement>();
  const [survol, setSurvol] = useState<number | null>(null);
  const idTitre = useId();
  const population = r.pyramide;
  const ages = population.length;
  const l = largeur - MARGE.gauche - MARGE.droite;
  const h = hauteur - MARGE.haut - MARGE.bas;
  // Échelle fixe pour que l’animation 1985-2070 reste comparable d’une année à l’autre.
  const ticksX = graduations(0, Math.max(1_000_000, ...population), Math.max(2, Math.floor(l / 110)));
  const xMax = ticksX[ticksX.length - 1];
  const sx = (v: number) => MARGE.gauche + (v / xMax) * l;
  const hBarre = h / ages;
  const sy = (age: number) => MARGE.haut + h - (age + 1) * hBarre;

  const parAge = (a: number) => {
    const cotisants = r.pyramideCotisants[a];
    const retraites = r.pyramideRetraites[a];
    return { cotisants, retraites, autres: Math.max(0, population[a] - cotisants - retraites) };
  };
  const autresTotal = r.population - r.cotisants - r.retraites;

  return (
    <figure className="graphique" aria-labelledby={idTitre}>
      <figcaption id={idTitre}>
        <span className="graphique-titre">
          Population par âge en {r.annee}
          <BoutonAide cle="pyramide" />
        </span>
        <span className="graphique-sous-titre">
          Effectifs par âge simple, sexes confondus{r.reconstitue ? ' — année passée reconstituée (ordres de grandeur)' : ''}
        </span>
      </figcaption>

      <div className="ratio-pyramide" aria-live="polite">
        <div className="ratio-principal">
          <span className="ratio-valeur">{virgule(r.ratioCotisantsRetraites)}</span>
          <span className="ratio-libelle">
            actif en emploi pour 1 retraité
            {reference && Math.abs(reference.ratioCotisantsRetraites - r.ratioCotisantsRetraites) > 0.005 && (
              <span className="ratio-ref"> (législation actuelle : {virgule(reference.ratioCotisantsRetraites)})</span>
            )}
          </span>
        </div>
        <div className="ratio-principal">
          <span className="ratio-valeur secondaire">{virgule(ratioActifsInactifs(r))}</span>
          <span className="ratio-libelle">
            actif en emploi pour 1 inactif
            {reference && Math.abs(ratioActifsInactifs(reference) - ratioActifsInactifs(r)) > 0.005 && (
              <span className="ratio-ref"> (législation actuelle : {virgule(ratioActifsInactifs(reference))})</span>
            )}
          </span>
        </div>
        <div className="ratio-details">
          <span>
            <span className="pastille carree" style={{ background: 'var(--series-1)' }} /> {millions(r.cotisants)} actifs en emploi
          </span>
          <span>
            <span className="pastille carree" style={{ background: 'var(--series-2)' }} /> {millions(r.retraites)} retraités
          </span>
          <span>
            <span className="pastille carree" style={{ background: 'var(--autres)' }} /> {millions(autresTotal)} autres inactifs
          </span>
        </div>
      </div>

      <ul className="legende">
        {CATEGORIES.map((c) => (
          <li key={c.id}>
            <span className="pastille carree" style={{ background: c.couleur }} />
            {c.nom}
          </li>
        ))}
      </ul>
      <div ref={ref} className="graphique-zone">
        <svg width={largeur} height={hauteur} role="img" aria-label={`Population par âge en ${r.annee} : ${virgule(r.ratioCotisantsRetraites)} actif en emploi pour un retraité`}>
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
          {population.map((_, a) => {
            const d = parAge(a);
            const y = sy(a);
            const hb = Math.max(1, hBarre - 0.6);
            let cumul = 0;
            return (
              <g key={a} opacity={survol === null || survol === a ? 1 : 0.55}>
                {CATEGORIES.map((c) => {
                  const v = d[c.id];
                  const x = sx(cumul);
                  cumul += v;
                  return v > 0 ? <rect key={c.id} x={x} y={y} width={Math.max(0, sx(cumul) - x)} height={hb} fill={c.couleur} /> : null;
                })}
              </g>
            );
          })}
          <line x1={MARGE.gauche} x2={largeur - MARGE.droite} y1={sy(r.ageLegal) + hBarre} y2={sy(r.ageLegal) + hBarre} className="repere" />
          <text x={largeur - MARGE.droite} y={sy(r.ageLegal) + hBarre - 4} className="etiquette-repere" textAnchor="end">
            âge légal {r.ageLegal.toFixed(r.ageLegal % 1 ? 2 : 0).replace('.', ',')} ans
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
          <div className="bulle" style={{ left: MARGE.gauche + 12, top: Math.max(0, sy(survol) - 90) }}>
            <div className="bulle-titre">{survol === ages - 1 ? `${survol} ans et plus` : `${survol} ans`}</div>
            {CATEGORIES.map((c) => (
              <div key={c.id} className="bulle-ligne">
                <span className="pastille carree" style={{ background: c.couleur }} />
                <span className="bulle-nom">{c.id === 'autres' ? 'Autres' : c.id === 'cotisants' ? 'Actifs en emploi' : 'Retraités'}</span>
                <span className="bulle-valeur">{Math.round(parAge(survol)[c.id] / 1000).toLocaleString('fr-FR')} k</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </figure>
  );
}
