const fs = require('fs');
const path = require('path');
const https = require('https');

const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/sarvam_api=([^\r\n]+)/);
const apiKey = match ? match[1].trim() : '';

if (!apiKey) {
  console.error('Sarvam API key not found in .env!');
  process.exit(1);
}

const LANGUAGE_CODE_MAP = {
  hi: 'hi-IN',
  mr: 'mr-IN',
  en: 'en-IN',
};

const PROMPTS = [
  // 1. Language screen
  {
    key: 'language.intro',
    texts: {
      hi: 'यह भाषा चुनने का पेज है। कृपया अपनी भाषा चुनें।',
      mr: 'हे भाषा निवडण्याचे पान आहे. कृपया आपली भाषा निवडा.',
      en: 'This is the language selection page. Please choose your language.',
    },
  },
  {
    key: 'language.select_mr',
    texts: {
      hi: 'आपने मराठी भाषा चुनी है।',
      mr: 'तुम्ही मराठी भाषा निवडली आहे.',
      en: 'You have chosen Marathi.',
    },
  },
  {
    key: 'language.select_hi',
    texts: {
      hi: 'आपने हिंदी भाषा चुनी है।',
      mr: 'तुम्ही हिंदी भाषा निवडली आहे.',
      en: 'You have chosen Hindi.',
    },
  },
  {
    key: 'language.select_en',
    texts: {
      hi: 'आपने अंग्रेज़ी भाषा चुनी है।',
      mr: 'तुम्ही इंग्रजी भाषा निवडली आहे.',
      en: 'You have chosen English.',
    },
  },

  // 2. Details screen
  {
    key: 'details.intro',
    texts: {
      hi: 'यह आपकी जानकारी का पेज है। कृपया अपना पूरा नाम, उम्र और मोबाइल नंबर दर्ज करें।',
      mr: 'हे तुमच्या माहितीचे पान आहे. कृपया तुमचे पूर्ण नाव, वय आणि मोबाईल नंबर भरा.',
      en: 'This is the details page. Please enter your full name, age, and mobile number.',
    },
  },

  // 3. Location screen
  {
    key: 'location.intro',
    texts: {
      hi: 'यह स्थान का पेज है। अपना वर्तमान स्थान शेयर करें या अपना शहर और इलाका खुद लिखें।',
      mr: 'हे ठिकाणाचे पान आहे. तुमचे सध्याचे ठिकाण शेअर करा किंवा तुमचे शहर आणि परिसर स्वतः लिहा.',
      en: 'This is the location page. Share your current location or enter your area manually.',
    },
  },
  {
    key: 'location.gps_success',
    texts: {
      hi: 'आपका वर्तमान स्थान सफलतापूर्वक दर्ज हो गया है।',
      mr: 'तुमचे सध्याचे ठिकाण यशस्वीरीत्या मिळाले आहे.',
      en: 'Your current location has been captured.',
    },
  },

  // 4. Gender screen
  {
    key: 'gender.intro',
    texts: {
      hi: 'यह पहचान का पेज है। कृपया महिला या पुरुष का विकल्प चुनें।',
      mr: 'हे ओळखीचे पान आहे. कृपया महिला किंवा पुरुष पर्याय निवडा.',
      en: 'This is the gender page. Please select female or male.',
    },
  },
  {
    key: 'gender.select_female',
    texts: {
      hi: 'आपने महिला चुना है।',
      mr: 'तुम्ही महिला निवडले आहे.',
      en: 'You have chosen Female.',
    },
  },
  {
    key: 'gender.select_male',
    texts: {
      hi: 'आपने पुरुष चुना है।',
      mr: 'तुम्ही पुरुष निवडले आहे.',
      en: 'You have chosen Male.',
    },
  },

  // 5. Account type screen (Consumer vs Producer)
  {
    key: 'account_type.intro',
    texts: {
      hi: 'क्या आप उपभोक्ता हैं या उत्पादक? रोज़मर्रा की ज़रूरतों के लिए उपभोक्ता चुनें, या व्यवसाय के लिए उत्पादक चुनें।',
      mr: 'तुम्ही ग्राहक आहात की उत्पादक? दैनंदिन गरजांसाठी ग्राहक निवडा, किंवा व्यवसायासाठी उत्पादक निवडा.',
      en: 'Are you a Consumer or Producer? Choose Consumer for household living, or Producer for business.',
    },
  },
  {
    key: 'account_type.select_consumer',
    texts: {
      hi: 'आपने उपभोक्ता चुना है। अपनी प्रोफ़ाइल पूरी करने के लिए नीचे दिए गए बटन पर दबाएं।',
      mr: 'तुम्ही ग्राहक निवडले आहे. प्रोफाइल पूर्ण करण्यासाठी खालील बटण दाबा.',
      en: 'You have chosen Consumer. Tap the button below to finish.',
    },
  },
  {
    key: 'account_type.select_producer',
    texts: {
      hi: 'आपने उत्पादक चुना है। आगे अपने व्यवसाय का प्रकार चुनने के लिए जारी रखें पर दबाएं।',
      mr: 'तुम्ही उत्पादक निवडले आहे. पुढे व्यवसायाचा प्रकार निवडण्यासाठी पुढे जा वर दाबा.',
      en: 'You have chosen Producer. Tap continue to select your business type.',
    },
  },

  // 6. Producer role screen
  {
    key: 'role.intro',
    texts: {
      hi: 'आप किस प्रकार के उत्पादक हैं? किसान, किराना दुकान मालिक, या महिला उद्यमी में से चुनें।',
      mr: 'तुम्ही कोणत्या प्रकारचे उत्पादक आहात? शेतकरी, किराणा दुकान मालक, किंवा महिला उद्योजक निवडा.',
      en: 'What kind of producer are you? Choose Farmer, Kirana Store, or Women Entrepreneur.',
    },
  },
  {
    key: 'role.select_farmer',
    texts: {
      hi: 'आपने किसान प्रोफ़ाइल चुनी है।',
      mr: 'तुम्ही शेतकरी प्रोफाइल निवडले आहे.',
      en: 'You have chosen Farmer profile.',
    },
  },
  {
    key: 'role.select_kirana',
    texts: {
      hi: 'आपने किराना दुकान मालिक प्रोफ़ाइल चुनी है।',
      mr: 'तुम्ही किराणा दुकान मालक प्रोफाइल निवडले आहे.',
      en: 'You have chosen Kirana Store Owner profile.',
    },
  },
  {
    key: 'role.select_entrepreneur',
    texts: {
      hi: 'आपने महिला उद्यमी प्रोफ़ाइल चुनी है।',
      mr: 'तुम्ही महिला उद्योजक प्रोफाइल निवडले आहे.',
      en: 'You have chosen Women Entrepreneur profile.',
    },
  },

  // 7. Profile completed
  {
    key: 'profile.completed',
    texts: {
      hi: 'बधाई हो! आपकी एस्मोर प्रोफ़ाइल तैयार हो गई है।',
      mr: 'अभिनंदन! तुमची एस्मोर प्रोफाइल तयार झाली आहे.',
      en: 'Congratulations! Your Esmor profile is ready.',
    },
  },
];

