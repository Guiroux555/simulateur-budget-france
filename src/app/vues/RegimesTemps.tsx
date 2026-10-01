import { useEffect, useMemo, useState } from 'react';
import type { ResultatSimulation } from '../../engine';
import { REGIMES } from '../../engine/donnees/regimes';
import { STATUT_REGIMES_TEMPS } from '../../engine/donnees/regimesTemps';
import { Barres } from '../charts/Barres';
import { Courbes, type Serie } from '../charts/Courbes';
import { useFenetre } from '../fenetre';
import { REPERES_REFORMES } from '../historique';
import { ANNEE_DEBUT_REGIMES, ANNEE_FIN_REGIMES, regimesDansLeTemps } from '../regimesTemps';
import { PARAMETRES_REFERENCE, type ParametresUI } from '../parametres';
import { PanneauInteractif, useModeInteractif } from './PanneauInteractif';

interface Props {
  reference: ResultatSimulation;
  /** Paramètres de départ du mode interactif. */
  parametres?: ParametresUI;
  /** Propose le mode interactif (curseurs et poids des critères). */
  interactif?: boolean;
  couleur: (id: string) => string;
  selection: string | null;
  onSelect: (id: string) => void;
}

const virgule = (v: number, d = 1) => v.toFixed(d).replace('.', ',');
const pctPib = (v: number) => `${v < 0 ? '−' : v > 0 ? '+' : ''}${virgule(Math.abs(v * 100), 2)} %`;

