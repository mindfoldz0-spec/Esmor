import { Image, type ImageSource } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { AppIcon, Icons } from '@/components/app-icon';
import { OnboardingNote, OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { PrimaryButton } from '@/components/onboarding/primary-button';
import { Brand } from '@/constants/theme';
import { useI18n, type TranslationKey } from '@/i18n';
import { useAppData } from '@/providers/app-data-provider';
import { useOnboarding } from '@/providers/onboarding-provider';
import type { UserRole } from '@/types/profile';

const FARMER_IMAGE = require('@/assets/images/farmer.png');
const KIRANA_IMAGE = require('@/assets/images/kiranastoreowner.png');
const FEMALE_ENTREPRENEUR_IMAGE = require('@/assets/images/female_entrepreneur.png');
const MALE_ENTREPRENEUR_IMAGE = require('@/assets/images/male_entrepreneur.png');

type RoleOptionConfig = {
  value: UserRole;
  titleKey: TranslationKey;
  badgeKey: TranslationKey;
  descKey: TranslationKey;
  accessibilityKey: TranslationKey;
};

const ROLE_OPTIONS: RoleOptionConfig[] = [
  {
    value: 'farmer',
    titleKey: 'role.farmer',
    badgeKey: 'role.farmerBadge',
    descKey: 'role.farmerDesc',
    accessibilityKey: 'role.selectFarmer',
  },
  {
    value: 'kirana',
    titleKey: 'role.kirana',
    badgeKey: 'role.kiranaBadge',
    descKey: 'role.kiranaDesc',
    accessibilityKey: 'role.selectKirana',
  },
  {
    value: 'entrepreneur',
    titleKey: 'role.entrepreneur',
    badgeKey: 'role.entrepreneurBadge',
    descKey: 'role.entrepreneurDesc',
    accessibilityKey: 'role.selectEntrepreneur',
  },
];

export default function RoleScreen() {
  const router = useRouter();
  const { t, language } = useI18n();
  const { form, updateForm } = useOnboarding();
  const { completeOnboarding } = useAppData();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/gender');
  };

  const handleSelect = (role: UserRole) => {
    updateForm({ role });
    setError(null);
  };

  const handleFinish = async () => {
    if (!form.role) {
      setError(t('role.error'));
      return;
    }

    if (!form.gender) {
      setError(t('gender.error'));
      return;
    }

    if (!form.location) {
      setError(t('onboarding.incomplete'));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await completeOnboarding({
        name: form.name.trim(),
        age: Number(form.age),
        phone: form.phone.trim(),
        gender: form.gender,
        role: form.role,
        language,
        location: form.location,
      });
    } catch (cause) {
      console.warn('Could not save the profile.', cause);
      setSaving(false);
      setError(t('onboarding.saveError'));
    }
  };

  const getRoleImage = (role: UserRole) => {
    if (role === 'farmer') {
      return FARMER_IMAGE;
    }
    if (role === 'kirana') {
      return KIRANA_IMAGE;
    }
    return form.gender === 'male' ? MALE_ENTREPRENEUR_IMAGE : FEMALE_ENTREPRENEUR_IMAGE;
  };

  return (
    <OnboardingShell
      step={5}
      eyebrow={t('role.eyebrow')}
      title={t('role.title')}
      subtitle={t('role.subtitle')}
      onBack={handleBack}
      footer={
        <PrimaryButton
          label={saving ? t('role.saving') : t('common.finish')}
          onPress={handleFinish}
          loading={saving}
          icon="check"
        />
      }>
      <View style={styles.list} accessibilityRole="radiogroup">
        {ROLE_OPTIONS.map((option) => (
          <RoleCard
            key={option.value}
            role={option.value}
            title={t(option.titleKey)}
            badge={t(option.badgeKey)}
            description={t(option.descKey)}
            accessibilityLabel={t(option.accessibilityKey)}
            selected={form.role === option.value}
            imageSource={getRoleImage(option.value)}
            onPress={() => handleSelect(option.value)}
          />
        ))}
      </View>

      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <OnboardingNote>{t('role.privateNote')}</OnboardingNote>
    </OnboardingShell>
  );
}

function RoleCard({
  title,
  badge,
  description,
  accessibilityLabel,
  selected,
  imageSource,
  onPress,
}: {
  role: UserRole;
  title: string;
  badge: string;
  description: string;
  accessibilityLabel: string;
  selected: boolean;
  imageSource: ImageSource | number;
  onPress: () => void;
}) {
  const selection = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    selection.value = withSpring(selected ? 1 : 0, {
      damping: 18,
      stiffness: 240,
      mass: 0.6,
    });
  }, [selected, selection]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + selection.value * 0.015 }],
  }));

  return (
    <Animated.View
      style={[
        styles.card,
        selected && styles.cardSelected,
        animatedStyle,
      ]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="radio"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected }}
        style={({ pressed }) => [styles.pressable, pressed && styles.cardPressed]}>
        <View style={styles.avatarWrap}>
          <Image
            source={imageSource}
            style={styles.avatarImage}
            contentFit="cover"
            transition={150}
          />
        </View>

        <View style={styles.contentWrap}>
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>{title}</Text>
            <View style={[styles.badge, selected && styles.badgeSelected]}>
              <Text style={[styles.badgeText, selected && styles.badgeTextSelected]}>
                {badge}
              </Text>
            </View>
          </View>

          <Text style={styles.descText} numberOfLines={2}>
            {description}
          </Text>
        </View>

        <View style={[styles.check, selected && styles.checkSelected]}>
          {selected ? (
            <AppIcon name={Icons.check} size={13} color={Brand.surface} />
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: 22,
    gap: 12,
  },
  card: {
    backgroundColor: Brand.surface,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Brand.surface,
    shadowColor: '#2B1B4D',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2,
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: Brand.ink,
    backgroundColor: '#FFFCFF',
    shadowOpacity: 0.1,
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
    position: 'relative',
  },
  cardPressed: {
    opacity: 0.92,
  },
  avatarWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Brand.surfaceTint,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  contentWrap: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  titleText: {
    color: Brand.ink,
    fontSize: 15.5,
    lineHeight: 20,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: Brand.surfaceMuted,
  },
  badgeSelected: {
    backgroundColor: Brand.accentSoft,
  },
  badgeText: {
    color: Brand.inkMuted,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
  },
  badgeTextSelected: {
    color: Brand.accentInk,
  },
  descText: {
    color: Brand.inkMuted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(22, 19, 31, 0.14)',
    backgroundColor: Brand.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: {
    backgroundColor: Brand.ink,
    borderColor: Brand.ink,
  },
  error: {
    color: Brand.danger,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 14,
  },
});
