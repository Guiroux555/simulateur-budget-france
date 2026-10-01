/**
 * Une « trajectoire » est une liste de points [année, valeur] interpolés linéairement,
 * la valeur étant constante avant le premier point et après le dernier.
 */
export type Trajectoire = ReadonlyArray<readonly [annee: number, valeur: number]>;

/** Valeur d'une trajectoire à une année donnée (interpolation linéaire, constante aux bords). */
export function valeurA(t: Trajectoire, annee: number): number {
  if (t.length === 0) return 0;
  const premier = t[0];
  if (annee <= premier[0]) return premier[1];
  for (let i = 1; i < t.length; i++) {
    const [a1, v1] = t[i];
    if (annee <= a1) {
      const [a0, v0] = t[i - 1];
      return v0 + ((v1 - v0) * (annee - a0)) / (a1 - a0);
    }
  }
  return t[t.length - 1][1];
}

export const constante = (v: number): Trajectoire => [[2000, v]];
export const nulle: Trajectoire = [];
