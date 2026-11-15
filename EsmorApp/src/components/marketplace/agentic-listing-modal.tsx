import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import { AppIcon, Icons } from '@/components/app-icon';
import { Brand } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { askListingAgent } from '@/lib/groq-agent-service';
import { addMarketplaceProduct } from '@/lib/marketplace-store';
import { SpeechToTextController } from '@/lib/stt-service';
import { speakPrompt, stopVoice } from '@/lib/voice-player';
import { contentVoiceKey } from '@/lib/voice-service';
import type { AgentChatMessage, ListingDraft, MarketplaceProduct, ProductCategory } from '@/types/marketplace';
import type { Profile } from '@/types/profile';

type AgenticListingModalProps = {
  visible: boolean;
  onClose: () => void;
  profile: Profile | null;
  onProductCreated: (product: MarketplaceProduct) => void;
};

const SAMPLE_PHOTO_PRESETS: Record<ProductCategory, string> = {
  vegetables: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
  fruits: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80',
  grains: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
  dairy: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=600&q=80',
  equipment: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=600&q=80',
  kirana: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
  handcrafts: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
};

let msgCounter = 1;
function getNextId(prefix: string): string {
  msgCounter += 1;
  return `${prefix}-${msgCounter}`;
}

export function AgenticListingModal(props: AgenticListingModalProps) {
  if (!props.visible) return null;
  return <AgenticListingContent {...props} />;
}

