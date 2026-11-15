import type { Language } from '@/i18n/languages';
import type { ListingDraft, ProductCategory, ProductUnit } from '@/types/marketplace';
import { translate } from '@/i18n/translations';
import { fetchWithTimeout } from '@/lib/net';

const GROQ_API_KEY =
  process.env.EXPO_PUBLIC_GROQ_API_KEY ||
  process.env.groq_api ||
  '';

/**
 * The listing agent model. 'qwen/qwen3.8-27b' is a Groq *preview* model and may
 * be discontinued or renamed at short notice, so it can be overridden via the
 * EXPO_PUBLIC_GROQ_MODEL environment variable without a code change.
 */
const PRIMARY_MODEL = process.env.EXPO_PUBLIC_GROQ_MODEL || 'qwen/qwen3.8-27b';

/**
 * Benchmark Mandi market rates across Maharashtra APMCs
 * used by the agent to advise farmers when they ask "whatever is best".
 */
export const MANDI_BENCHMARK_RATES: Record<
  string,
  { price: number; unit: ProductUnit; category: ProductCategory; notes: string }
> = {
  आंबा: { price: 950, unit: 'box', category: 'fruits', notes: 'रत्नागिरी हापूस ₹800-1100 प्रति डझन/पेटी' },
  mango: { price: 950, unit: 'box', category: 'fruits', notes: 'Alphonso Mango ₹800-1100 per box' },
  कांदा: { price: 1400, unit: 'quintal', category: 'vegetables', notes: 'नाशिक लासलगाव कांदा ₹1300-1500 प्रति क्विंटल' },
  onion: { price: 1400, unit: 'quintal', category: 'vegetables', notes: 'Nashik Red Onion ₹1300-1500 per quintal' },
  टोमॅटो: { price: 350, unit: 'crate', category: 'vegetables', notes: 'नारायणगाव टोमॅटो ₹300-400 प्रति क्रेट (२५ किलो)' },
  tomato: { price: 350, unit: 'crate', category: 'vegetables', notes: 'Fresh Tomato ₹300-400 per crate (25 kg)' },
  गूळ: { price: 65, unit: 'kg', category: 'kirana', notes: 'कोल्हापुरी सेंद्रिय गूळ ₹60-70 प्रति किलो' },
  jaggery: { price: 65, unit: 'kg', category: 'kirana', notes: 'Organic Jaggery ₹60-70 per kg' },
  तांदूळ: { price: 55, unit: 'kg', category: 'grains', notes: 'इंद्रायणी तांदूळ ₹50-60 प्रति किलो' },
  rice: { price: 55, unit: 'kg', category: 'grains', notes: 'Indrayani Rice ₹50-60 per kg' },
  तूप: { price: 780, unit: 'liter', category: 'dairy', notes: 'शुद्ध गावठी गाईचे तूप ₹750-850 प्रति लिटर' },
  ghee: { price: 780, unit: 'liter', category: 'dairy', notes: 'Pure Desi Ghee ₹750-850 per liter' },
  दूध: { price: 52, unit: 'liter', category: 'dairy', notes: 'ताजे म्हशीचे दूध ₹50-55 प्रति लिटर' },
  milk: { price: 52, unit: 'liter', category: 'dairy', notes: 'Fresh Buffalo Milk ₹50-55 per liter' },
  गहू: { price: 32, unit: 'kg', category: 'grains', notes: 'लोकवन गहू ₹30-35 प्रति किलो' },
  wheat: { price: 32, unit: 'kg', category: 'grains', notes: 'Lokwan Wheat ₹30-35 per kg' },
  डाळ: { price: 155, unit: 'kg', category: 'grains', notes: 'हातसडीची तूर डाळ ₹150-165 प्रति किलो' },
  dal: { price: 155, unit: 'kg', category: 'grains', notes: 'Hand-pounded Toor Dal ₹150-165 per kg' },
};

export type AgentResponse = {
  replyText: string;
  suggestedQuickReplies: string[];
  productDraft: Partial<ListingDraft>;
};

