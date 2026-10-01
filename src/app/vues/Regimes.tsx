import { useState } from 'react';
import {
  COMPENSATION_DEMOGRAPHIQUE,
  LIBELLES_FAMILLES,
  REGIMES,
  TOTAUX_2024,
  type Regime,
} from '../../engine/donnees/regimes';
import { Barres } from '../charts/Barres';
import { Encadre, Tuile } from '../composants';

/**
 * Une couleur fixe par régime, la même dans tous les graphiques et sur les fiches
 * (ordre de la palette catégorielle ; « autres » en gris, comme un regroupement).
 */
const COULEURS_REGIMES: Record<string, string> = {
  cnav: 'var(--series-1)',
  'agirc-arrco': 'var(--series-2)',
  fpe: 'var(--series-3)',
  'msa-exploitants': 'var(--series-4)',
  speciaux: 'var(--series-5)',
  cnracl: 'var(--series-6)',
  liberaux: 'var(--series-7)',
  'autres-complementaires': 'var(--ref)',
};
const couleur = (r: Regime) => COULEURS_REGIMES[r.id] ?? 'var(--ref)';

const virgule = (v: number, d = 1) => v.toFixed(d).replace('.', ',');
const mds = (v: number) => `${v < 0 ? '−' : ''}${virgule(Math.abs(v), Math.abs(v) < 10 && v % 1 !== 0 ? 1 : 0)} Md€`;
const mdsSigne = (v: number) => (v > 0 ? `+${mds(v)}` : mds(v));

type Convention = 'comptable' | 'hors-subventions';

