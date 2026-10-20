import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppIcon, Icons } from '@/components/app-icon';
import { Brand } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { useVoice } from '@/providers/voice-provider';
import type { VoicePromptKey } from '@/types/voice';

type VoiceAssistantButtonProps = {
  voiceKey?: VoicePromptKey | string;
};

export function VoiceAssistantButton({ voiceKey }: VoiceAssistantButtonProps) {
  const { isSpeaking, speak, stop, activeKey } = useVoice();
  const { language } = useI18n();

  const isCurrentActive = isSpeaking && (!voiceKey || activeKey === voiceKey);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (isCurrentActive) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 600 }),
          withTiming(1.0, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      pulse.value = withTiming(1.0, { duration: 250 });
    }
  }, [isCurrentActive, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const handlePress = () => {
    if (isSpeaking) {
      stop();
    } else if (voiceKey) {
      speak(voiceKey);
    }
  };

  const getLabel = () => {
    if (isCurrentActive) {
      if (language === 'mr') return 'बोलत आहे…';
      if (language === 'hi') return 'बोल रहा है…';
      return 'Speaking…';
    }
    if (language === 'mr') return 'ऐका';
    if (language === 'hi') return 'सुनें';
    return 'Listen';
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={isCurrentActive ? 'Stop voice' : 'Listen to instructions'}
        hitSlop={6}
        style={({ pressed }) => [
          styles.button,
          isCurrentActive && styles.buttonActive,
          pressed && styles.buttonPressed,
        ]}>
        <View style={[styles.iconWrap, isCurrentActive && styles.iconWrapActive]}>
          <AppIcon
            name={isCurrentActive ? Icons.speaker : Icons.speaker}
            size={14}
            color={isCurrentActive ? Brand.accentInk : Brand.ink}
          />
        </View>
        <Text style={[styles.label, isCurrentActive && styles.labelActive]}>
          {getLabel()}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 14,
    backgroundColor: Brand.surfaceMuted,
    borderWidth: 1,
    borderColor: 'rgba(22, 19, 31, 0.08)',
  },
  buttonActive: {
    backgroundColor: Brand.accentSoft,
    borderColor: Brand.accentInk,
    shadowColor: Brand.accentInk,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  iconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: Brand.ink,
  },
  labelActive: {
    color: Brand.accentInk,
  },
});
