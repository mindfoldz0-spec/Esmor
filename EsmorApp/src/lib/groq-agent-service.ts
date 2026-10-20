import type { Language } from '@/i18n/languages';
import type { ListingDraft, ProductCategory, ProductUnit } from '@/types/marketplace';

const GROQ_API_KEY =
  process.env.EXPO_PUBLIC_GROQ_API_KEY ||
  process.env.groq_api ||
  '';

const PRIMARY_MODEL = 'qwen/qwen3.8-27b';

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
  गूळ: { price: 65, unit: 'kg', category: 'dairy', notes: 'कोल्हापुरी सेंद्रिय गूळ ₹60-70 प्रति किलो' },
  jaggery: { price: 65, unit: 'kg', category: 'dairy', notes: 'Organic Jaggery ₹60-70 per kg' },
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
  const systemPrompt = `
You are 'ई-समौर बाजार सहाय्यक' (Esmor Rural Market Agent).
Your goal is to help Indian rural farmers, artisans, and kirana producers list their products in the marketplace through simple, friendly conversation.
Unlike Amazon or Flipkart with complicated forms, you collect details through conversation.

Current Language: ${language === 'mr' ? 'Marathi (मराठी)' : language === 'hi' ? 'Hindi (हिंदी)' : 'English'}
Current Product Draft: ${JSON.stringify(currentDraft)}

Key Rules:
1. Speak warmly, respectfully, and simply in the chosen language.
2. If the user mentions what they want to sell, understand the item and ask for price and quantity.
3. If the user doesn't know the price or asks 'whatever is best / जे योग्य वाटेल ते भाव ठेवा / जो सही लगे', give a recommended fair market price based on current Maharashtra Mandi rates, and ask if they agree.
4. Extract title, category (vegetables, fruits, grains, dairy, equipment, kirana, handcrafts), price (number), unit (kg, quintal, crate, sack, box, liter, piece), and quantity.
5. When the user confirms the details, mark 'isReady': true.
6. YOU MUST ALWAYS append a JSON block at the very end of your response inside \`\`\`json { ... } \`\`\`.

JSON Structure:
\`\`\`json
{
  "replyText": "your friendly response to speak to the producer",
  "suggestedQuickReplies": ["Short reply 1", "Short reply 2"],
  "productDraft": {
    "title": "Clean product title in Marathi or English",
    "category": "vegetables | fruits | grains | dairy | equipment | kirana | handcrafts",
    "price": 350,
    "unit": "crate",
    "quantity": 20,
    "suggestedPrice": 350,
    "description": "Attractive brief description of the product",
    "isReady": true or false
  }
}
\`\`\`
`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-6),
    { role: 'user', content: userMessage },
  ];

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
    });

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
            suggestedQuickReplies: parsed.suggestedQuickReplies || ['होय, योग्य आहे', 'भाव बदला'],
            productDraft: { ...currentDraft, ...(parsed.productDraft || {}) },
          };
        } catch {
          // If JSON parse fails, fall through to fallback
        }
      }

      // If no code block, clean text
      return {
        replyText: rawContent.trim(),
        suggestedQuickReplies: language === 'mr' ? ['होय, चालेल', 'भाव बदला'] : ['Looks good', 'Change price'],
        productDraft: currentDraft,
      };
    }
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
  const priceMatch = userMessage.match(/(\d+)\s*(रुपये|रु|rs|inr|\/)/i);
  if (priceMatch) {
    nextDraft.price = parseInt(priceMatch[1], 10);
  }

  // Detect quantity
  const qtyMatch = userMessage.match(/(\d+)\s*(क्रेट|पोती|बोरी|किलो|डझन|पेटी|लिटर|crate|sack|kg|box|quintal)/i);
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
      replyText:
        language === 'mr'
          ? `सध्या बाजार समितीत याचा भाव सुमारे ₹${nextDraft.suggestedPrice} प्रति ${nextDraft.unit || 'नग'} आहे. आपण ₹${nextDraft.suggestedPrice} हा भाव ठेवूया का?`
          : `Currently in Mandi, this sells around ₹${nextDraft.suggestedPrice} per ${nextDraft.unit || 'unit'}. Shall we set ₹${nextDraft.suggestedPrice}?`,
      suggestedQuickReplies:
        language === 'mr'
          ? [`होय, ₹${nextDraft.suggestedPrice} भाव ठेवा`, 'दुसरा भाव सांगा']
          : [`Yes, set ₹${nextDraft.suggestedPrice}`, 'Set another price'],
      productDraft: nextDraft,
    };
  }

  // Check if ready
  if (nextDraft.title && nextDraft.price && nextDraft.quantity) {
    nextDraft.isReady = true;
    return {
      replyText:
        language === 'mr'
          ? `छान! तुमचे उत्पादन: ${nextDraft.title}, प्रमाण: ${nextDraft.quantity} ${nextDraft.unit}, भाव: ₹${nextDraft.price}. बाजारपेठेत प्रकाशित करायचे का?`
          : `Great! Product: ${nextDraft.title}, Quantity: ${nextDraft.quantity} ${nextDraft.unit}, Price: ₹${nextDraft.price}. Ready to publish to marketplace?`,
      suggestedQuickReplies:
        language === 'mr'
          ? ['होय, आताच प्रकाशित करा! 🎉', 'फोटो जोडा', 'माहिती बदला']
          : ['Yes, Publish Now! 🎉', 'Add Photo', 'Edit details'],
      productDraft: nextDraft,
    };
  }

  // Ask for missing details
  if (!nextDraft.price) {
    return {
      replyText:
        language === 'mr'
          ? `उत्तम! ${detectedTitle || 'या मालासाठी'} तुम्हाला काय भाव ठेवायचा आहे? (जर माहित नसेल तर 'योग्य भाव सांगा' म्हणा)`
          : `Great! What price would you like to set for ${detectedTitle || 'this item'}? (Or say 'Suggest best price')`,
      suggestedQuickReplies:
        language === 'mr'
          ? ['बाजारातील योग्य भाव सांगा', '₹350 प्रति क्रेट', '₹50 प्रति किलो']
          : ['Suggest best mandi price', '₹350 per crate', '₹50 per kg'],
      productDraft: { ...nextDraft, title: nextDraft.title || detectedTitle },
    };
  }

  return {
    replyText:
      language === 'mr'
        ? 'तुमच्याकडे किती माल उपलब्ध आहे? (उदा. १० क्रेट किंवा ५ क्विंटल)'
        : 'How much quantity do you have available? (e.g. 10 crates or 5 quintals)',
    suggestedQuickReplies:
      language === 'mr' ? ['१० क्रेट उपलब्ध आहेत', '५ क्विंटल', '२० किलो'] : ['10 crates', '5 quintals', '20 kg'],
    productDraft: nextDraft,
  };
}
