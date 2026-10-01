import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FICHES_AIDE } from '../src/modules/retraites/app/aide';

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiers(chemin);
    return nom.endsWith('.tsx') ? [chemin] : [];
  });
}

describe('aide du module retraites', () => {
  // Les composants communs reçoivent la clé sous forme de texte : on vérifie ici qu'elle existe.
  it('toute clé d’aide utilisée dans l’interface correspond à une fiche', () => {
    const cles = fichiers(resolve(__dirname, '../src/modules/retraites')).flatMap((f) =>
      [...readFileSync(f, 'utf8').matchAll(/\bcle(?:Aide)?="([^"]+)"/g)].map((m) => m[1]),
    );
    expect(cles.length).toBeGreaterThan(10);
    for (const cle of cles) expect(FICHES_AIDE, cle).toHaveProperty(cle);
  });
});
