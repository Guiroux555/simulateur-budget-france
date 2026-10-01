import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = resolve(__dirname, '../src');

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiers(chemin);
    return /\.tsx?$/.test(nom) ? [chemin] : [];
  });
}

/** Imports relatifs d'un fichier, résolus en chemins relatifs à `src/`. */
function imports(fichier: string): string[] {
  const source = readFileSync(fichier, 'utf8');
  return [...source.matchAll(/from\s+['"](\.{1,2}\/[^'"]+)['"]/g)].map((m) => relative(SRC, resolve(dirname(fichier), m[1])));
}

describe('architecture : socle, composants communs et modules indépendants', () => {
  it('le socle et les composants communs ne dépendent d’aucun module', () => {
    for (const dossier of ['socle', 'commun']) {
      for (const f of fichiers(join(SRC, dossier))) {
        for (const cible of imports(f)) expect(cible, `${relative(SRC, f)} → ${cible}`).not.toMatch(/^modules\//);
      }
    }
  });

  it('un module n’importe pas un autre module', () => {
    const modules = readdirSync(join(SRC, 'modules')).filter((n) => statSync(join(SRC, 'modules', n)).isDirectory());
    for (const m of modules) {
      for (const f of fichiers(join(SRC, 'modules', m))) {
        for (const cible of imports(f)) {
          if (cible.startsWith('modules/')) expect(cible, `${relative(SRC, f)} → ${cible}`).toMatch(new RegExp(`^modules/${m}/`));
        }
      }
    }
  });
});
