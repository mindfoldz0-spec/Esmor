import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, Icons, type AppIconName } from '@/components/app-icon';
import { Avatar } from '@/components/avatar';
import { Brand } from '@/constants/theme';
import { LANGUAGES, getLanguage, useI18n, type Language } from '@/i18n';
import { formatMonthYear } from '@/lib/date';
import { splitProfileName } from '@/lib/profile';
import { useAppData } from '@/providers/app-data-provider';
import {
  useNotificationPermissionLabel,
  useNotifications,
} from '@/providers/notification-provider';
import type { Profile } from '@/types/profile';

function formatLocation(profile: Profile) {
  const { location } = profile;

  if (location.label?.trim()) {
    return location.label.trim();
  }

  if (location.latitude !== null && location.longitude !== null) {
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  }

  return null;
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language } = useI18n();
  const { profile, resetProfile, changeLanguage } = useAppData();
  const { clearLocalData } = useNotifications();
  const notificationStatus = useNotificationPermissionLabel();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!profile) {
    return null;
  }

  const { firstName, lastName } = splitProfileName(profile.name);
  const location = formatLocation(profile);
  const genderKey = profile.gender === 'female' ? 'gender.female' : 'gender.male';

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)');
  };

  const showComingSoon = () => {
    setActionError(null);
    setNotice(t('profile.comingSoon'));
  };

  const handleChangeLanguage = async (nextLanguage: Language) => {
    setLanguageOpen(false);
    setNotice(null);
    setActionError(null);

    if (nextLanguage === language) {
      return;
    }

    try {
      await changeLanguage(nextLanguage);
    } catch (cause) {
      console.warn('Could not update the profile language.', cause);
      setActionError(t('profile.updateLanguageError'));
    }
  };

  const handleReset = async () => {
    setResetting(true);
    setActionError(null);

    try {
      await resetProfile();
      // The notification data is local too, so it goes with the profile.
      await clearLocalData();
      // The protected root stack takes over and returns to onboarding.
    } catch (cause) {
      console.warn('Could not reset the local profile.', cause);
      setResetting(false);
      setResetOpen(false);
      setActionError(t('profile.resetError'));
    }
  };

  const confirmReset = () => {
    setNotice(null);
    setActionError(null);
    setResetOpen(true);
  };

  const infoRows: {
    label: string;
    value: string;
    icon: AppIconName;
  }[] = [
    {
      label: t('profile.age'),
      value: t('profile.ageValue', { age: profile.age }),
      icon: Icons.calendar,
    },
    {
      label: t('profile.phone'),
      value: profile.phone,
      icon: Icons.phone,
    },
    {
      label: t('profile.gender'),
      value: t(genderKey),
      icon: Icons.person,
    },
    {
      label: t('profile.location'),
      value: location ?? t('profile.noLocation'),
      icon: Icons.location,
    },
  ];

  const menuItems: {
    id: string;
    label: string;
    subtitle: string;
    icon: AppIconName;
    onPress: () => void;
  }[] = [
    {
      id: 'language',
      label: t('profile.language'),
      subtitle: getLanguage(language).nativeName,
      icon: Icons.globe,
      onPress: () => {
        setNotice(null);
        setActionError(null);
        setLanguageOpen(true);
      },
    },
    {
      id: 'notifications',
      label: t('profile.notifications'),
      subtitle: notificationStatus,
      icon: Icons.bell,
      onPress: () => {
        setNotice(null);
        setActionError(null);
        router.push('/notifications');
      },
    },
    {
      id: 'privacy',
      label: t('profile.privacy'),
      subtitle: t('profile.privacySubtitle'),
      icon: Icons.lock,
      onPress: showComingSoon,
    },
    {
      id: 'support',
      label: t('profile.support'),
      subtitle: t('profile.supportSubtitle'),
      icon: Icons.help,
      onPress: showComingSoon,
    },
  ];

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Pressable
              onPress={handleBack}
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

          <View style={styles.profileCard}>
            <Avatar firstName={firstName} lastName={lastName} size={84} />

            <Text style={styles.name}>{profile.name}</Text>

            <View style={styles.memberPill}>
              <Text style={styles.memberText}>
                {t('profile.memberSince', {
                  date: formatMonthYear(language, profile.createdAt),
                })}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>{t('profile.infoTitle')}</Text>

          <View style={styles.infoCard}>
            {infoRows.map((row, index) => (
              <View key={row.label} style={[styles.infoRow, index > 0 && styles.infoDivider]}>
                <View style={styles.infoIcon}>
                  <AppIcon name={row.icon} size={18} color={Brand.ink} />
                </View>
                <View style={styles.infoBody}>
                  <Text style={styles.infoLabel}>{row.label}</Text>
                  <Text style={styles.infoValue}>{row.value}</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>

          <View style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <Pressable
                key={item.id}
                onPress={item.onPress}
                accessibilityRole="button"
                accessibilityLabel={`${item.label}, ${item.subtitle}`}
                style={({ pressed }) => [
                  styles.menuRow,
                  index > 0 && styles.menuDivider,
                  pressed && styles.menuRowPressed,
                ]}>
                <View style={styles.menuIcon}>
                  <AppIcon name={item.icon} size={19} color={Brand.ink} />
                </View>

                <View style={styles.menuBody}>
                  <Text style={styles.menuTitle}>{item.label}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>

                <AppIcon name={Icons.chevronRight} size={16} color={Brand.inkFaint} />
              </Pressable>
            ))}
          </View>

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
                onPress={() => setActionError(null)}
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
                onPress={() => setNotice(null)}
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

          <Pressable
            onPress={confirmReset}
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
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={languageOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setLanguageOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setLanguageOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
          />

          <View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 20) },
            ]}>
            <View style={styles.grabber} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderText}>
                <Text style={styles.sheetTitle}>{t('profile.languageModalTitle')}</Text>
                <Text style={styles.sheetSubtitle}>{t('profile.languageSubtitle')}</Text>
              </View>

              <Pressable
                onPress={() => setLanguageOpen(false)}
                accessibilityRole="button"
                accessibilityLabel={t('common.cancel')}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.closePressed,
                ]}>
                <AppIcon name={Icons.close} size={17} color={Brand.ink} />
              </Pressable>
            </View>

            <View style={styles.languageList} accessibilityRole="radiogroup">
              {LANGUAGES.map((option) => {
                const selected = option.code === language;

                return (
                  <Pressable
                    key={option.code}
                    onPress={() => {
                      void handleChangeLanguage(option.code);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={t('language.select', {
                      language: option.nativeName,
                    })}
                    style={({ pressed }) => [
                      styles.languageRow,
                      selected && styles.languageRowSelected,
                      pressed && styles.languageRowPressed,
                    ]}>
                    <View style={[styles.languageTile, selected && styles.languageTileSelected]}>
                      <Text style={styles.languageTileText} allowFontScaling={false}>
                        {option.tile}
                      </Text>
                    </View>

                    <Text style={styles.languageName}>{option.nativeName}</Text>

                    <View style={[styles.check, selected && styles.checkSelected]}>
                      {selected ? (
                        <AppIcon name={Icons.check} size={13} color={Brand.surface} />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={resetOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (!resetting) {
            setResetOpen(false);
          }
        }}>
        <View style={styles.modalRoot}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (!resetting) {
                setResetOpen(false);
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
          />

          <View
            accessibilityViewIsModal
            style={[
              styles.confirmSheet,
              { paddingBottom: Math.max(insets.bottom, 24) },
            ]}>
            <View style={styles.confirmIcon}>
              <AppIcon name={Icons.trash} size={24} color={Brand.danger} />
            </View>

            <Text style={styles.confirmTitle}>{t('profile.resetTitle')}</Text>
            <Text style={styles.confirmMessage}>{t('profile.resetMessage')}</Text>

            <Pressable
              onPress={() => {
                void handleReset();
              }}
              disabled={resetting}
              accessibilityRole="button"
              accessibilityLabel={t('profile.resetConfirm')}
              accessibilityState={{ disabled: resetting, busy: resetting }}
              style={({ pressed }) => [
                styles.confirmButton,
                resetting && styles.confirmButtonDisabled,
                pressed && !resetting && styles.confirmButtonPressed,
              ]}>
              {resetting ? (
                <ActivityIndicator color={Brand.surface} />
              ) : (
                <Text style={styles.confirmButtonText}>{t('profile.resetConfirm')}</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => setResetOpen(false)}
              disabled={resetting}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && !resetting && styles.cancelButtonPressed,
              ]}>
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  headerText: {
    gap: 2,
  },
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
  profileCard: {
    backgroundColor: Brand.surface,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 26,
    alignItems: 'center',
    shadowColor: '#2B1B4D',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  name: {
    color: Brand.ink,
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginTop: 16,
    textAlign: 'center',
  },
  memberPill: {
    marginTop: 12,
    paddingHorizontal: 12,
    minHeight: 28,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: Brand.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberText: {
    color: Brand.inkMuted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    color: Brand.ink,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginTop: 26,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: Brand.surface,
    borderRadius: 24,
    paddingVertical: 4,
    shadowColor: '#2B1B4D',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  infoDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.divider,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: Brand.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBody: {
    flex: 1,
    gap: 1,
  },
  infoLabel: {
    color: Brand.inkMuted,
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  infoValue: {
    color: Brand.ink,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  menuCard: {
    backgroundColor: Brand.surface,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#2B1B4D',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  menuDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.divider,
  },
  menuRowPressed: {
    backgroundColor: Brand.surfaceTint,
  },
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
  menuTitle: {
    color: Brand.ink,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  menuSubtitle: {
    color: Brand.inkMuted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
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
  confirmSheet: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    backgroundColor: Brand.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 28,
    alignItems: 'center',
    shadowColor: '#140E24',
    shadowOpacity: 0.2,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: -8 },
    elevation: 14,
  },
  confirmIcon: {
    width: 58,
    height: 58,
    borderRadius: 21,
    backgroundColor: Brand.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTitle: {
    color: Brand.ink,
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 16,
    textAlign: 'center',
  },
  confirmMessage: {
    color: Brand.inkMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  confirmButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: 999,
    backgroundColor: Brand.danger,
    marginTop: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.68,
  },
  confirmButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  confirmButtonText: {
    color: Brand.surface,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  cancelButton: {
    width: '100%',
    minHeight: 50,
    borderRadius: 999,
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonPressed: {
    backgroundColor: Brand.surfaceTint,
  },
  cancelButtonText: {
    color: Brand.ink,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Brand.backdrop,
  },
  sheet: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    backgroundColor: Brand.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 10,
    shadowColor: '#140E24',
    shadowOpacity: 0.2,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: -8 },
    elevation: 14,
  },
  grabber: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(22, 19, 31, 0.14)',
    alignSelf: 'center',
    marginBottom: 18,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  sheetHeaderText: {
    flex: 1,
    gap: 3,
  },
  sheetTitle: {
    color: Brand.ink,
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sheetSubtitle: {
    color: Brand.inkMuted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Brand.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closePressed: {
    opacity: 0.7,
  },
  languageList: {
    gap: 10,
  },
  languageRow: {
    minHeight: 68,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Brand.divider,
    backgroundColor: Brand.surfaceMuted,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  languageRowSelected: {
    borderColor: Brand.ink,
    backgroundColor: '#FFFCFF',
  },
  languageRowPressed: {
    opacity: 0.86,
  },
  languageTile: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: Brand.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageTileSelected: {
    backgroundColor: Brand.accentSoft,
  },
  languageTileText: {
    color: Brand.ink,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  languageName: {
    flex: 1,
    color: Brand.ink,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(22, 19, 31, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: {
    backgroundColor: Brand.ink,
    borderColor: Brand.ink,
  },
});
