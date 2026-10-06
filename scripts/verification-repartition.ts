/**
 * Relit sur les données ouvertes les chiffres de la page « Où vont 100 € »
 * (data/repartition/apu-france.json) et signale tout écart.
 *
 * Sources interrogées (sans clé d'API) :
 *  - Eurostat (données transmises par l'Insee) : grandeurs d'ensemble des APU (gov_10a_main),
 *    dette au sens de Maastricht (gov_10dd_edpt1), PIB (nama_10_gdp), dépenses par fonction COFOG
 *    (gov_10a_exp) ;
 *  - Insee, API Melodi, jeu « Comptes des administrations publiques » (DD_CNA_APU) : détail des
 *    impôts et cotisations de l'année la plus récente (pas encore publié par Eurostat).
 *
 * Usage : npm run verification:repartition
 */
import donnees from '../data/repartition/apu-france.json';
import type { DonneesRepartition } from '../src/accueil/repartition';

const D = donnees as DonneesRepartition;
const EUROSTAT = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/';
const MELODI = 'https://api.insee.fr/melodi/data/DD_CNA_APU';
/** Tolérance : les montants du fichier sont arrondis à 0,1 Md€. */
const TOLERANCE_MD = 0.051;

type Filtres = Record<string, string | string[]>;

function requete(base: string, filtres: Filtres): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(filtres)) for (const x of [v].flat()) q.append(k, x);
  return `${base}?${q}`;
}

/** Valeur unique d'une série Eurostat (millions d'euros), ramenée en Md€. */
async function eurostat(jeu: string, filtres: Filtres): Promise<number> {
  const r = await fetch(requete(EUROSTAT + jeu, { format: 'JSON', unit: 'MIO_EUR', geo: 'FR', ...filtres }));
  if (!r.ok) throw new Error(`Eurostat ${jeu} : HTTP ${r.status}`);
  const valeurs = Object.values((await r.json()).value as Record<string, number>);
  if (valeurs.length !== 1) throw new Error(`Eurostat ${jeu} ${JSON.stringify(filtres)} : ${valeurs.length} valeurs`);
  return valeurs[0] / 1000;
}

/** Recette des APU (Insee, Melodi), en Md€ : impôts et cotisations reçus du reste de l'économie. */
async function melodi(operation: string, annee: number): Promise<number> {
  const url = requete(MELODI, {
    REF_SECTOR: 'S13', STO: operation, TIME_PERIOD: String(annee), EXPENDITURE: '_Z',
    ACCOUNTING_ENTRY: 'C', COUNTERPART_SECTOR: 'S1', UNIT_MEASURE: 'XDC', maxResult: '100',
  });
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`Melodi ${operation} : HTTP ${r.status}`);
  const obs: Array<{ measures: { OBS_VALUE_NIVEAU: { value?: number } } }> = (await r.json()).observations;
  // Même valeur en version consolidée et non consolidée pour ces opérations reçues de l'extérieur des APU.
  const valeurs = [...new Set(obs.map((o) => o.measures.OBS_VALUE_NIVEAU.value).filter((v) => v !== undefined))];
  if (valeurs.length !== 1) throw new Error(`Melodi ${operation} ${annee} : ${valeurs.length} valeurs distinctes`);
  return valeurs[0]! / 1000;
}

const lignes: Array<{ donnee: string; fichier: number; source: number; ecart: string }> = [];
let ecarts = 0;
function comparer(donnee: string, fichier: number, source: number) {
  const ok = Math.abs(fichier - source) <= TOLERANCE_MD;
  if (!ok) ecarts++;
  lignes.push({ donnee, fichier, source: Math.round(source * 10) / 10, ecart: ok ? '' : `⚠ ${(fichier - source).toFixed(1)}` });
}
const poste = (postes: DonneesRepartition['depenses']['postes'], id: string) => {
  const p = postes.find((x) => x.id === id);
  if (!p) throw new Error(`poste absent : ${id}`);
  return p.mdEuros;
};

