import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { simuler, type EquilibreAnnee, type ResultatSimulation } from '../../engine';
import { Courbes } from '../charts/Courbes';
import { GraphiqueAges } from '../charts/GraphiqueAges';
import { Pyramide } from '../charts/Pyramide';
import { SoldeProductivite } from '../charts/SoldeProductivite';
import { Choix, Curseur, Encadre, Tuile } from '../composants';
import { ans, effortFinancement, milliards, pct, pctSigne, points } from '../format';
import { ANNEE_MESURES, PARAMETRES_REFERENCE, versScenario, type ParametresUI } from '../parametres';
import { appliquerPreset, PRESETS } from '../presets';
import { REFORMES } from '../../engine/donnees/historique';
import { ANNEE_DEBUT_HISTORIQUE, avecHistorique } from '../historique';
import { etatsPyramidesHistoriques, ratioActifsInactifs, serieActifsInactifsHistorique } from '../pyramidesHistoriques';
import { fourchette } from '../sensibilite';
import { avecTendanceObservee, LIBELLE_TENDANCE_COURT, TENDANCE_OBSERVEE } from '../productivite';
import { Sensibilite } from './Sensibilite';
import { Regimes } from './Regimes';

interface Props {
  parametres: ParametresUI;
  setParametres: (p: ParametresUI) => void;
  reference: ResultatSimulation;
  scenario: ResultatSimulation;
  equilibreScenario: EquilibreAnnee[];
  historique: boolean;
  setHistorique: (v: boolean) => void;
}

const ETAPES = ['Comprendre', 'Choisir mes mesures', 'Qui paie ?'] as const;
const ANNEES_CLES = [2030, 2045, 2070] as const;

const an = (s: ResultatSimulation, a: number) => s.annees.find((r) => r.annee === a)!;
const serie = (s: ResultatSimulation, f: (r: ResultatSimulation['annees'][number]) => number) =>
  s.annees.map((r) => ({ x: r.annee, y: f(r) }));

export function GrandPublic(props: Props) {
  const [etape, setEtape] = useState(0);
  useEffect(() => window.scrollTo({ top: 0 }), [etape]);
  return (
    <div className="grand-public">
      <nav className="etapes" aria-label="Étapes">
        {ETAPES.map((e, i) => (
          <button key={e} type="button" className={i === etape ? 'actif' : ''} aria-current={i === etape ? 'step' : undefined} onClick={() => setEtape(i)}>
            <span className="etape-num">{i + 1}</span>
            {e}
          </button>
        ))}
      </nav>
      {etape === 0 && <Comprendre {...props} />}
      {etape === 1 && <Choisir {...props} />}
      {etape === 2 && <QuiPaie {...props} />}
      <div className="navigation-etapes">
        {etape > 0 && (
          <button type="button" className="bouton secondaire" onClick={() => setEtape(etape - 1)}>
            ← {ETAPES[etape - 1]}
          </button>
        )}
        {etape < ETAPES.length - 1 && (
          <button type="button" className="bouton principal" onClick={() => setEtape(etape + 1)}>
            {ETAPES[etape + 1]} →
          </button>
        )}
      </div>
    </div>
  );
}

