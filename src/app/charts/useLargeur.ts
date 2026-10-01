import { useEffect, useRef, useState } from 'react';

/** Largeur d'un conteneur, mise à jour au redimensionnement. */
export function useLargeur<T extends HTMLElement>(defaut = 600) {
  const ref = useRef<T>(null);
  const [largeur, setLargeur] = useState(defaut);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new ResizeObserver(([e]) => setLargeur(Math.max(240, Math.floor(e.contentRect.width))));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, largeur] as const;
}

/** Graduations « rondes » couvrant [min, max]. */
export function graduations(min: number, max: number, cible = 5): number[] {
  const etendue = max - min || Math.abs(max) || 1;
  const brut = etendue / cible;
  const puissance = Math.pow(10, Math.floor(Math.log10(brut)));
  const pas = [1, 2, 2.5, 5, 10].map((m) => m * puissance).find((p) => etendue / p <= cible) ?? 10 * puissance;
  const debut = Math.floor(min / pas) * pas;
  const fin = Math.ceil(max / pas) * pas;
  const out: number[] = [];
  for (let v = debut; v <= fin + pas / 2; v += pas) out.push(Math.round(v / pas) * pas);
  return out;
}
