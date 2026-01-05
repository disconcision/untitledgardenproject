/**
 * Day/Night Color Scheme
 * 
 * Defines the color tokens for day and night modes, and provides
 * functions to interpolate between them based on time of day.
 */

import { 
  lerpHexOklch, 
  getDayNightBlend, 
  getGoldenHourFactor 
} from './oklch';

// === Color Scheme Definitions ===

export type ColorScheme = {
  // Background atmosphere
  bgDeep: string;
  bgMid: string;
  bgPale: string;
  bgWarm: string;
  
  // Rocks
  rockDarkest: string;
  rockDark: string;
  rockMid: string;
  rockLight: string;
  rockPale: string;
  
  // Earth
  earthLoam: string;
  earthDark: string;
  earthMid: string;
  earthTan: string;
  earthSand: string;
  
  // Greens (vegetation)
  greenDeep: string;
  greenMoss: string;
  greenFern: string;
  greenLeaf: string;
  greenFresh: string;
  greenLichen: string;
  greenBright: string;
  greenPale: string;
  
  // Accents
  accentCoral: string;
  accentBerry: string;
  accentViolet: string;
  accentGold: string;
  accentCream: string;
  
  // UI
  text: string;
  textMuted: string;
  panelBg: string;
  panelBorder: string;
  
  // Interactive
  hover: string;
  selection: string;
  selectionGlow: string;
};

// === Day Scheme (Light Mode) ===
// Bright, warm, temperate rainforest midday

export const dayScheme: ColorScheme = {
  // Background - bright overcast sky
  bgDeep: '#c8d4d8',
  bgMid: '#d8e2e5',
  bgPale: '#e8eff1',
  bgWarm: '#f0ebe3',
  
  // Rocks - warm grays in daylight
  rockDarkest: '#2a2c2e',
  rockDark: '#3d4043',
  rockMid: '#5a5f64',
  rockLight: '#7b8188',
  rockPale: '#9fa5ac',
  
  // Earth - rich warm tones
  earthLoam: '#3c3429',
  earthDark: '#4d4034',
  earthMid: '#6c5a4a',
  earthTan: '#8a7664',
  earthSand: '#b6a492',
  
  // Greens - vibrant life
  greenDeep: '#2a3e2f',
  greenMoss: '#3d5a42',
  greenFern: '#4d7b55',
  greenLeaf: '#5a9062',
  greenFresh: '#6fb075',
  greenLichen: '#8cc08a',
  greenBright: '#9fd99a',
  greenPale: '#c5edc0',
  
  // Accents - bright botanical pops
  accentCoral: '#e4827a',
  accentBerry: '#9b5a7b',
  accentViolet: '#7b6a9c',
  accentGold: '#d9b865',
  accentCream: '#f8efd8',
  
  // UI - readable in daylight
  text: '#2a2c2e',
  textMuted: '#5a5f64',
  panelBg: 'rgba(248, 243, 235, 0.95)',
  panelBorder: '#b6a492',
  
  // Interactive
  hover: '#6fb075',
  selection: '#5a9062',
  selectionGlow: 'rgba(111, 176, 117, 0.4)',
};

// === Night Scheme (Dark Mode) ===
// Cool, muted, moonlit garden

export const nightScheme: ColorScheme = {
  // Background - deep night sky
  bgDeep: '#0c1015',
  bgMid: '#141a20',
  bgPale: '#1c242c',
  bgWarm: '#242830',
  
  // Rocks - cool silvery moonlit
  rockDarkest: '#0a0c0e',
  rockDark: '#161a1e',
  rockMid: '#2a3038',
  rockLight: '#3e4650',
  rockPale: '#566068',
  
  // Earth - deep muted tones
  earthLoam: '#181410',
  earthDark: '#221c16',
  earthMid: '#342a22',
  earthTan: '#483c30',
  earthSand: '#5c5044',
  
  // Greens - cool moonlit vegetation
  greenDeep: '#0e1a12',
  greenMoss: '#1a2e1f',
  greenFern: '#264028',
  greenLeaf: '#305035',
  greenFresh: '#3c6242',
  greenLichen: '#4a7850',
  greenBright: '#5a8c5e',
  greenPale: '#6ea070',
  
  // Accents - muted, nocturnal
  accentCoral: '#8c4a44',
  accentBerry: '#5c3048',
  accentViolet: '#4a3c62',
  accentGold: '#8c7838',
  accentCream: '#9c9080',
  
  // UI - readable in darkness
  text: '#c8d0d8',
  textMuted: '#7c8890',
  panelBg: 'rgba(20, 26, 32, 0.95)',
  panelBorder: '#3e4650',
  
  // Interactive
  hover: '#5a8c5e',
  selection: '#3c6242',
  selectionGlow: 'rgba(90, 140, 94, 0.4)',
};

