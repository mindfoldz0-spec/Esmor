import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppIcon, Icons } from '@/components/app-icon';
import { OnboardingNote, OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { PrimaryButton } from '@/components/onboarding/primary-button';
import { TextField } from '@/components/onboarding/text-field';
import { Brand } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { useOnboarding } from '@/providers/onboarding-provider';
import type { LocationSource, ProfileLocation } from '@/types/profile';

const LOCATION_BANNER = require('@/assets/images/location-banner.jpg');

function formatAddress(address: Location.LocationGeocodedAddress) {
  const parts = [
    address.name,
    address.street,
    address.district,
    address.city,
    address.region,
    address.country,
  ].filter((part): part is string => Boolean(part && part.trim()));

  return Array.from(new Set(parts)).slice(0, 3).join(', ');
}

async function getReadableLabel(latitude: number, longitude: number) {
  try {
    const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
    return address ? formatAddress(address) || null : null;
  } catch {
    return null;
  }
}

export default function LocationScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { form, updateForm } = useOnboarding();
  const existingLocation = form.location;

  const [mode, setMode] = useState<LocationSource | null>(
    existingLocation?.source ?? null
  );
  const [gpsLocation, setGpsLocation] = useState<ProfileLocation | null>(
    existingLocation?.source === 'gps' ? existingLocation : null
  );
  const [manualLocation, setManualLocation] = useState(
    existingLocation?.source === 'manual' ? existingLocation.label ?? '' : ''
  );
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/details');
  };

  const openManual = () => {
    setMode('manual');
    setError(null);
    setManualError(null);
  };

  const handleUseCurrentLocation = async () => {
    if (locating) {
      return;
    }

    setError(null);
    setManualError(null);
    setLocating(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setError(t('location.permissionDenied'));
        setMode('manual');
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        setError(t('location.servicesOff'));
        setMode('manual');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        mayShowUserSettingsDialog: true,
      });
      const { latitude, longitude, accuracy } = position.coords;
      const label = await getReadableLabel(latitude, longitude);
      const nextLocation: ProfileLocation = {
        label,
        latitude,
        longitude,
        accuracy,
        source: 'gps',
      };

      setGpsLocation(nextLocation);
      setMode('gps');
    } catch (cause) {
      console.warn('Could not resolve the current location.', cause);
      setError(t('location.error'));
      setMode('manual');
    } finally {
      setLocating(false);
    }
  };

  const handleContinue = () => {
    if (mode === 'gps' && gpsLocation) {
      updateForm({ location: gpsLocation });
      router.push('/gender');
      return;
    }

    if (mode === 'manual') {
      const value = manualLocation.trim();

      if (value.length < 2) {
        setManualError(t('location.manualError'));
        return;
      }

      updateForm({
        location: {
          label: value,
          latitude: null,
          longitude: null,
          accuracy: null,
          source: 'manual',
        },
      });
      router.push('/gender');
      return;
    }

    setError(t('location.choiceError'));
  };

  const gpsLabel = gpsLocation
    ? gpsLocation.label ??
      t('location.coordinates', {
        latitude: gpsLocation.latitude?.toFixed(5) ?? '',
        longitude: gpsLocation.longitude?.toFixed(5) ?? '',
      })
    : '';

  return (
    <OnboardingShell
      step={3}
      eyebrow={t('location.eyebrow')}
      title={t('location.title')}
      subtitle={t('location.subtitle')}
      onBack={handleBack}
      footer={<PrimaryButton label={t('common.continue')} onPress={handleContinue} />}>
      <View style={styles.content}>
        {error ? (
          <View style={styles.errorBanner} accessibilityLiveRegion="polite">
            <AppIcon name={Icons.warning} size={17} color={Brand.danger} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        {mode === 'manual' ? (
          <View style={styles.manualCard}>
            <Text style={styles.manualTitle}>{t('location.manualTitle')}</Text>
            <Text style={styles.manualSubtitle}>{t('location.manualSubtitle')}</Text>

            <View style={styles.manualField}>
              <TextField
                label={t('location.manualLabel')}
                icon={Icons.location}
                value={manualLocation}
                onChangeText={(value) => {
                  setManualLocation(value);
                  setManualError(null);
                  setError(null);
                }}
                placeholder={t('location.manualPlaceholder')}
                error={manualError}
                autoCapitalize="words"
                returnKeyType="done"
                maxLength={160}
              />
            </View>

            <Pressable
              onPress={handleUseCurrentLocation}
              disabled={locating}
              accessibilityRole="button"
              accessibilityLabel={t('location.useGpsInstead')}
              hitSlop={8}
              style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}>
              {locating ? (
                <ActivityIndicator size="small" color={Brand.accentInk} />
              ) : (
                <AppIcon name={Icons.location} size={15} color={Brand.accentInk} />
              )}
              <Text style={styles.linkText}>
                {locating ? t('location.locating') : t('location.useGpsInstead')}
              </Text>
            </Pressable>
          </View>
        ) : mode === 'gps' && gpsLocation ? (
          <View style={styles.successCard}>
            <View style={styles.successHeader}>
              <View style={styles.successIcon}>
                <AppIcon name={Icons.check} size={20} color={Brand.success} />
              </View>
              <View style={styles.successBody}>
                <Text style={styles.successTitle}>{t('location.captured')}</Text>
                <Text style={styles.successSubtitle} numberOfLines={3}>
                  {gpsLabel}
                </Text>
              </View>
            </View>

            <View style={styles.successMeta}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t('location.currentBadge')}</Text>
              </View>
              {typeof gpsLocation.accuracy === 'number' ? (
                <Text style={styles.accuracy}>
                  {t('location.accuracy', {
                    meters: Math.max(1, Math.round(gpsLocation.accuracy)),
                  })}
                </Text>
              ) : null}
            </View>

            <Pressable
              onPress={openManual}
              accessibilityRole="button"
              accessibilityLabel={t('location.changeLocation')}
              hitSlop={8}
              style={({ pressed }) => [styles.changeButton, pressed && styles.linkPressed]}>
              <Text style={styles.changeText}>{t('location.changeLocation')}</Text>
              <AppIcon name={Icons.chevronRight} size={14} color={Brand.inkMuted} />
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.mapCard}>
              <Image
                source={LOCATION_BANNER}
                style={styles.mapImage}
                contentFit="cover"
                transition={200}
                accessibilityLabel={t('location.title')}
              />
            </View>

            <Pressable
              onPress={handleUseCurrentLocation}
              disabled={locating}
              accessibilityRole="button"
              accessibilityLabel={t('location.useCurrent')}
              accessibilityState={{ busy: locating }}
              style={({ pressed }) => [
                styles.gpsButton,
                pressed && !locating && styles.gpsButtonPressed,
              ]}>
              <View style={styles.gpsIcon}>
                {locating ? (
                  <ActivityIndicator size="small" color={Brand.accentInk} />
                ) : (
                  <AppIcon name={Icons.location} size={21} color={Brand.ink} />
                )}
              </View>

              <View style={styles.gpsBody}>
                <Text style={styles.gpsTitle}>
                  {locating ? t('location.locating') : t('location.useCurrent')}
                </Text>
                <Text style={styles.gpsSubtitle}>{t('location.permissionBody')}</Text>
              </View>

              <AppIcon name={Icons.chevronRight} size={17} color={Brand.inkMuted} />
            </Pressable>

            <Pressable
              onPress={openManual}
              accessibilityRole="button"
              accessibilityLabel={t('location.manualCta')}
              hitSlop={8}
              style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}>
              <Text style={styles.linkText}>{t('location.manualCta')}</Text>
            </Pressable>
          </>
        )}

        <OnboardingNote>{t('location.privateNote')}</OnboardingNote>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  content: {
    marginTop: 26,
    gap: 14,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 15,
    backgroundColor: Brand.dangerSoft,
  },
  errorBannerText: {
    flex: 1,
    color: Brand.danger,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
  },
  mapCard: {
    height: 184,
    borderRadius: 27,
    backgroundColor: Brand.surface,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#2B1B4D',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 2,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  gpsButton: {
    minHeight: 78,
    borderRadius: 22,
    backgroundColor: Brand.surface,
    borderWidth: 1.5,
    borderColor: Brand.surface,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#2B1B4D',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2,
  },
  gpsButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.994 }],
  },
  gpsIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Brand.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsBody: {
    flex: 1,
    gap: 3,
  },
  gpsTitle: {
    color: Brand.ink,
    fontSize: 14.5,
    lineHeight: 19,
    fontWeight: '700',
  },
  gpsSubtitle: {
    color: Brand.inkMuted,
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '500',
  },
  link: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  linkPressed: {
    opacity: 0.6,
  },
  linkText: {
    color: Brand.accentInk,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
  },
  manualCard: {
    borderRadius: 24,
    backgroundColor: Brand.surface,
    padding: 18,
    shadowColor: '#2B1B4D',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  manualTitle: {
    color: Brand.ink,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  manualSubtitle: {
    color: Brand.inkMuted,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
    marginTop: 3,
  },
  manualField: {
    marginTop: 16,
  },
  successCard: {
    borderRadius: 24,
    backgroundColor: Brand.surface,
    padding: 17,
    borderWidth: 1.5,
    borderColor: 'rgba(62, 122, 94, 0.18)',
    shadowColor: '#2B1B4D',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  successIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: Brand.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBody: {
    flex: 1,
    gap: 2,
  },
  successTitle: {
    color: Brand.ink,
    fontSize: 15.5,
    lineHeight: 21,
    fontWeight: '700',
  },
  successSubtitle: {
    color: Brand.inkMuted,
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '500',
  },
  successMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 13,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9,
    backgroundColor: Brand.successSoft,
  },
  badgeText: {
    color: Brand.success,
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  accuracy: {
    color: Brand.inkMuted,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
  },
  changeButton: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  changeText: {
    color: Brand.inkMuted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
});