/** Les graphiques par régime à une année choisie (2000-2070) et leur évolution. */
export function RegimesTemps({ reference, parametres = PARAMETRES_REFERENCE, interactif = true, couleur, selection, onSelect }: Props) {
  const mode = useModeInteractif(parametres);
  const resultatInteractif = mode.resultat;
  const donnees = useMemo(() => resultatInteractif?.regimes ?? regimesDansLeTemps(reference), [resultatInteractif, reference]);
  const fenetre = useFenetre();
  const min = Math.max(ANNEE_DEBUT_REGIMES, Math.min(fenetre.debut, ANNEE_FIN_REGIMES - 10));
  const max = Math.min(ANNEE_FIN_REGIMES, fenetre.fin);
  const [anneeChoisie, setAnnee] = useState(2024);
  const annee = Math.min(max, Math.max(min, anneeChoisie));
  const [lecture, setLecture] = useState(false);
  useEffect(() => {
    if (!lecture) return;
    const t = setInterval(() => setAnnee((a) => (a >= max ? (setLecture(false), max) : Math.max(a, min) + 1)), 180);
    return () => clearInterval(t);
  }, [lecture, min, max]);

  const nom = (id: string) => REGIMES.find((r) => r.id === id)!.sigle;
  const ligne = (id: string) => donnees.regimes.find((r) => r.id === id)!.annees.find((l) => l.annee === annee)!;
  const ordre = REGIMES.map((r) => r.id).sort((a, b) => ligne(b).depensesPctPib - ligne(a).depensesPctPib);
  const projection = annee >= 2025;

  const courbes = (f: (l: SerieAnnee) => number | null): Serie[] =>
    donnees.regimes
      .map((r) => ({
        id: r.id,
        nom: nom(r.id),
        couleur: couleur(r.id),
        epaisseur: selection === r.id ? 3.5 : selection ? 1.25 : 2,
        valeurs: r.annees.filter((l) => f(l) !== null).map((l) => ({ x: l.annee, y: f(l)! })),
      }))
      .filter((s) => s.valeurs.length > 0);
  const axe = { separation: 2025, reformes: REPERES_REFORMES };

  return (
    <div className="regimes-temps">
      <p className="note avertissement">
        {STATUT_REGIMES_TEMPS} Projection : législation actuelle, hypothèses du COR. Retraités, cotisants et montants
        moyens par régime sont dérivés des valeurs 2024 et de l’évolution d’ensemble (estimations).
      </p>

      {interactif && <PanneauInteractif mode={mode} annee={annee} />}

      <div className="controle-annee grand">
        <button type="button" className="bouton secondaire" onClick={() => (annee >= max && setAnnee(min), setLecture(!lecture))}>
          {lecture ? '❚❚ Pause' : '▶ Animer'}
        </button>
        <input
          type="range"
          min={min}
          max={max}
          value={annee}
          aria-label="Année affichée pour les régimes"
          onChange={(e) => (setLecture(false), setAnnee(Number(e.target.value)))}
        />
        <span className="annee">
          {annee}
          <span className="annee-statut">{projection ? 'projection' : 'reconstitué'}</span>
        </span>
      </div>

      <div className="grille-2">
        <Barres
          titre={`Dépenses par régime en ${annee}`}
          sousTitre="En % du PIB (et part des dépenses totales)"
          barres={ordre.map((id) => ({
            id,
            libelle: nom(id),
            valeur: ligne(id).depensesPctPib * 100,
            texte: `${virgule(ligne(id).depensesPctPib * 100, 2)} % (${virgule(ligne(id).part, 0)} % du total)`,
            couleur: couleur(id),
          }))}
          format={(v) => `${virgule(v, Number.isInteger(v) ? 0 : 1)} %`}
          margeDroite={140}
          selection={selection}
          onSelect={onSelect}
        />
        <Barres
          titre={`Solde par régime en ${annee}`}
          sousTitre="En % du PIB (convention comptable du COR) — à gauche de zéro : déficit"
          barres={ordre.map((id) => ({
            id,
            libelle: nom(id),
            valeur: ligne(id).soldePctPib * 100,
            texte: Math.abs(ligne(id).soldePctPib) < 0.00005 ? '≈ 0' : pctPib(ligne(id).soldePctPib),
            couleur: couleur(id),
          }))}
          format={(v) => `${virgule(v, 1)}`}
          selection={selection}
          onSelect={onSelect}
        />
      </div>
      <Barres
        titre={`Cotisants pour un retraité en ${annee}`}
        barres={ordre
          .filter((id) => ligne(id).ratio !== null)
          .sort((a, b) => (ligne(b).ratio ?? 0) - (ligne(a).ratio ?? 0))
          .map((id) => ({ id, libelle: nom(id), valeur: ligne(id).ratio!, texte: virgule(ligne(id).ratio!, 2), couleur: couleur(id) }))}
        format={(v) => virgule(v, 2)}
        repere={{ valeur: 1, libelle: '1 cotisant pour 1 retraité' }}
        selection={selection}
        onSelect={onSelect}
      />

      <h3 id="evolution-regimes">Évolution {Math.max(ANNEE_DEBUT_REGIMES, fenetre.debut)}-{max}</h3>
      <div className="grille-2">
        <Courbes titre="Dépenses par régime" sousTitre="% du PIB" series={courbes((l) => l.depensesPctPib)} format={pctPibSimple} {...axe} hauteur={300} />
        <Courbes titre="Solde par régime" sousTitre="% du PIB ; le régime général porte l’essentiel du déficit projeté" series={courbes((l) => l.soldePctPib)} format={pctPib} formatAxe={pctPibSimple} zero {...axe} hauteur={300} />
        <Courbes titre="Cotisants pour un retraité" sousTitre="Régimes spéciaux fermés aux nouveaux embauchés : extinction progressive" series={courbes((l) => l.ratio)} format={(v) => virgule(v, 2)} {...axe} hauteur={300} />
        <Courbes titre="Cotisants par régime" sousTitre="Millions de cotisants" series={courbes((l) => l.cotisants)} format={(v) => `${virgule(v, 1)} M`} {...axe} hauteur={300} />
        <Courbes
          titre="Retraités par régime"
          sousTitre="Millions de retraités de droit direct (une même personne peut relever de plusieurs régimes)"
          series={courbes((l) => l.retraites)}
          format={(v) => `${virgule(v, 1)} M`}
          {...axe}
          hauteur={300}
        />
        <Courbes
          titre="Part des pensions couverte par les cotisations"
          sousTitre="Cotisations / pensions ; sous 100 % : impôts, transferts ou subventions"
          series={courbes((l) => l.couverture)}
          format={(v) => `${virgule(v * 100, 0)} %`}
          domaine={[0, 1.1]}
          {...axe}
          hauteur={300}
        />
        <Courbes
          titre="Cotisation moyenne par actif"
          sousTitre="Salarié + employeur (État employeur compris), € de 2025 par an"
          series={courbes((l) => l.cotisationMoyenne)}
          format={euros}
          formatAxe={(v) => `${virgule(v / 1000, 0)} k€`}
          {...axe}
          hauteur={300}
        />
        <Courbes
          titre="Pension moyenne versée par retraité"
          sousTitre="Montant versé par ce régime à chacun de ses retraités, € de 2025 par an"
          series={courbes((l) => l.pensionMoyenne)}
          format={euros}
          formatAxe={(v) => `${virgule(v / 1000, 0)} k€`}
          {...axe}
          hauteur={300}
        />
      </div>
    </div>
  );
}

type SerieAnnee = ReturnType<typeof regimesDansLeTemps>['regimes'][number]['annees'][number];
const euros = (v: number) => `${(Math.round(v / 100) * 100).toLocaleString('fr-FR')} €`;
const pctPibSimple = (v: number) => `${virgule(v * 100, 1)} %`;
