import { Platform } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { File, UploadType } from 'expo-file-system';
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

export function hasSttApiKey(): boolean {
  return Boolean(GROQ_API_KEY || SARVAM_API_KEY);
}

// Vocabulary hint per language so Whisper's transcription doesn't drift into the other script.
const STT_PROMPT: Record<Language, string> = {
  en: 'farmer produce vegetables fruits grains onion tomato mango price crate quintal kilo market',
  hi: 'किसान उपज सब्जी फल अनाज प्याज टमाटर आम भाव क्रेट क्विंटल किलो',
  mr: 'शेतकरी उत्पादन भाजीपाला फळे धान्य कांदा टोमॅटो आंबा भाव क्रेट क्विंटल किलो',
};

/**
 * Transcribe recorded audio using Groq Whisper-large-v3-turbo with
 * automatic fallback to Sarvam AI STT (saarika:v2.5).
 */
export async function transcribeAudioBlob(
  audioBlob: Blob,
  language: Language
): Promise<string> {
  if (!hasSttApiKey()) {
    console.warn('Neither Groq nor Sarvam API key is configured. STT transcription cannot run.');
    return '';
  }

  const langCode = language === 'mr' ? 'mr' : language === 'hi' ? 'hi' : 'en';

  // 1. Try Groq Whisper API (Lightning-fast ~0.3s)
  if (GROQ_API_KEY) {
    try {
      const groqFormData = new FormData();
      groqFormData.append('file', audioBlob, 'recording.webm');
      groqFormData.append('model', 'whisper-large-v3-turbo');
      groqFormData.append('language', langCode);
      groqFormData.append('prompt', STT_PROMPT[language] ?? STT_PROMPT.hi);

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
  if (!hasSttApiKey()) {
    console.warn('Neither Groq nor Sarvam API key is configured. STT transcription cannot run.');
    return '';
  }

  // Normalize URI to file:// scheme for React Native FormData and File instance
  const normalizedUri = fileUri.startsWith('file://') ? fileUri : `file://${fileUri}`;

  let audioFile: File | null = null;
  try {
    audioFile = new File(normalizedUri);
    if (!audioFile.exists || (audioFile.size !== undefined && audioFile.size < 500)) {
      console.warn(
        `Audio recording file missing or too small (${audioFile.exists ? audioFile.size : 0} bytes): ${normalizedUri}`
      );
      return '';
    }
  } catch (fileErr) {
    console.warn('Failed to inspect audio file with expo-file-system File:', fileErr);
  }

  const langCode = language === 'mr' ? 'mr' : language === 'hi' ? 'hi' : 'en';

  if (GROQ_API_KEY) {
    // 1. Primary: Native OkHttp multipart upload using expo-file-system File
    if (audioFile) {
      try {
        const uploadRes = await audioFile.upload(
          'https://api.groq.com/openai/v1/audio/transcriptions',
          {
            uploadType: UploadType.MULTIPART,
            fieldName: 'file',
            mimeType: 'audio/m4a',
            headers: {
              Authorization: `Bearer ${GROQ_API_KEY}`,
            },
            parameters: {
              model: 'whisper-large-v3-turbo',
              language: langCode,
              prompt: STT_PROMPT[language] ?? STT_PROMPT.hi,
            },
          }
        );

        if (uploadRes.status >= 200 && uploadRes.status < 300) {
          const data = JSON.parse(uploadRes.body);
          const text = (data.text || '').trim();
          if (text) {
            return text;
          }
        } else {
          console.warn('Groq Native STT upload returned status', uploadRes.status, uploadRes.body);
        }
      } catch (err) {
        console.warn('Groq Native file.upload failed, trying fetch fallback:', err);
      }
    }

    // 2. Secondary fallback: React Native fetch with FormData
    try {
      const groqFormData = new FormData();
      groqFormData.append('file', {
        uri: normalizedUri,
        name: 'recording.m4a',
        type: 'audio/m4a',
      } as unknown as Blob);
      groqFormData.append('model', 'whisper-large-v3-turbo');
      groqFormData.append('language', langCode);
      groqFormData.append('prompt', STT_PROMPT[language] ?? STT_PROMPT.hi);

      const res = await fetchWithTimeout(
        'https://api.groq.com/openai/v1/audio/transcriptions',
        {
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
        console.warn('Groq Native STT fetch returned status', res.status, errText);
      }
    } catch (err) {
      console.warn('Groq Native STT fetch failed:', err);
    }
  }

  if (SARVAM_API_KEY) {
    const sarvamLangCode = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

    // 1. Primary: Native OkHttp multipart upload using expo-file-system File
    if (audioFile) {
      try {
        const sarvamRes = await audioFile.upload(
          'https://api.sarvam.ai/speech-to-text',
          {
            uploadType: UploadType.MULTIPART,
            fieldName: 'file',
            mimeType: 'audio/m4a',
            headers: {
              'api-subscription-key': SARVAM_API_KEY,
            },
            parameters: {
              model: 'saarika:v2.5',
              language_code: sarvamLangCode,
            },
          }
        );

        if (sarvamRes.status >= 200 && sarvamRes.status < 300) {
          const data = JSON.parse(sarvamRes.body);
          const transcript = (data.transcript || '').trim();
          if (transcript) {
            return transcript;
          }
        } else {
          console.warn('Sarvam Native STT upload returned status', sarvamRes.status, sarvamRes.body);
        }
      } catch (err) {
        console.warn('Sarvam Native file.upload failed, trying fetch fallback:', err);
      }
    }

    // 2. Secondary fallback: React Native fetch with FormData
    try {
      const sarvamFormData = new FormData();
      sarvamFormData.append('file', {
        uri: normalizedUri,
        name: 'recording.m4a',
        type: 'audio/m4a',
      } as unknown as Blob);
      sarvamFormData.append('model', 'saarika:v2.5');
      sarvamFormData.append('language_code', sarvamLangCode);

      const res = await fetchWithTimeout(
        'https://api.sarvam.ai/speech-to-text',
        {
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
      } else {
        const errText = await res.text();
        console.warn('Sarvam Native STT fetch returned status', res.status, errText);
      }
    } catch (err) {
      console.warn('Sarvam Native STT fetch failed:', err);
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
    stop(): Promise<any>;
    prepareToRecordAsync(options?: any): Promise<void>;
    getStatus(): { url: string | null };
  } | null = null;
  private isListening = false;
  private isStarting = false;
  private startGeneration = 0;

  hasApiKey(): boolean {
    return hasSttApiKey();
  }

  async startListening(
    language: Language,
    onInterimText?: (text: string) => void
  ): Promise<boolean> {
    // A tap while a start (permission / getUserMedia / prepare) is still in
    // flight must not create a second recorder — it would leave the first one
    // recording with no way to stop it.
    if (this.isListening || this.isStarting) return true;

    this.isStarting = true;
    const generation = ++this.startGeneration;
    this.audioChunks = [];

    try {
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
            if (generation !== this.startGeneration) {
              // Cancelled while the permission prompt was up.
              stream.getTracks().forEach((track) => track.stop());
              return false;
            }
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
          if (generation !== this.startGeneration) {
            return false;
          }
          if (!permission.granted) {
            console.warn('Microphone permission was not granted.');
            return false;
          }

          await setAudioModeAsync({
            allowsRecording: true,
            playsInSilentMode: true,
          });
          if (generation !== this.startGeneration) {
            return false;
          }

          // High-quality AAC (m4a) so Whisper transcribes rural speech accurately.
          // In expo-audio on Android, MediaRecorder requires outputFormat and audioEncoder
          // to be flattened at top-level options, or passed to prepareToRecordAsync(options)
          // where createRecordingOptions flattens platform-specific options.
          const recordingOptions: any = {
            ...RecordingPresets.HIGH_QUALITY,
            ...(Platform.OS === 'android' ? RecordingPresets.HIGH_QUALITY.android : {}),
            ...(Platform.OS === 'ios' ? RecordingPresets.HIGH_QUALITY.ios : {}),
          };
          // eslint-disable-next-line import/namespace -- re-exported through the package's default-class chain; TS resolves it correctly
          const recorder = new AudioModule.AudioRecorder(recordingOptions);
          await recorder.prepareToRecordAsync(RecordingPresets.HIGH_QUALITY);
          if (generation !== this.startGeneration) {
            try {
              recorder.stop();
            } catch {
              // Ignore
            }
            return false;
          }
          recorder.record();
          if (generation !== this.startGeneration) {
            try {
              recorder.stop();
            } catch {
              // Ignore
            }
            return false;
          }

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
    } finally {
      this.isStarting = false;
    }
  }

  async stopListening(language: Language): Promise<string> {
    if (this.isStarting) {
      this.cancel();
      return '';
    }

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

      const preUri = recorder.uri;
      let stopStatus: any = null;
      try {
        stopStatus = await recorder.stop();
      } catch (err) {
        console.warn('Failed to stop the native recording:', err);
      } finally {
        // Restore the audio session so voice playback works again
        setAudioModeAsync({ allowsRecording: false }).catch(() => {});
      }

      const uri = (stopStatus?.url || preUri || recorder.uri || recorder.getStatus()?.url || '').trim();
      if (!uri) {
        return '';
      }
      return transcribeNativeAudioFile(uri, language);
    }

    return '';
  }

  cancel() {
    // Invalidate any start that is still in flight so its recorder is stopped.
    this.startGeneration++;
    this.isStarting = false;
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
