import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, Icons } from '@/components/app-icon';
import { Brand } from '@/constants/theme';
import { useI18n } from '@/i18n';

type ProfileResetRowProps = {
  onPress: () => void;
};

export function ProfileResetRow({ onPress }: ProfileResetRowProps) {
  const { t } = useI18n();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${t('profile.reset')}, ${t('profile.resetSubtitle')}`}
      style={({ pressed }) => [styles.resetRow, pressed && styles.resetRowPressed]}>
      <View style={[styles.menuIcon, styles.resetIcon]}>
        <AppIcon name={Icons.trash} size={19} color={Brand.danger} />
      </View>

      <View style={styles.menuBody}>
        <Text style={styles.resetTitle}>{t('profile.reset')}</Text>
        <Text style={styles.resetSubtitle}>{t('profile.resetSubtitle')}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Brand.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBody: {
    flex: 1,
    gap: 2,
  },
  resetRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 22,
    backgroundColor: Brand.dangerSoft,
  },
  resetRowPressed: {
    backgroundColor: 'rgba(184, 69, 54, 0.12)',
  },
  resetIcon: {
    backgroundColor: 'rgba(184, 69, 54, 0.1)',
  },
  resetTitle: {
    color: Brand.danger,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  resetSubtitle: {
    color: 'rgba(184, 69, 54, 0.76)',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
});
