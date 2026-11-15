import { Platform } from 'react-native';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';

import { getVoiceSource, hashPromptText, type VoiceSource } from '@/lib/voice-service';
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
 * Play a resolved voice source across iOS, Android, and Web.
 * Bundled assets go through expo-audio on every platform; base64 audio is
 * written to a cache file on native and played as a data URI on web.
 */
export async function playVoiceSource(
  source: VoiceSource,
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

  // Bundled asset: expo-audio resolves Metro asset ids on every platform.
  if (source.kind === 'asset') {
    try {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          interruptionMode: 'duckOthers',
        });
      } catch {
        // Audio mode set is best-effort
      }

      if (currentPlayId !== playId || (reqId !== undefined && reqId !== activeRequestId)) {
        return;
      }

      const player = createAudioPlayer(source.asset);

      if (currentPlayId !== playId || (reqId !== undefined && reqId !== activeRequestId)) {
        player.remove();
        return;
      }

      currentPlayer = player;
      attachEndListener(player, playId);
      player.play();
    } catch (err) {
      console.warn('Asset audio playback error:', err);
      notifySpeaking(false);
    }
    return;
  }

  const base64 = source.audio;

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
        await playPromise.catch(() => {
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

    const contentHash = hashPromptText(base64);
    const safeId = `${identifier}_${contentHash}`.replace(/[^a-zA-Z0-9_-]/g, '_');
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
    attachEndListener(player, playId);
    player.play();
  } catch (err) {
    console.warn('Native audio playback error:', err);
    notifySpeaking(false);
  }
}

function attachEndListener(player: AudioPlayer, playId: number) {
  let cleanedUp = false;
  const finish = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    if (currentPlayId === playId) {
      notifySpeaking(false);
      try {
        player.remove();
      } catch {
        // Player may already be released
      }
      if (currentPlayer === player) {
        currentPlayer = null;
      }
    }
  };

  player.addListener('playbackStatusUpdate', (status) => {
    if (
      status.didJustFinish ||
      (Platform.OS === 'web' &&
        !status.playing &&
        status.currentTime > 0 &&
        status.duration > 0 &&
        status.currentTime >= status.duration)
    ) {
      finish();
    }
  });

  // expo-audio on Web uses HTMLAudioElement internally, which emits standard ended events
  // but does not emit didJustFinish in playbackStatusUpdate.
  if (Platform.OS === 'web') {
    const webMedia = (player as any).media as HTMLAudioElement | undefined;
    if (webMedia) {
      const onEnded = () => finish();
      webMedia.addEventListener('ended', onEnded, { once: true });
      webMedia.addEventListener('error', onEnded, { once: true });
    }
  }
}

/**
 * Convenience helper to speak a prompt for the given language.
 * Automatically checks bundled assets / SQLite cache and synthesizes with
 * Sarvam TTS if the prompt has never been generated before.
 */
export async function speakPrompt(
  voiceKey: VoicePromptKey | string,
  language: Language,
  fallbackText?: string
): Promise<void> {
  const reqId = ++activeRequestId;

  try {
    const source = await getVoiceSource(voiceKey, language, fallbackText);
    if (reqId !== activeRequestId) {
      // Newer input voice arrived while audio was being read! Abort obsolete page voice.
      return;
    }
    if (source) {
      await playVoiceSource(source, `${language}_${voiceKey}`, reqId);
    } else {
      if (reqId === activeRequestId) {
        notifySpeaking(false);
      }
    }
  } catch (err) {
    if (reqId === activeRequestId) {
      console.warn(`Failed to speak prompt ${voiceKey}:`, err);
      notifySpeaking(false);
    }
  }
}
