import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { AppIcon, Icons } from '@/components/app-icon';
import { GenderIllustration } from '@/components/onboarding/gender-illustration';
import { OnboardingNote, OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { PrimaryButton } from '@/components/onboarding/primary-button';
import { Brand } from '@/constants/theme';
import { useI18n, type TranslationKey } from '@/i18n';
import { useAppData } from '@/providers/app-data-provider';
import { useOnboarding } from '@/providers/onboarding-provider';
import type { Gender } from '@/types/profile';

const GENDER_OPTIONS: {
  value: Gender;
  labelKey: TranslationKey;
  accessibilityKey: TranslationKey;
}[] = [
  { value: 'female', labelKey: 'gender.female', accessibilityKey: 'gender.selectFemale' },
  { value: 'male', labelKey: 'gender.male', accessibilityKey: 'gender.selectMale' },
];

export default function GenderScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { t, language } = useI18n();
  const { form, updateForm } = useOnboarding();
  const { completeOnboarding } = useAppData();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const viewportWidth = Math.min(width, 640);
  const cardWidth = (viewportWidth - 40 - 12) / 2;
  const artSize = Math.max(104, Math.min(148, cardWidth - 24));

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/location');
  };

  const handleSelect = (gender: Gender) => {
    updateForm({ gender });
    setError(null);
  };

  const handleFinish = async () => {
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
        language,
        location: form.location,
      });
      // The protected root stack switches to the app when the profile appears.
    } catch (cause) {
      console.warn('Could not save the profile.', cause);
      setSaving(false);
      setError(t('onboarding.saveError'));
    }
  };

  return (
    <OnboardingShell
      step={4}
      eyebrow={t('gender.eyebrow')}
      title={t('gender.title')}
      subtitle={t('gender.subtitle')}
      onBack={handleBack}
      footer={
        <PrimaryButton
          label={saving ? t('common.saving') : t('common.finish')}
          onPress={handleFinish}
          loading={saving}
          icon="check"
        />
      }>
      <View style={styles.grid} accessibilityRole="radiogroup">
        {GENDER_OPTIONS.map((option) => (
          <GenderCard
            key={option.value}
            gender={option.value}
            label={t(option.labelKey)}
            accessibilityLabel={t(option.accessibilityKey)}
            selected={form.gender === option.value}
            artSize={artSize}
            onPress={() => handleSelect(option.value)}
          />
        ))}
      </View>

      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <OnboardingNote>{t('gender.privateNote')}</OnboardingNote>
    </OnboardingShell>
  );
}

function GenderCard({
  gender,
  label,
  accessibilityLabel,
  selected,
  artSize,
  onPress,
}: {
  gender: Gender;
  label: string;
  accessibilityLabel: string;
  selected: boolean;
  artSize: number;
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
    transform: [{ scale: 1 + selection.value * 0.018 }],
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
        <View
          style={[
            styles.artWrap,
            { width: artSize, height: artSize, borderRadius: artSize / 2 },
          ]}>
          <GenderIllustration gender={gender} size={artSize} />
        </View>

        <Text style={styles.label}>{label}</Text>

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
  grid: {
    marginTop: 30,
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: Brand.surface,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: Brand.surface,
    shadowColor: '#2B1B4D',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 2,
  },
  cardSelected: {
    borderColor: Brand.ink,
    backgroundColor: '#FFFCFF',
  },
  pressable: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 18,
    paddingBottom: 20,
    position: 'relative',
  },
  cardPressed: {
    opacity: 0.9,
  },
  artWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  label: {
    color: Brand.ink,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginTop: 14,
  },
  check: {
    position: 'absolute',
    top: 10,
    right: 10,
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
