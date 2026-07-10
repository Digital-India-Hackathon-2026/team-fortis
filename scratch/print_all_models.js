import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenAI } from '@google/genai';

const keys = (process.env.GEMINI_API_KEYS || '').split(',').map(k => k.trim()).filter(Boolean);

async function run() {
  if (keys.length === 0) return;
  const ai = new GoogleGenAI({ apiKey: keys[0] });
  try {
    const res = await ai.models.list();
    if (res.pageInternal) {
      console.log("pageInternal type:", Array.isArray(res.pageInternal) ? "Array" : typeof res.pageInternal);
      console.log("pageInternal length/keys:", Array.isArray(res.pageInternal) ? res.pageInternal.length : Object.keys(res.pageInternal));
      if (Array.isArray(res.pageInternal)) {
        console.log("Model names:", res.pageInternal.map(m => m.name));
      }
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
