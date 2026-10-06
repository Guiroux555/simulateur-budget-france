/**
 * Simulateur du budget : une adresse par page, dans le fragment de l'URL.
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

type Page = 'retraites' | 'dette' | 'synthese';
const PAGES: ReadonlyArray<{ id: Page; libelle: string }> = [
  { id: 'retraites', libelle: 'Retraites' },
  { id: 'dette', libelle: 'Dette' },
  { id: 'synthese', libelle: 'Synthèse' },
];
/** Pages dont le scénario est conservé et regroupé dans le lien de la synthèse. */
const PAGES_SCENARIO = ['retraites', 'dette'] as const;

function lire(): { page: Page; liens: Record<string, string> } {
  const h = new URLSearchParams(window.location.hash.slice(1));
  const p = h.get('page');
  const page: Page = p === 'dette' || p === 'synthese' ? p : 'retraites';
  // URLSearchParams décode les valeurs : on les réencode sous la forme produite par les modules.
  const enc = (v: string | null) => (v ? encodeURIComponent(v) : '');
  if (page === 'synthese') return { page, liens: Object.fromEntries(PAGES_SCENARIO.map((id) => [id, enc(h.get(id))])) };
  return { page, liens: { [page]: enc(h.get('s')) } };
}

function adresse(page: Page, liens: Record<string, string>): string {
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

  const allerA = (cible: string) => {
    if (cible !== 'retraites' && cible !== 'dette' && cible !== 'synthese') return;
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

  return (
    <div className="app">
      {navigation}
      <header className="entete">
        <div className="entete-titre">
          <h1>{page === 'dette' ? 'Dette et solde public' : 'Synthèse'}</h1>
          <p>{page === 'dette' ? 'Peut-on tenir la trajectoire de la dette sur les dix prochaines années ?' : 'L’effet cumulé de vos scénarios sur le solde public et la dette.'}</p>
        </div>
      </header>
      <main>
        <Garde cle={`${page}-${cle}`}>
          {page === 'dette' ? <AppDette key={cle} lien={liens.dette ?? ''} onLien={surLienDette} /> : <Synthese key={cle} liens={liens} allerA={allerA} />}
        </Garde>
      </main>
    </div>
  );
}
