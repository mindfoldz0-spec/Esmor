import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { StyleProp, ViewStyle } from 'react-native';

export type AppIconName = SymbolViewProps['name'];

type AppIconProps = {
  name: AppIconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Cross-platform icon wrapper.
 * iOS renders SF Symbols, while Android and web render Material Symbols.
 */
export function AppIcon({ name, size = 22, color, style }: AppIconProps) {
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={color}
      style={style}
    />
  );
}

/** Shared icon names so every component stays visually consistent. */
export const Icons = {
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  clock: { ios: 'clock', android: 'history', web: 'history' },
  chevronLeft: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  home: { ios: 'house', android: 'home', web: 'home' },
  grid: { ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' },
  chart: { ios: 'chart.bar', android: 'bar_chart', web: 'bar_chart' },
  sun: { ios: 'sun.max.fill', android: 'wb_sunny', web: 'wb_sunny' },
  wallet: { ios: 'wallet.pass.fill', android: 'account_balance_wallet', web: 'account_balance_wallet' },
  person: { ios: 'person', android: 'person', web: 'person' },
  sparkle: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  location: { ios: 'location.fill', android: 'location_on', web: 'location_on' },
  phone: { ios: 'phone.fill', android: 'call', web: 'call' },
  calendar: { ios: 'calendar', android: 'calendar_today', web: 'calendar_today' },
  globe: { ios: 'globe', android: 'language', web: 'language' },
  trash: { ios: 'trash', android: 'delete', web: 'delete' },
  bell: { ios: 'bell.fill', android: 'notifications', web: 'notifications' },
  lock: { ios: 'lock.shield', android: 'lock', web: 'lock' },
  help: { ios: 'questionmark.circle', android: 'help', web: 'help' },
  arrowRight: { ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' },
  warning: { ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' },
  speaker: { ios: 'speaker.wave.2.fill', android: 'volume_up', web: 'volume_up' },
  speakerMute: { ios: 'speaker.slash.fill', android: 'volume_off', web: 'volume_off' },
  mic: { ios: 'mic.fill', android: 'mic', web: 'mic' },
  micOff: { ios: 'mic.slash.fill', android: 'mic_off', web: 'mic_off' },
  stop: { ios: 'stop.fill', android: 'stop', web: 'stop' },
} satisfies Record<string, SymbolViewProps['name']>;
