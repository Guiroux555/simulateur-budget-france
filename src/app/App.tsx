import { useEffect, useMemo, useRef, useState } from 'react';
import { equilibre, simuler } from '../engine';
import { depuisUrl, PARAMETRES_REFERENCE, versScenario, versUrl, type ParametresUI } from './parametres';
import { ANNEE_PROJECTION, ControleFenetre, FENETRE_DEFAUT, FENETRE_MAX, FENETRE_MIN, FenetreContext, type Fenetre } from './fenetre';
import { Expert } from './vues/Expert';
import { GrandPublic } from './vues/GrandPublic';
import { Garde } from './Garde';
import { AideContext } from './aideContexte';
import { FICHES_AIDE, type CleAide } from './aide';
import { PageAide } from './vues/PageAide';

type Mode = 'decouvrir' | 'expert';

function lireUrl(): { mode: Mode; parametres: ParametresUI; fenetre: Fenetre; aide: { fiche: CleAide | null } | null } {
  const h = new URLSearchParams(window.location.hash.slice(1));
  const fiche = h.get('aide');
  return {
    aide: fiche === null ? null : { fiche: fiche in FICHES_AIDE ? (fiche as CleAide) : null },
    mode: h.get('mode') === 'expert' ? 'expert' : 'decouvrir',
    fenetre: lireFenetre(h.get('f')),
    parametres: { ...PARAMETRES_REFERENCE, ...depuisUrl(h.get('s') ?? '') },
  };
}

function lireFenetre(valeur: string | null): Fenetre {
  const m = valeur?.match(/^(\d{4})-(\d{4})$/);
  if (!m) return FENETRE_DEFAUT;
  const debut = Math.max(FENETRE_MIN, Number(m[1]));
  const fin = Math.min(FENETRE_MAX, Number(m[2]));
  return fin - debut >= 10 ? { debut, fin } : FENETRE_DEFAUT;
}

export function App() {
  const initial = useMemo(lireUrl, []);
  const [mode, setMode] = useState<Mode>(initial.mode);
  const [parametres, setParametres] = useState<ParametresUI>(initial.parametres);
  const [copie, setCopie] = useState(false);
  const [fenetre, setFenetre] = useState<Fenetre>(initial.fenetre);
  // Page d'aide ouverte (fiche affichée) ; on revient ensuite au même endroit du mode expert.
  const [aide, setAide] = useState<{ fiche: CleAide | null } | null>(initial.aide);
  const defilementAvantAide = useRef(0);
  const ouvrirAide = (fiche: CleAide | null) => {
    defilementAvantAide.current = window.scrollY;
    setAide({ fiche });
  };
  const fermerAide = () => {
    setAide(null);
    setTimeout(() => {
      window.scrollTo({ top: defilementAvantAide.current });
    }, 0);
  };
  const historique = fenetre.debut < ANNEE_PROJECTION;
  const setHistorique = (v: boolean) => setFenetre(v ? FENETRE_DEFAUT : { debut: ANNEE_PROJECTION, fin: fenetre.fin });

  const reference = useMemo(() => simuler(versScenario(PARAMETRES_REFERENCE)), []);
  const scenario = useMemo(() => simuler(versScenario(parametres)), [parametres]);
  const equilibreScenario = useMemo(() => equilibre(scenario, parametres.soldeCible / 100), [scenario, parametres.soldeCible]);

  useEffect(() => {
    const s = versUrl(parametres);
    const f = fenetre.debut === FENETRE_DEFAUT.debut && fenetre.fin === FENETRE_DEFAUT.fin ? '' : `&f=${fenetre.debut}-${fenetre.fin}`;
    const a = aide ? `&aide=${aide.fiche ?? ''}` : '';
    const hash = `mode=${mode}${f}${s ? `&s=${s}` : ''}${a}`;
    try {
      history.replaceState(null, '', `#${hash}`);
    } catch {
      /* environnement sans historique (aperçu) */
    }
  }, [mode, parametres, fenetre, aide]);

  const copierLien = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      /* presse-papiers indisponible */
    }
  };

  const props = { parametres, setParametres, reference, scenario, equilibreScenario, historique, setHistorique };

  return (
    <div className="app">
      <header className="entete">
        <div className="entete-titre">
          <h1>Simulateur des retraites</h1>
          <p>Comment équilibrer le système de retraite français d’ici 2070 ?</p>
        </div>
        <div className="entete-actions">
          <div className="bascule" role="tablist" aria-label="Présentation">
            <button type="button" role="tab" aria-selected={mode === 'decouvrir'} className={mode === 'decouvrir' ? 'actif' : ''} onClick={() => (setAide(null), setMode('decouvrir'))}>
              Découvrir
            </button>
            <button type="button" role="tab" aria-selected={mode === 'expert'} className={mode === 'expert' ? 'actif' : ''} onClick={() => (setAide(null), setMode('expert'))}>
              Mode expert
            </button>
          </div>

          <button type="button" className="bouton secondaire" onClick={copierLien}>
            {copie ? 'Lien copié ✓' : 'Copier le lien du scénario'}
          </button>
        </div>
      </header>

      <div className="barre-fenetre">
        <ControleFenetre fenetre={fenetre} setFenetre={setFenetre} />
      </div>

      <FenetreContext.Provider value={fenetre}>
        <main>
          <Garde cle={aide ? 'aide' : mode}>
            {aide ? (
              <PageAide fiche={aide.fiche} retour={fermerAide} />
            ) : mode === 'decouvrir' ? (
              <GrandPublic {...props} />
            ) : (
              <AideContext.Provider value={ouvrirAide}>
                <Expert {...props} />
              </AideContext.Provider>
            )}
          </Garde>
        </main>
      </FenetreContext.Provider>

      <footer className="pied">
        <p>
          <strong>Neutralité.</strong> Ce simulateur ne défend aucune option : toutes les mesures sont évaluées avec les mêmes
          hypothèses, celles du scénario de référence du Conseil d’orientation des retraites (rapport de juin 2026). Les
          scénarios-types illustrent des familles de mesures du débat public, sans les attribuer à quiconque.
        </p>
        <p>
          <strong>Limites.</strong> Modèle simplifié (système pris dans son ensemble, sexes confondus, pas d’effet des réformes
          sur la croissance ni sur les dépenses de chômage ou d’invalidité). Il reproduit le solde projeté par le COR à
          0,15 point de PIB près ; les résultats sont des ordres de grandeur, non des prévisions. Montants en euros constants 2025.
        </p>
        <p>
          Sources : COR, INSEE, DREES. Méthode et code ouverts :{' '}
          <a href="https://github.com/guiroux555/simulateur-budget-france">github.com/guiroux555/simulateur-budget-france</a>.
        </p>
      </footer>
    </div>
  );
}
