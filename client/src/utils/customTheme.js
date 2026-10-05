import {
  DefaultColorStyle,
  DefaultColorThemePalette,
  defaultColorNames,
  geoShapeProps,
  arrowShapeProps,
} from 'tldraw'
import { T } from '@tldraw/validate'

export const EXTRA_PALETTE = {
  teal: {
    solid: '#0ca678',
    fill: '#0ca678',
    semi: '#0ca67824',
    pattern: '#63e6be',
    note: { fill: '#12b886', text: '#ffffff' },
    highlight: { srgb: '#0ca678', p3: 'color(display-p3 0.047 0.651 0.471)' },
  },
  mint: {
    solid: '#38d9a9',
    fill: '#38d9a9',
    semi: '#38d9a924',
    pattern: '#96f2d7',
    note: { fill: '#63e6be', text: '#1d1d1d' },
    highlight: { srgb: '#38d9a9', p3: 'color(display-p3 0.22 0.851 0.663)' },
  },
  cyan: {
    solid: '#15aabf',
    fill: '#15aabf',
    semi: '#15aabf24',
    pattern: '#66d9e8',
    note: { fill: '#22b8cf', text: '#ffffff' },
    highlight: { srgb: '#15aabf', p3: 'color(display-p3 0.082 0.667 0.749)' },
  },
  indigo: {
    solid: '#4c6ef5',
    fill: '#4c6ef5',
    semi: '#4c6ef524',
    pattern: '#91a7ff',
    note: { fill: '#5c7cfa', text: '#ffffff' },
    highlight: { srgb: '#4c6ef5', p3: 'color(display-p3 0.298 0.431 0.961)' },
  },
  purple: {
    solid: '#7950f2',
    fill: '#7950f2',
    semi: '#7950f224',
    pattern: '#b197fc',
    note: { fill: '#845ef7', text: '#ffffff' },
    highlight: { srgb: '#7950f2', p3: 'color(display-p3 0.475 0.314 0.949)' },
  },
  pink: {
    solid: '#d6336c',
    fill: '#d6336c',
    semi: '#d6336c24',
    pattern: '#f783ac',
    note: { fill: '#e64980', text: '#ffffff' },
    highlight: { srgb: '#d6336c', p3: 'color(display-p3 0.839 0.2 0.424)' },
  },
  rose: {
    solid: '#f783ac',
    fill: '#f783ac',
    semi: '#f783ac24',
    pattern: '#fcc2d7',
    note: { fill: '#f783ac', text: '#1d1d1d' },
    highlight: { srgb: '#f783ac', p3: 'color(display-p3 0.969 0.514 0.675)' },
  },
  amber: {
    solid: '#f59f00',
    fill: '#f59f00',
    semi: '#f59f0024',
    pattern: '#ffd43b',
    note: { fill: '#fab005', text: '#1d1d1d' },
    highlight: { srgb: '#f59f00', p3: 'color(display-p3 0.961 0.624 0)' },
  },
  lime: {
    solid: '#82c91e',
    fill: '#82c91e',
    semi: '#82c91e24',
    pattern: '#c0eb75',
    note: { fill: '#94d82d', text: '#1d1d1d' },
    highlight: { srgb: '#82c91e', p3: 'color(display-p3 0.51 0.788 0.118)' },
  },
  emerald: {
    solid: '#20c997',
    fill: '#20c997',
    semi: '#20c99724',
    pattern: '#63e6be',
    note: { fill: '#38d9a9', text: '#1d1d1d' },
    highlight: { srgb: '#20c997', p3: 'color(display-p3 0.125 0.788 0.592)' },
  },
  brown: {
    solid: '#8d5b4c',
    fill: '#8d5b4c',
    semi: '#8d5b4c24',
    pattern: '#d7a99c',
    note: { fill: '#a26a5a', text: '#ffffff' },
    highlight: { srgb: '#8d5b4c', p3: 'color(display-p3 0.553 0.357 0.298)' },
  },
}

export const ALL_COLOR_ORDER = [
  'black',
  'grey',
  'light-violet',
  'violet',
  'blue',
  'light-blue',
  'yellow',
  'orange',
  'green',
  'light-green',
  'light-red',
  'red',
  'white',
  'teal',
  'mint',
  'cyan',
  'indigo',
  'purple',
  'pink',
  'rose',
  'amber',
  'lime',
  'emerald',
  'brown',
]

export const COLOR_SWATCH_ITEMS = ALL_COLOR_ORDER.map((name) => ({
  value: name,
  icon: 'color',
}))

export const COLOR_TRANSLATIONS = {
  'color-style.black': 'Black',
  'color-style.grey': 'Grey',
  'color-style.light-violet': 'Light Violet',
  'color-style.violet': 'Violet',
  'color-style.blue': 'Blue',
  'color-style.light-blue': 'Light Blue',
  'color-style.yellow': 'Yellow',
  'color-style.orange': 'Orange',
  'color-style.green': 'Green',
  'color-style.light-green': 'Light Green',
  'color-style.light-red': 'Light Red',
  'color-style.red': 'Red',
  'color-style.white': 'White',
  'color-style.teal': 'Teal',
  'color-style.mint': 'Mint',
  'color-style.cyan': 'Cyan',
  'color-style.indigo': 'Indigo',
  'color-style.purple': 'Purple',
  'color-style.pink': 'Pink',
  'color-style.rose': 'Rose',
  'color-style.amber': 'Amber',
  'color-style.lime': 'Lime',
  'color-style.emerald': 'Emerald',
  'color-style.brown': 'Brown',
}

let initialized = false

export function initializeCustomColors() {
  if (initialized) return
  initialized = true

  // Ensure 'white' is in defaultColorNames and DefaultColorStyle.values
  if (!defaultColorNames.includes('white')) {
    defaultColorNames.push('white')
  }
  if (!DefaultColorStyle.values.includes('white')) {
    DefaultColorStyle.values.push('white')
  }

  // Register extra colors
  for (const [name, palette] of Object.entries(EXTRA_PALETTE)) {
    if (!defaultColorNames.includes(name)) {
      defaultColorNames.push(name)
    }
    if (!DefaultColorStyle.values.includes(name)) {
      DefaultColorStyle.values.push(name)
    }

    if (DefaultColorThemePalette?.lightMode) {
      DefaultColorThemePalette.lightMode[name] = palette
    }
    if (DefaultColorThemePalette?.darkMode) {
      DefaultColorThemePalette.darkMode[name] = palette
    }
  }

  // Update validators so all shape props accept the new colors
  try {
    const newValidator = T.literalEnum(...DefaultColorStyle.values)
    DefaultColorStyle.type = newValidator
    if (geoShapeProps?.labelColor) {
      geoShapeProps.labelColor.type = newValidator
    }
    if (arrowShapeProps?.labelColor) {
      arrowShapeProps.labelColor.type = newValidator
    }
  } catch (err) {
    console.warn('Could not update color validator:', err)
  }
}

// Auto-run once upon import
initializeCustomColors()
