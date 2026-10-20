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
import type { UserCategory } from '@/types/profile';

const CATEGORY_IMAGES: Record<UserCategory, ImageSource> = {
  consumer: require('@/assets/images/consumer.png'),
  producer: require('@/assets/images/producer.png'),
};

type CategoryOptionConfig = {
  value: UserCategory;
  titleKey: TranslationKey;
  badgeKey: TranslationKey;
  descKey: TranslationKey;
  accessibilityKey: TranslationKey;
};

const CATEGORY_OPTIONS: CategoryOptionConfig[] = [
  {
    value: 'consumer',
    titleKey: 'accountType.consumer',
    badgeKey: 'accountType.consumerBadge',
    descKey: 'accountType.consumerDesc',
    accessibilityKey: 'accountType.selectConsumer',
  },
  {
    value: 'producer',
    titleKey: 'accountType.producer',
    badgeKey: 'accountType.producerBadge',
    descKey: 'accountType.producerDesc',
    accessibilityKey: 'accountType.selectProducer',
  },
];

export default function AccountTypeScreen() {
  const router = useRouter();
  const { t, language } = useI18n();
  const { form, updateForm } = useOnboarding();
  const { completeOnboarding } = useAppData();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = form.category ?? null;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/gender' as any);
  };

  const handleSelect = (category: UserCategory) => {
    updateForm({ category });
    setError(null);
  };

  const handleAction = async () => {
    if (!selectedCategory) {
      setError(t('accountType.error'));
      return;
    }

    if (selectedCategory === 'producer') {
      router.push('/role' as any);
      return;
    }

    // Consumer flow: completes registration directly
    const age = Number(form.age);
    const phoneDigits = form.phone.replace(/\D/g, '');
    const detailsComplete =
      form.name.trim().length >= 2 &&
      form.age.trim().length > 0 &&
      Number.isInteger(age) &&
      age >= 13 &&
      age <= 100 &&
      phoneDigits.length >= 7 &&
      phoneDigits.length <= 15;

    if (!detailsComplete || !form.location || !form.gender) {
      setError(t('onboarding.incomplete'));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await completeOnboarding({
        name: form.name.trim(),
        age,
        phone: form.phone.trim(),
        gender: form.gender,
        category: 'consumer',
        role: 'consumer',
        language,
        location: form.location,
      });
    } catch (cause) {
      console.warn('Could not save the consumer profile.', cause);
      setSaving(false);
      setError(t('onboarding.saveError'));
    }
  };

  const isConsumer = selectedCategory === 'consumer';
  const buttonLabel = saving
    ? t('role.saving')
    : isConsumer
      ? t('common.finish')
      : t('common.continue');

  const buttonIcon: 'arrow' | 'check' = isConsumer ? 'check' : 'arrow';

  return (
    <OnboardingShell
      step={5}
      totalSteps={selectedCategory === 'producer' ? 6 : 5}
      eyebrow={t('accountType.eyebrow')}
      title={t('accountType.title')}
      subtitle={t('accountType.subtitle')}
      onBack={handleBack}
      footer={
        <PrimaryButton
          label={buttonLabel}
          onPress={handleAction}
          loading={saving}
          icon={buttonIcon}
        />
      }>
      <View style={styles.list} accessibilityRole="radiogroup">
        {CATEGORY_OPTIONS.map((option) => (
          <CategoryCard
            key={option.value}
            category={option.value}
            title={t(option.titleKey)}
            badge={t(option.badgeKey)}
            description={t(option.descKey)}
            accessibilityLabel={t(option.accessibilityKey)}
            selected={selectedCategory === option.value}
            imageSource={CATEGORY_IMAGES[option.value]}
            onPress={() => handleSelect(option.value)}
          />
        ))}
      </View>

      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <OnboardingNote>{t('accountType.note')}</OnboardingNote>
    </OnboardingShell>
  );
}

function CategoryCard({
  title,
  badge,
  description,
  accessibilityLabel,
  selected,
  imageSource,
  onPress,
}: {
  category: UserCategory;
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
    gap: 14,
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
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Brand.surfaceTint,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    backgroundColor: Brand.surfaceMuted,
  },
  badgeSelected: {
    backgroundColor: Brand.accentSoft,
  },
  badgeText: {
    color: Brand.inkMuted,
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '600',
  },
  badgeTextSelected: {
    color: Brand.accentInk,
  },
  descText: {
    color: Brand.inkMuted,
    fontSize: 12.5,
    lineHeight: 17,
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
