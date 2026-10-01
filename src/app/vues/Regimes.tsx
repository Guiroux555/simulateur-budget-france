import { useState } from 'react';
import {
  COMPENSATION_DEMOGRAPHIQUE,
  LIBELLES_FAMILLES,
  PARCOURS_TYPES,
  POLYPENSION,
  POURQUOI_PLUSIEURS_REGIMES,
  REGIMES,
  SOURCES_COTISATIONS,
  TOTAUX_2024,
  type Regime,
} from '../../engine/donnees/regimes';
import type { ResultatSimulation } from '../../engine';
import type { ParametresUI } from '../parametres';
import { Barres } from '../charts/Barres';
import { RegimesTemps } from './RegimesTemps';
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
const euros = (v: number) => `${(Math.round(v / 100) * 100).toLocaleString('fr-FR')} €`;
const mds = (v: number) => `${v < 0 ? '−' : ''}${virgule(Math.abs(v), Math.abs(v) < 10 && v % 1 !== 0 ? 1 : 0)} Md€`;
const mdsSigne = (v: number) => (v > 0 ? `+${mds(v)}` : mds(v));

type Convention = 'comptable' | 'hors-subventions';

/** Montant moyen versé par ce régime à chacun de ses retraités (réversions comprises), en € par mois. */
const pensionMoyenne = (r: Regime) =>
  r.retraites === null ? '—' : `≈ ${(Math.round((r.depenses * 1e9) / (r.retraites * 1e6) / 12 / 10) * 10).toLocaleString('fr-FR')} €`;

