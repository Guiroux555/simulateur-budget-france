/**
 * Événements économiques ayant marqué la France depuis 1945, représentés comme des périodes sur les
 * graphiques historiques. Dates arrondies au trimestre ; ordres de grandeur INSEE.
 */
export interface EvenementEconomique {
  debut: number;
  fin: number;
  court: string;
  nom: string;
  impact: string;
}

export const EVENEMENTS: EvenementEconomique[] = [
  {
    debut: 1973.75,
    fin: 1975.5,
    court: '1er choc pétrolier',
    nom: 'Premier choc pétrolier',
    impact: 'Prix du pétrole multiplié par quatre ; fin des Trente Glorieuses, récession en 1975 et montée du chômage',
  },
  {
    debut: 1979,
    fin: 1980.75,
    court: '2e choc pétrolier',
    nom: 'Second choc pétrolier',
    impact: 'Inflation supérieure à 13 % en 1980, ralentissement durable de la croissance',
  },
  {
    debut: 1992.5,
    fin: 1993.75,
    court: 'Récession 1993',
    nom: 'Récession de 1993 (crise du système monétaire européen)',
    impact: 'Recul du PIB en 1993, chômage au-delà de 10 % ; contexte de la réforme Balladur',
  },
  {
    debut: 2008.5,
    fin: 2009.75,
    court: 'Crise financière',
    nom: 'Crise financière mondiale (subprimes)',
    impact: 'PIB −2,9 % en 2009, forte hausse du chômage et du déficit des retraites (−0,7 % du PIB en 2010)',
  },
  {
    debut: 2011.5,
    fin: 2013,
    court: 'Dettes souveraines',
    nom: 'Crise des dettes souveraines de la zone euro',
    impact: 'Croissance quasi nulle en 2012-2013, plans de redressement des comptes publics',
  },
  {
    debut: 2020.2,
    fin: 2021.5,
    court: 'Covid-19',
    nom: 'Pandémie de Covid-19',
    impact: 'PIB −7,5 % en 2020 ; dépenses de retraite à 14,7 % du PIB par effet de dénominateur',
  },
  {
    debut: 2022,
    fin: 2023.75,
    court: 'Choc d’inflation',
    nom: 'Choc énergétique et inflation (guerre en Ukraine)',
    impact: 'Inflation de 5 à 6 % ; revalorisations des pensions de 4 % (2022) puis 5,3 % (janvier 2024)',
  },
];