/** Section « Les régimes » : poids, solde, démographie et règles de chaque grand régime. */
export function Regimes({ integre = false }: { integre?: boolean }) {
  const [selection, setSelection] = useState<string | null>(null);
  const [convention, setConvention] = useState<Convention>('comptable');
  const choisir = (id: string) => setSelection((s) => (s === id ? null : id));
  const parDepenses = [...REGIMES].sort((a, b) => b.depenses - a.depenses);
  const subventions = REGIMES.reduce((s, r) => s + r.subventionEtat, 0);
  const soldeAffiche = (r: Regime) => (convention === 'comptable' ? r.solde : r.solde - r.subventionEtat);
  const soldeTotal = TOTAUX_2024.solde - (convention === 'comptable' ? 0 : subventions);
  const regimeSelectionne = REGIMES.find((r) => r.id === selection);

  return (
    <section className={integre ? 'regimes regimes-integre' : 'regimes'} id="regimes" aria-labelledby="titre-regimes">
      <h2 id="titre-regimes">Les régimes de retraite</h2>
      <p className="chapeau">
        Le système français n’est pas une caisse unique : il réunit une quarantaine de régimes. Chaque assuré cotise à un{' '}
        <strong>régime de base</strong> (selon son statut) et, le plus souvent, à un <strong>régime complémentaire</strong>.
        Un salarié du privé relève ainsi du régime général et de l’Agirc-Arrco ; un fonctionnaire d’un régime unique qui
        couvre les deux étages. Les règles, la démographie et le mode de financement diffèrent fortement d’un régime à
        l’autre.
      </p>

      <div className="tuiles">
        <Tuile libelle="Dépenses de retraite 2024" valeur={`${TOTAUX_2024.depenses} Md€`} detail="tous régimes, base et complémentaires" />
        <Tuile
          libelle="Solde 2024"
          valeur={mdsSigne(soldeTotal)}
          detail={convention === 'comptable' ? 'subventions de l’État comprises' : 'hors subventions d’équilibre de l’État'}
          ton={soldeTotal < 0 ? 'deficit' : 'excedent'}
        />
        <Tuile libelle="Subventions d’équilibre de l’État" valeur={mds(subventions)} detail="régimes spéciaux (2025)" />
      </div>

      <div className="barre-outils">
        <span className="libelle-outil">Solde présenté :</span>
        <div className="segments" role="radiogroup" aria-label="Convention de solde">
          {(
            [
              ['comptable', 'Comptable (COR)'],
              ['hors-subventions', 'Hors subventions d’équilibre'],
            ] as const
          ).map(([id, libelle]) => (
            <button key={id} type="button" role="radio" aria-checked={convention === id} className={convention === id ? 'actif' : ''} onClick={() => setConvention(id)}>
              {libelle}
            </button>
          ))}
        </div>
      </div>
      <p className="note">
        Dans la convention du COR, les subventions d’équilibre et la contribution de l’État employeur comptent comme des
        ressources : les régimes concernés sont donc à l’équilibre « par construction ». L’autre présentation retire les
        subventions explicites pour montrer ce que coûtent ces régimes au budget de l’État. La contribution de l’État
        employeur aux pensions des fonctionnaires (taux de 78 % à 126 % du traitement) n’est pas retirée : c’est une
        cotisation d’employeur, dont le niveau fait débat.
      </p>

      <div className="grille-2">
        <Barres
          titre="Répartition des dépenses 2024"
          sousTitre="Pensions versées, en milliards d’euros — cliquez sur un régime pour le détail"
          barres={parDepenses.map((r) => ({
            id: r.id,
            libelle: r.sigle,
            valeur: r.depenses,
            couleur: couleur(r),
            detail: `${r.nom} : ${mds(r.depenses)}, soit ${virgule((100 * r.depenses) / TOTAUX_2024.depenses)} % des dépenses`,
          }))}
          format={(v) => `${virgule(v, 0)}`}
          selection={selection}
          onSelect={choisir}
        />
        <Barres
          titre="Solde 2024 par régime"
          sousTitre={
            convention === 'comptable'
              ? 'Milliards d’euros — à gauche de zéro : déficit, à droite : excédent ; hachuré : subvention d’équilibre de l’État'
              : 'Milliards d’euros, hors subventions d’équilibre de l’État — à gauche de zéro : déficit, à droite : excédent'
          }
          barres={parDepenses.map((r) => ({
            id: r.id,
            libelle: r.sigle,
            valeur: soldeAffiche(r),
            couleur: couleur(r),
            complement:
              convention === 'comptable' && r.subventionEtat > 0
                ? { valeur: r.subventionEtat, couleur: couleur(r), libelle: 'Subvention de l’État', texte: `État ${virgule(r.subventionEtat)}` }
                : undefined,
          }))}
          format={(v) => (v === 0 ? '0' : mdsSigne(v).replace(' Md€', ''))}
          legende={convention === 'comptable' ? [{ libelle: 'Subvention d’équilibre de l’État', couleur: 'var(--text-muted)', motif: true }] : undefined}
          selection={selection}
          onSelect={choisir}
        />
      </div>

      <Barres
        titre="Cotisants pour un retraité, par régime"
        sousTitre="Plus le rapport est faible, plus le régime dépend de transferts ou de subventions pour payer ses pensions"
        barres={[...REGIMES]
          .filter((r) => r.ratioDemographique !== null)
          .sort((a, b) => (b.ratioDemographique ?? 0) - (a.ratioDemographique ?? 0))
          .map((r) => ({ id: r.id, libelle: r.sigle, valeur: r.ratioDemographique!, couleur: couleur(r) }))}
        format={(v) => virgule(v, 2)}
        repere={{ valeur: 1, libelle: '1 cotisant pour 1 retraité' }}
        selection={selection}
        onSelect={choisir}
      />

      <Encadre titre="Solidarité entre régimes">
        <p>{COMPENSATION_DEMOGRAPHIQUE}</p>
      </Encadre>

      <h3>Les régimes un par un</h3>
      {regimeSelectionne && (
        <p className="note">
          Régime sélectionné : <strong>{regimeSelectionne.nom}</strong>.{' '}
          <button type="button" className="bouton lien" onClick={() => setSelection(null)}>
            Tout afficher
          </button>
        </p>
      )}
      <div className="fiches-regimes">
        {(regimeSelectionne ? [regimeSelectionne] : parDepenses).map((r) => (
          <article key={r.id} className="fiche-regime" style={{ borderTopColor: couleur(r) }}>
            <header>
              <span className="fiche-famille">{LIBELLES_FAMILLES[r.famille]}</span>
              <h4>{r.nom}</h4>
              <span className="fiche-sigle">
                {r.sigle}
                {r.statut ? ` · ${r.statut}` : ''}
              </span>
            </header>
            <dl className="fiche-chiffres">
              <div>
                <dt>Dépenses</dt>
                <dd>{mds(r.depenses)}</dd>
              </div>
              <div>
                <dt>Part du total</dt>
                <dd>{virgule((100 * r.depenses) / TOTAUX_2024.depenses)} %</dd>
              </div>
              <div>
                <dt>Solde</dt>
                <dd>{r.solde === 0 ? 'Équilibré' : mdsSigne(r.solde)}</dd>
              </div>
              <div>
                <dt>Cotisants / retraité</dt>
                <dd>{r.ratioDemographique === null ? '—' : virgule(r.ratioDemographique, 2)}</dd>
              </div>
            </dl>
            <p>
              <strong>Qui ?</strong> {r.publicCouvert}
            </p>
            <p>
              <strong>Calcul :</strong> {r.calcul}
            </p>
            <p className="fiche-titre-liste">Avantages et particularités</p>
            <ul className="liste-avantages">
              {r.avantages.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <p className="fiche-titre-liste">Contreparties et limites</p>
            <ul className="liste-contreparties">
              {r.contreparties.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <p>
              <strong>Financement :</strong> {r.equilibre}
            </p>
            <p className="note">
              {r.estime ? 'Montants en ordre de grandeur, en partie estimés. ' : ''}Sources : {r.sources}.
            </p>
          </article>
        ))}
      </div>
      <p className="note">
        Chiffres 2024 en ordres de grandeur (Sénat, Cour des comptes, COR, DSS, caisses de retraite), à remplacer par les
        comptes officiels par régime. Les avantages décrits sont les règles générales ; de nombreux cas particuliers
        existent.
      </p>
    </section>
  );
}
