import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

import { getVoiceAudio } from '@/lib/voice-service';
import type { Language } from '@/i18n/languages';
import type { VoicePromptKey } from '@/types/voice';

type Listener = (speaking: boolean) => void;
const listeners = new Set<Listener>();

let currentSound: Audio.Sound | null = null;
let currentWebAudio: HTMLAudioElement | null = null;
let currentSpeaking = false;
let currentPlayId = 0;

function notifySpeaking(speaking: boolean) {
  currentSpeaking = speaking;
  listeners.forEach((fn) => fn(speaking));
}

export function subscribeSpeaking(listener: Listener): () => void {
  listeners.add(listener);
  listener(currentSpeaking);
  return () => {
    listeners.delete(listener);
  };
}

export function isSpeaking(): boolean {
  return currentSpeaking;
}

export async function stopVoice(): Promise<void> {
  currentPlayId++;

  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    } catch {
      // Sound may already be unloaded
    }
    currentSound = null;
  }

  if (currentWebAudio) {
    try {
      currentWebAudio.pause();
      currentWebAudio.currentTime = 0;
    } catch {
      // Ignore
    }
    currentWebAudio = null;
  }

  notifySpeaking(false);
}

/**
 * Play raw base64 audio across iOS, Android, and Web.
 */
export async function playBase64Audio(base64: string, identifier: string): Promise<void> {
  await stopVoice();
  const playId = ++currentPlayId;

  notifySpeaking(true);

  if (Platform.OS === 'web') {
    try {
      const audioUri = `data:audio/wav;base64,${base64}`;
      const audio = new window.Audio(audioUri);
      currentWebAudio = audio;

      audio.onended = () => {
        if (currentPlayId === playId) {
          notifySpeaking(false);
          currentWebAudio = null;
        }
      };

      audio.onerror = () => {
        if (currentPlayId === playId) {
          notifySpeaking(false);
          currentWebAudio = null;
        }
      };

      await audio.play();
    } catch (err) {
      console.warn('Web audio playback error:', err);
      notifySpeaking(false);
    }
    return;
  }

  // Native iOS & Android
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    const safeId = identifier.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileUri = `${FileSystem.cacheDirectory}voice_${safeId}.wav`;

    const info = await FileSystem.getInfoAsync(fileUri);
    if (!info.exists) {
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri: fileUri },
      { shouldPlay: true }
    );

    if (currentPlayId !== playId) {
      // Another audio was started in the meantime
      await sound.unloadAsync();
      return;
    }

    currentSound = sound;

    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) {
        if (currentPlayId === playId) {
          notifySpeaking(false);
          sound.unloadAsync().catch(() => {});
          currentSound = null;
        }
      }
    });
  } catch (err) {
    console.warn('Native audio playback error:', err);
    notifySpeaking(false);
  }
}

/**
 * Convenience helper to speak a prompt for the given language.
 * Automatically checks SQLite / pregenerated cache and plays audio.
 */
export async function speakPrompt(
  voiceKey: VoicePromptKey | string,
  language: Language,
  fallbackText?: string
): Promise<void> {
  try {
    const audio = await getVoiceAudio(voiceKey, language, fallbackText);
    if (audio) {
      await playBase64Audio(audio, `${language}_${voiceKey}`);
    }
  } catch (err) {
    console.warn(`Failed to speak prompt ${voiceKey}:`, err);
    notifySpeaking(false);
  }
}
