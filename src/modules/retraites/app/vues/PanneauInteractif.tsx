import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Barres } from '../../../../commun/charts/Barres';
import { Curseur, Tuile } from '../../../../commun/composants';
import { actifsInactifs, criteresDepuis, LIBELLES_CRITERES, poidsCriteres, simulerInteractif, soldeTotal, type CriteresInteractifs } from '../interactif';
import type { ParametresUI } from '../parametres';

const virgule = (v: number, d = 1) => v.toFixed(d).replace('.', ',');
const pts = (v: number) => `${v > 0.00005 ? '+' : v < -0.00005 ? '−' : ''}${virgule(Math.abs(v * 100), 2)} pt`;
const HORIZONS = [2035, 2045, 2070] as const;

/** État du mode interactif : critères de départ (tirés de `base`), critères courants et simulation. */
export function useModeInteractif(base: ParametresUI) {
  const depart = useMemo(() => criteresDepuis(base), [base]);
  const [actif, setActif] = useState(false);
  const [criteres, setCriteres] = useState<CriteresInteractifs>(depart);
  useEffect(() => {
    setCriteres(depart);
  }, [depart]);
  const differes = useDeferredValue(criteres);
  const resultat = useMemo(() => (actif ? simulerInteractif(base, differes) : null), [actif, base, differes]);
  return { actif, setActif, base, depart, criteres, setCriteres, resultat };
}

export type ModeInteractif = ReturnType<typeof useModeInteractif>;

interface PropsPanneau {
  mode: ModeInteractif;
  /** Année pour le ratio actifs/inactifs affiché sous le curseur d'activité. */
  annee: number;
}

/** Curseurs du mode interactif (et, dans un onglet, ses résultats). */
export function PanneauInteractif({ mode, annee }: PropsPanneau) {
  const { actif, setActif, depart, criteres: c, setCriteres, resultat } = mode;
  const maj = (m: Partial<CriteresInteractifs>) => setCriteres({ ...c, ...m });
  const anneeRatio = annee < 2025 ? 2070 : annee;

  if (!actif) {
    return (
      <div className="panneau-interactif ferme">
        <button type="button" className="bouton principal" onClick={() => setActif(true)}>
          Mode interactif : faire varier les critères
        </button>
        <span className="note">
          Productivité, chômage, taux d’activité, âge de départ, natalité, valeur et rendement du point… et mesurer le poids de chacun.
        </span>
      </div>
    );
  }

  const entete = (
    <div className="panneau-interactif-entete">
      <h3>Mode interactif</h3>
      <button type="button" className="bouton secondaire" onClick={() => setCriteres(depart)}>
        Réinitialiser
      </button>
      <button type="button" className="bouton secondaire" onClick={() => (setCriteres(depart), setActif(false))}>
        Quitter
      </button>
    </div>
  );

  const curseurs = (
    <div className="grille-interactif">
      <fieldset>
        <legend>Économie</legend>
        <Curseur libelle="Productivité (long terme)" valeur={c.productivite} min={0} max={2} pas={0.1} reference={depart.productivite} format={(v) => `${virgule(v)} % / an`} onChange={(v) => maj({ productivite: v })} />
        <Curseur libelle="Chômage (dès 2030)" valeur={c.chomage} min={3} max={12} pas={0.5} reference={depart.chomage} format={(v) => `${virgule(v)} %`} onChange={(v) => maj({ chomage: v })} />
        <Curseur
          libelle="Taux d’activité des 20-64 ans"
          valeur={c.activite}
          min={-8}
          max={8}
          pas={0.5}
          reference={depart.activite}
          format={(v) => `${v > 0 ? '+' : ''}${virgule(v)} pt`}
          onChange={(v) => maj({ activite: v })}
          aide={resultat ? <>Actifs en emploi pour un inactif en {anneeRatio} : <strong>{virgule(actifsInactifs(resultat, anneeRatio), 2)}</strong></> : null}
        />
      </fieldset>
      <fieldset>
        <legend>Démographie et départ</legend>
        <Curseur
          libelle="Âge légal de départ (atteint en 2035)"
          valeur={c.ageLegal ?? 64}
          min={60}
          max={68}
          pas={0.25}
          reference={depart.ageLegal ?? 64}
          format={(v) => (c.ageLegal === null ? 'Actuel (64 ans)' : `${virgule(v, v % 1 ? 2 : 0)} ans`)}
          onChange={(v) => maj({ ageLegal: v })}
        />
        <Curseur libelle="Natalité (dès 2028)" valeur={c.fecondite} min={1.2} max={2.1} pas={0.05} reference={depart.fecondite} format={(v) => `${virgule(v, 2)} enfant/femme`} onChange={(v) => maj({ fecondite: v })} />
      </fieldset>
      <fieldset>
        <legend>Régimes par points (Agirc-Arrco, libéraux, Ircantec…)</legend>
        <Curseur
          libelle="Valeur du point : revalorisation"
          valeur={c.revalorisationPoint}
          min={-1.5}
          max={1}
          pas={0.1}
          reference={0}
          format={(v) => (v === 0 ? 'Comme l’inflation' : `Inflation ${v > 0 ? '+' : '−'} ${virgule(Math.abs(v))} pt / an`)}
          onChange={(v) => maj({ revalorisationPoint: v })}
          aide="Agit sur toutes les pensions en cours de ces régimes."
        />
        <Curseur
          libelle="Rendement du point (droits par euro cotisé)"
          valeur={c.rendementPoint}
          min={-30}
          max={20}
          pas={1}
          reference={0}
          format={(v) => `${v > 0 ? '+' : ''}${v} %`}
          onChange={(v) => maj({ rendementPoint: v })}
          aide="Prix d’achat du point : agit progressivement, sur les nouveaux droits."
        />
      </fieldset>
    </div>
  );

  return (
    <div className="panneau-interactif">
      {entete}
      <p className="note">
        Les graphiques de cet onglet se recalculent avec ces critères (projection à partir de 2025). Les mesures prennent effet
        en 2028 ; le rendement du point ne joue que sur les droits acquis à partir de 2026.
      </p>
      {curseurs}
      <ResultatsInteractifs mode={mode} />
      <p className="note">Critères disponibles : {Object.values(LIBELLES_CRITERES).join(', ')}.</p>
    </div>
  );
}

