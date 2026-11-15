import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, Icons } from '@/components/app-icon';
import { Brand } from '@/constants/theme';
import { useI18n } from '@/i18n';

type ProfileHeaderProps = {
  onBack: () => void;
};

export function ProfileHeader({ onBack }: ProfileHeaderProps) {
  const { t } = useI18n();

  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={t('profile.back')}
        hitSlop={8}
        style={({ pressed }) => [styles.backButton, pressed && styles.backPressed]}>
        <AppIcon name={Icons.chevronLeft} size={20} color={Brand.ink} />
      </Pressable>

      <View style={styles.headerText}>
        <Text style={styles.eyebrow}>{t('profile.eyebrow')}</Text>
        <Text style={styles.title}>{t('profile.title')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  headerText: {
    gap: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2B1B4D',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  backPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.95 }],
  },
  eyebrow: {
    color: Brand.accentInk,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: Brand.ink,
    fontSize: 32,
    lineHeight: 39,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
});
