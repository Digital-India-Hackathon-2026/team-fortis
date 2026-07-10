import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const keys = (process.env.GEMINI_API_KEYS || '').split(',');
const ai = new GoogleGenAI({ apiKey: keys[0] });

async function test(modelName) {
  try {
    console.log(`Testing model: ${modelName}...`);
    const start = Date.now();
    const response = await ai.models.generateContent({
      model: modelName,
      contents: 'Hello, respond with exactly "OK" if you hear me.'
    });
    console.log(`Success! Time: ${Date.now() - start}ms, Response:`, response.text.trim());
  } catch (err) {
    console.log(`Failed for ${modelName}:`, err.message);
  }
}

async function run() {
  await test('gemini-1.5-flash');
  await test('gemini-1.5-flash-latest');
  await test('gemini-1.5-flash-8b');
  await test('gemini-2.0-flash-exp');
  await test('gemini-2.5-flash');
  await test('gemini-3.5-flash');
}
run();
