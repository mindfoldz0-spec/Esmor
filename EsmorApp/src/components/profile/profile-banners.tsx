import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, Icons } from '@/components/app-icon';
import { Brand } from '@/constants/theme';
import { useI18n } from '@/i18n';

type ProfileBannersProps = {
  actionError: string | null;
  notice: string | null;
  onDismissError: () => void;
  onDismissNotice: () => void;
};

export function ProfileBanners({
  actionError,
  notice,
  onDismissError,
  onDismissNotice,
}: ProfileBannersProps) {
  const { t } = useI18n();

  return (
    <>
      {actionError ? (
        <View
          style={styles.errorBanner}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite">
          <View style={styles.bannerIcon}>
            <AppIcon name={Icons.warning} size={16} color={Brand.danger} />
          </View>
          <Text style={styles.errorText}>{actionError}</Text>
          <Pressable
            onPress={onDismissError}
            accessibilityRole="button"
            accessibilityLabel={t('common.dismiss')}
            hitSlop={6}
            style={({ pressed }) => [
              styles.bannerClose,
              pressed && styles.closePressed,
            ]}>
            <AppIcon name={Icons.close} size={13} color={Brand.danger} />
          </Pressable>
        </View>
      ) : null}

      {notice ? (
        <View style={styles.noticeBanner} accessibilityLiveRegion="polite">
          <View style={styles.bannerIcon}>
            <AppIcon name={Icons.sparkle} size={16} color={Brand.accentInk} />
          </View>
          <Text style={styles.noticeText}>{notice}</Text>
          <Pressable
            onPress={onDismissNotice}
            accessibilityRole="button"
            accessibilityLabel={t('common.dismiss')}
            hitSlop={6}
            style={({ pressed }) => [
              styles.bannerClose,
              pressed && styles.closePressed,
            ]}>
            <AppIcon name={Icons.close} size={13} color={Brand.accentInk} />
          </Pressable>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 8,
    borderRadius: 18,
    backgroundColor: Brand.dangerSoft,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 8,
    borderRadius: 18,
    backgroundColor: Brand.accentSoft,
  },
  bannerIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    flex: 1,
    color: Brand.danger,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
  },
  noticeText: {
    flex: 1,
    color: Brand.accentInk,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
  },
  bannerClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closePressed: {
    opacity: 0.7,
  },
});