function fetchTts(text, languageCode) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      text,
      language_code: languageCode,
      model: 'bulbul:v4-flash',
    });

    const req = https.request('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'api-subscription-key': apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Status ${res.statusCode}: ${body}`));
        }
        try {
          const parsed = JSON.parse(body);
          if (parsed.audios && parsed.audios[0]) {
            resolve(parsed.audios[0]);
          } else {
            reject(new Error(`No audio returned in response: ${body.slice(0, 200)}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log(`Starting voice generation for ${PROMPTS.length} prompt keys across hi, mr, en...`);
  const outputPath = path.resolve(__dirname, '../src/constants/pregenerated-voices.json');
  
  let existing = {};
  if (fs.existsSync(outputPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      console.log(`Found ${Object.keys(existing).length} existing cached voice keys.`);
    } catch {
      existing = {};
    }
  }

  let successCount = 0;
  let skippedCount = 0;

  for (const item of PROMPTS) {
    for (const [lang, text] of Object.entries(item.texts)) {
      const cacheId = `${lang}:${item.key}`;
      if (existing[cacheId]) {
        skippedCount++;
        continue;
      }

      const langCode = LANGUAGE_CODE_MAP[lang];
      console.log(`Generating [${cacheId}] (${langCode}): "${text.slice(0, 30)}..."`);
      try {
        const base64 = await fetchTts(text, langCode);
        existing[cacheId] = {
          key: item.key,
          language: lang,
          text,
          audioBase64: base64,
        };
        successCount++;
        // Small delay to be polite to API rate limits
        await sleep(250);
      } catch (err) {
        console.error(`Error generating [${cacheId}]:`, err.message);
      }
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(existing, null, 2), 'utf8');
  console.log(`Voice generation complete! Generated: ${successCount}, Cached/Skipped: ${skippedCount}, Total in store: ${Object.keys(existing).length}`);
  console.log(`Saved to ${outputPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
