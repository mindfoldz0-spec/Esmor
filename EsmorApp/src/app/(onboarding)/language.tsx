import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, Icons } from '@/components/app-icon';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { PrimaryButton } from '@/components/onboarding/primary-button';
import { Brand } from '@/constants/theme';
import { LANGUAGES, useI18n, type Language } from '@/i18n';

import { useVoice } from '@/providers/voice-provider';

export default function LanguageScreen() {
  const router = useRouter();
  const { language, setLanguage, t } = useI18n();
  const { speak } = useVoice();

  const handleContinue = () => {
    router.push('/details');
  };

  const handleSelectLanguage = (code: Language) => {
    setLanguage(code);
    const feedbackKey =
      code === 'mr'
        ? 'language.select_mr'
        : code === 'hi'
          ? 'language.select_hi'
          : 'language.select_en';
    speak(feedbackKey, { language: code });
  };

  return (
    <OnboardingShell
      step={1}
      voiceKey="language.intro"
      eyebrow={t('language.eyebrow')}
      title={t('language.title')}
      subtitle={t('language.subtitle')}
      footer={
        <PrimaryButton label={t('common.continue')} onPress={handleContinue} />
      }>
      <View style={styles.list} accessibilityRole="radiogroup">
        {LANGUAGES.map((option) => {
          const selected = language === option.code;

          return (
            <LanguageCard
              key={option.code}
              code={option.code}
              nativeName={option.nativeName}
              tile={option.tile}
              selected={selected}
              onPress={() => handleSelectLanguage(option.code)}
            />
          );
        })}
      </View>
    </OnboardingShell>
  );
}

function LanguageCard({
  code,
  nativeName,
  tile,
  selected,
  onPress,
}: {
  code: Language;
  nativeName: string;
  tile: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { t } = useI18n();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={t('language.select', { language: nativeName })}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}>
      <View style={[styles.tile, selected && styles.tileSelected]}>
        <Text
          style={[styles.tileText, selected && styles.tileTextSelected]}
          allowFontScaling={false}>
          {tile}
        </Text>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.nativeName}>{nativeName}</Text>
        <Text style={styles.code} allowFontScaling={false}>
          {code.toUpperCase()}
        </Text>
      </View>

      <View style={[styles.check, selected && styles.checkSelected]}>
        {selected ? (
          <AppIcon name={Icons.check} size={14} color={Brand.surface} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: 28,
    gap: 12,
  },
  card: {
    minHeight: 78,
    borderRadius: 22,
    backgroundColor: Brand.surface,
    borderWidth: 1.5,
    borderColor: Brand.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#2B1B4D',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2,
  },
  cardSelected: {
    borderColor: Brand.ink,
    backgroundColor: '#FFFCFF',
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.992 }],
  },
  tile: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: Brand.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileSelected: {
    backgroundColor: Brand.accentSoft,
  },
  tileText: {
    color: Brand.ink,
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  tileTextSelected: {
    color: Brand.accentInk,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  nativeName: {
    color: Brand.ink,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  code: {
    color: Brand.inkMuted,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.3,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(22, 19, 31, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: {
    backgroundColor: Brand.ink,
    borderColor: Brand.ink,
  },
});
