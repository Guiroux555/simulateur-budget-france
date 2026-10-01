import { useEffect } from 'react';
import { CATEGORIES_AIDE, FICHES_AIDE, type CleAide, type FicheAide } from '../aide';

const fiches = Object.entries(FICHES_AIDE) as Array<[CleAide, FicheAide]>;

/** Page d'aide : définition et effets concrets de chaque indicateur du mode expert. */
export function PageAide({ fiche, retour }: { fiche: CleAide | null; retour: () => void }) {
  useEffect(() => {
    const el = fiche ? document.getElementById(`aide-${fiche}`) : null;
    if (el) el.scrollIntoView({ block: 'start' });
    else window.scrollTo({ top: 0 });
  }, [fiche]);

  return (
    <section className="page-aide">
      <button type="button" className="bouton secondaire retour-aide" onClick={retour}>
        ← Retour au simulateur
      </button>
      <h2>Comprendre les indicateurs</h2>
      <p className="chapeau">
        Pour chaque réglage et chaque résultat du mode expert : ce qu’il mesure, ce qu’il change dans la vie réelle et la
        façon dont le simulateur le traite. Les chiffres sont des ordres de grandeur.
      </p>
      <nav className="sommaire-aide" aria-label="Sommaire">
        {CATEGORIES_AIDE.map((c) => (
          <div key={c}>
            <strong>{c}</strong>
            <ul>
              {fiches
                .filter(([, f]) => f.categorie === c)
                .map(([cle, f]) => (
                  <li key={cle}>
                    <a href={`#aide-${cle}`} onClick={(e) => (e.preventDefault(), document.getElementById(`aide-${cle}`)?.scrollIntoView({ behavior: 'smooth' }))}>
                      {f.titre}
                    </a>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </nav>
      {CATEGORIES_AIDE.map((c) => (
        <div key={c}>
          <h3 className="categorie-aide">{c}</h3>
          {fiches
            .filter(([, f]) => f.categorie === c)
            .map(([cle, f]) => (
              <article key={cle} id={`aide-${cle}`} className={`fiche-aide${cle === fiche ? ' selectionnee' : ''}`}>
                <h4>{f.titre}</h4>
                <dl>
                  <dt>Définition</dt>
                  <dd>{f.definition}</dd>
                  <dt>Dans la vie réelle</dt>
                  <dd>{f.vieReelle}</dd>
                  <dt>Dans le simulateur</dt>
                  <dd>{f.simulateur}</dd>
                  {f.reference && (
                    <>
                      <dt>Repère</dt>
                      <dd>{f.reference}</dd>
                    </>
                  )}
                </dl>
                <button type="button" className="bouton lien" onClick={retour}>
                  ← Retour au simulateur
                </button>
              </article>
            ))}
        </div>
      ))}
    </section>
  );
}
