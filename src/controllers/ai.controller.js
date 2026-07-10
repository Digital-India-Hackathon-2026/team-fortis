import { GeminiRotationService } from '../services/geminiRotation.service.js';
import { GoogleGenAI } from '@google/genai';

export class AiController {
  static async analyzeImage(req, res, next) {
    try {
      const { image, description } = req.body;
      if (!image) {
        return res.status(400).json({ success: false, message: 'Image data is required' });
      }

      // Perform AI vision scanning using Rotation Service
      const analysis = await GeminiRotationService.analyzeImage(image);
      
      // Map suggestedDepartment to department for frontend compatibility
      analysis.department = analysis.suggestedDepartment;
      
      // Return the analysis JSON directly to match the frontend expectations
      return res.status(200).json(analysis);
    } catch (error) {
      console.error('AI Image Analysis Error:', error);
      next(error);
    }
  }

  static async voiceAssistant(req, res, next) {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ success: false, message: 'Query is required' });
      }

      const apiKeys = GeminiRotationService.getApiKeys();
      if (apiKeys.length === 0) {
        return res.status(503).json({ 
          success: false, 
          message: 'No Gemini API keys configured. Please set GEMINI_API_KEYS.' 
        });
      }

      // Use the first key for assistant chat
      const ai = new GoogleGenAI({ apiKey: apiKeys[0] });
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

      const prompt = `You are CiviqAI Voice/Chat Assistant, an AI companion built to help citizens report and track municipal/civic issues.
Help the user with their municipal query politely, concisely, and focus on civic matters like pothole reports, waste management, sanitation, streetlights, or drainage.

User query: ${query}`;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt
      });

      const reply = response.text || "I'm sorry, I couldn't generate a response.";
      return res.status(200).json({ reply });
    } catch (error) {
      console.error('Voice Assistant Error:', error);
      next(error);
    }
  }
}
