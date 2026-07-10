import { GoogleGenAI } from '@google/genai';
import { GEMINI_CIVIC_PROMPT } from '../utils/geminiPrompt.js';
import { AiResponseParser } from '../utils/aiResponseParser.js';

export class GeminiService {
  /**
   * Analyzes a complaint image using Gemini 2.5 Flash Vision.
   * @param {string} apiKey - The Gemini API key to use for this call.
   * @param {string|Buffer} imageInput - Base64 string (data URL or raw) or Buffer.
   * @param {string|Buffer} imageInput - Base64 string (data URL or raw) or Buffer.
   * @param {string} [mimeType='image/jpeg'] - The image mime type.
   * @param {string} [modelName=null] - The model name to override the default.
   * @returns {Promise<object>} The validated structured JSON response.
   */
  static async analyzeImage(apiKey, imageInput, mimeType = 'image/jpeg', modelName = null) {
    if (!apiKey) {
      throw new Error('API key is required for Gemini service call');
    }

    let base64Data = '';
    let resolvedMimeType = mimeType;

    if (Buffer.isBuffer(imageInput)) {
      base64Data = imageInput.toString('base64');
    } else if (typeof imageInput === 'string') {
      if (imageInput.startsWith('data:')) {
        const matches = imageInput.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          resolvedMimeType = matches[1];
          base64Data = matches[2];
        } else {
          throw new Error('Invalid base64 data URL format');
        }
      } else {
        base64Data = imageInput;
      }
    } else {
      throw new Error('Unsupported image input type. Expected string (base64) or Buffer.');
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = modelName || process.env.GEMINI_MODEL || 'gemini-3.5-flash';

    const apiCallPromise = ai.models.generateContent({
      model: model,
      contents: [
        {
          inlineData: {
            mimeType: resolvedMimeType,
            data: base64Data
          }
        },
        GEMINI_CIVIC_PROMPT
      ]
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request Timeout')), 60000)
    );

    const response = await Promise.race([apiCallPromise, timeoutPromise]);

    const text = response.text;
    if (!text) {
      throw new Error('Gemini model returned empty response text');
    }

    return AiResponseParser.parse(text);
  }
}