// === Golden Hour Colors ===
// Warm overlay for sunrise/sunset

const goldenHourTints = {
  bgWarmth: '#ffd4a0',       // Warm orange for sky
  goldenGlow: '#ffb060',     // Deep golden
  pinkishHue: '#ffc0b0',     // Soft pink
};

// === Interpolation Functions ===

/**
 * Interpolate between day and night schemes based on time of day.
 */
export function interpolateScheme(timeOfDay: number): ColorScheme {
  const dayNightBlend = getDayNightBlend(timeOfDay);
  const goldenHour = getGoldenHourFactor(timeOfDay);
  
  // Helper to interpolate a single color
  const lerp = (key: keyof ColorScheme): string => {
    const dayColor = dayScheme[key];
    const nightColor = nightScheme[key];
    
    // Skip non-color values (like rgba)
    if (typeof dayColor !== 'string' || !dayColor.startsWith('#')) {
      return dayNightBlend >= 0.5 ? dayColor : nightColor;
    }
    
    return lerpHexOklch(nightColor, dayColor, dayNightBlend);
  };
  
  // Interpolate all colors
  const baseScheme: ColorScheme = {
    bgDeep: lerp('bgDeep'),
    bgMid: lerp('bgMid'),
    bgPale: lerp('bgPale'),
    bgWarm: lerp('bgWarm'),
    
    rockDarkest: lerp('rockDarkest'),
    rockDark: lerp('rockDark'),
    rockMid: lerp('rockMid'),
    rockLight: lerp('rockLight'),
    rockPale: lerp('rockPale'),
    
    earthLoam: lerp('earthLoam'),
    earthDark: lerp('earthDark'),
    earthMid: lerp('earthMid'),
    earthTan: lerp('earthTan'),
    earthSand: lerp('earthSand'),
    
    greenDeep: lerp('greenDeep'),
    greenMoss: lerp('greenMoss'),
    greenFern: lerp('greenFern'),
    greenLeaf: lerp('greenLeaf'),
    greenFresh: lerp('greenFresh'),
    greenLichen: lerp('greenLichen'),
    greenBright: lerp('greenBright'),
    greenPale: lerp('greenPale'),
    
    accentCoral: lerp('accentCoral'),
    accentBerry: lerp('accentBerry'),
    accentViolet: lerp('accentViolet'),
    accentGold: lerp('accentGold'),
    accentCream: lerp('accentCream'),
    
    text: lerp('text'),
    textMuted: lerp('textMuted'),
    panelBg: dayNightBlend >= 0.5 ? dayScheme.panelBg : nightScheme.panelBg,
    panelBorder: lerp('panelBorder'),
    
    hover: lerp('hover'),
    selection: lerp('selection'),
    selectionGlow: dayNightBlend >= 0.5 ? dayScheme.selectionGlow : nightScheme.selectionGlow,
  };
  
  // Apply golden hour warmth to sky colors
  if (goldenHour > 0.1) {
    baseScheme.bgDeep = lerpHexOklch(baseScheme.bgDeep, goldenHourTints.bgWarmth, goldenHour * 0.3);
    baseScheme.bgMid = lerpHexOklch(baseScheme.bgMid, goldenHourTints.pinkishHue, goldenHour * 0.25);
    baseScheme.bgPale = lerpHexOklch(baseScheme.bgPale, goldenHourTints.goldenGlow, goldenHour * 0.2);
  }
  
  return baseScheme;
}