export async function askListingAgent(
  userMessage: string,
  language: Language,
  currentDraft: Partial<ListingDraft>,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[]
): Promise<AgentResponse> {
  const LANGUAGE_NAME: Record<Language, string> = {
    mr: 'Marathi (मराठी)',
    hi: 'Hindi (हिंदी)',
    en: 'English (English)',
  };
  const targetLanguage = LANGUAGE_NAME[language] ?? LANGUAGE_NAME.en;

  const systemPrompt = `
You are 'Esmor Market Agent' (ई-समौर बाजार सहायक).
Your goal is to help Indian rural farmers, artisans, and kirana producers list their products in the marketplace through simple, friendly conversation.
Unlike Amazon or Flipkart with complicated forms, you collect details through conversation.

App UI language (CHOSEN BY THE USER): ${targetLanguage}
Current Product Draft: ${JSON.stringify(currentDraft)}

Key Rules:
1. Speak warmly, respectfully, and simply — but ONLY in ${targetLanguage}.
2. If the user mentions what they want to sell, understand the item and ask for price and quantity.
3. If the user doesn't know the price or asks 'whatever is best / जे योग्य वाटेल ते भाव ठेवा / जो सही लगे', give a recommended fair market price based on current Maharashtra Mandi rates, and ask if they agree.
4. Extract title, category (vegetables, fruits, grains, dairy, equipment, kirana, handcrafts), price (number), unit (kg, quintal, crate, sack, box, liter, piece), and quantity.
5. When the user confirms the details, mark 'isReady': true.
6. YOU MUST ALWAYS append a JSON block at the very end of your response inside \`\`\`json { ... } \`\`\`.

CRITICAL LANGUAGE RULE: Every word you produce — replyText, suggestedQuickReplies, and the productDraft title/description — MUST be written in ${targetLanguage} ONLY. The user chose ${targetLanguage} as their app language; never reply in any other language, no matter what language the user writes or speaks in. Do not mix languages within a sentence.

JSON Structure:
\`\`\`json
{
  "replyText": "your friendly response to speak to the producer, in ${targetLanguage} only",
  "suggestedQuickReplies": ["<short reply in ${targetLanguage}>", "<short reply in ${targetLanguage}>"],
  "productDraft": {
    "title": "Clean product title in ${targetLanguage}",
    "category": "vegetables | fruits | grains | dairy | equipment | kirana | handcrafts",
    "price": 350,
    "unit": "crate",
    "quantity": 20,
    "suggestedPrice": 350,
    "description": "Attractive brief description of the product, in ${targetLanguage}",
    "isReady": true or false
  }
}
\`\`\`
`;

  if (!GROQ_API_KEY) {
    console.warn('Groq API key is not configured; using the offline rule-based agent.');
    return runLocalRuleAgent(userMessage, language, currentDraft);
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-6),
    { role: 'user', content: userMessage },
  ];

  try {
    const res = await fetchWithTimeout(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: PRIMARY_MODEL,
          messages,
          temperature: 0.3,
          max_tokens: 600,
        }),
      },
      12000
    );

    if (res.ok) {
      const data = await res.json();
      const rawContent: string = data.choices?.[0]?.message?.content || '';

      // Extract JSON block
      const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          return {
            replyText: parsed.replyText || rawContent.replace(/```json[\s\S]*```/, '').trim(),
            suggestedQuickReplies: parsed.suggestedQuickReplies || [
              translate(language, 'agent.fallbackQuickOk'),
              translate(language, 'agentModal.quickChangePrice'),
            ],
            productDraft: { ...currentDraft, ...(parsed.productDraft || {}) },
          };
        } catch {
          // If JSON parse fails, fall through to fallback
        }
      }

      // If no code block, clean text
      return {
        replyText: rawContent.trim(),
        suggestedQuickReplies: [
          translate(language, 'agent.fallbackQuickOk'),
          translate(language, 'agentModal.quickChangePrice'),
        ],
        productDraft: currentDraft,
      };
    }

    // Non-ok responses (auth, deprecation, rate limits) used to fail silently.
    const errBody = await res.text().catch(() => '');
    console.warn(`Groq chat completion failed: HTTP ${res.status} ${errBody.slice(0, 300)}`);
  } catch (err) {
    console.warn('Groq primary model call failed, using intelligent offline agent:', err);
  }

  // Robust Rule-Based Indic Agent Fallback (guarantees 100% availability even offline)
  return runLocalRuleAgent(userMessage, language, currentDraft);
}

