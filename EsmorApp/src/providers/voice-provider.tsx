import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useI18n } from '@/i18n';
import type { Language } from '@/i18n/languages';
import {
  isSpeaking as getIsSpeaking,
  speakPrompt,
  stopVoice,
  subscribeSpeaking,
} from '@/lib/voice-player';
import type { VoicePromptKey } from '@/types/voice';

type VoiceContextValue = {
  isSpeaking: boolean;
  activeKey: string | null;
  speak: (
    voiceKey: VoicePromptKey | string,
    options?: {
      language?: Language;
      fallbackText?: string;
    }
  ) => Promise<void>;
  stop: () => Promise<void>;
};

const VoiceContext = createContext<VoiceContextValue | null>(null);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const { language } = useI18n();
  const [isSpeaking, setIsSpeaking] = useState(getIsSpeaking());
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    return subscribeSpeaking((speaking) => {
      setIsSpeaking(speaking);
      if (!speaking) {
        setActiveKey(null);
      }
    });
  }, []);

  const speak = useCallback(
    async (
      voiceKey: VoicePromptKey | string,
      options?: {
        language?: Language;
        fallbackText?: string;
      }
    ) => {
      const targetLang = options?.language ?? language;
      setActiveKey(voiceKey);
      try {
        await speakPrompt(voiceKey, targetLang, options?.fallbackText);
      } catch {
        setActiveKey(null);
      } finally {
        if (!getIsSpeaking()) {
          setActiveKey(null);
        }
      }
    },
    [language]
  );

  const stop = useCallback(async () => {
    setActiveKey(null);
    await stopVoice();
  }, []);

  const value = useMemo(
    () => ({
      isSpeaking,
      activeKey,
      speak,
      stop,
    }),
    [isSpeaking, activeKey, speak, stop]
  );

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

export function useVoice(): VoiceContextValue {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}
