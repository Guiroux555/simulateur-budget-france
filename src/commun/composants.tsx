import { useId, type ReactNode } from 'react';
import { BoutonAide } from './aide';

interface CurseurProps {
  libelle: string;
  valeur: number;
  min: number;
  max: number;
  pas: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  aide?: ReactNode;
  /** Valeur de référence, signalée sous le curseur. */
  reference?: number;
  desactive?: boolean;
  /** Fiche d'aide associée (icône « ? »). */
  cleAide?: string;
}

export function Curseur({ libelle, valeur, min, max, pas, onChange, format, aide, reference, desactive, cleAide }: CurseurProps) {
  const id = useId();
  const posRef = reference === undefined ? null : ((reference - min) / (max - min)) * 100;
  return (
    <div className={`curseur${desactive ? ' desactive' : ''}`}>
      <div className="curseur-entete">
        <label htmlFor={id}>
          {libelle}
          {cleAide && <BoutonAide cle={cleAide} />}
        </label>
        <output htmlFor={id}>{format(valeur)}</output>
      </div>
      <div className="curseur-piste">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={pas}
          value={valeur}
          disabled={desactive}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        {posRef !== null && (
          <span className="curseur-ref" style={{ left: `${posRef}%` }} title={`Référence : ${format(reference!)}`} aria-hidden="true" />
        )}
      </div>
      {aide && <p className="aide">{aide}</p>}
    </div>
  );
}

interface ChoixProps<T extends string | number> {
  libelle: string;
  valeur: T;
  options: ReadonlyArray<{ valeur: T; libelle: string }>;
  onChange: (v: T) => void;
  aide?: ReactNode;
}

export function Choix<T extends string | number>({ libelle, valeur, options, onChange, aide }: ChoixProps<T>) {
  return (
    <fieldset className="choix">
      <legend>{libelle}</legend>
      <div className="segments" role="radiogroup">
        {options.map((o) => (
          <button
            key={String(o.valeur)}
            type="button"
            role="radio"
            aria-checked={o.valeur === valeur}
            className={o.valeur === valeur ? 'actif' : ''}
            onClick={() => onChange(o.valeur)}
          >
            {o.libelle}
          </button>
        ))}
      </div>
      {aide && <p className="aide">{aide}</p>}
    </fieldset>
  );
}

interface TuileProps {
  libelle: string;
  valeur: string;
  detail?: ReactNode;
  ton?: 'neutre' | 'deficit' | 'excedent';
}

export function Tuile({ libelle, valeur, detail, ton = 'neutre' }: TuileProps) {
  return (
    <div className={`tuile tuile-${ton}`}>
      <div className="tuile-libelle">{libelle}</div>
      <div className="tuile-valeur">{valeur}</div>
      {detail && <div className="tuile-detail">{detail}</div>}
    </div>
  );
}

export function Encadre({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <aside className="encadre">
      <h3>{titre}</h3>
      {children}
    </aside>
  );
}
