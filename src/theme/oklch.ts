/**
 * OKLCH Color Utilities
 * 
 * OKLCH is a perceptually uniform color space, making it ideal for
 * smooth transitions. Colors interpolated in OKLCH look more natural
 * than RGB interpolation.
 * 
 * L = Lightness (0-1)
 * C = Chroma (0-0.4 roughly, varies by hue)
 * H = Hue (0-360 degrees)
 */

export type OKLCH = {
  l: number;  // Lightness 0-1
  c: number;  // Chroma 0-0.4+
  h: number;  // Hue 0-360
};

export type RGB = {
  r: number;  // 0-255
  g: number;  // 0-255
  b: number;  // 0-255
};

// === Conversion from hex to OKLCH ===

function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

function rgbToHex(rgb: RGB): string {
  const toHex = (n: number): string => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

// Linear RGB to sRGB gamma correction
function linearToSrgb(c: number): number {
  if (c <= 0.0031308) {
    return c * 12.92;
  }
  return 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

// sRGB to linear RGB
function srgbToLinear(c: number): number {
  if (c <= 0.04045) {
    return c / 12.92;
  }
  return Math.pow((c + 0.055) / 1.055, 2.4);
}

// Convert RGB (0-255) to OKLCH
export function rgbToOklch(rgb: RGB): OKLCH {
  // Normalize to 0-1
  const r = srgbToLinear(rgb.r / 255);
  const g = srgbToLinear(rgb.g / 255);
  const b = srgbToLinear(rgb.b / 255);

  // RGB to linear sRGB to OKLab
  const l_ = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m_ = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s_ = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l = Math.cbrt(l_);
  const m = Math.cbrt(m_);
  const s = Math.cbrt(s_);

  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const bComp = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;

  // OKLab to OKLCH
  const C = Math.sqrt(a * a + bComp * bComp);
  let H = Math.atan2(bComp, a) * (180 / Math.PI);
  if (H < 0) H += 360;

  return { l: L, c: C, h: H };
}

// Convert OKLCH to RGB (0-255)
export function oklchToRgb(oklch: OKLCH): RGB {
  const { l: L, c: C, h: H } = oklch;

  // OKLCH to OKLab
  const hRad = H * (Math.PI / 180);
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // OKLab to linear sRGB
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bOut = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  return {
    r: Math.round(linearToSrgb(r) * 255),
    g: Math.round(linearToSrgb(g) * 255),
    b: Math.round(linearToSrgb(bOut) * 255),
  };
}

// === Hex convenience functions ===

export function hexToOklch(hex: string): OKLCH {
  return rgbToOklch(hexToRgb(hex));
}

export function oklchToHex(oklch: OKLCH): string {
  return rgbToHex(oklchToRgb(oklch));
}

// === Interpolation ===

/**
 * Interpolate between two OKLCH colors.
 * t is 0-1, where 0 = color1, 1 = color2
 */
export function lerpOklch(color1: OKLCH, color2: OKLCH, t: number): OKLCH {
  const clampedT = Math.max(0, Math.min(1, t));
  
  // Handle hue interpolation (shortest path around the circle)
  let h1 = color1.h;
  let h2 = color2.h;
  let dh = h2 - h1;
  
  // Take the shortest path around the hue circle
  if (dh > 180) {
    dh -= 360;
  } else if (dh < -180) {
    dh += 360;
  }
  
  let h = h1 + dh * clampedT;
  if (h < 0) h += 360;
  if (h >= 360) h -= 360;
  
  return {
    l: color1.l + (color2.l - color1.l) * clampedT,
    c: color1.c + (color2.c - color1.c) * clampedT,
    h,
  };
}

/**
 * Interpolate between two hex colors in OKLCH space.
 */
export function lerpHexOklch(hex1: string, hex2: string, t: number): string {
  const oklch1 = hexToOklch(hex1);
  const oklch2 = hexToOklch(hex2);
  const result = lerpOklch(oklch1, oklch2, t);
  return oklchToHex(result);
}

// === Easing Functions for Day Cycle ===

/**
 * Get the blend factor for day/night based on time of day.
 * Returns 0 for full night, 1 for full day.
 * 
 * Time of day: 0=midnight, 0.25=sunrise, 0.5=noon, 0.75=sunset
 * 
 * Transition periods:
 * - Sunrise: 0.2 to 0.35 (dawn to morning)
 * - Sunset: 0.7 to 0.85 (dusk to night)
 */
export function getDayNightBlend(timeOfDay: number): number {
  const t = timeOfDay % 1; // Normalize to 0-1
  
  // Define key points
  const DAWN_START = 0.18;   // ~4:20 AM
  const DAWN_END = 0.30;     // ~7:12 AM
  const DUSK_START = 0.72;   // ~5:17 PM
  const DUSK_END = 0.84;     // ~8:10 PM
  
  if (t < DAWN_START || t >= DUSK_END) {
    // Night
    return 0;
  } else if (t >= DAWN_END && t < DUSK_START) {
    // Day
    return 1;
  } else if (t >= DAWN_START && t < DAWN_END) {
    // Sunrise transition
    const progress = (t - DAWN_START) / (DAWN_END - DAWN_START);
    return smoothstep(progress);
  } else {
    // Sunset transition
    const progress = (t - DUSK_START) / (DUSK_END - DUSK_START);
    return 1 - smoothstep(progress);
  }
}

/**
 * Smooth step function for natural transitions
 */
function smoothstep(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

/**
 * Get a sunrise/sunset warmth factor.
 * Returns 0 during day/night, peaks at 1 during golden hour.
 */
export function getGoldenHourFactor(timeOfDay: number): number {
  const t = timeOfDay % 1;
  
  // Sunrise golden hour: peaks around 0.24
  const sunriseCenter = 0.24;
  const sunriseWidth = 0.08;
  const sunriseFactor = Math.max(0, 1 - Math.abs(t - sunriseCenter) / sunriseWidth);
  
  // Sunset golden hour: peaks around 0.78
  const sunsetCenter = 0.78;
  const sunsetWidth = 0.08;
  const sunsetFactor = Math.max(0, 1 - Math.abs(t - sunsetCenter) / sunsetWidth);
  
  return Math.max(sunriseFactor, sunsetFactor);
}

/**
 * Get the current "phase" of day for display/debugging.
 */
export function getDayPhase(timeOfDay: number): 'night' | 'dawn' | 'day' | 'dusk' {
  const t = timeOfDay % 1;
  
  if (t < 0.18 || t >= 0.84) return 'night';
  if (t >= 0.18 && t < 0.30) return 'dawn';
  if (t >= 0.30 && t < 0.72) return 'day';
  return 'dusk';
}

/**
 * Format time of day as a clock string (e.g., "14:30")
 */
export function formatTimeOfDay(timeOfDay: number): string {
  const t = timeOfDay % 1;
  const totalMinutes = Math.floor(t * 24 * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