/** Soldes aux horizons clés et poids de chaque critère pris isolément. */
function ResultatsInteractifs({ mode, libelleTuile = 'Solde tous régimes en' }: { mode: ModeInteractif; libelleTuile?: string }) {
  const { actif, base, depart, criteres, resultat } = mode;
  const [horizon, setHorizon] = useState<(typeof HORIZONS)[number]>(2070);
  const differes = useDeferredValue(criteres);
  const poids = useMemo(() => (actif ? poidsCriteres(base, depart, differes, horizon) : null), [actif, base, depart, differes, horizon]);
  const reference = useMemo(() => (actif ? simulerInteractif(base, depart) : null), [actif, base, depart]);

  const barres = poids
    ? [
        ...poids.effets.map((e) => ({
          id: e.cle,
          libelle: e.libelle,
          valeur: e.effet * 100,
          texte: pts(e.effet),
          couleur: e.effet >= 0 ? 'var(--series-1)' : 'var(--series-2)',
        })),
        ...(poids.effets.length > 1
          ? [{ id: 'ensemble', libelle: 'Ensemble des critères', valeur: poids.ensemble * 100, texte: pts(poids.ensemble), couleur: 'var(--hist)' }]
          : []),
      ]
    : [];

  return (
    <>
      {resultat && reference && (
        <div className="tuiles">
          {HORIZONS.map((a) => (
            <Tuile
              key={a}
              libelle={`${libelleTuile} ${a}`}
              valeur={`${virgule(soldeTotal(resultat, a) * 100, 2)} %`}
              detail={<>du PIB · {pts(soldeTotal(resultat, a) - soldeTotal(reference, a))} vs départ</>}
              ton={soldeTotal(resultat, a) < -0.0005 ? 'deficit' : 'neutre'}
            />
          ))}
        </div>
      )}

      <div className="poids-criteres">
        <div className="barre-outils">
          <span className="libelle-outil">Poids de chaque critère sur le solde en</span>
          <div className="segments" role="radiogroup" aria-label="Horizon">
            {HORIZONS.map((a) => (
              <button key={a} type="button" role="radio" aria-checked={horizon === a} className={horizon === a ? 'actif' : ''} onClick={() => setHorizon(a)}>
                {a}
              </button>
            ))}
          </div>
        </div>
        {barres.length ? (
          <Barres
            titre={`Effet de chaque critère, pris isolément, sur le solde ${horizon}`}
            sousTitre="En points de PIB par rapport au point de départ ; à droite : amélioration, à gauche : dégradation. « Ensemble » peut différer de la somme (les effets se combinent)."
            barres={barres}
            format={(v) => `${virgule(v, 1)}`}
            margeDroite={90}
          />
        ) : (
          <p className="note">Déplacez un curseur pour voir son effet isolé sur le solde.</p>
        )}
      </div>
    </>
  );
}
