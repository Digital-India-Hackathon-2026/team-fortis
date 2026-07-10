import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenAI } from '@google/genai';

const keys = (process.env.GEMINI_API_KEYS || '').split(',').map(k => k.trim()).filter(Boolean);

async function run() {
  if (keys.length === 0) {
    console.error("No API keys found.");
    return;
  }

  const ai = new GoogleGenAI({ apiKey: keys[0] });
  try {
    console.log("Listing available models using async iterator...");
    const modelList = await ai.models.list();
    console.log("Response:", JSON.stringify(modelList));
  } catch (err) {
    console.error("Error listing models:", err.message);
  }
}

run();
