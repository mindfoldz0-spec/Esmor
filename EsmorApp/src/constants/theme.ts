import '@/global.css';

import { Platform } from 'react-native';

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

/** Vertical room screens should leave for the floating tab bar. */
export const FloatingTabBarSpace = 120;
