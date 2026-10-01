import { useEffect, useMemo, useState } from 'react';
import { equilibre, simuler } from '../engine';
import { depuisUrl, PARAMETRES_REFERENCE, versScenario, versUrl, type ParametresUI } from './parametres';
import { Expert } from './vues/Expert';
import { GrandPublic } from './vues/GrandPublic';

type Mode = 'decouvrir' | 'expert';

function lireUrl(): { mode: Mode; parametres: ParametresUI; historique: boolean } {
  const h = new URLSearchParams(window.location.hash.slice(1));
  return {
    mode: h.get('mode') === 'expert' ? 'expert' : 'decouvrir',
    historique: h.get('historique') !== '0',
    parametres: { ...PARAMETRES_REFERENCE, ...depuisUrl(h.get('s') ?? '') },
  };
}

export function App() {
  const initial = useMemo(lireUrl, []);
  const [mode, setMode] = useState<Mode>(initial.mode);
  const [parametres, setParametres] = useState<ParametresUI>(initial.parametres);
  const [copie, setCopie] = useState(false);
  const [historique, setHistorique] = useState(initial.historique);

  const reference = useMemo(() => simuler(versScenario(PARAMETRES_REFERENCE)), []);
  const scenario = useMemo(() => simuler(versScenario(parametres)), [parametres]);
  const equilibreScenario = useMemo(() => equilibre(scenario, parametres.soldeCible / 100), [scenario, parametres.soldeCible]);

  useEffect(() => {
    const s = versUrl(parametres);
    const hash = `mode=${mode}${historique ? '' : '&historique=0'}${s ? `&s=${s}` : ''}`;
    try {
      history.replaceState(null, '', `#${hash}`);
    } catch {
      /* environnement sans historique (aperçu) */
    }
  }, [mode, parametres, historique]);

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
            <button type="button" role="tab" aria-selected={mode === 'decouvrir'} className={mode === 'decouvrir' ? 'actif' : ''} onClick={() => setMode('decouvrir')}>
              Découvrir
            </button>
            <button type="button" role="tab" aria-selected={mode === 'expert'} className={mode === 'expert' ? 'actif' : ''} onClick={() => setMode('expert')}>
              Mode expert
            </button>
          </div>
          <label className="case">
            <input type="checkbox" checked={historique} onChange={(e) => setHistorique(e.target.checked)} />
            Afficher 1995-2024 et les réformes
          </label>
          <button type="button" className="bouton secondaire" onClick={copierLien}>
            {copie ? 'Lien copié ✓' : 'Copier le lien du scénario'}
          </button>
        </div>
      </header>

      <main>{mode === 'decouvrir' ? <GrandPublic {...props} /> : <Expert {...props} />}</main>

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
