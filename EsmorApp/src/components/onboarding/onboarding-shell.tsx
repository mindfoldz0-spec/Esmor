import { useEffect, useRef, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon, Icons } from '@/components/app-icon';
import { VoiceAssistantButton } from '@/components/onboarding/voice-assistant-button';
import { Brand } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { useVoice } from '@/providers/voice-provider';
import type { VoicePromptKey } from '@/types/voice';

const DEFAULT_TOTAL_STEPS = 5;

type OnboardingShellProps = {
  step: number;
  totalSteps?: number;
  voiceKey?: VoicePromptKey | string;
  autoPlayVoice?: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  children?: ReactNode;
  footer: ReactNode;
  onBack?: () => void;
};

export function OnboardingShell({
  step,
  totalSteps = DEFAULT_TOTAL_STEPS,
  voiceKey,
  autoPlayVoice = true,
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  onBack,
}: OnboardingShellProps) {
  const { t } = useI18n();
  const { speak } = useVoice();
  const hasPlayedIntroRef = useRef(false);

  useEffect(() => {
    if (!voiceKey || autoPlayVoice === false || hasPlayedIntroRef.current) return;
    hasPlayedIntroRef.current = true;

    const timer = setTimeout(() => {
      speak(voiceKey);
    }, 450);

    return () => {
      clearTimeout(timer);
    };
  }, [voiceKey, autoPlayVoice, speak]);

  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.glowBottom} />

      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}>
          <View style={styles.frame}>
            <View style={styles.topBar}>
              {onBack ? (
                <Pressable
                  onPress={onBack}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.back')}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.backButton,
                    pressed && styles.backButtonPressed,
                  ]}>
                  <AppIcon name={Icons.chevronLeft} size={20} color={Brand.ink} />
                </Pressable>
              ) : (
                <View style={styles.brandMark}>
                  <Text style={styles.brandLetter} allowFontScaling={false}>
                    E
                  </Text>
                </View>
              )}

              <View style={styles.topBarRight}>
                {voiceKey ? (
                  <VoiceAssistantButton voiceKey={voiceKey} />
                ) : null}

                <Text style={styles.stepText} allowFontScaling={false}>
                  {t('common.step', { current: step, total: totalSteps })}
                </Text>
              </View>
            </View>

            <View
              style={styles.progressTrack}
              accessibilityRole="progressbar"
              accessibilityLabel={t('onboarding.progressA11y', {
                current: step,
                total: totalSteps,
              })}
              accessibilityValue={{ min: 1, max: totalSteps, now: step }}>
              {Array.from({ length: totalSteps }, (_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressSegment,
                    index < step && styles.progressSegmentActive,
                  ]}
                />
              ))}
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}>
              <Animated.View
                entering={FadeInDown.duration(360)}
                style={styles.hero}>
                <Text style={styles.eyebrow}>{eyebrow}</Text>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.duration(420).delay(60)}>
                {children}
              </Animated.View>
            </ScrollView>

            <View style={styles.footer}>{footer}</View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

export function OnboardingNote({
  children,
  icon,
}: {
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <View style={styles.note}>
      {icon ?? <AppIcon name={Icons.lock} size={14} color={Brand.inkMuted} />}
      <Text style={styles.noteText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.background,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  glowTop: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: Brand.accentSoft,
    opacity: 0.66,
    top: -150,
    right: -90,
  },
  glowBottom: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: Brand.surfaceTint,
    opacity: 0.7,
    bottom: -190,
    left: -150,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    minHeight: 48,
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
  backButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: Brand.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7A4417',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  brandLetter: {
    color: Brand.ink,
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -1,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepText: {
    color: Brand.inkMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(22, 19, 31, 0.1)',
  },
  progressSegmentActive: {
    backgroundColor: Brand.accent,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 22,
  },
  hero: {
    gap: 9,
  },
  eyebrow: {
    color: Brand.accentInk,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
  title: {
    color: Brand.ink,
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '800',
    letterSpacing: -0.9,
  },
  subtitle: {
    color: Brand.inkMuted,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    maxWidth: 520,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 10,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 18,
  },
  noteText: {
    color: Brand.inkMuted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    flexShrink: 1,
  },
});