function AgenticListingContent({
  visible,
  onClose,
  profile,
  onProductCreated,
}: AgenticListingModalProps) {
  const { language, t } = useI18n();

  const [messages, setMessages] = useState<AgentChatMessage[]>(() => [
    {
      id: 'msg-init',
      sender: 'agent',
      text: t('agentModal.greeting'),
      suggestedQuickReplies: [
        t('agentModal.initialChipTomatoes'),
        t('agentModal.initialChipMangoes'),
        t('agentModal.initialChipRice'),
      ],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ListingDraft>({
    title: '',
    category: 'vegetables',
    price: 0,
    unit: 'crate',
    quantity: 0,
    description: '',
    isReady: false,
  });

  const scrollRef = useRef<ScrollView>(null);
  const sttControllerRef = useRef<SpeechToTextController | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [liveSpokenText, setLiveSpokenText] = useState('');

  // Setup STT controller and ensure cleanup on unmount
  useEffect(() => {
    const controller = new SpeechToTextController();
    sttControllerRef.current = controller;
    return () => {
      controller.cancel();
      stopVoice().catch(() => {});
    };
  }, []);

  // Play spoken greeting when agent mounts, and ensure voice is stopped on unmount
  useEffect(() => {
    speakPrompt('agent_welcome', language, t('agentModal.greeting')).catch(() => {});
    return () => {
      stopVoice().catch(() => {});
    };
  }, [language, t]);

  const handleToggleListening = async () => {
    if (isProcessing || isPublishing || isTranscribing) return;

    if (isListening) {
      setIsListening(false);
      setIsTranscribing(true);
      try {
        const transcript = await sttControllerRef.current?.stopListening(language);
        setIsTranscribing(false);
        const finalText = (transcript || liveSpokenText || '').trim();
        setLiveSpokenText('');
        if (finalText) {
          await handleSendMessage(finalText);
        } else {
          const hasSttApiKey = Boolean(
            process.env.EXPO_PUBLIC_GROQ_API_KEY ||
            process.env.EXPO_PUBLIC_SARVAM_API_KEY ||
            process.env.groq_api ||
            process.env.sarvam_api
          );
          if (!hasSttApiKey) {
            const missingKeyText =
              language === 'mr'
                ? 'व्हॉइस API की (Groq/Sarvam) उपलब्ध नाही.'
                : language === 'hi'
                  ? 'वॉइस API की (Groq/Sarvam) उपलब्ध नहीं है।'
                  : 'Voice API key (Groq/Sarvam) is missing.';
            setInputText(missingKeyText);
          } else {
            setInputText(t('agentModal.couldNotHear'));
          }
        }
      } catch (err) {
        setIsTranscribing(false);
        setIsListening(false);
        console.warn('STT stop listening error:', err);
        setInputText(t('agentModal.couldNotHear'));
      }
    } else {
      await stopVoice();
      setLiveSpokenText('');
      setInputText('');
      try {
        const started = await sttControllerRef.current?.startListening(
          language,
          (liveText) => {
            setLiveSpokenText(liveText);
            setInputText(liveText);
          }
        );
        if (started) {
          setIsListening(true);
        } else {
          setIsListening(false);
          setInputText(t('agentModal.micPermissionDenied'));
        }
      } catch (err) {
        setIsListening(false);
        console.warn('STT start listening error:', err);
        setInputText(t('agentModal.micPermissionDenied'));
      }
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('agentModal.cameraPermissionDenied'));
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        const photoUri = result.assets[0].uri;
        setDraft((prev) => ({ ...prev, imageUrl: photoUri }));
        const agentAck: AgentChatMessage = {
          id: getNextId('agent-photo'),
          sender: 'agent',
          text: t('agentModal.photoAddedScreen'),
          suggestedQuickReplies: [
            t('agentModal.quickYesPublish'),
            t('agentModal.quickChangePrice'),
          ],
        };
        setMessages((prev) => [...prev, agentAck]);
        speakPrompt('ack_photo', language, t('agentModal.photoVoiceAdded')).catch(
          () => {}
        );
      }
    } catch (err) {
      console.warn('Take photo failed:', err);
    }
  };

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('agentModal.galleryPermissionDenied'));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        const photoUri = result.assets[0].uri;
        setDraft((prev) => ({ ...prev, imageUrl: photoUri }));
        const agentAck: AgentChatMessage = {
          id: getNextId('agent-photo'),
          sender: 'agent',
          text: t('agentModal.photoAddedGallery'),
          suggestedQuickReplies: [
            t('agentModal.quickYesPublish'),
            t('agentModal.quickChangePrice'),
          ],
        };
        setMessages((prev) => [...prev, agentAck]);
        speakPrompt('ack_photo', language, t('agentModal.photoVoiceAdded')).catch(
          () => {}
        );
      }
    } catch (err) {
      console.warn('Pick image failed:', err);
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || isProcessing) return;

    const isCameraAction =
      /📷|camera|कॅमेरा|कैमरा|take photo|फोटो काढा|फ़ोटो लें|फोटो लें|फोटो खींचो|फ़ोटो खींचो/i.test(text) ||
      text === t('agentModal.takePhoto');
    if (isCameraAction) {
      await handleTakePhoto();
      return;
    }

    const isGalleryAction =
      /🖼️|gallery|गॅलरी|गैलरी|upload photo|फोटो अपलोड|फ़ोटो अपलोड|गॅलरीतून|गैलरी से|निवडा|चुनें/i.test(text) ||
      text === t('agentModal.uploadPhoto');
    if (isGalleryAction) {
      await handlePickImage();
      return;
    }

    setInputText('');

    const userMsg: AgentChatMessage = {
      id: getNextId('user'),
      sender: 'user',
      text,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setIsProcessing(true);

    try {
      const history = nextMessages.map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.text,
      }));

      const response = await askListingAgent(text, language, draft, history);

      const updatedDraft: ListingDraft = {
        title: response.productDraft.title || draft.title,
        category: response.productDraft.category || draft.category,
        price: response.productDraft.price ?? draft.price,
        unit: response.productDraft.unit || draft.unit,
        quantity: response.productDraft.quantity ?? draft.quantity,
        suggestedPrice: response.productDraft.suggestedPrice ?? draft.suggestedPrice,
        description: response.productDraft.description || draft.description,
        isReady: Boolean(response.productDraft.isReady),
        imageUrl: draft.imageUrl || SAMPLE_PHOTO_PRESETS[response.productDraft.category || draft.category],
      };

      setDraft(updatedDraft);

      const agentMsg: AgentChatMessage = {
        id: getNextId('agent'),
        sender: 'agent',
        text: response.replyText,
        suggestedQuickReplies: response.suggestedQuickReplies,
        productDraft: updatedDraft,
      };

      setMessages((prev) => [...prev, agentMsg]);

      // Speak agent reply in audio
      speakPrompt(contentVoiceKey('agent_reply', response.replyText), language, response.replyText).catch(() => {});

      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 150);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setIsListening(false);
    setIsTranscribing(false);
    sttControllerRef.current?.cancel();
    stopVoice().catch(() => {});
    onClose();
  };

  const handlePublish = async () => {
    if (!draft.title || !draft.price || !draft.quantity) {
      setPublishError(t('agentModal.publishError'));
      return;
    }

    setPublishError(null);
    setIsPublishing(true);
    try {
      const newProduct: MarketplaceProduct = {
        id: getNextId('prod-agent'),
        title: draft.title,
        marathiTitle: draft.title,
        category: draft.category,
        price: draft.price,
        unit: draft.unit,
        quantityAvailable: draft.quantity,
        imageUrl: draft.imageUrl || SAMPLE_PHOTO_PRESETS[draft.category],
        sellerId: profile?.phone || 'seller-me',
        sellerName: profile?.name || t('agentModal.defaultSellerName'),
        sellerPhone: profile?.phone || '+91 98220 12345',
        sellerVillage: profile?.location?.label || t('agentModal.defaultSellerVillage'),
        district: 'Maharashtra',
        description: draft.description || t('agentModal.defaultDescription', { title: draft.title }),
        isOrganic: true,
        createdAt: new Date().toISOString(),
      };

      await addMarketplaceProduct(newProduct);
      onProductCreated(newProduct);

      const congrats = t('agentModal.congratsPublish', { title: draft.title });

      await speakPrompt(contentVoiceKey('agent_congrats', congrats), language, congrats);
      handleClose();
    } catch (err) {
      console.error('Failed to publish product:', err);
      setPublishError(t('agentModal.publishError'));
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.agentAvatar}>
                <AppIcon name={Icons.sparkle} size={16} color={Brand.surface} />
              </View>
              <View>
                <Text style={styles.headerTitle}>{t('agentModal.headerTitle')}</Text>
                <Text style={styles.headerSub}>{t('agentModal.headerSub')}</Text>
              </View>
            </View>

            <Pressable
              onPress={handleClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close agent">
              <AppIcon name={Icons.close} size={16} color={Brand.ink} />
            </Pressable>
          </View>

          {/* Chat Stream & Draft Preview */}
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.chatContent}>
            {/* Prominent Hero Voice Mic Section for Producer */}
            <View style={styles.heroVoiceSection}>
              <Pressable
                onPress={handleToggleListening}
                style={[
                  styles.heroMicBtn,
                  isListening && styles.heroMicBtnListening,
                  isTranscribing && styles.heroMicBtnTranscribing,
                ]}
                accessibilityRole="button"
                accessibilityLabel={isListening ? 'Stop recording' : 'Start speaking'}>
                {isTranscribing ? (
                  <ActivityIndicator size="small" color={Brand.surface} />
                ) : (
                  <AppIcon
                    name={isListening ? Icons.stop : Icons.mic}
                    size={28}
                    color={Brand.surface}
                  />
                )}
              </Pressable>

              <View style={styles.heroVoiceInfo}>
                <Text style={styles.heroVoiceTitle}>
                  {isListening
                    ? t('agentModal.listeningNow')
                    : isTranscribing
                      ? t('agentModal.transcribing')
                      : t('agentModal.tapMic')}
                </Text>
                <Text style={styles.heroVoiceSub} numberOfLines={2}>
                  {isListening
                    ? liveSpokenText
                      ? `"${liveSpokenText}"`
                      : t('agentModal.listenHint')
                    : t('agentModal.idleExample')}
                </Text>
              </View>
            </View>

            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageBubble,
                  msg.sender === 'user' ? styles.userBubble : styles.agentBubble,
                ]}>
                {msg.sender === 'agent' ? (
                  <View style={styles.agentTag}>
                    <Text style={styles.agentTagText}>{t('agentModal.aiTag')}</Text>
                  </View>
                ) : null}
                <Text
                  style={[
                    styles.messageText,
                    msg.sender === 'user' ? styles.userMessageText : styles.agentMessageText,
                  ]}>
                  {msg.text}
                </Text>
              </View>
            ))}

            {isProcessing ? (
              <View style={[styles.messageBubble, styles.agentBubble, styles.loadingBubble]}>
                <ActivityIndicator size="small" color={Brand.ink} />
                <Text style={styles.loadingText}>{t('agentModal.analyzing')}</Text>
              </View>
            ) : null}

            {/* Live Product Draft Card (Appears as user provides details) */}
            {Boolean(draft.title) ? (
              <View style={styles.draftCard}>
                <View style={styles.draftCardHeader}>
                  <View style={styles.draftBadge}>
                    <Text style={styles.draftBadgeText}>
                      {draft.isReady ? t('agentModal.draftReady') : t('agentModal.draftProgress')}
                    </Text>
                  </View>
                  <Text style={styles.draftCategory}>{(draft.category || 'vegetables').toUpperCase()}</Text>
                </View>

                <View style={styles.draftBody}>
                  <View style={styles.imageWrapper}>
                    <Image
                      source={{ uri: draft.imageUrl || SAMPLE_PHOTO_PRESETS[draft.category] }}
                      style={styles.draftImage}
                    />
                    <Pressable
                      style={styles.imageOverlayBtn}
                      onPress={handlePickImage}
                      accessibilityRole="button"
                      accessibilityLabel="Change photo">
                      <AppIcon name={Icons.camera} size={13} color={Brand.surface} />
                    </Pressable>
                  </View>

                  <View style={styles.draftDetails}>
                    <Text style={styles.draftTitle} numberOfLines={2}>
                      {draft.title}
                    </Text>

                    <View style={styles.draftPriceRow}>
                      <Text style={styles.draftPrice}>
                        {`₹${draft.price > 0 ? draft.price : '---'}`}
                      </Text>
                      <Text style={styles.draftUnit}>{`/${draft.unit || 'नग'}`}</Text>
                    </View>

                    <Text style={styles.draftQty}>
                      {`${t('agentModal.stockLabel')} ${draft.quantity > 0 ? `${draft.quantity} ${draft.unit}` : '---'}`}
                    </Text>

                    {Boolean(draft.suggestedPrice && draft.price === draft.suggestedPrice) ? (
                      <View style={styles.mandiSuggestedPill}>
                        <Text style={styles.mandiSuggestedText}>
                          {t('agentModal.mandiFairRate')}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Photo Upload Actions */}
                <View style={styles.photoActionsRow}>
                  <Pressable
                    style={styles.photoActionBtn}
                    onPress={handleTakePhoto}
                    accessibilityRole="button"
                    accessibilityLabel="Take Photo with Camera">
                    <AppIcon name={Icons.camera} size={15} color={Brand.ink} />
                    <Text style={styles.photoActionBtnText}>{t('agentModal.takePhoto')}</Text>
                  </Pressable>

                  <Pressable
                    style={styles.photoActionBtn}
                    onPress={handlePickImage}
                    accessibilityRole="button"
                    accessibilityLabel="Upload photo from gallery">
                    <AppIcon name={Icons.photo} size={15} color={Brand.ink} />
                    <Text style={styles.photoActionBtnText}>{t('agentModal.uploadPhoto')}</Text>
                  </Pressable>
                </View>

                {publishError ? (
                  <Text style={styles.publishErrorText} accessibilityLiveRegion="polite">
                    {publishError}
                  </Text>
                ) : null}

                {draft.isReady ? (
                  <Pressable
                    style={styles.publishBtn}
                    onPress={handlePublish}
                    disabled={isPublishing}
                    accessibilityRole="button"
                    accessibilityLabel="Publish product to marketplace">
                    {isPublishing ? (
                      <ActivityIndicator size="small" color={Brand.surface} />
                    ) : (
                      <>
                        <AppIcon name={Icons.check} size={16} color={Brand.surface} />
                        <Text style={styles.publishBtnText}>{t('agentModal.publish')}</Text>
                      </>
                    )}
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {/* Suggested Quick Speech Chips */}
            {Boolean(
              messages.length > 0 &&
              messages[messages.length - 1]?.suggestedQuickReplies?.length
            ) ? (
              <View style={styles.quickRepliesSection}>
                <Text style={styles.quickRepliesTitle}>{t('agentModal.suggestedReplies')}</Text>
                <View style={styles.chipsRow}>
                  {messages[messages.length - 1].suggestedQuickReplies?.map((chip) => (
                    <Pressable
                      key={chip}
                      style={styles.quickChip}
                      onPress={() => handleSendMessage(chip)}
                      accessibilityRole="button"
                      accessibilityLabel={chip}>
                      <Text style={styles.quickChipText}>{chip}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
          </ScrollView>

          {/* Bottom Conversational Voice/Text Input Bar */}
          <View style={[styles.inputContainer, isListening && styles.inputContainerListening]}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={
                isListening ? t('agentModal.inputListening') : t('agentModal.inputIdle')
              }
              placeholderTextColor={isListening ? Brand.danger : Brand.inkFaint}
              onSubmitEditing={() => handleSendMessage(inputText)}
              returnKeyType="send"
              style={styles.inputField}
              editable={!isTranscribing}
            />

            <Pressable
              style={[
                styles.micSendBtn,
                isListening && styles.micBtnListening,
                Boolean(inputText.trim()) && !isListening && styles.sendBtnActive,
              ]}
              onPress={() => {
                if (isListening) {
                  handleToggleListening();
                } else if (inputText.trim()) {
                  handleSendMessage(inputText);
                } else {
                  handleToggleListening();
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={isListening ? 'Stop' : inputText.trim() ? 'Send' : 'Speak'}>
              {isTranscribing ? (
                <ActivityIndicator size="small" color={Brand.surface} />
              ) : (
                <AppIcon
                  name={isListening ? Icons.stop : inputText.trim() ? Icons.check : Icons.mic}
                  size={18}
                  color={Brand.surface}
                />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(22, 19, 31, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Brand.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    maxHeight: '90%',
    minHeight: '75%',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(22, 19, 31, 0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  agentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Brand.ink,
  },
  headerSub: {
    fontSize: 10,
    color: Brand.inkMuted,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Brand.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatContent: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: '85%',
  },
  agentBubble: {
    backgroundColor: '#F5F3FF',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  userBubble: {
    backgroundColor: Brand.ink,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  agentTag: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  agentTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
  },
  agentMessageText: {
    color: '#3B0764',
    fontWeight: '500',
  },
  userMessageText: {
    color: Brand.surface,
    fontWeight: '600',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#6D28D9',
  },
  draftCard: {
    backgroundColor: Brand.surfaceMuted,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C4B5FD',
    marginTop: 6,
  },
  draftCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  draftBadge: {
    backgroundColor: '#DEF7EC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  draftBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#03543F',
  },
  draftCategory: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7C3AED',
  },
  draftBody: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  imageWrapper: {
    position: 'relative',
    width: 76,
    height: 76,
    borderRadius: 14,
    overflow: 'hidden',
  },
  imageOverlayBtn: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    backgroundColor: 'rgba(22, 19, 31, 0.75)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(22, 19, 31, 0.08)',
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.surface,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(22, 19, 31, 0.1)',
  },
  photoActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.ink,
  },
  draftDetails: {
    flex: 1,
  },
  draftTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Brand.ink,
  },
  draftPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 3,
  },
  draftPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F9D58',
  },
  draftUnit: {
    fontSize: 11,
    color: Brand.inkMuted,
  },
  draftQty: {
    fontSize: 11,
    color: Brand.inkMuted,
    marginTop: 2,
  },
  draftQtyHighlight: {
    fontWeight: '700',
    color: Brand.ink,
  },
  mandiSuggestedPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  mandiSuggestedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F9D58',
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 12,
    gap: 8,
  },
  publishErrorText: {
    color: Brand.danger,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  publishBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Brand.surface,
  },
  quickRepliesSection: {
    marginTop: 8,
  },
  quickRepliesTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.inkMuted,
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickChip: {
    backgroundColor: Brand.surface,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(22, 19, 31, 0.1)',
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Brand.ink,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(22, 19, 31, 0.08)',
    gap: 10,
    backgroundColor: Brand.surface,
  },
  inputField: {
    flex: 1,
    height: 44,
    backgroundColor: Brand.surfaceMuted,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 13,
    color: Brand.ink,
    borderWidth: 1,
    borderColor: 'rgba(22, 19, 31, 0.08)',
  },
  micSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: Brand.ink,
  },
  heroVoiceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.surfaceMuted,
    borderRadius: 20,
    padding: 14,
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.15)',
  },
  heroMicBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  heroMicBtnListening: {
    backgroundColor: Brand.danger,
    borderWidth: 3,
    borderColor: Brand.dangerSoft,
  },
  heroMicBtnTranscribing: {
    backgroundColor: Brand.ink,
  },
  heroVoiceInfo: {
    flex: 1,
  },
  heroVoiceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.ink,
  },
  heroVoiceSub: {
    fontSize: 12,
    color: Brand.inkMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  inputContainerListening: {
    backgroundColor: Brand.dangerSoft,
    borderTopColor: Brand.danger,
  },
  micBtnListening: {
    backgroundColor: Brand.danger,
  },
});
