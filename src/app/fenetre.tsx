import { createContext, useContext } from 'react';

/** Fenêtre de temps affichée par les graphiques en courbes. */
export interface Fenetre {
  debut: number;
  fin: number;
}

export const FENETRE_MIN = 1945;
export const FENETRE_MAX = 2070;
export const ANNEE_PROJECTION = 2025;
export const FENETRE_DEFAUT: Fenetre = { debut: 1985, fin: 2070 };
const DUREE_MIN = 15;

export const FenetreContext = createContext<Fenetre>({ debut: FENETRE_MIN, fin: FENETRE_MAX });
export const useFenetre = () => useContext(FenetreContext);

/** Élargit (pas > 0) ou réduit (pas < 0) la fenêtre de part et d'autre, en restant dans les bornes. */
export function zoomer(f: Fenetre, pas: number): Fenetre {
  let debut = Math.max(FENETRE_MIN, f.debut - pas);
  let fin = Math.min(FENETRE_MAX, f.fin + pas);
  if (fin - debut < DUREE_MIN) {
    const milieu = (f.debut + f.fin) / 2;
    debut = Math.round(milieu - DUREE_MIN / 2);
    fin = debut + DUREE_MIN;
  }
  return { debut, fin };
}

const DEBUTS = [1945, 1960, 1975, 1985, 1995, 2005, 2015, 2025, 2035, 2045];
const FINS = [2030, 2035, 2040, 2045, 2050, 2060, 2070];

export const PRESETS_FENETRE: Array<{ libelle: string; fenetre: Fenetre }> = [
  { libelle: 'Depuis 1945', fenetre: { debut: 1945, fin: 2070 } },
  { libelle: '40 ans + projection', fenetre: { debut: 1985, fin: 2070 } },
  { libelle: 'Projection seule', fenetre: { debut: 2025, fin: 2070 } },
  { libelle: 'Court terme', fenetre: { debut: 2015, fin: 2040 } },
];

export function ControleFenetre({ fenetre, setFenetre }: { fenetre: Fenetre; setFenetre: (f: Fenetre) => void }) {
  const actif = PRESETS_FENETRE.find((p) => p.fenetre.debut === fenetre.debut && p.fenetre.fin === fenetre.fin);
  return (
    <div className="controle-fenetre" role="group" aria-label="Période affichée par les graphiques">
      <span className="libelle-outil">Période :</span>
      <button type="button" className="bouton secondaire zoom" onClick={() => setFenetre(zoomer(fenetre, -10))} aria-label="Réduire la période" title="Réduire la période">
        −
      </button>
      <select value={fenetre.debut} aria-label="Début" onChange={(e) => setFenetre({ debut: Number(e.target.value), fin: Math.max(fenetre.fin, Number(e.target.value) + DUREE_MIN) })}>
        {[...new Set([...DEBUTS, fenetre.debut])].sort().map((a) => (
          <option key={a} value={a} disabled={a > fenetre.fin - DUREE_MIN}>
            {a}
          </option>
        ))}
      </select>
      <span>→</span>
      <select value={fenetre.fin} aria-label="Fin" onChange={(e) => setFenetre({ debut: Math.min(fenetre.debut, Number(e.target.value) - DUREE_MIN), fin: Number(e.target.value) })}>
        {[...new Set([...FINS, fenetre.fin])].sort().map((a) => (
          <option key={a} value={a} disabled={a < fenetre.debut + DUREE_MIN}>
            {a}
          </option>
        ))}
      </select>
      <button type="button" className="bouton secondaire zoom" onClick={() => setFenetre(zoomer(fenetre, 10))} aria-label="Élargir la période" title="Élargir la période">
        +
      </button>
      <div className="presets-fenetre">
        {PRESETS_FENETRE.map((p) => (
          <button key={p.libelle} type="button" className={actif === p ? 'actif' : ''} onClick={() => setFenetre(p.fenetre)}>
            {p.libelle}
          </button>
        ))}
      </div>
    </div>
  );
}
