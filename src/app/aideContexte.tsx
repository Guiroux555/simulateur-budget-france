import { createContext, useContext } from 'react';
import { FICHES_AIDE, type CleAide } from './aide';

/** Ouvre la page d'aide sur une fiche ; absent hors de l'application (aucune icône affichée). */
export const AideContext = createContext<((cle: CleAide | null) => void) | null>(null);

/** Lien vers la page d'aide complète. */
export function LienAide() {
  const ouvrir = useContext(AideContext);
  if (!ouvrir) return null;
  return (
    <button type="button" className="bouton lien" onClick={() => ouvrir(null)}>
      <span className="bouton-aide" aria-hidden="true">?</span> Comprendre chaque indicateur
    </button>
  );
}

/** Icône « ? » menant à la fiche d'aide d'un indicateur. */
export function BoutonAide({ cle }: { cle: CleAide }) {
  const ouvrir = useContext(AideContext);
  if (!ouvrir) return null;
  return (
    <button
      type="button"
      className="bouton-aide"
      aria-label={`Aide : ${FICHES_AIDE[cle].titre}`}
      title={`Qu’est-ce que c’est ? ${FICHES_AIDE[cle].titre}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        ouvrir(cle);
      }}
    >
      ?
    </button>
  );
}
