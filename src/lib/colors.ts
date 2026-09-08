/**
 * Utility functions for generating vibrant, visually distinct, high-contrast colors
 * optimized for category tags, badges, and analytics charts.
 */

// Modern, high-contrast category palette
export const CURATED_CATEGORY_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#14b8a6', // Teal
  '#84cc16', // Lime
  '#0ea5e9', // Sky
  '#d946ef', // Fuchsia
  '#22c55e', // Green
  '#e11d48', // Crimson
  '#d97706', // Warm Amber
  '#2563eb', // Royal Blue
  '#7c3aed', // Deep Violet
  '#059669', // Deep Emerald
  '#db2777', // Hot Pink
  '#0284c7', // Ocean Blue
  '#ea580c', // Burnt Orange
];

/**
 * Converts HSL values to a standard 6-character hex string (#rrggbb).
 * h: 0..360, s: 0..100, l: 0..100
 */
export function hslToHex(h: number, s: number, l: number): string {
  const normH = ((h % 360) + 360) % 360;
  const sat = s / 100;
  const light = l / 100;

  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => {
    const k = (n + normH / 30) % 12;
    const color = light - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Converts a hex color string (#rrggbb or #rgb) to HSL values.
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const cleanHex = hex.replace('#', '').trim();
  let r = 0, g = 0, b = 0;

  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.slice(0, 2), 16);
    g = parseInt(cleanHex.slice(2, 4), 16);
    b = parseInt(cleanHex.slice(4, 6), 16);
  } else {
    return null;
  }

  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / diff + 2) * 60;
        break;
      case b:
        h = ((r - g) / diff + 4) * 60;
        break;
    }
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Shuffles an array using the Fisher-Yates algorithm.
 */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generates an array of `count` maximally distinct, vibrant, and readable hex colors.
 * - Distributes hues evenly around the 360-degree color wheel with a randomized base angle.
 * - Compensates lightness for yellow/amber hues so white icons maintain clear contrast.
 * - Shuffles the result so alphabetically adjacent categories receive visually contrasting colors.
 */
export function generateDistinctColors(count: number): string[] {
  if (count <= 0) return [];
  if (count === 1) return [CURATED_CATEGORY_COLORS[Math.floor(Math.random() * CURATED_CATEGORY_COLORS.length)]];

  const baseHue = Math.floor(Math.random() * 360);
  const step = 360 / count;
  const colors: string[] = [];

  for (let i = 0; i < count; i++) {
    const hue = (baseHue + i * step) % 360;

    // Saturation: vibrant (76% - 86%)
    const sat = 80;

    // Lightness tuning:
    // Hues between 40deg and 70deg (yellows/golds) need lower lightness (38-42%) so white icons pop.
    // Blues and purples look best around 50-54%.
    let light = 48;
    if (hue >= 40 && hue <= 70) {
      light = 40;
    } else if (hue >= 220 && hue <= 280) {
      light = 52;
    }

    colors.push(hslToHex(hue, sat, light));
  }

  // Shuffle so consecutive items don't just form an ordered chromatic wheel
  return shuffle(colors);
}

/**
 * Picks a single random vibrant color that is as distinct as possible from existing category colors.
 */
export function getRandomCategoryColor(existingColors: string[] = []): string {
  const normalizedExisting = new Set(
    existingColors.map((c) => c.toLowerCase().trim())
  );

  // 1. Try to pick from curated palette if any unused colors remain
  const availableCurated = CURATED_CATEGORY_COLORS.filter(
    (c) => !normalizedExisting.has(c.toLowerCase())
  );

  if (availableCurated.length > 0) {
    const randomIndex = Math.floor(Math.random() * availableCurated.length);
    return availableCurated[randomIndex];
  }

  // 2. If all curated colors are already used, find existing hues and pick in the largest gap
  const existingHues = existingColors
    .map((c) => hexToHsl(c)?.h)
    .filter((h): h is number => typeof h === 'number')
    .sort((a, b) => a - b);

  if (existingHues.length === 0) {
    const randomCurated = CURATED_CATEGORY_COLORS[Math.floor(Math.random() * CURATED_CATEGORY_COLORS.length)];
    return randomCurated;
  }

  // Find the largest angular gap between adjacent hues
  let maxGap = 0;
  let gapStart = 0;

  for (let i = 0; i < existingHues.length; i++) {
    const current = existingHues[i];
    const next = i === existingHues.length - 1 ? existingHues[0] + 360 : existingHues[i + 1];
    const gap = next - current;
    if (gap > maxGap) {
      maxGap = gap;
      gapStart = current;
    }
  }

  // Pick hue in the middle of the largest gap, with slight random jitter (+-5 deg)
  const targetHue = Math.round((gapStart + maxGap / 2 + (Math.random() * 10 - 5)) % 360);
  let light = 48;
  if (targetHue >= 40 && targetHue <= 70) {
    light = 40;
  } else if (targetHue >= 220 && targetHue <= 280) {
    light = 52;
  }

  return hslToHex(targetHue, 80, light);
}
