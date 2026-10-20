import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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

import { AppIcon, Icons } from '@/components/app-icon';
import { Brand } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { askListingAgent } from '@/lib/groq-agent-service';
import { addMarketplaceProduct } from '@/lib/marketplace-store';
import { SpeechToTextController } from '@/lib/stt-service';
import { speakPrompt, stopVoice } from '@/lib/voice-player';
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

function getInitialGreeting(language: string): string {
  if (language === 'mr') {
    return 'नमस्कार! मी तुमचा ई-समौर बाजार सहाय्यक आहे. तुम्हाला काय विकायचे आहे? (उदा. "मला १० क्रेट टोमॅटो विकायचे आहेत")';
  }
  if (language === 'hi') {
    return 'नमस्ते! मैं आपका ई-समौर बाजार सहायक हूँ। आप क्या बेचना चाहते हैं? बोलें या लिखें।';
  }
  return 'Hello! I am your Esmor Market Agent. What would you like to sell today? Speak or type.';
}

function getInitialMessages(language: string): AgentChatMessage[] {
  return [
    {
      id: 'msg-init',
      sender: 'agent',
      text: getInitialGreeting(language),
      suggestedQuickReplies:
        language === 'mr'
          ? ['मला १० क्रेट टोमॅटो विकायचे आहेत', 'मला २५ बॉक्स आंबे विकायचे आहेत', 'मला १० पोती तांदूळ विकायचा आहे']
          : ['I want to sell 10 crates of tomatoes', 'I want to sell 25 boxes of mangoes', 'I want to sell 10 sacks of rice'],
    },
  ];
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
  const { language } = useI18n();

  const [messages, setMessages] = useState<AgentChatMessage[]>(() => getInitialMessages(language));
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
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

  // Setup STT controller
  useEffect(() => {
    const controller = new SpeechToTextController();
    sttControllerRef.current = controller;
    return () => {
      controller.cancel();
    };
  }, []);

  // Play spoken greeting when agent mounts
  useEffect(() => {
    speakPrompt('agent_welcome', language, getInitialGreeting(language)).catch(() => {});
  }, [language]);

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
          setInputText(
            language === 'mr'
              ? 'आवाज ऐकू आला नाही. कृपया पुन्हा बोला किंवा पर्याय निवडा.'
              : 'Could not hear voice. Please speak again or select an option.'
          );
        }
      } catch (err) {
        setIsTranscribing(false);
        console.warn('STT stop listening error:', err);
      }
    } else {
      await stopVoice();
      setLiveSpokenText('');
      setInputText('');
      const started = await sttControllerRef.current?.startListening(
        language,
        (liveText) => {
          setLiveSpokenText(liveText);
          setInputText(liveText);
        }
      );
      if (started) {
        setIsListening(true);
      }
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || isProcessing) return;

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
      speakPrompt(getNextId('agent_reply'), language, response.replyText).catch(() => {});

      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 150);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublish = async () => {
    if (!draft.title || !draft.price || !draft.quantity) return;

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
        sellerName: profile?.name || 'माझे शेत (Producer)',
        sellerPhone: profile?.phone || '+91 98220 12345',
        sellerVillage: profile?.location.label || 'माझे गाव / तालुका',
        district: 'Maharashtra',
        description: draft.description || `${draft.title} थेट शेतकऱ्याकडून उपलब्ध.`,
        isOrganic: true,
        createdAt: new Date().toISOString(),
      };

      await addMarketplaceProduct(newProduct);
      onProductCreated(newProduct);

      const congrats =
        language === 'mr'
          ? `अभिनंदन! तुमचे उत्पादन '${draft.title}' बाजारपेठेत यशस्वीरीत्या प्रकाशित झाले आहे!`
          : `Congratulations! Your product '${draft.title}' is now listed on the marketplace!`;

      await speakPrompt('agent_congrats', language, congrats);
      onClose();
    } catch (err) {
      console.error('Failed to publish product:', err);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
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
                <Text style={styles.headerTitle}>
                  {language === 'mr' ? 'ई-समौर बाजार सहाय्यक' : 'Esmor Market Agent'}
                </Text>
                <Text style={styles.headerSub}>
                  {language === 'mr' ? 'बोलून उत्पादन जोडा (Groq AI Powered)' : 'Voice-assisted product listing'}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
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
                    ? (language === 'mr' ? '🔴 ऐकत आहे... आता बोला' : '🔴 Listening... speak now')
                    : isTranscribing
                      ? (language === 'mr' ? '⏳ AI आवाज ओळखत आहे...' : '⏳ AI is transcribing...')
                      : (language === 'mr' ? 'माईक दाबा आणि बोला' : 'Tap Mic & Speak to Sell')}
                </Text>
                <Text style={styles.heroVoiceSub} numberOfLines={2}>
                  {isListening
                    ? (liveSpokenText ? `"${liveSpokenText}"` : (language === 'mr' ? 'बोलून झाल्यावर पुन्हा माईकवर टॅप करा' : 'Speak now (tap again when finished)'))
                    : (language === 'mr' ? 'उदा. "मला १० क्रेट टोमॅटो विकायचे आहेत"' : 'e.g. "I want to sell 10 crates of tomatoes"')}
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
                    <Text style={styles.agentTagText}>AI सहाय्यक</Text>
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
                <Text style={styles.loadingText}>
                  {language === 'mr' ? 'बाजार सहाय्यक विचार करत आहे...' : 'Agent is analyzing...'}
                </Text>
              </View>
            ) : null}

            {/* Live Product Draft Card (Appears as user provides details) */}
            {Boolean(draft.title) ? (
              <View style={styles.draftCard}>
                <View style={styles.draftCardHeader}>
                  <View style={styles.draftBadge}>
                    <Text style={styles.draftBadgeText}>
                      {draft.isReady ? '✅ तयार उत्पादन (Ready)' : '📝 मसुदा (In Progress)'}
                    </Text>
                  </View>
                  <Text style={styles.draftCategory}>{(draft.category || 'vegetables').toUpperCase()}</Text>
                </View>

                <View style={styles.draftBody}>
                  <Image
                    source={{ uri: draft.imageUrl || SAMPLE_PHOTO_PRESETS[draft.category] }}
                    style={styles.draftImage}
                  />
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
                      {`${language === 'mr' ? 'उपलब्ध: ' : 'Stock: '}${draft.quantity > 0 ? `${draft.quantity} ${draft.unit}` : '---'}`}
                    </Text>

                    {Boolean(draft.suggestedPrice && draft.price === draft.suggestedPrice) ? (
                      <View style={styles.mandiSuggestedPill}>
                        <Text style={styles.mandiSuggestedText}>
                          {language === 'mr' ? '★ बाजार समिती प्रमाणित भाव' : '★ Mandi Fair Rate'}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>

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
                        <Text style={styles.publishBtnText}>
                          {language === 'mr' ? 'बाजारपेठेत प्रकाशित करा 🎉' : 'Publish to Marketplace 🎉'}
                        </Text>
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
                <Text style={styles.quickRepliesTitle}>
                  {language === 'mr' ? 'द्रुत पर्याय (टॅप करा किंवा बोला):' : 'Suggested Replies:'}
                </Text>
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
                isListening
                  ? (language === 'mr' ? 'तुमचा आवाज ऐकत आहे...' : 'Listening to speech...')
                  : (language === 'mr' ? 'येथे लिहा किंवा माईक दाबा...' : 'Type or tap mic to speak...')
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
  draftImage: {
    width: 76,
    height: 76,
    borderRadius: 12,
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
