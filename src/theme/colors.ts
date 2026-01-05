/**
 * Hanging Garden Color Palette
 *
 * Vibe: Temperate rainforest. BC/Vancouver Island winter.
 * Rocky, volcanic "new world" — sparse but alive.
 *
 * Primary families:
 * - Grays: rocks, scaffolds (the bones)
 * - Browns: soil, bark, earth (the substrate)
 * - Greens: plants, life (where the life is)
 * - Accents: botanical pops, used sparingly
 */

export const palette = {
  // === GRAYS (volcanic, rocky, the bones of the world) ===
  rock: {
    darkest: "#1a1c1e", // basalt shadow
    dark: "#2d3033", // wet stone
    mid: "#4a4f54", // weathered rock
    light: "#6b7178", // ite gray
    pale: "#8f959c", // fog-touched stone
  },

  // === BROWNS (soil, bark, earth, the substrate) ===
  earth: {
    loam: "#2c2419", // deep forest floor
    dark: "#3d3024", // rich soil
    mid: "#5c4a3a", // bark
    tan: "#7a6654", // dry earth
    sand: "#a69482", // sandy pale
  },

  // === GREENS (plants, life — the richest series) ===
  green: {
    deepForest: "#1a2e1f", // deep shadow under canopy
    moss: "#2d4a32", // wet moss
    fern: "#3d6b45", // fern frond
    leaf: "#4a8052", // healthy leaf
    fresh: "#5fa065", // new growth
    lichen: "#7cb07a", // lichen, yellowy-green
    bright: "#8fc98a", // sunlit leaf
    pale: "#b5ddb0", // very new shoot
  },

  // === ACCENTS (botanical pops, earned not scattered) ===
  accent: {
    coral: "#d4726a", // warm flower
    berry: "#8b4a6b", // deep berry
    violet: "#6b5a8c", // cool floral
    gold: "#c9a855", // pollen, stamens
    cream: "#e8dfc8", // pale petal
  },

  // === ATMOSPHERE ===
  sky: {
    deep: "#c8d4d8", // overcast depth
    mid: "#d8e2e5", // humid light
    pale: "#e8eff1", // bright fog
    warm: "#f0ebe3", // filtered sun
  },
} as const;

// Semantic color tokens for theming
export const tokens = {
  // Background layers
  bgDeep: palette.sky.deep,
  bgMid: palette.sky.mid,
  bgPale: palette.sky.pale,

  // Interactive states
  hover: palette.green.fresh,
  selection: palette.green.leaf,
  selectionGlow: `${palette.green.fresh}66`, // 40% opacity

  // Entity defaults
  island: palette.earth.tan, // Lighter, less dominant
  islandShadow: palette.earth.mid,
  rock: palette.rock.mid,
  rockShadow: palette.rock.dark,
  stem: palette.earth.dark,
  leaf: palette.green.fern,
  leafHighlight: palette.green.fresh,
  bud: palette.green.lichen,
  budCharged: palette.accent.gold,
  flower: palette.accent.coral,
  vine: palette.green.moss,

  // UI
  text: palette.rock.darkest,
  textMuted: palette.rock.mid,
  textOnDark: palette.sky.pale,
  panelBg: `${palette.sky.warm}ee`,
  panelBorder: palette.earth.sand,
} as const;

export type Palette = typeof palette;
export type Tokens = typeof tokens;
