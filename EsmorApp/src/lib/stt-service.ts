import { Platform } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import type { Language } from '@/i18n/languages';
import { fetchWithTimeout } from '@/lib/net';

const GROQ_API_KEY =
  process.env.EXPO_PUBLIC_GROQ_API_KEY ||
  process.env.groq_api ||
  '';

const SARVAM_API_KEY =
  process.env.EXPO_PUBLIC_SARVAM_API_KEY ||
  process.env.sarvam_api ||
  '';

/**
 * Transcribe recorded audio using Groq Whisper-large-v3-turbo with
 * automatic fallback to Sarvam AI STT (saarika:v2.5).
 */
export async function transcribeAudioBlob(
  audioBlob: Blob,
  language: Language
): Promise<string> {
  const langCode = language === 'mr' ? 'mr' : language === 'hi' ? 'hi' : 'en';

  // 1. Try Groq Whisper API (Lightning-fast ~0.3s)
  if (GROQ_API_KEY) {
    try {
      const groqFormData = new FormData();
      groqFormData.append('file', audioBlob, 'recording.webm');
      groqFormData.append('model', 'whisper-large-v3-turbo');
      groqFormData.append('language', langCode);
      groqFormData.append(
        'prompt',
        'शेतकरी उत्पादन भाजीपाला फळे धान्य कांदा टोमॅटो आंबा भाव क्रेट क्विंटल किलो'
      );

      const res = await fetchWithTimeout('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: groqFormData,
      },
      20000
    );

      if (res.ok) {
        const data = await res.json();
        const text = (data.text || '').trim();
        if (text) {
          return text;
        }
      } else {
        const errText = await res.text();
        console.warn('Groq STT returned status', res.status, errText);
      }
    } catch (err) {
      console.warn('Groq Whisper STT failed, trying Sarvam STT fallback:', err);
    }
  }

  // 2. Fallback to Sarvam AI Saarika STT
  if (SARVAM_API_KEY) {
    try {
      const sarvamFormData = new FormData();
      sarvamFormData.append('file', audioBlob, 'recording.wav');
      sarvamFormData.append('model', 'saarika:v2.5');
      sarvamFormData.append(
        'language_code',
        language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN'
      );

      const res = await fetchWithTimeout('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: {
          'api-subscription-key': SARVAM_API_KEY,
        },
        body: sarvamFormData,
      },
      20000
    );

      if (res.ok) {
        const data = await res.json();
        const transcript = (data.transcript || '').trim();
        if (transcript) {
          return transcript;
        }
      }
    } catch (err) {
      console.warn('Sarvam STT failed:', err);
    }
  }

  return '';
}

/**
 * Transcribe audio from a native file URI (Android/iOS)
 */
export async function transcribeNativeAudioFile(
  fileUri: string,
  language: Language
): Promise<string> {
  const langCode = language === 'mr' ? 'mr' : language === 'hi' ? 'hi' : 'en';

  if (GROQ_API_KEY) {
    try {
      const groqFormData = new FormData();
      groqFormData.append('file', {
        uri: fileUri,
        name: 'recording.m4a',
        type: 'audio/m4a',
      } as unknown as Blob);
      groqFormData.append('model', 'whisper-large-v3-turbo');
      groqFormData.append('language', langCode);
      groqFormData.append(
        'prompt',
        'शेतकरी उत्पादन भाजीपाला फळे धान्य कांदा टोमॅटो आंबा भाव क्रेट क्विंटल किलो'
      );

      const res = await fetchWithTimeout('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: groqFormData,
      },
      20000
    );

      if (res.ok) {
        const data = await res.json();
        const text = (data.text || '').trim();
        if (text) {
          return text;
        }
      }
    } catch (err) {
      console.warn('Groq Native STT failed:', err);
    }
  }

  if (SARVAM_API_KEY) {
    try {
      const sarvamFormData = new FormData();
      sarvamFormData.append('file', {
        uri: fileUri,
        name: 'recording.m4a',
        type: 'audio/m4a',
      } as unknown as Blob);
      sarvamFormData.append('model', 'saarika:v2.5');
      sarvamFormData.append(
        'language_code',
        language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN'
      );

      const res = await fetchWithTimeout('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: {
          'api-subscription-key': SARVAM_API_KEY,
        },
        body: sarvamFormData,
      },
      20000
    );

      if (res.ok) {
        const data = await res.json();
        const transcript = (data.transcript || '').trim();
        if (transcript) {
          return transcript;
        }
      }
    } catch (err) {
      console.warn('Sarvam Native STT failed:', err);
    }
  }

  return '';
}

/**
 * Speech Recognition controller supporting Web SpeechRecognition + MediaRecorder + expo-audio
 */
export class SpeechToTextController {
  // Structural type instead of the deep expo-audio class import, which the
  // import/namespace rule cannot resolve through the package's re-export chain.
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private webSpeechRecognition: any = null;
  private recorder: {
    uri: string | null;
    record(): void;
    stop(): Promise<void>;
    prepareToRecordAsync(): Promise<void>;
    getStatus(): { url: string | null };
  } | null = null;
  private isListening = false;