// Grandeurs d'ensemble.
const a = String(D.annee);
const apu = (na_item: string) => eurostat('gov_10a_main', { sector: 'S13', na_item, time: a });
comparer(`Dépenses ${a}`, D.depensesMdEuros, await apu('TE'));
comparer(`Recettes ${a}`, D.recettesMdEuros, await apu('TR'));
comparer(`Dette ${a}`, D.detteMdEuros, await eurostat('gov_10dd_edpt1', { sector: 'S13', na_item: 'GD', time: a }));
comparer(`PIB ${a}`, D.pibMdEuros, await eurostat('nama_10_gdp', { unit: 'CP_MEUR', na_item: 'B1GQ', time: a }));

// Dépenses par fonction (COFOG).
const v = D.depenses;
const cofog = (...codes: string[]) =>
  Promise.all(codes.map((c) => eurostat('gov_10a_exp', { sector: 'S13', na_item: 'TE', cofog99: c, time: String(v.annee) }))).then((x) =>
    x.reduce((s, y) => s + y, 0),
  );
const [vieillesse, socialTotal, generaux, dette] = await Promise.all([cofog('GF1002', 'GF1003'), cofog('GF10'), cofog('GF01'), cofog('GF0107')]);
comparer(`Total des dépenses ${v.annee}`, v.totalMdEuros, await cofog('TOTAL'));
comparer('Retraites (10.2 vieillesse + 10.3 survivants)', poste(v.postes, 'retraites'), vieillesse);
comparer('Autre protection sociale (10 hors 10.2 et 10.3)', poste(v.postes, 'protection-sociale'), socialTotal - vieillesse);
comparer('Santé (07)', poste(v.postes, 'sante'), await cofog('GF07'));
comparer('Affaires économiques (04)', poste(v.postes, 'economie'), await cofog('GF04'));
comparer('Enseignement (09)', poste(v.postes, 'enseignement'), await cofog('GF09'));
comparer('Services généraux hors dette (01 hors 01.7)', poste(v.postes, 'services-generaux'), generaux - dette);
comparer('Opérations concernant la dette (01.7)', poste(v.postes, 'interets'), dette);
comparer('Défense (02)', poste(v.postes, 'defense'), await cofog('GF02'));
comparer('Ordre et sécurité publics (03)', poste(v.postes, 'securite'), await cofog('GF03'));
comparer('Loisirs, culture et culte (08)', poste(v.postes, 'culture'), await cofog('GF08'));
comparer('Logement et équipements collectifs (06)', poste(v.postes, 'logement'), await cofog('GF06'));
comparer('Protection de l’environnement (05)', poste(v.postes, 'environnement'), await cofog('GF05'));

// Recettes : impôts et cotisations (Insee, Melodi), reste = autres recettes.
const r = D.recettes;
const [tva, cotisations, irCsg, is, impotsEtCotisations] = await Promise.all(
  ['D211', 'D61', 'D51A', 'D51O', 'TRICS'].map((o) => melodi(o, r.annee)),
);
const totalRecettes = await eurostat('gov_10a_main', { sector: 'S13', na_item: 'TR', time: String(r.annee) });
comparer(`Total des recettes ${r.annee}`, r.totalMdEuros, totalRecettes);
comparer('Cotisations sociales (D61)', poste(r.postes, 'cotisations'), cotisations);
comparer('TVA (D211)', poste(r.postes, 'tva'), tva);
comparer('Impôts sur le revenu des ménages, dont CSG (D51A)', poste(r.postes, 'ir-csg'), irCsg);
comparer('Impôt sur les sociétés (D51O)', poste(r.postes, 'is'), is);
comparer('Autres impôts (impôts et cotisations − postes ci-dessus)', poste(r.postes, 'autres-impots'), impotsEtCotisations - tva - cotisations - irCsg - is);
comparer('Autres recettes (total − impôts et cotisations)', poste(r.postes, 'autres-recettes'), totalRecettes - impotsEtCotisations);

console.table(lignes);
if (ecarts > 0) {
  console.error(`${ecarts} écart(s) avec les données ouvertes.`);
  process.exitCode = 1;
} else {
  console.log('Tous les chiffres correspondent aux données ouvertes (à 0,1 Md€ près).');
}
