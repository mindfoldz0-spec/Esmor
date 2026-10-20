import { Platform } from 'react-native';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';

import { getVoiceAudio } from '@/lib/voice-service';
import type { Language } from '@/i18n/languages';
import type { VoicePromptKey } from '@/types/voice';

type Listener = (speaking: boolean) => void;
const listeners = new Set<Listener>();

let currentPlayer: AudioPlayer | null = null;
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

let activeRequestId = 0;

export function isSpeaking(): boolean {
  return currentSpeaking;
}

async function stopCurrentAudio(): Promise<void> {
  currentPlayId++;

  if (currentPlayer) {
    try {
      currentPlayer.pause();
      currentPlayer.remove();
    } catch {
      // Player may already be released
    }
    currentPlayer = null;
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

export async function stopVoice(): Promise<void> {
  activeRequestId++;
  await stopCurrentAudio();
}

/**
 * Play raw base64 audio across iOS, Android, and Web.
 */
export async function playBase64Audio(
  base64: string,
  identifier: string,
  reqId?: number
): Promise<void> {
  if (reqId !== undefined && reqId !== activeRequestId) {
    return;
  }

  await stopCurrentAudio();

  if (reqId !== undefined && reqId !== activeRequestId) {
    return;
  }

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

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise.catch((err) => {
          // Play was interrupted by user tapping another option
          if (currentPlayId === playId) {
            notifySpeaking(false);
            currentWebAudio = null;
          }
        });
      }
    } catch (err) {
      console.warn('Web audio playback error:', err);
      notifySpeaking(false);
    }
    return;
  }

  // Native iOS & Android
  try {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: 'duckOthers',
      });
    } catch {
      // Audio mode set is best-effort
    }

    const safeId = identifier.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileUri = `${FileSystem.cacheDirectory}voice_${safeId}.wav`;

    const info = await FileSystem.getInfoAsync(fileUri);
    if (!info.exists) {
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }

    if (currentPlayId !== playId || (reqId !== undefined && reqId !== activeRequestId)) {
      return;
    }

    const player = createAudioPlayer({ uri: fileUri });

    if (currentPlayId !== playId || (reqId !== undefined && reqId !== activeRequestId)) {
      player.remove();
      return;
    }

    currentPlayer = player;

    player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        if (currentPlayId === playId) {
          notifySpeaking(false);
          player.remove();
          if (currentPlayer === player) {
            currentPlayer = null;
          }
        }
      }
    });

    player.play();
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
  const reqId = ++activeRequestId;

  try {
    const audio = await getVoiceAudio(voiceKey, language, fallbackText);
    if (reqId !== activeRequestId) {
      // Newer input voice arrived while audio was being read! Abort obsolete page voice.
      return;
    }
    if (audio) {
      await playBase64Audio(audio, `${language}_${voiceKey}`, reqId);
    }
  } catch (err) {
    if (reqId === activeRequestId) {
      console.warn(`Failed to speak prompt ${voiceKey}:`, err);
      notifySpeaking(false);
    }
  }
}