/**
 * Apply a color scheme to CSS custom properties.
 */
export function applySchemeToDOM(scheme: ColorScheme): void {
  const root = document.documentElement;
  
  root.style.setProperty('--bg-deep', scheme.bgDeep);
  root.style.setProperty('--bg-mid', scheme.bgMid);
  root.style.setProperty('--bg-pale', scheme.bgPale);
  root.style.setProperty('--bg-warm', scheme.bgWarm);
  
  root.style.setProperty('--color-rock-darkest', scheme.rockDarkest);
  root.style.setProperty('--color-rock-dark', scheme.rockDark);
  root.style.setProperty('--color-rock-mid', scheme.rockMid);
  root.style.setProperty('--color-rock-light', scheme.rockLight);
  root.style.setProperty('--color-rock-pale', scheme.rockPale);
  
  root.style.setProperty('--color-earth-loam', scheme.earthLoam);
  root.style.setProperty('--color-earth-dark', scheme.earthDark);
  root.style.setProperty('--color-earth-mid', scheme.earthMid);
  root.style.setProperty('--color-earth-tan', scheme.earthTan);
  root.style.setProperty('--color-earth-sand', scheme.earthSand);
  
  root.style.setProperty('--color-green-deep', scheme.greenDeep);
  root.style.setProperty('--color-green-moss', scheme.greenMoss);
  root.style.setProperty('--color-green-fern', scheme.greenFern);
  root.style.setProperty('--color-green-leaf', scheme.greenLeaf);
  root.style.setProperty('--color-green-fresh', scheme.greenFresh);
  root.style.setProperty('--color-green-lichen', scheme.greenLichen);
  root.style.setProperty('--color-green-bright', scheme.greenBright);
  root.style.setProperty('--color-green-pale', scheme.greenPale);
  
  root.style.setProperty('--color-accent-coral', scheme.accentCoral);
  root.style.setProperty('--color-accent-berry', scheme.accentBerry);
  root.style.setProperty('--color-accent-violet', scheme.accentViolet);
  root.style.setProperty('--color-accent-gold', scheme.accentGold);
  root.style.setProperty('--color-accent-cream', scheme.accentCream);
  
  root.style.setProperty('--color-text', scheme.text);
  root.style.setProperty('--color-text-muted', scheme.textMuted);
  root.style.setProperty('--color-panel-bg', scheme.panelBg);
  root.style.setProperty('--color-panel-border', scheme.panelBorder);
  
  // UI aliases for consistency
  root.style.setProperty('--color-text-primary', scheme.text);
  root.style.setProperty('--color-text-secondary', scheme.textMuted);
  root.style.setProperty('--color-ui-border', scheme.panelBorder);
  root.style.setProperty('--color-ui-bg', scheme.bgPale);
  
  root.style.setProperty('--color-hover', scheme.hover);
  root.style.setProperty('--color-selection', scheme.selection);
  root.style.setProperty('--color-selection-glow', scheme.selectionGlow);
  
  // Also update entity defaults that reference the base colors
  root.style.setProperty('--color-island', scheme.earthMid);
  root.style.setProperty('--color-island-shadow', scheme.earthLoam);
  root.style.setProperty('--color-rock', scheme.rockMid);
  root.style.setProperty('--color-stem', scheme.earthDark);
  root.style.setProperty('--color-stem-highlight', scheme.earthTan);
  root.style.setProperty('--color-leaf', scheme.greenFern);
  root.style.setProperty('--color-leaf-highlight', scheme.greenFresh);
  root.style.setProperty('--color-bud', scheme.greenLichen);
  root.style.setProperty('--color-bud-highlight', scheme.greenBright);
  root.style.setProperty('--color-bud-charged', scheme.accentGold);
  root.style.setProperty('--color-flower', scheme.accentCoral);
  root.style.setProperty('--color-flower-highlight', lerpHexOklch(scheme.accentCoral, '#ffffff', 0.2));
  root.style.setProperty('--color-vine', scheme.greenMoss);
}