/** Section « Les régimes » : poids, solde, démographie et règles de chaque grand régime. */
export function Regimes({ integre = false, reference, parametres }: { integre?: boolean; reference?: ResultatSimulation; parametres?: ParametresUI }) {
  const [onglet, setOnglet] = useState<'date' | 'temps'>('date');
  const [selection, setSelection] = useState<string | null>(null);
  const [convention, setConvention] = useState<Convention>('comptable');
  const choisir = (id: string) => setSelection((s) => (s === id ? null : id));
  const voirEvolution = () => {
    setOnglet('temps');
    setTimeout(() => document.getElementById('evolution-regimes')?.scrollIntoView({ behavior: 'smooth' }), 50);
  };
  const lienEvolution = reference && (
    <button type="button" className="bouton lien" onClick={voirEvolution}>
      Voir l’historique et la projection en courbes →
    </button>
  );
  const parDepenses = [...REGIMES].sort((a, b) => b.depenses - a.depenses);
  const pensionsParRetraite = REGIMES.reduce((t, r) => t + (r.retraites ?? 0), 0) / TOTAUX_2024.retraites;
  const avecCotisations = parDepenses.filter((r) => r.cotisations !== null && r.cotisants !== null && r.retraites !== null);
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

      <details className="encadre pourquoi-regimes">
        <summary>Pourquoi plusieurs régimes ? Pourquoi les fonctionnaires ont-ils un régime à part ?</summary>
        <ul>
          {POURQUOI_PLUSIEURS_REGIMES.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </details>

      <div className="onglets-regimes" role="tablist" aria-label="Période">
        {(
          [
            ['date', 'À date (2024)'],
            ['temps', 'Dans le temps (2000-2070)'],
          ] as const
        ).map(([id, libelle]) => (
          <button key={id} type="button" role="tab" aria-selected={onglet === id} className={onglet === id ? 'actif' : ''} onClick={() => setOnglet(id)}>
            {libelle}
          </button>
        ))}
      </div>

      {onglet === 'temps' && reference && <RegimesTemps reference={reference} parametres={parametres} couleur={(id) => COULEURS_REGIMES[id] ?? 'var(--ref)'} selection={selection} onSelect={choisir} />}
      {onglet === 'date' && (
        <>
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
            titre="Dépenses et retraités par régime"
            sousTitre="Barre pleine : part des dépenses 2024 ; barre claire : part des retraités qui perçoivent une pension de ce régime (une même personne peut relever de plusieurs régimes, le total dépasse donc 100 %) — cliquez sur un régime pour le détail"
            barres={parDepenses.map((r) => ({
              id: r.id,
              libelle: r.sigle,
              valeur: (100 * r.depenses) / TOTAUX_2024.depenses,
              texte: `${virgule((100 * r.depenses) / TOTAUX_2024.depenses, 0)} % · ${mds(r.depenses)}`,
              couleur: couleur(r),
              secondaire:
                r.retraites === null
                  ? null
                  : {
                      valeur: (100 * r.retraites) / TOTAUX_2024.retraites,
                      texte: `${virgule((100 * r.retraites) / TOTAUX_2024.retraites, 0)} % des retraités (${virgule(r.retraites, r.retraites < 1 ? 2 : 1)} M)`,
                    },
              detail: `${r.nom} : ${mds(r.depenses)}, soit ${virgule((100 * r.depenses) / TOTAUX_2024.depenses)} % des dépenses`,
            }))}
            format={(v) => `${virgule(v, 0)} %`}
            legende={[
              { libelle: 'Part des dépenses', couleur: 'var(--text-secondary)' },
              { libelle: 'Part des retraités concernés', couleur: 'var(--text-secondary)', clair: true },
            ]}
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

        <p className="note">
          Comment lire : le régime général verse une pension à 83 % des retraités mais ne pèse que 42 % des dépenses, car
          beaucoup n’y ont validé qu’une partie de leur carrière et touchent le reste d’autres régimes (complémentaire,
          fonction publique…). À l’inverse, un régime de fonctionnaires couvre à la fois la base et le complément : il pèse
          davantage dans les dépenses que dans le nombre de retraités. Le montant moyen versé par chaque régime figure sur
          les fiches ci-dessous (réversions comprises).
        </p>

        <h3>Un retraité, plusieurs régimes</h3>
        <div className="tuiles">
          <Tuile
            libelle="Retraités polypensionnés"
            valeur={`${virgule(100 * POLYPENSION.partPolypensionnes)} %`}
            detail={<>touchent des pensions d’au moins deux régimes de base (hommes {virgule(100 * POLYPENSION.partHommes)} %, femmes {virgule(100 * POLYPENSION.partFemmes)} %)</>}
          />
          <Tuile
            libelle="Pensions par retraité"
            valeur={`≈ ${virgule(pensionsParRetraite)}`}
            detail={<>en comptant base et principales complémentaires ({virgule(POLYPENSION.pensionsBaseParRetraite)} pension de base en moyenne)</>}
          />
          <Tuile libelle="Retraités de droit direct" valeur={`${virgule(TOTAUX_2024.retraites)} M`} detail="personnes, chacune comptée une seule fois" />
        </div>
        <p className="note">
          Un salarié du privé touche au minimum deux pensions (régime général et Agirc-Arrco) ; un quart des retraités ont en
          plus changé de régime de base au cours de leur carrière. C’est pourquoi les effectifs par régime, additionnés,
          dépassent largement le nombre de retraités. Exemples de parcours (répartitions indicatives, non statistiques) :
        </p>
        <div className="parcours">
          {PARCOURS_TYPES.map((p) => (
            <div key={p.titre} className="parcours-ligne">
              <div className="parcours-titre">
                <strong>{p.titre}</strong>
                <span>{p.description}</span>
              </div>
              <div className="parcours-barre" role="img" aria-label={`${p.titre} : ${p.parts.map((x) => `${x.libelle} ${x.part} %`).join(', ')}`}>
                {p.parts.map((x) => (
                  <span
                    key={x.libelle}
                    className="parcours-segment"
                    style={{ flexGrow: x.part, background: COULEURS_REGIMES[x.regime] ?? 'var(--ref)' }}
                    title={`${x.libelle} : ${x.part} % de la pension`}
                  >
                    {x.part >= 12 && <span className="parcours-libelle">{x.libelle}&nbsp;</span>}
                    {x.part} %
                  </span>
                ))}
              </div>
              <ul className="parcours-legende">
                {p.parts.map((x) => (
                  <li key={x.libelle}>
                    <span className="pastille carree" style={{ background: COULEURS_REGIMES[x.regime] ?? 'var(--ref)' }} />
                    {x.libelle} {x.part} %
                  </li>
                ))}
              </ul>
            </div>
          ))}
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

        {lienEvolution}

        <h3>Ce que chaque régime encaisse et verse</h3>
        <p className="note">
          Pour comparer les régimes sur une base commune : combien cotise en moyenne un actif, combien est versé en moyenne à
          un retraité, et quelle part des pensions les cotisations couvrent. Pour les fonctionnaires de l’État, les
          cotisations comprennent la contribution de l’État employeur, dont le taux s’ajuste pour couvrir les pensions (taux
          de couverture de 100 % par construction).
        </p>
        <div className="grille-2">
          <Barres
            titre="Part des pensions couverte par les cotisations"
            sousTitre="Cotisations encaissées / pensions versées, 2024. Sous 100 % : le complément vient d’impôts, de transferts ou de subventions"
            barres={avecCotisations.map((r) => ({
              id: r.id,
              libelle: r.sigle,
              valeur: (100 * r.cotisations!) / r.depenses,
              texte: `${virgule((100 * r.cotisations!) / r.depenses, 0)} %`,
              couleur: couleur(r),
            }))}
            format={(v) => `${virgule(v, 0)} %`}
            repere={{ valeur: 100, libelle: '100 %' }}
            selection={selection}
            onSelect={choisir}
          />
          <Barres
            titre="Cotisation moyenne et pension moyenne"
            sousTitre="Barre pleine : cotisé par actif (salarié + employeur), en € par an ; barre claire : versé par le régime à chacun de ses retraités, en € par an"
            barres={avecCotisations.map((r) => ({
              id: r.id,
              libelle: r.sigle,
              valeur: (r.cotisations! * 1e3) / r.cotisants!,
              texte: `${euros((r.cotisations! * 1e3) / r.cotisants!)} cotisés`,
              couleur: couleur(r),
              secondaire: { valeur: (r.depenses * 1e3) / r.retraites!, texte: `${euros((r.depenses * 1e3) / r.retraites!)} versés` },
            }))}
            format={(v) => `${virgule(v / 1000, 0)} k€`}
            legende={[
              { libelle: 'Cotisation par actif', couleur: 'var(--text-secondary)' },
              { libelle: 'Pension versée par retraité', couleur: 'var(--text-secondary)', clair: true },
            ]}
            selection={selection}
            onSelect={choisir}
          />
        </div>
        <Barres
          titre="Population concernée"
          sousTitre="Barre pleine : cotisants ; barre claire : retraités de droit direct, en millions (une même personne peut relever de plusieurs régimes)"
          barres={avecCotisations.map((r) => ({
            id: r.id,
            libelle: r.sigle,
            valeur: r.cotisants!,
            texte: `${virgule(r.cotisants!, r.cotisants! < 1 ? 2 : 1)} M cotisants`,
            couleur: couleur(r),
            secondaire: { valeur: r.retraites!, texte: `${virgule(r.retraites!, r.retraites! < 1 ? 2 : 1)} M retraités` },
          }))}
          format={(v) => `${virgule(v, Number.isInteger(v) ? 0 : 1)} M`}
          legende={[
            { libelle: 'Cotisants', couleur: 'var(--text-secondary)' },
            { libelle: 'Retraités', couleur: 'var(--text-secondary)', clair: true },
          ]}
          selection={selection}
          onSelect={choisir}
        />
        <p className="note">
          Lecture : un régime qui compte peu de cotisants par retraité doit soit prélever davantage sur chaque actif, soit
          recevoir des ressources extérieures. Les montants par personne sont des moyennes globales (temps partiels, carrières
          incomplètes et réversions comprises) et non des cas individuels. Sources : {SOURCES_COTISATIONS}. Cotisations et
          cotisants en partie estimés (ordres de grandeur).
        </p>
        {lienEvolution}
        </>
      )}

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
                <dt>Retraités</dt>
                <dd>{r.retraites === null ? '—' : `${virgule(r.retraites, r.retraites < 1 ? 2 : 1)} M`}</dd>
              </div>
              <div>
                <dt>Versé / retraité / mois</dt>
                <dd>{pensionMoyenne(r)}</dd>
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
            {r.histoire && (
              <p className="fiche-histoire">
                <strong>Pourquoi un régime à part ?</strong> {r.histoire}
              </p>
            )}
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
