/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

/**
 * Brand palette for the custom app shell. These values live in one place so
 * the visual identity can be changed without touching individual components.
 */
export const Brand = {
  background: '#F3EDFB',
  surface: '#FFFFFF',
  surfaceMuted: '#F8F4FE',
  surfaceTint: '#EDE4FA',
  ink: '#16131F',
  inkMuted: '#7B7387',
  inkFaint: '#A79FB2',
  accent: '#F0A96B',
  accentSoft: '#FCE8D5',
  accentInk: '#7A4417',
  nav: '#191B2D',
  navIconMuted: 'rgba(255, 255, 255, 0.62)',
  navIconActive: '#FFFFFF',
  divider: 'rgba(22, 19, 31, 0.08)',
  input: '#F1EAF9',
  backdrop: 'rgba(17, 13, 28, 0.44)',
  searchPanel: '#FCFAFF',
  success: '#3E7A5E',
  successSoft: '#E4F2EA',
  danger: '#B84536',
  dangerSoft: '#FBE7E3',
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/** Vertical room screens should leave for the floating tab bar. */
export const FloatingTabBarSpace = 120;