function Comprendre({ reference, historique }: Props) {
  const referenceTendance = useMemo(() => simuler(versScenario(avecTendanceObservee(PARAMETRES_REFERENCE))), []);
  const [annee, setAnnee] = useState(2025);
  const [lecture, setLecture] = useState(false);
  useEffect(() => {
    if (!lecture) return;
    const t = setInterval(() => setAnnee((a) => (a >= 2070 ? (setLecture(false), 2070) : a + 1)), 160);
    return () => clearInterval(t);
  }, [lecture]);
  const debutPyramide = historique ? ANNEE_DEBUT_HISTORIQUE : 2025;
  const r = annee < 2025 ? etatsPyramidesHistoriques().get(annee)! : an(reference, annee);
  const debut = reference.annees[0];
  const fin = an(reference, 2070);

  return (
    <section>
      <h2>Comment fonctionne le système ?</h2>
      <p className="chapeau">
        En France, les retraites sont financées par <strong>répartition</strong> : les cotisations des actifs
        d’une année paient les pensions des retraités de la même année. L’équilibre dépend donc du
        nombre de cotisants par retraité, du niveau des pensions et du taux de prélèvement.
      </p>
      <p className="sommaire">
        <button type="button" className="bouton lien" onClick={() => document.getElementById('regimes')?.scrollIntoView({ behavior: 'smooth' })}>
          Voir la répartition par régime (régime général, fonction publique, régimes spéciaux…) ↓
        </button>
      </p>

      <div className="tuiles">
        {ANNEES_CLES.map((a) => {
          const x = an(reference, a);
          return (
            <Tuile
              key={a}
              libelle={`Solde en ${a}`}
              valeur={pctSigne(x.soldePctPib)}
              detail={<>du PIB, soit {milliards(x.solde)} (euros 2025)</>}
              ton={x.soldePctPib < -0.0005 ? 'deficit' : 'neutre'}
            />
          );
        })}
      </div>
      <p className="note">
        Projection à législation actuelle, hypothèses du Conseil d’orientation des retraites (COR, juin 2026) :
        productivité +0,7 %/an, chômage 7 %, 1,45 enfant par femme, solde migratoire +150 000/an.
      </p>

      <div className="grille-2">
        <div>
          <Pyramide resultat={r} />
          <div className="controle-annee">
            <button type="button" className="bouton secondaire" onClick={() => (annee >= 2070 && setAnnee(debutPyramide), setLecture(!lecture))}>
              {lecture ? '❚❚ Pause' : '▶ Animer'}
            </button>
            <input
              type="range"
              min={debutPyramide}
              max={2070}
              value={Math.max(annee, debutPyramide)}
              aria-label="Année affichée"
              onChange={(e) => (setLecture(false), setAnnee(Number(e.target.value)))}
            />
            <span className="annee">{annee}</span>
          </div>
        </div>
        <div>
          <Courbes
            titre="Actifs en emploi pour un retraité et pour un inactif"
            sousTitre="Inactifs : toutes les personnes sans emploi (retraités, jeunes, chômeurs, autres inactifs)"
            {...avecHistorique(historique, 'ratioCotisantsRetraites', [
              { id: 'ref', nom: 'Pour un retraité', couleur: 'var(--series-1)', valeurs: serie(reference, (x) => x.ratioCotisantsRetraites) },
              {
                id: 'inactifs',
                nom: 'Pour un inactif',
                couleur: 'var(--series-3)',
                valeurs: [...(historique ? serieActifsInactifsHistorique() : []), ...serie(reference, (x) => ratioActifsInactifs(x))],
              },
            ])}
            format={(v) => v.toFixed(2).replace('.', ',')}
            formatAxe={(v) => v.toFixed(1).replace('.', ',')}
            domaine={[0.5, 1.8]}
            hauteur={270}
          />
          <p className="explication">
            On passerait de <strong>{debut.ratioCotisantsRetraites.toFixed(2).replace('.', ',')}</strong> cotisant par retraité
            en 2025 à <strong>{fin.ratioCotisantsRetraites.toFixed(2).replace('.', ',')}</strong> en 2070 : les générations
            nombreuses du baby-boom partent à la retraite, l’espérance de vie progresse et les naissances reculent.
          </p>
          <p className="explication">
            Le nombre d’actifs en emploi pour un <strong>inactif</strong> (toute personne sans emploi) bouge beaucoup moins :{' '}
            <strong>{ratioActifsInactifs(debut).toFixed(2).replace('.', ',')}</strong> en 2025,{' '}
            <strong>{ratioActifsInactifs(fin).toFixed(2).replace('.', ',')}</strong> en 2070. Il y aura moins de jeunes à
            charge mais davantage de retraités — or seuls ces derniers sont financés par les caisses de retraite.
          </p>
        </div>
      </div>

      <div className="grille-2">
        <SoldeProductivite
          historique={historique}
          productivite={[{ nom: 'Hypothèse du COR (0,7 % à long terme)', simulation: reference, couleur: 'var(--series-1)' }]}
          soldeTendance={referenceTendance}
        >
          <Courbes
            titre="Solde du système de retraite"
            sousTitre="En % du PIB — au-dessus de zéro : excédent ; en dessous : déficit"
            {...avecHistorique(historique, 'soldePctPib', [
              { id: 'ref', nom: 'Projection (législation actuelle)', couleur: 'var(--series-1)', valeurs: serie(reference, (x) => x.soldePctPib) },
            ])}
            format={(v) => pct(v)}
            zero
            hauteur={250}
          />
        </SoldeProductivite>
        <GraphiqueAges simulation={reference} historique={historique} />
      </div>
      {historique && (
        <p className="note">
          Observé : points d’ancrage approximatifs (COR, DREES, INSEE) reliés entre eux, à remplacer par les séries
          officielles annuelles. Les définitions diffèrent légèrement de celles du modèle, d’où de petites marches en 2025.
        </p>
      )}

      <p className="note">
        Espérance de vie : 25,7 ans à 60 ans en 2025 (INSEE). Le modèle simplifié projette ensuite une hausse plus rapide
        que les projections de l’INSEE (≈ 32,7 ans en 2070 contre ≈ 30 ans) : c’est un paramètre de calage, documenté dans la
        note de méthode, qui sera corrigé avec les tables de mortalité officielles. Âge sans incapacité : 65 ans + espérance
        de vie sans incapacité à 65 ans (DREES : ≈ 11,2 ans en 2024, moyenne femmes-hommes) ; projeté en supposant que la
        part des années vécues sans incapacité reste de 52 % — une hypothèse, pas une prévision.
      </p>

      <Encadre titre="Quarante ans de réformes">
        <ol className="frise">
          {REFORMES.map((r) => (
            <li key={r.annee}>
              <span className="frise-annee">{r.annee}</span>
              <div>
                <span className="frise-nom">{r.nom}</span>
                <ul>
                  {r.mesures.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </Encadre>

      <Encadre titre="L’équation de l’équilibre">
        <p className="equation">
          taux de prélèvement × <span>cotisants / retraités</span> = <span>pension moyenne / revenu d’activité moyen</span>
        </p>
        <p>Quand le nombre de cotisants par retraité baisse, il n’existe que trois façons de rétablir l’équilibre :</p>
        <ol>
          <li><strong>prélever davantage</strong> (cotisations, impôts affectés) ;</li>
          <li><strong>travailler plus longtemps</strong> (âge de départ, durée de cotisation), ce qui augmente les cotisants et réduit les retraités ;</li>
          <li><strong>baisser le niveau relatif des pensions</strong> (indexation, règles de calcul).</li>
        </ol>
        <p>
          La <strong>croissance</strong> joue aussi : les pensions suivent les prix, les salaires suivent la productivité.
          Une croissance plus forte réduit la pension relative et améliore le solde. La <strong>capitalisation</strong> change
          la façon d’épargner, mais pas l’équation de la répartition pendant la transition.
        </p>
      </Encadre>

      <Regimes integre />
    </section>
  );
}

function Choisir({ parametres: p, setParametres, reference, scenario, equilibreScenario, historique }: Props) {
  const maj = (m: Partial<ParametresUI>) => setParametres({ ...p, ...m });
  const presetActif = PRESETS.find((x) => JSON.stringify(appliquerPreset(x)) === JSON.stringify(p))?.id;
  const eq = (a: number) => equilibreScenario.find((e) => e.annee === a)!;
  const gel = p.anneesGel.includes(ANNEE_MESURES);
  const pDiffere = useDeferredValue(p);
  const { pessimiste, optimiste } = useMemo(() => fourchette(pDiffere), [pDiffere]);
  const scenarioTendance = useMemo(() => simuler(versScenario(avecTendanceObservee(pDiffere))), [pDiffere]);

  return (
    <section>
      <h2>À vous de choisir</h2>
      <p className="chapeau">
        Partez d’un scénario-type ou réglez vous-même les curseurs. Les mesures s’appliquent à partir de {ANNEE_MESURES}.
      </p>
      <div className="presets" role="group" aria-label="Scénarios-types">
        {PRESETS.map((x) => (
          <button key={x.id} type="button" title={x.description} className={x.id === presetActif ? 'actif' : ''} onClick={() => setParametres(appliquerPreset(x))}>
            {x.nom}
          </button>
        ))}
      </div>

      <div className="mise-en-page-choix">
        <div className="panneau">
          <Choix
            libelle="Âge légal de départ"
            valeur={p.ageLegalCible ?? 0}
            options={[
              { valeur: 0, libelle: 'Actuel (→ 64)' },
              { valeur: 60, libelle: '60' },
              { valeur: 62, libelle: '62' },
              { valeur: 63, libelle: '63' },
              { valeur: 65, libelle: '65' },
              { valeur: 66, libelle: '66' },
              { valeur: 67, libelle: '67' },
            ]}
            onChange={(v) => maj({ ageLegalCible: v === 0 ? null : v, ageLegalAnnee: v !== 0 && v < 64 ? ANNEE_MESURES : Math.max(p.ageLegalAnnee, 2035) })}
            aide="Législation actuelle : 62 ans et 9 mois pendant la suspension, puis 64 ans en 2033."
          />
          <Curseur
            libelle="Hausse des cotisations"
            valeur={p.hausseCotisation}
            min={0}
            max={6}
            pas={0.25}
            reference={0}
            format={(v) => `+${v.toFixed(2).replace('.', ',')} pt`}
            onChange={(v) => maj({ hausseCotisation: v })}
            aide="Points de cotisation sur les salaires (1 point ≈ 13 Md€ par an)."
          />
          <Curseur
            libelle="Revalorisation des pensions (2028-2035)"
            valeur={-p.sousIndexation}
            min={-2}
            max={0}
            pas={0.25}
            reference={0}
            format={(v) => (v === 0 ? 'Inflation' : `Inflation ${v.toFixed(2).replace('.', ',')} pt`)}
            onChange={(v) => maj({ sousIndexation: -v, sousIndexationFin: 2035 })}
            aide={
              <label className="case">
                <input type="checkbox" checked={gel} onChange={(e) => maj({ anneesGel: e.target.checked ? [ANNEE_MESURES] : [] })} />
                Geler les pensions en {ANNEE_MESURES} (« année blanche »)
              </label>
            }
          />
          <Curseur
            libelle="Capitalisation"
            valeur={p.capitalisationTaux}
            min={0}
            max={6}
            pas={0.5}
            reference={0}
            format={(v) => (v === 0 ? 'Aucune' : `${v.toFixed(1).replace('.', ',')} pt`)}
            onChange={(v) => maj({ capitalisationTaux: v })}
            aide={
              <select
                value={p.capitalisationMode}
                onChange={(e) => maj({ capitalisationMode: e.target.value as ParametresUI['capitalisationMode'] })}
                aria-label="Type de capitalisation"
              >
                <option value="substitutif">Prise sur les cotisations actuelles (comptes individuels)</option>
                <option value="additionnel">En plus des cotisations actuelles (comptes individuels)</option>
                <option value="fonds-reserve">Fonds collectif de réserve</option>
              </select>
            }
          />
          <fieldset className="groupe-hypotheses">
            <legend>Hypothèses (incertitudes, pas des mesures)</legend>
            <Choix
              libelle="Productivité"
              valeur={p.productiviteDepart !== null ? 'tendance' : String(p.productivite)}
              options={[
                { valeur: 'tendance', libelle: LIBELLE_TENDANCE_COURT },
                { valeur: '0.4', libelle: '0,4 %' },
                { valeur: '0.7', libelle: '0,7 % (COR)' },
                { valeur: '1', libelle: '1,0 %' },
                { valeur: '1.3', libelle: '1,3 %' },
              ]}
              onChange={(v) =>
                maj(
                  v === 'tendance'
                    ? { productivite: TENDANCE_OBSERVEE.longTerme, productiviteDepart: TENDANCE_OBSERVEE.depart }
                    : { productivite: Number(v), productiviteDepart: null },
                )
              }
              aide="Croissance annuelle à long terme. La tendance observée part du niveau quasi nul de 2024."
            />
            <Choix
              libelle="Chômage"
              valeur={p.chomage}
              options={[
                { valeur: 4.5, libelle: '4,5 %' },
                { valeur: 7, libelle: '7 % (COR)' },
                { valeur: 10, libelle: '10 %' },
              ]}
              onChange={(v) => maj({ chomage: v })}
            />
            <Choix
              libelle="Natalité (enfants par femme)"
              valeur={p.fecondite}
              options={[
                { valeur: 1.3, libelle: '1,3' },
                { valeur: 1.45, libelle: '1,45 (COR)' },
                { valeur: 1.6, libelle: '1,6' },
                { valeur: 1.8, libelle: '1,8' },
              ]}
              onChange={(v) => maj({ fecondite: v })}
            />
            <p className="aide">
              La zone colorée du graphique montre l’éventail des résultats entre les hypothèses les plus défavorables et
              les plus favorables.
            </p>
          </fieldset>
        </div>

        <div className="resultats">
          <div className="tuiles">
            {ANNEES_CLES.map((a) => {
              const s = an(scenario, a);
              const r = an(reference, a);
              return (
                <Tuile
                  key={a}
                  libelle={`Solde en ${a}`}
                  valeur={pctSigne(s.soldePctPib)}
                  detail={<>du PIB ({milliards(s.solde)}) · {points(s.soldePctPib - r.soldePctPib)} vs actuel</>}
                  ton={s.soldePctPib < -0.0005 ? 'deficit' : s.soldePctPib > 0.0005 ? 'excedent' : 'neutre'}
                />
              );
            })}
          </div>
          <SoldeProductivite
            historique={historique}
            productivite={[
              { nom: 'Mon scénario', simulation: scenario, couleur: 'var(--series-1)' },
              { nom: 'Hypothèse du COR', simulation: reference, couleur: 'var(--ref)', pointille: true },
            ]}
            fourchette={{ nom: 'Hypothèses testées', bas: pessimiste, haut: optimiste }}
            soldeTendance={scenarioTendance}
          >
            <Courbes
              titre="Solde du système de retraite"
              sousTitre="En % du PIB — au-dessus de zéro : excédent ; en dessous : déficit"
              {...avecHistorique(historique, 'soldePctPib', [
                { id: 'ref', nom: 'Législation actuelle', couleur: 'var(--ref)', valeurs: serie(reference, (x) => x.soldePctPib), pointille: true },
                { id: 'moi', nom: 'Mon scénario', couleur: 'var(--series-1)', valeurs: serie(scenario, (x) => x.soldePctPib) },
              ])}
              bande={{
                nom: 'Mon scénario, hypothèses défavorables à favorables',
                couleur: 'var(--series-1)',
                bas: serie(pessimiste, (x) => x.soldePctPib),
                haut: serie(optimiste, (x) => x.soldePctPib),
              }}
              format={(v) => pct(v)}
              zero
              reperes={[{ x: ANNEE_MESURES, libelle: 'mesures' }]}
            />
          </SoldeProductivite>
          <Encadre titre="Ce qu’il resterait à faire pour équilibrer">
            <table className="tableau compact">
              <thead>
                <tr>
                  <th>Avec un seul levier en plus…</th>
                  <th>2045</th>
                  <th>2070</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Âge moyen de départ nécessaire</td>
                  {[2045, 2070].map((a) => (
                    <td key={a}>{ans(eq(a).ageDepartNecessaire)}</td>
                  ))}
                </tr>
                <tr>
                  <td>ou hausse de prélèvements</td>
                  {[2045, 2070].map((a) => (
                    <td key={a}>{points(eq(a).hausseTauxNecessaire)}</td>
                  ))}
                </tr>
                <tr>
                  <td>ou pension relative ramenée à</td>
                  {[2045, 2070].map((a) => (
                    <td key={a}>{pct(eq(a).pensionRelativeNecessaire)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
            <p className="note">
              Pension relative : pension moyenne rapportée au revenu d’activité moyen ({pct(an(scenario, 2045).pensionRelative)} en
              2045 dans votre scénario).
            </p>
          </Encadre>
          <button type="button" className="bouton lien" onClick={() => setParametres(PARAMETRES_REFERENCE)}>
            Revenir à la législation actuelle
          </button>
        </div>
      </div>
      <h3>Et si les hypothèses changent ?</h3>
      <Sensibilite parametres={p} historique={historique} />
      <div className="resume-mobile" aria-hidden="true">
        {ANNEES_CLES.map((a) => (
          <div key={a}>
            Solde {a}
            <strong>{pctSigne(an(scenario, a).soldePctPib)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

const GENERATIONS = [1965, 1975, 1985, 1995, 2005] as const;

function QuiPaie({ parametres, reference, scenario, historique }: Props) {
  const mode = parametres.capitalisationTaux > 0 ? parametres.capitalisationMode : undefined;
  const lignes: Array<{ libelle: string; aide: string; f: (r: ResultatSimulation['annees'][number], m?: string) => string }> = [
    { libelle: 'Âge moyen de départ', aide: 'Les actifs travaillent plus ou moins longtemps.', f: (r) => ans(r.ageMoyenDepart) },
    { libelle: 'Durée de retraite attendue', aide: 'Espérance de vie à l’âge de départ.', f: (r) => ans(r.esperanceVieADepart) },
    {
      libelle: 'Niveau de vie relatif des retraités',
      aide: 'Pension moyenne (y compris rente de capitalisation) / revenu d’activité moyen.',
      f: (r) => pct(r.pensionRelativeTotale),
    },
    { libelle: 'Prélèvements pour les retraites', aide: 'En % du PIB, y compris cotisations de capitalisation.', f: (r, m) => pct(effortFinancement(r, m)) },
    { libelle: 'Dette accumulée par le système', aide: 'Déficits cumulés depuis 2025, en % du PIB (négatif : réserves).', f: (r) => pct(r.detteCumuleePctPib, 0) },
  ];

  return (
    <section>
      <h2>Qui paie l’ajustement ?</h2>
      <p className="chapeau">
        Toute mesure répartit l’effort entre trois groupes : les <strong>actifs</strong> (cotisations, âge), les{' '}
        <strong>retraités</strong> (niveau des pensions) et les <strong>générations futures</strong> (dette).
      </p>
      <div className="tableau-defilant">
        <table className="tableau">
          <thead>
            <tr>
              <th rowSpan={2}>Indicateur</th>
              <th colSpan={2}>2045</th>
              <th colSpan={2}>2070</th>
            </tr>
            <tr>
              <th>Actuel</th>
              <th>Mon scénario</th>
              <th>Actuel</th>
              <th>Mon scénario</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => (
              <tr key={l.libelle}>
                <td>
                  {l.libelle}
                  <span className="aide-ligne">{l.aide}</span>
                </td>
                <td>{l.f(an(reference, 2045))}</td>
                <td className="fort">{l.f(an(scenario, 2045), mode)}</td>
                <td>{l.f(an(reference, 2070))}</td>
                <td className="fort">{l.f(an(scenario, 2070), mode)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grille-2">
        <Courbes
          titre="Niveau de vie relatif des retraités"
          sousTitre="Pension moyenne / revenu d’activité moyen"
          {...avecHistorique(historique, 'pensionRelative', [
            { id: 'ref', nom: 'Législation actuelle', couleur: 'var(--ref)', valeurs: serie(reference, (x) => x.pensionRelativeTotale), pointille: true },
            { id: 'moi', nom: 'Mon scénario', couleur: 'var(--series-1)', valeurs: serie(scenario, (x) => x.pensionRelativeTotale) },
          ])}
          format={(v) => pct(v, 0)}
        />
        <Courbes
          titre="Dette accumulée par le système"
          sousTitre="Déficits cumulés depuis 2025, en % du PIB"
          series={[
            { id: 'ref', nom: 'Législation actuelle', couleur: 'var(--ref)', valeurs: serie(reference, (x) => x.detteCumuleePctPib), pointille: true },
            { id: 'moi', nom: 'Mon scénario', couleur: 'var(--series-1)', valeurs: serie(scenario, (x) => x.detteCumuleePctPib) },
          ]}
          format={(v) => pct(v, 0)}
          zero
        />
      </div>

      <h3>Par génération</h3>
      <p className="note">Situation moyenne de chaque génération au moment de son départ (vers 63 ans), selon votre scénario.</p>
      <div className="tableau-defilant">
        <table className="tableau">
          <thead>
            <tr>
              <th>Née en</th>
              <th>Départ vers</th>
              <th>Âge de départ</th>
              <th>Durée de retraite attendue</th>
              <th>Pension par répartition au départ / revenu moyen</th>
              <th>Écart vs actuel</th>
            </tr>
          </thead>
          <tbody>
            {GENERATIONS.map((g) => {
              const a = Math.min(2070, g + 63);
              const s = an(scenario, a);
              const r = an(reference, a);
              return (
                <tr key={g}>
                  <td>{g}</td>
                  <td>{a === 2070 && g + 63 > 2070 ? '2070 et après' : a}</td>
                  <td>{ans(s.ageMoyenDepart)}</td>
                  <td>{ans(s.esperanceVieADepart)}</td>
                  <td>{pct(s.pensionLiquidationRelative, 0)}</td>
                  <td>{points(s.pensionLiquidationRelative - r.pensionLiquidationRelative)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
