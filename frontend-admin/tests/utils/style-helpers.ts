/**
 * Style Helpers
 *
 * Utility functions for testing CSS properties in Playwright
 */

import { Locator, expect } from '@playwright/test';
import { RGB_COLORS, BORDER_RADIUS, SHADOWS } from './tailadmin-tokens';

/**
 * Parse RGB color string to object
 */
export function parseRgbColor(rgbString: string): { r: number; g: number; b: number; a?: number } | null {
  const rgbMatch = rgbString.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  const rgbaMatch = rgbString.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1], 10),
      g: parseInt(rgbaMatch[2], 10),
      b: parseInt(rgbaMatch[3], 10),
      a: parseFloat(rgbaMatch[4]),
    };
  }

  return null;
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Check if two colors are approximately equal (allowing for browser differences)
 */
export function colorsMatch(actual: string, expected: string, tolerance = 5): boolean {
  const actualParsed = parseRgbColor(actual);
  const expectedParsed = parseRgbColor(expected);

  if (!actualParsed || !expectedParsed) {
    return actual === expected;
  }

  const rDiff = Math.abs(actualParsed.r - expectedParsed.r);
  const gDiff = Math.abs(actualParsed.g - expectedParsed.g);
  const bDiff = Math.abs(actualParsed.b - expectedParsed.b);

  return rDiff <= tolerance && gDiff <= tolerance && bDiff <= tolerance;
}

/**
 * Get computed style property from a locator
 */
export async function getComputedStyle(locator: Locator, property: string): Promise<string> {
  return locator.evaluate((el, prop) => {
    return window.getComputedStyle(el).getPropertyValue(prop);
  }, property);
}

/**
 * Get multiple computed style properties
 */
export async function getComputedStyles(
  locator: Locator,
  properties: string[]
): Promise<Record<string, string>> {
  return locator.evaluate((el, props) => {
    const styles = window.getComputedStyle(el);
    const result: Record<string, string> = {};
    props.forEach((prop) => {
      result[prop] = styles.getPropertyValue(prop);
    });
    return result;
  }, properties);
}

/**
 * Assert background color matches
 */
export async function assertBackgroundColor(
  locator: Locator,
  expectedColor: string,
  message?: string
): Promise<void> {
  const actual = await getComputedStyle(locator, 'background-color');
  const matches = colorsMatch(actual, expectedColor);
  expect(matches, message ?? `Expected background-color ${expectedColor}, got ${actual}`).toBe(true);
}

/**
 * Assert text color matches
 */
export async function assertTextColor(
  locator: Locator,
  expectedColor: string,
  message?: string
): Promise<void> {
  const actual = await getComputedStyle(locator, 'color');
  const matches = colorsMatch(actual, expectedColor);
  expect(matches, message ?? `Expected color ${expectedColor}, got ${actual}`).toBe(true);
}

/**
 * Assert border color matches
 */
export async function assertBorderColor(
  locator: Locator,
  expectedColor: string,
  message?: string
): Promise<void> {
  const actual = await getComputedStyle(locator, 'border-color');
  const matches = colorsMatch(actual, expectedColor);
  expect(matches, message ?? `Expected border-color ${expectedColor}, got ${actual}`).toBe(true);
}

/**
 * Assert border radius matches TailAdmin tokens
 */
export async function assertBorderRadius(
  locator: Locator,
  expectedRadius: keyof typeof BORDER_RADIUS | string,
  message?: string
): Promise<void> {
  const expected = BORDER_RADIUS[expectedRadius as keyof typeof BORDER_RADIUS] ?? expectedRadius;
  const actual = await getComputedStyle(locator, 'border-radius');
  expect(actual, message ?? `Expected border-radius ${expected}, got ${actual}`).toBe(expected);
}

/**
 * Assert element has a box shadow (not "none")
 */
export async function assertHasShadow(locator: Locator, message?: string): Promise<void> {
  const actual = await getComputedStyle(locator, 'box-shadow');
  expect(actual, message ?? 'Expected element to have a box shadow').not.toBe('none');
}

/**
 * Assert element has no box shadow
 */
export async function assertNoShadow(locator: Locator, message?: string): Promise<void> {
  const actual = await getComputedStyle(locator, 'box-shadow');
  expect(actual, message ?? 'Expected element to have no box shadow').toBe('none');
}

/**
 * Assert element width
 */
export async function assertWidth(
  locator: Locator,
  expectedWidth: string,
  message?: string
): Promise<void> {
  const actual = await getComputedStyle(locator, 'width');
  expect(actual, message ?? `Expected width ${expectedWidth}, got ${actual}`).toBe(expectedWidth);
}

/**
 * Assert element height
 */
export async function assertHeight(
  locator: Locator,
  expectedHeight: string,
  message?: string
): Promise<void> {
  const actual = await getComputedStyle(locator, 'height');
  expect(actual, message ?? `Expected height ${expectedHeight}, got ${actual}`).toBe(expectedHeight);
}

/**
 * Assert element has backdrop blur
 */
export async function assertHasBackdropBlur(locator: Locator, message?: string): Promise<void> {
  const actual = await getComputedStyle(locator, 'backdrop-filter');
  expect(actual, message ?? 'Expected element to have backdrop blur').toContain('blur');
}

/**
 * Check if dark mode is enabled on the document
 */
export async function isDarkMode(locator: Locator): Promise<boolean> {
  return locator.evaluate(() => {
    return document.documentElement.classList.contains('dark');
  });
}

/**
 * Enable dark mode
 */
export async function enableDarkMode(locator: Locator): Promise<void> {
  await locator.evaluate(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('darkMode', 'true');
  });
}

/**
 * Disable dark mode
 */
export async function disableDarkMode(locator: Locator): Promise<void> {
  await locator.evaluate(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', 'false');
  });
}

/**
 * Toggle dark mode
 */
export async function toggleDarkMode(locator: Locator): Promise<void> {
  await locator.evaluate(() => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('darkMode', isDark ? 'true' : 'false');
  });
}
