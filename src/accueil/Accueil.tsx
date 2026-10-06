import { Barres } from '../commun/charts/Barres';
import { Tuile } from '../commun/composants';
import { pct } from '../commun/format';
import donnees from '../../data/repartition/apu-france.json';
import { empruntPour100, pour100, type DonneesRepartition, type LignePour100 } from './repartition';

const D = donnees as DonneesRepartition;
const euros = (v: number) => `${v} €`;
const milliards = (v: number) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v)} Md€`;

function Repartition({ titre, sousTitre, lignes, couleur, allerA }: { titre: string; sousTitre: string; lignes: LignePour100[]; couleur: string; allerA: (page: string) => void }) {
  return (
    <section className="repartition">
      <Barres
        titre={titre}
        sousTitre={sousTitre}
        format={euros}
        barres={lignes.map((l) => ({
          id: l.id,
          libelle: l.libelle,
          valeur: l.euros,
          couleur,
          detail: `${milliards(l.mdEuros)}${l.detail ? ` — ${l.detail}` : ''}`,
        }))}
      />
      <ul className="liens-postes">
        {lignes
          .filter((l) => l.page)
          .map((l) => (
            <li key={l.id}>
              <button type="button" className="bouton lien" onClick={() => allerA(l.page!)}>
                {l.libelle} : simuler
              </button>
            </li>
          ))}
      </ul>
    </section>
  );
}

export function Accueil({ allerA }: { allerA: (page: string) => void }) {
  const depenses = pour100(D.depenses.postes);
  const recettes = pour100(D.recettes.postes);
  const emprunt = empruntPour100(D);
  return (
    <>
      {D.statut !== 'vérifié' && (
        <div className="encadre avertissement" role="note">
          <strong>Chiffres à vérifier.</strong> {D.note ?? 'Ces montants n’ont pas encore été relus sur la publication officielle.'}
        </div>
      )}
      <section className="expert-resultats" aria-label="Où vont 100 € de dépense publique">
        <p className="chapeau">
          En {D.annee}, les administrations publiques (État, collectivités locales, Sécurité sociale) ont dépensé{' '}
          {milliards(D.depensesMdEuros)}, soit {pct(D.depensesMdEuros / D.pibMdEuros, 0)} du PIB. Voici, pour 100 € de dépense,
          à quoi ils ont servi et d’où ils venaient.
        </p>
        <div className="tuiles">
          <Tuile libelle={`Dépense publique ${D.annee}`} valeur={milliards(D.depensesMdEuros)} detail={`${pct(D.depensesMdEuros / D.pibMdEuros)} du PIB`} />
          <Tuile libelle={`Recettes publiques ${D.annee}`} valeur={milliards(D.recettesMdEuros)} detail={`${pct(D.recettesMdEuros / D.pibMdEuros)} du PIB`} />
          <Tuile
            libelle="Financé par l’emprunt"
            valeur={`${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(emprunt)} € sur 100 €`}
            detail={`Déficit : ${pct((D.depensesMdEuros - D.recettesMdEuros) / D.pibMdEuros)} du PIB`}
            ton={emprunt > 0 ? 'deficit' : 'excedent'}
          />
          <Tuile libelle={`Dette publique fin ${D.annee}`} valeur={milliards(D.detteMdEuros)} detail={`${pct(D.detteMdEuros / D.pibMdEuros)} du PIB`} />
        </div>
        <div className="grille-2">
          <Repartition titre="À quoi servent 100 € de dépense publique" sousTitre={`Par grande fonction, ${D.depenses.annee} (dernière répartition publiée)`} lignes={depenses} couleur="var(--series-1)" allerA={allerA} />
          <Repartition titre="D’où viennent 100 € de recettes publiques" sousTitre={`Par type de recette, ${D.recettes.annee}`} lignes={recettes} couleur="var(--series-3)" allerA={allerA} />
        </div>
        <p className="note">
          Montants arrondis à l’euro, dont le total fait 100 €. Administrations publiques consolidées, au sens de la comptabilité
          nationale. Sources : ensemble, <a href={D.url}>{D.source}</a> ; dépenses par fonction,{' '}
          <a href={D.depenses.url}>{D.depenses.source}</a> ; recettes, <a href={D.recettes.url}>{D.recettes.source}</a>.
        </p>
      </section>
    </>
  );
}
