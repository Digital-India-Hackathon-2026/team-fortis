import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenAI } from '@google/genai';

const keys = (process.env.GEMINI_API_KEYS || '').split(',').map(k => k.trim()).filter(Boolean);
const models = [
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-pro-latest'
];

async function testWithTimeout(ai, model) {
  const apiCall = ai.models.generateContent({
    model: model,
    contents: "Return a JSON object: { \"test\": \"hello\" }"
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Local Request Timeout')), 5000)
  );

  return Promise.race([apiCall, timeoutPromise]);
}

async function run() {
  if (keys.length === 0) {
    console.error("No API keys found.");
    return;
  }

  for (let i = 0; i < keys.length; i++) {
    const apiKey = keys[i];
    const keyLabel = `Gemini Key #${i + 1} (${apiKey.substring(0, 10)}...)`;
    console.log(`\n=================== Testing ${keyLabel} ===================`);
    
    const ai = new GoogleGenAI({ apiKey });
    
    for (const model of models) {
      console.log(`Testing ${model}...`);
      try {
        const response = await testWithTimeout(ai, model);
        console.log(`  ✅ Success for ${model}! Response:`, response.text.trim());
      } catch (err) {
        console.error(`  ❌ Failed for ${model}. Error:`, err.message.substring(0, 120));
      }
    }
  }
}

run();