/**
 * Intelligent local agent logic when offline or if network is unavailable.
 */
function runLocalRuleAgent(
  userMessage: string,
  language: Language,
  draft: Partial<ListingDraft>
): AgentResponse {
  const lower = userMessage.toLowerCase();
  const nextDraft: Partial<ListingDraft> = { ...draft };

  // Normalize Devanagari digits to ASCII so extraction works for Hindi/Marathi input.
  const asciiMessage = userMessage.replace(/[०-९]/g, (d) =>
    String('०१२३४५६७८९'.indexOf(d))
  );

  // Detect product match from benchmark
  let detectedTitle = draft.title || '';

  for (const [key, val] of Object.entries(MANDI_BENCHMARK_RATES)) {
    if (lower.includes(key)) {
      detectedTitle = userMessage.split(/विकायचे|बेचना|sell/i)[0].trim() || key;
      nextDraft.title = nextDraft.title || detectedTitle;
      nextDraft.category = val.category;
      nextDraft.unit = val.unit;
      nextDraft.suggestedPrice = val.price;
      break;
    }
  }

  // Detect price
  const priceMatch = asciiMessage.match(/(\d+)\s*(रुपये|रु|rs|inr|\/)/i);
  if (priceMatch) {
    nextDraft.price = parseInt(priceMatch[1], 10);
  }

  // Detect quantity
  const qtyMatch = asciiMessage.match(/(\d+)\s*(क्रेट|पोती|बोरी|किलो|डझन|पेटी|लिटर|crate|sack|kg|box|quintal)/i);
  if (qtyMatch) {
    nextDraft.quantity = parseInt(qtyMatch[1], 10);
  }

  // Check if user asks for "best price" or "whatever is best"
  const isAskingBestPrice =
    lower.includes('योग्य') ||
    lower.includes('best') ||
    lower.includes('माहिती नाही') ||
    lower.includes('सही लगे') ||
    lower.includes('चांगला भाव');

  if (isAskingBestPrice && nextDraft.suggestedPrice) {
    nextDraft.price = nextDraft.suggestedPrice;
    return {
      replyText: translate(language, 'agent.bestPriceReply', {
        price: nextDraft.suggestedPrice,
        unit: nextDraft.unit || 'unit',
      }),
      suggestedQuickReplies: [
        translate(language, 'agent.quickSetPrice', { price: nextDraft.suggestedPrice }),
        translate(language, 'agent.quickSetAnotherPrice'),
      ],
      productDraft: nextDraft,
    };
  }

  // Check if ready
  if (nextDraft.title && nextDraft.price && nextDraft.quantity) {
    nextDraft.isReady = true;
    return {
      replyText: translate(language, 'agent.readyToPublish', {
        title: nextDraft.title,
        quantity: nextDraft.quantity,
        unit: nextDraft.unit ?? 'unit',
        price: nextDraft.price,
      }),
      suggestedQuickReplies: [
        translate(language, 'agentModal.quickYesPublish'),
        translate(language, 'agent.quickAddPhoto'),
        translate(language, 'agent.quickEditDetails'),
      ],
      productDraft: nextDraft,
    };
  }

  // Ask for missing details
  if (!nextDraft.price) {
    return {
      replyText: translate(language, 'agent.askPrice', {
        title: detectedTitle || translate(language, 'agent.thisItem'),
      }),
      suggestedQuickReplies: [
        translate(language, 'agent.quickSuggestBestPrice'),
        translate(language, 'agent.sampleChipRate1'),
        translate(language, 'agent.sampleChipRate2'),
      ],
      productDraft: { ...nextDraft, title: nextDraft.title || detectedTitle },
    };
  }

  return {
    replyText: translate(language, 'agent.askQuantity'),
    suggestedQuickReplies: [
      translate(language, 'agent.quickQuantity1'),
      translate(language, 'agent.quickQuantity2'),
      translate(language, 'agent.quickQuantity3'),
    ],
    productDraft: nextDraft,
  };
}
