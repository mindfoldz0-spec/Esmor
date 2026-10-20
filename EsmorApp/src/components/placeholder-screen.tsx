import type { AppIconName } from '@/components/app-icon';
import { AppIcon } from '@/components/app-icon';
import { Brand, FloatingTabBarSpace } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type PlaceholderScreenProps = {
  eyebrow: string;
  title: string;
  icon: AppIconName;
  heading: string;
  description: string;
};

/**
 * Lightweight, on-brand placeholder used by tabs that don't have app content
 * yet. Keeps the navigation fully functional while the real screens are built.
 */
export function PlaceholderScreen({
  eyebrow,
  title,
  icon,
  heading,
  description,
}: PlaceholderScreenProps) {
  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.iconBubble}>
            <AppIcon name={icon} size={28} color={Brand.ink} />
          </View>
          <Text style={styles.heading}>{heading}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.background,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingBottom: FloatingTabBarSpace,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 2,
  },
  eyebrow: {
    color: Brand.inkMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: Brand.ink,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  iconBubble: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: Brand.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#2B1B4D',
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  heading: {
    color: Brand.ink,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  description: {
    color: Brand.inkMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 300,
  },
});
