/**
 * Plant color palettes — health-responsive.
 *
 * Each function takes a health score (0→1) and returns
 * interpolated colors for stems, leaves, accents, and soil.
 *
 * Palette inspired by botanical field guides:
 * muted greens, warm earth tones, desaturated when wilting.
 */

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(hex1: string, hex2: string, t: number): string {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  const r = Math.round(lerp(r1, r2, t));
  const g = Math.round(lerp(g1, g2, t));
  const b = Math.round(lerp(b1, b2, t));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export interface PlantColors {
  stem: string;
  leaf: string;
  leafDark: string;
  accent: string;
  pot: string;
  potDark: string;
  soil: string;
}

export function getPlantColors(health: number): PlantColors {
  // Clamp health
  const h = Math.max(0, Math.min(1, health));

  // Dead/dormant colors
  const dead = {
    stem: "#A89B8C",
    leaf: "#B8AFA4",
    leafDark: "#9E9588",
    accent: "#C4B8AA",
    pot: "#C9B99A",
    potDark: "#B5A68A",
    soil: "#8C7E6E",
  };

  // Thriving colors
  const alive = {
    stem: "#5B7A4A",
    leaf: "#6B9B5A",
    leafDark: "#4A7C3D",
    accent: "#8BC77A",
    pot: "#C9B99A",
    potDark: "#B5A68A",
    soil: "#6B5D4F",
  };

  return {
    stem: lerpColor(dead.stem, alive.stem, h),
    leaf: lerpColor(dead.leaf, alive.leaf, h),
    leafDark: lerpColor(dead.leafDark, alive.leafDark, h),
    accent: lerpColor(dead.accent, alive.accent, h),
    pot: lerpColor(dead.pot, alive.pot, h),
    potDark: lerpColor(dead.potDark, alive.potDark, h),
    soil: lerpColor(dead.soil, alive.soil, h),
  };
}
