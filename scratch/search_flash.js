import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

async function listFlashModels() {
  try {
    const keysString = process.env.GEMINI_API_KEYS || '';
    const apiKeys = keysString.split(',').map(k => k.trim()).filter(Boolean);
    
    const ai = new GoogleGenAI({ apiKey: apiKeys[0] });
    const response = await ai.models.list();
    console.log('Available Flash models:');
    if (response.pageInternal) {
      for (const m of response.pageInternal) {
        if (m && m.name && m.name.includes('flash')) {
          console.log(`- ${m.name}`);
        }
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

listFlashModels();
