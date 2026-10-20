import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Tabs } from 'expo-router';

import { NavigationIcon, type NavigationIconName } from '@/components/navigation-icons';
import { Brand } from '@/constants/theme';
import { useI18n, type TranslationKey } from '@/i18n';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

type TabMeta = {
  labelKey: TranslationKey;
  icon: NavigationIconName;
};

const TAB_META: Record<string, TabMeta> = {
  index: { labelKey: 'tabs.home', icon: 'home' },
  explore: { labelKey: 'tabs.explore', icon: 'explore' },
  activity: { labelKey: 'tabs.activity', icon: 'activity' },
};

const ACTIVE_TIMING = { duration: 240, easing: Easing.out(Easing.cubic) };
const HOVER_TIMING = { duration: 300, easing: Easing.out(Easing.quad) };
const PRESS_SPRING = { damping: 20, stiffness: 400, mass: 0.4 };

type TabItemProps = {
  label: string;
  icon: NavigationIconName;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
};

function TabItem({ label, icon, focused, onPress, onLongPress }: TabItemProps) {
  const { t } = useI18n();
  const active = useSharedValue(focused ? 1 : 0);
  const hover = useSharedValue(0);
  const press = useSharedValue(0);

  useEffect(() => {
    active.value = withTiming(focused ? 1 : 0, ACTIVE_TIMING);
  }, [active, focused]);

  const tabStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: hover.value * -2 + press.value },
      { scale: 1 + hover.value * 0.06 - press.value * 0.06 },
    ],
  }));

  const hoverFillStyle = useAnimatedStyle(() => ({
    opacity: hover.value * (1 - active.value),
  }));

  const activeFillStyle = useAnimatedStyle(() => ({
    opacity: active.value,
  }));

  const iconScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + hover.value * 0.03 - press.value * 0.03 }],
  }));

  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - active.value,
  }));

  const activeIconStyle = useAnimatedStyle(() => ({
    opacity: active.value,
  }));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => {
        press.value = withSpring(1, PRESS_SPRING);
      }}
      onPressOut={() => {
        press.value = withSpring(0, PRESS_SPRING);
      }}
      onHoverIn={() => {
        hover.value = withTiming(1, HOVER_TIMING);
      }}
      onHoverOut={() => {
        hover.value = withTiming(0, HOVER_TIMING);
      }}
      accessibilityRole="tab"
      accessibilityLabel={t('a11y.tab', { label })}
      accessibilityState={focused ? { selected: true } : undefined}
      style={styles.item}>
      <Animated.View style={[styles.tab, tabStyle]}>
        <Animated.View style={[styles.hoverFill, hoverFillStyle]} />
        <Animated.View style={[styles.activeFill, activeFillStyle]} />

        <Animated.View style={[styles.iconWrap, iconScaleStyle]}>
          <Animated.View style={[styles.iconLayer, inactiveIconStyle]}>
            <NavigationIcon name={icon} color={Brand.ink} size={20} />
          </Animated.View>
          <Animated.View style={[styles.iconLayer, activeIconStyle]}>
            <NavigationIcon name={icon} color={Brand.surface} size={20} />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Floating white navigation pill from the reference design.
 * Circular tabs use a 0.3s-style hover fill, a soft lift and scale, and
 * smoothly crossfade into the active state.
 */
export function FloatingTabBar({ state, navigation, insets }: TabBarProps) {
  const { t } = useI18n();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.positioner, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.pill} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const meta = TAB_META[route.name];
          if (!meta) {
            return null;
          }

          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabItem
              key={route.key}
              label={t(meta.labelKey)}
              icon={meta.icon}
              focused={focused}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  positioner: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
    backgroundColor: Brand.surface,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 50,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(22, 19, 31, 0.05)',
    shadowColor: '#1B1630',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  item: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  tab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#FCFCFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoverFill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 25,
    backgroundColor: '#DFDFDF',
  },
  activeFill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 25,
    backgroundColor: Brand.ink,
  },
  iconWrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