  async startListening(
    language: Language,
    onInterimText?: (text: string) => void
  ): Promise<boolean> {
    if (this.isListening) return true;
    this.audioChunks = [];

    // Web platform
    if (Platform.OS === 'web') {
      try {
        // 1. Try Browser SpeechRecognition for instant live dictation
        const SpeechRec =
          typeof window !== 'undefined'
            ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
            : null;

        if (SpeechRec) {
          try {
            const recognition = new SpeechRec();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang =
              language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

            recognition.onresult = (event: any) => {
              let liveText = '';
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                liveText += event.results[i][0].transcript;
              }
              if (liveText && onInterimText) {
                onInterimText(liveText);
              }
            };

            recognition.onerror = () => {
              // Ignore web speech errors, MediaRecorder fallback will handle transcription
            };

            recognition.start();
            this.webSpeechRecognition = recognition;
          } catch (e) {
            console.warn('Browser SpeechRecognition init error:', e);
          }
        }

        // 2. Also start MediaRecorder for reliable audio capture & Groq Whisper transcription
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          this.stream = stream;

          const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : MediaRecorder.isTypeSupported('audio/webm')
              ? 'audio/webm'
              : '';

          const recorder = mimeType
            ? new MediaRecorder(stream, { mimeType })
            : new MediaRecorder(stream);

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              this.audioChunks.push(e.data);
            }
          };

          recorder.start(250);
          this.mediaRecorder = recorder;
          this.isListening = true;
          return true;
        }
      } catch (err) {
        console.warn('Microphone permission / mediaRecorder failed on web:', err);
        return false;
      }
    }

    // Native iOS & Android: record with expo-audio, transcribe the file afterwards
    if (Platform.OS !== 'web') {
      try {
        const permission = await requestRecordingPermissionsAsync();
        if (!permission.granted) {
          console.warn('Microphone permission was not granted.');
          return false;
        }

        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });

        // eslint-disable-next-line import/namespace -- re-exported through the package's default-class chain; TS resolves it correctly
        const recorder = new AudioModule.AudioRecorder({ ...RecordingPresets.LOW_QUALITY });
        await recorder.prepareToRecordAsync();
        recorder.record();

        this.recorder = recorder;
        this.isListening = true;
        return true;
      } catch (err) {
        console.warn('Native audio recording failed to start:', err);
        return false;
      }
    }

    // Web: browser SpeechRecognition is running but MediaRecorder is unavailable.
    // Live dictation still works through onInterimText.
    this.isListening = true;
    return true;
  }

  async stopListening(language: Language): Promise<string> {
    this.isListening = false;

    // Stop web speech recognition if active
    if (this.webSpeechRecognition) {
      try {
        this.webSpeechRecognition.stop();
      } catch {
        // Ignore
      }
      this.webSpeechRecognition = null;
    }

    // Stop mediaRecorder on web
    if (Platform.OS === 'web' && this.mediaRecorder) {
      return new Promise<string>((resolve) => {
        const recorder = this.mediaRecorder;
        if (!recorder) {
          resolve('');
          return;
        }

        recorder.onstop = async () => {
          try {
            // Clean up microphone tracks
            if (this.stream) {
              this.stream.getTracks().forEach((track) => track.stop());
              this.stream = null;
            }

            const audioBlob = new Blob(this.audioChunks, {
              type: recorder.mimeType || 'audio/webm',
            });

            this.mediaRecorder = null;
            this.audioChunks = [];

            if (audioBlob.size > 1000) {
              const text = await transcribeAudioBlob(audioBlob, language);
              resolve(text);
            } else {
              resolve('');
            }
          } catch (err) {
            console.warn('Error processing stopped audio recording:', err);
            resolve('');
          }
        };

        try {
          recorder.stop();
        } catch {
          resolve('');
        }
      });
    }

    // Stop the native expo-audio recorder and transcribe the file
    if (Platform.OS !== 'web') {
      const recorder = this.recorder;
      this.recorder = null;
      this.isListening = false;
      if (!recorder) {
        return '';
      }

      try {
        await recorder.stop();
      } catch (err) {
        console.warn('Failed to stop the native recording:', err);
      } finally {
        // Restore the audio session so voice playback works again
        setAudioModeAsync({ allowsRecording: false }).catch(() => {});
      }

      const uri = recorder.uri ?? recorder.getStatus()?.url ?? null;
      if (!uri) {
        return '';
      }
      return transcribeNativeAudioFile(uri, language);
    }

    return '';
  }

  cancel() {
    this.isListening = false;
    if (this.recorder) {
      this.recorder.stop().catch(() => {});
      this.recorder = null;
      setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    }
    if (this.webSpeechRecognition) {
      try {
        this.webSpeechRecognition.abort();
      } catch {
        // Ignore
      }
      this.webSpeechRecognition = null;
    }
    if (this.mediaRecorder) {
      try {
        this.mediaRecorder.stop();
      } catch {
        // Ignore
      }
      this.mediaRecorder = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    this.audioChunks = [];
  }
}
