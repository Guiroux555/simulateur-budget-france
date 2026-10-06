/**
 * Simulateur du budget : une adresse par page, dans le fragment de l'URL.
 *  - adresse vide ou `#page=accueil` : « Où vont 100 € de dépense publique ? » ;
 *  - `#mode=…&s=…` (sans `page`) : module retraites, liens existants inchangés ;
 *  - `#page=dette&s=…` : module dette ;
 *  - `#page=synthese&retraites=…&dette=…` : synthèse, qui regroupe les liens de chaque module.
 * Changer de page conserve le scénario de chaque module.
 */
import { useCallback, useEffect, useState } from 'react';
import { Garde } from './commun/Garde';
import { App as AppRetraites } from './modules/retraites/app/App';
import { App as AppDette } from './modules/dette/app/App';
import { Synthese } from './synthese/Synthese';
import { Accueil } from './accueil/Accueil';

type Page = 'accueil' | 'retraites' | 'dette' | 'synthese';
const PAGES: ReadonlyArray<{ id: Page; libelle: string }> = [
  { id: 'accueil', libelle: 'Où vont 100 €' },
  { id: 'retraites', libelle: 'Retraites' },
  { id: 'dette', libelle: 'Dette' },
  { id: 'synthese', libelle: 'Synthèse' },
];
const ENTETES: Record<Exclude<Page, 'retraites'>, { titre: string; question: string }> = {
  accueil: { titre: 'Où vont 100 € de dépense publique ?', question: 'À quoi sert l’argent public, et d’où vient-il.' },
  dette: { titre: 'Dette et solde public', question: 'Peut-on tenir la trajectoire de la dette sur les dix prochaines années ?' },
  synthese: { titre: 'Synthèse', question: 'L’effet cumulé de vos scénarios sur le solde public et la dette.' },
};
/** Pages dont le scénario est conservé et regroupé dans le lien de la synthèse. */
const PAGES_SCENARIO = ['retraites', 'dette'] as const;

function lire(): { page: Page; liens: Record<string, string> } {
  const h = new URLSearchParams(window.location.hash.slice(1));
  const p = h.get('page');
  // Sans `page`, une adresse non vide est un lien du module retraites (il écrit toujours `mode=`).
  const page: Page = p === 'accueil' || p === 'dette' || p === 'synthese' ? p : h.toString() === '' ? 'accueil' : 'retraites';
  // URLSearchParams décode les valeurs : on les réencode sous la forme produite par les modules.
  const enc = (v: string | null) => (v ? encodeURIComponent(v) : '');
  if (page === 'synthese') return { page, liens: Object.fromEntries(PAGES_SCENARIO.map((id) => [id, enc(h.get(id))])) };
  return { page, liens: { [page]: enc(h.get('s')) } };
}

function adresse(page: Page, liens: Record<string, string>): string {
  if (page === 'accueil') return '#page=accueil';
  if (page === 'synthese') {
    const parts = PAGES_SCENARIO.filter((id) => liens[id]).map((id) => `&${id}=${liens[id]}`);
    return `#page=synthese${parts.join('')}`;
  }
  const s = liens[page] ? `&s=${liens[page]}` : '';
  return page === 'retraites' ? `#mode=decouvrir${s}` : `#page=${page}${s}`;
}

function ecrire(hash: string) {
  try {
    history.replaceState(null, '', hash);
  } catch {
    /* environnement sans historique (aperçu) */
  }
}

export function Racine() {
  const [etat, setEtat] = useState(() => ({ ...lire(), cle: 0 }));
  const { page, liens, cle } = etat;

  // Lien saisi ou collé à la main : on recharge la page demandée.
  useEffect(() => {
    const surChangement = () => setEtat((e) => ({ ...lire(), liens: { ...e.liens, ...lire().liens }, cle: e.cle + 1 }));
    window.addEventListener('hashchange', surChangement);
    return () => window.removeEventListener('hashchange', surChangement);
  }, []);

  const allerA = (id: string) => {
    const cible = PAGES.find((p) => p.id === id)?.id;
    if (!cible) return;
    // Le module retraites tient lui-même son lien à jour dans l'URL : on le relit en partant.
    const courants = page === 'retraites' ? { ...liens, ...lire().liens } : liens;
    ecrire(adresse(cible, courants));
    setEtat({ page: cible, liens: courants, cle: cle + 1 });
    window.scrollTo({ top: 0 });
  };

  const surLienDette = useCallback((lien: string) => {
    setEtat((e) => (e.liens.dette === lien ? e : { ...e, liens: { ...e.liens, dette: lien } }));
    ecrire(adresse('dette', { dette: lien }));
  }, []);

  const navigation = (
    <nav className="navigation" aria-label="Pages du simulateur">
      <span className="navigation-titre">Simulateur du budget</span>
      <div className="bascule" role="tablist">
        {PAGES.map((p) => (
          <button key={p.id} type="button" role="tab" aria-selected={page === p.id} className={page === p.id ? 'actif' : ''} onClick={() => allerA(p.id)}>
            {p.libelle}
          </button>
        ))}
      </div>
    </nav>
  );

  if (page === 'retraites')
    return (
      <>
        <div className="app app-navigation">{navigation}</div>
        <AppRetraites key={cle} />
      </>
    );

  const entete = ENTETES[page];
  return (
    <div className="app">
      {navigation}
      <header className="entete">
        <div className="entete-titre">
          <h1>{entete.titre}</h1>
          <p>{entete.question}</p>
        </div>
      </header>
      <main>
        <Garde cle={`${page}-${cle}`}>
          {page === 'accueil' ? (
            <Accueil allerA={allerA} />
          ) : page === 'dette' ? (
            <AppDette key={cle} lien={liens.dette ?? ''} onLien={surLienDette} />
          ) : (
            <Synthese key={cle} liens={liens} allerA={allerA} />
          )}
        </Garde>
      </main>
    </div>
  );
}
