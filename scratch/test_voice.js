import dotenv from 'dotenv';
import { GeminiRotationService } from '../src/services/geminiRotation.service.js';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

async function test() {
  try {
    console.log('Keys loaded from environment:', GeminiRotationService.getApiKeys());
    
    const apiKeys = GeminiRotationService.getApiKeys();
    if (apiKeys.length === 0) {
      console.error('No keys found');
      return;
    }

    const ai = new GoogleGenAI({ apiKey: apiKeys[0] });
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    console.log('Sending request to Gemini...');
    const response = await ai.models.generateContent({
      model: model,
      contents: 'Hi'
    });

    console.log('Response:', response.text);
  } catch (error) {
    console.error('Error during execution:', error);
  }
}

test();
