import type { ContexteAide } from '../../../commun/aide';
import { BoutonAide as BoutonAideCommun } from '../../../commun/aide';
import { FICHES_AIDE, type CleAide } from './aide';

export { LienAide } from '../../../commun/aide';

/** Contexte d'aide du module retraites, à partir de ses fiches. */
export function contexteAide(ouvrir: (cle: CleAide | null) => void): ContexteAide {
  return {
    ouvrir: (cle) => ouvrir(cle !== null && cle in FICHES_AIDE ? (cle as CleAide) : null),
    titre: (cle) => (cle in FICHES_AIDE ? FICHES_AIDE[cle as CleAide].titre : undefined),
  };
}

/** Icône « ? » vers une fiche du module (clé vérifiée à la compilation). */
export function BoutonAide({ cle }: { cle: CleAide }) {
  return <BoutonAideCommun cle={cle} />;
}
