import { createContext, useContext } from 'react';

/**
 * Aide contextuelle commune à tous les modules. Chaque module fournit ses propres fiches :
 * `titre` renvoie le titre d'une fiche (undefined si la clé est inconnue), `ouvrir` affiche la
 * fiche (ou la page d'aide complète avec null).
 */
export interface ContexteAide {
  ouvrir: (cle: string | null) => void;
  titre: (cle: string) => string | undefined;
}

/** Absent hors de l'application : aucune icône d'aide affichée. */
export const AideContext = createContext<ContexteAide | null>(null);

/** Lien vers la page d'aide complète. */
export function LienAide() {
  const aide = useContext(AideContext);
  if (!aide) return null;
  return (
    <button type="button" className="bouton lien" onClick={() => aide.ouvrir(null)}>
      <span className="bouton-aide" aria-hidden="true">?</span> Comprendre chaque indicateur
    </button>
  );
}

/** Icône « ? » menant à la fiche d'aide d'un indicateur. */
export function BoutonAide({ cle }: { cle: string }) {
  const aide = useContext(AideContext);
  const titre = aide?.titre(cle);
  if (!aide || titre === undefined) return null;
  return (
    <button
      type="button"
      className="bouton-aide"
      aria-label={`Aide : ${titre}`}
      title={`Qu’est-ce que c’est ? ${titre}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        aide.ouvrir(cle);
      }}
    >
      ?
    </button>
  );
}
