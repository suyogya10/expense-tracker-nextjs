import { describe, it, expect } from 'vitest';
import {
  hslToHex,
  hexToHsl,
  generateDistinctColors,
  getRandomCategoryColor,
} from './colors';

describe('Category Color Utilities', () => {
  it('converts HSL to Hex and back correctly', () => {
    const hex = hslToHex(0, 80, 50);
    expect(hex).toMatch(/^#[0-9a-f]{6}$/i);

    const hsl = hexToHsl(hex);
    expect(hsl).not.toBeNull();
    expect(hsl?.h).toBe(0);
    expect(Math.abs((hsl?.s || 0) - 80)).toBeLessThanOrEqual(2);
    expect(Math.abs((hsl?.l || 0) - 50)).toBeLessThanOrEqual(2);
  });

  it('generates N distinct hex colors', () => {
    const count = 14;
    const colors = generateDistinctColors(count);

    expect(colors).toHaveLength(count);
    colors.forEach((col) => {
      expect(col).toMatch(/^#[0-9a-f]{6}$/i);
    });

    // Verify all colors are unique
    const uniqueSet = new Set(colors);
    expect(uniqueSet.size).toBe(count);
  });

  it('handles edge cases for count in generateDistinctColors', () => {
    expect(generateDistinctColors(0)).toEqual([]);
    expect(generateDistinctColors(1)).toHaveLength(1);
  });

  it('picks a random color avoiding existing category colors', () => {
    const existing = ['#ef4444', '#f97316', '#10b981'];
    const nextColor = getRandomCategoryColor(existing);

    expect(nextColor).toMatch(/^#[0-9a-f]{6}$/i);
    expect(existing).not.toContain(nextColor.toLowerCase());
  });

  it('picks distinct colors even when all curated colors are exhausted', () => {
    const manyColors = generateDistinctColors(30);
    const nextColor = getRandomCategoryColor(manyColors);

    expect(nextColor).toMatch(/^#[0-9a-f]{6}$/i);
    expect(manyColors).not.toContain(nextColor);
  });
});
