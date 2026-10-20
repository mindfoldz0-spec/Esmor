import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon, Icons, type AppIconName } from '@/components/app-icon';
import { PrimaryButton } from '@/components/onboarding/primary-button';
import { Brand, Fonts } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { formatTimeOfDay } from '@/lib/date';
import {
  useNotificationPermissionLabel,
  useNotifications,
} from '@/providers/notification-provider';
import type { NotificationLogEntry, NotificationLogKind } from '@/types/notification';

const DELAY_OPTIONS = [0, 5, 30, 60] as const;

function logKindIcon(kind: NotificationLogKind): AppIconName {
  switch (kind) {
    case 'received':
      return Icons.bell;
    case 'opened':
      return Icons.check;
    case 'error':
      return Icons.warning;
    default:
      return Icons.arrowRight;
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const {
    supported,
    permission,
    registration,
    log,
    scheduled,
    projectId,
    physicalDevice,
    busy,
    error,
    enableNotifications,
    sendLocalNotification,
    cancelScheduled,
    clearLog,
    dismissError,
  } = useNotifications();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [delay, setDelay] = useState<number>(5);
  const [sent, setSent] = useState(false);

  const permissionText = useNotificationPermissionLabel();

  const deviceText = useMemo(() => {
    if (!supported) {
      return t('notifications.deviceWeb');
    }

    return physicalDevice
      ? t('notifications.devicePhysical')
      : t('notifications.deviceSimulator');
  }, [supported, physicalDevice, t]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)');
  };

  const handleSend = async () => {
    const payload = {
      title: title.trim() || t('notifications.fieldTitlePlaceholder'),
      body: body.trim() || t('notifications.fieldBodyPlaceholder'),
    };

    const delivered = await sendLocalNotification(payload, delay);

    if (delivered) {
      setSent(true);
    }
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel={t('notifications.back')}
              hitSlop={8}
              style={({ pressed }) => [styles.backButton, pressed && styles.backPressed]}>
              <AppIcon name={Icons.chevronLeft} size={20} color={Brand.ink} />
            </Pressable>

            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>{t('notifications.eyebrow')}</Text>
              <Text style={styles.title}>{t('notifications.title')}</Text>
            </View>
          </View>

          <Text style={styles.lead}>{t('notifications.subtitle')}</Text>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <AppIcon name={Icons.bell} size={19} color={Brand.ink} />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>{t('notifications.statusTitle')}</Text>
                <Text style={styles.cardSubtitle}>{permissionText}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('notifications.permissionLabel')}</Text>
              <Text style={styles.detailValue}>{permissionText}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('notifications.tokenLabel')}</Text>
              {registration?.token ? (
                <Text selectable style={styles.tokenValue}>
                  {registration.token}
                </Text>
              ) : (
                <Text style={styles.detailValue}>
                  {t('notifications.tokenMissing')}
                </Text>
              )}
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('notifications.projectLabel')}</Text>
              <Text style={styles.detailValue}>
                {projectId ?? t('notifications.projectMissing')}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('notifications.deviceLabel')}</Text>
              <Text style={styles.detailValue}>{deviceText}</Text>
            </View>

            {permission === 'granted' ? (
              <View style={styles.enabledPill}>
                <AppIcon name={Icons.check} size={14} color={Brand.success} />
                <Text style={styles.enabledText}>{t('notifications.enabled')}</Text>
              </View>
            ) : null}

            {supported && permission !== 'granted' ? (
              <View style={styles.enableButton}>
                <PrimaryButton
                  label={t('notifications.enable')}
                  onPress={() => {
                    void enableNotifications();
                  }}
                  loading={busy}
                  icon="check"
                />
              </View>
            ) : null}

            {supported ? (
              <Text style={styles.hint}>{t('notifications.remoteHint')}</Text>
            ) : (
              <Text style={styles.hint}>{t('notifications.webNotice')}</Text>
            )}
          </View>

          <Text style={styles.sectionTitle}>{t('notifications.testTitle')}</Text>

          <View style={styles.card}>
            <Text style={styles.cardSubtitle}>{t('notifications.testSubtitle')}</Text>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>{t('notifications.fieldTitle')}</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={t('notifications.fieldTitlePlaceholder')}
                placeholderTextColor={Brand.inkFaint}
                selectionColor={Brand.accent}
                accessibilityLabel={t('notifications.fieldTitle')}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>{t('notifications.fieldBody')}</Text>
              <TextInput
                value={body}
                onChangeText={setBody}
                placeholder={t('notifications.fieldBodyPlaceholder')}
                placeholderTextColor={Brand.inkFaint}
                selectionColor={Brand.accent}
                multiline
                accessibilityLabel={t('notifications.fieldBody')}
                style={[styles.input, styles.inputMultiline]}
              />
            </View>

            <Text style={styles.fieldLabel}>{t('notifications.delayLabel')}</Text>
            <View style={styles.chipRow}>
              {DELAY_OPTIONS.map((option) => {
                const selected = option === delay;

                return (
                  <Pressable
                    key={option}
                    onPress={() => setDelay(option)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={
                      option === 0
                        ? t('notifications.delayNow')
                        : t('notifications.delaySeconds', { seconds: option })
                    }
                    style={({ pressed }) => [
                      styles.chip,
                      selected && styles.chipSelected,
                      pressed && styles.chipPressed,
                    ]}>
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {option === 0
                        ? t('notifications.delayNow')
                        : t('notifications.delaySeconds', { seconds: option })}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.sendButton}>
              <PrimaryButton
                label={t('notifications.send')}
                onPress={() => {
                  void handleSend();
                }}
                loading={busy}
                disabled={!supported}
              />
            </View>

            {sent ? (
              <View style={styles.successBanner} accessibilityLiveRegion="polite">
                <AppIcon name={Icons.check} size={15} color={Brand.success} />
                <Text style={styles.successText}>{t('notifications.sent')}</Text>
              </View>
            ) : null}
          </View>

          {error ? (
            <View
              style={styles.errorBanner}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite">
              <View style={styles.bannerIcon}>
                <AppIcon name={Icons.warning} size={16} color={Brand.danger} />
              </View>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable
                onPress={dismissError}
                accessibilityRole="button"
                accessibilityLabel={t('common.dismiss')}
                hitSlop={6}
                style={({ pressed }) => [styles.bannerClose, pressed && styles.closePressed]}>
                <AppIcon name={Icons.close} size={13} color={Brand.danger} />
              </Pressable>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>{t('notifications.scheduledTitle')}</Text>

          <View style={styles.card}>
            {scheduled.length === 0 ? (
              <Text style={styles.emptyText}>{t('notifications.scheduledEmpty')}</Text>
            ) : (
              scheduled.map((item, index) => (
                <View
                  key={item.id}
                  style={[styles.listRow, index > 0 && styles.listDivider]}>
                  <View style={styles.listBody}>
                    <Text style={styles.listTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.listSubtitle} numberOfLines={1}>
                      {item.deliverAt
                        ? formatTimeOfDay(item.deliverAt)
                        : t('notifications.delayNow')}
                    </Text>
                  </View>
                </View>
              ))
            )}

            {scheduled.length > 0 ? (
              <Pressable
                onPress={() => {
                  void cancelScheduled();
                }}
                accessibilityRole="button"
                accessibilityLabel={t('notifications.cancelAll')}
                style={({ pressed }) => [styles.ghostButton, pressed && styles.ghostPressed]}>
                <Text style={styles.ghostText}>{t('notifications.cancelAll')}</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.sectionTitle}>{t('notifications.activityTitle')}</Text>

          <View style={styles.card}>
            {log.length === 0 ? (
              <Text style={styles.emptyText}>{t('notifications.activityEmpty')}</Text>
            ) : (
              log.map((entry, index) => (
                <LogRow
                  key={entry.id}
                  entry={entry}
                  first={index === 0}
                  label={t(logKindLabel(entry.kind))}
                  time={formatTimeOfDay(entry.createdAt)}
                />
              ))
            )}

            {log.length > 0 ? (
              <Pressable
                onPress={() => {
                  void clearLog();
                }}
                accessibilityRole="button"
                accessibilityLabel={t('notifications.clearLog')}
                style={({ pressed }) => [styles.ghostButton, pressed && styles.ghostPressed]}>
                <Text style={styles.ghostText}>{t('notifications.clearLog')}</Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function LogRow({
  entry,
  first,
  label,
  time,
}: {
  entry: NotificationLogEntry;
  first: boolean;
  label: string;
  time: string;
}) {
  return (
    <View style={[styles.listRow, !first && styles.listDivider]}>
      <View style={styles.logIcon}>
        <AppIcon name={logKindIcon(entry.kind)} size={16} color={Brand.ink} />
      </View>
      <View style={styles.listBody}>
        <Text style={styles.listTitle} numberOfLines={1}>
          {entry.title}
        </Text>
        <Text style={styles.listSubtitle} numberOfLines={1}>
          {label} · {time}
        </Text>
      </View>
    </View>
  );
}

function logKindLabel(kind: NotificationLogKind) {
  switch (kind) {
    case 'received':
      return 'notifications.logReceived' as const;
    case 'opened':
      return 'notifications.logOpened' as const;
    case 'error':
      return 'notifications.logError' as const;
    default:
      return 'notifications.logSent' as const;
  }
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
    marginBottom: 12,
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
    fontSize: 28,
    lineHeight: 35,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  lead: {
    color: Brand.inkMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    marginBottom: 18,
  },
  card: {
    backgroundColor: Brand.surface,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#2B1B4D',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Brand.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    color: Brand.ink,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: Brand.inkMuted,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 9,
  },
  detailLabel: {
    color: Brand.inkMuted,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
  },
  detailValue: {
    flex: 1,
    color: Brand.ink,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'right',
  },
  tokenValue: {
    flex: 1,
    color: Brand.ink,
    fontSize: 11.5,
    lineHeight: 17,
    fontFamily: Fonts.mono,
    fontWeight: '500',
    textAlign: 'right',
  },
  enabledPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: Brand.successSoft,
  },
  enabledText: {
    color: Brand.success,
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '700',
  },
  enableButton: {
    marginTop: 14,
  },
  hint: {
    color: Brand.inkFaint,
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: '500',
    marginTop: 12,
  },
  sectionTitle: {
    color: Brand.ink,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginTop: 24,
    marginBottom: 12,
  },
  fieldBlock: {
    marginTop: 14,
  },
  fieldLabel: {
    color: Brand.ink,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 7,
    marginLeft: 2,
  },
  input: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: Brand.surfaceMuted,
    borderWidth: 1.5,
    borderColor: Brand.surfaceMuted,
    color: Brand.ink,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputMultiline: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: Brand.surfaceMuted,
  },
  chipSelected: {
    backgroundColor: Brand.ink,
  },
  chipPressed: {
    opacity: 0.8,
  },
  chipText: {
    color: Brand.inkMuted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: Brand.surface,
  },
  sendButton: {
    marginTop: 18,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Brand.successSoft,
  },
  successText: {
    flex: 1,
    color: Brand.success,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 8,
    borderRadius: 18,
    backgroundColor: Brand.dangerSoft,
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
  emptyText: {
    color: Brand.inkMuted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
  },
  listDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.divider,
  },
  logIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: Brand.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listBody: {
    flex: 1,
    gap: 2,
  },
  listTitle: {
    color: Brand.ink,
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: '600',
  },
  listSubtitle: {
    color: Brand.inkMuted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  ghostButton: {
    marginTop: 12,
    minHeight: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.surfaceMuted,
  },
  ghostPressed: {
    opacity: 0.8,
  },
  ghostText: {
    color: Brand.ink,
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '700',
  },
});
