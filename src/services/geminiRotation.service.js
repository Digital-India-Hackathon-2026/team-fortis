import { GeminiService } from './gemini.service.js';

// Keeps track of the current key index for round-robin rotation
let currentKeyIndex = 0;

// Set of status codes that trigger a retry
const RETRY_STATUS_CODES = [429, 500, 502, 503, 504];

// Cooldown tracker for keys to temporarily skip them if they failed recently
const keyCooldowns = {};

export class GeminiRotationService {
  /**
   * Helper function to wait/sleep
   * @param {number} ms 
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Returns the list of configured API keys.
   * @returns {string[]}
   */
  static getApiKeys() {
    const keysString = process.env.GEMINI_API_KEYS || '';
    return keysString
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);
  }

  /**
   * Analyzes an image with round-robin API key rotation, retry logic, and exponential backoff.
   * @param {string|Buffer} imageInput 
   * @param {string} [mimeType='image/jpeg'] 
   * @returns {Promise<object>} The parsed JSON result
   */
  static async analyzeImage(imageInput, mimeType = 'image/jpeg') {
    const apiKeys = this.getApiKeys();
    if (apiKeys.length === 0) {
      const err = new Error('No Gemini API keys configured. Please set GEMINI_API_KEYS in your environment.');
      err.status = 503;
      throw err;
    }

    const primaryModel = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
    try {
      return await this._analyzeWithModel(apiKeys, primaryModel, imageInput, mimeType);
    } catch (error) {
      const fallbacks = ['gemini-flash-lite-latest', 'gemini-2.0-flash', 'gemini-flash-latest'];
      for (const fallbackModel of fallbacks) {
        if (fallbackModel === primaryModel) continue;
        console.warn(`[Rotation] Primary model failed or is overloaded. Falling back to: ${fallbackModel}`);
        try {
          return await this._analyzeWithModel(apiKeys, fallbackModel, imageInput, mimeType);
        } catch (fallbackError) {
          console.error(`[Rotation] Fallback model ${fallbackModel} also failed.`);
        }
      }
      throw error;
    }
  }

  static async _analyzeWithModel(apiKeys, modelName, imageInput, mimeType) {
    let attempt = 0;
    const maxAttempts = apiKeys.length;
    const errorsList = [];

    while (attempt < maxAttempts) {
      // Pick key using round-robin index
      const keyIdx = currentKeyIndex;
      currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
      
      const apiKey = apiKeys[keyIdx];
      const keyName = `Gemini Key #${keyIdx + 1}`;
      attempt++;

      // Check if key is in cooldown for this specific model
      const now = Date.now();
      const cooldownKey = `${keyIdx}-${modelName}`;
      if (keyCooldowns[cooldownKey] && keyCooldowns[cooldownKey] > now) {
        console.log(`[Rotation] Skipping ${keyName} - currently in cooldown for model ${modelName}`);
        continue;
      }

      console.log(`[Rotation] Attempting analysis using ${keyName} with model ${modelName}`);

      try {
        // Attempt the call
        const result = await GeminiService.analyzeImage(apiKey, imageInput, mimeType, modelName);
        return result;
      } catch (error) {
        // Identify error status
        let status = error.status || error.statusCode || (error.response && error.response.status);
        
        // Check for specific error message mappings or string checks if status is not explicitly set
        const errMsg = error.message ? error.message.toLowerCase() : '';
        if (!status) {
          if (errMsg.includes('429') || errMsg.includes('too many requests')) status = 429;
          else if (errMsg.includes('500')) status = 500;
          else if (errMsg.includes('502')) status = 502;
          else if (errMsg.includes('503')) status = 503;
          else if (errMsg.includes('504')) status = 504;
          else if (errMsg.includes('timeout') || errMsg.includes('etimedout')) status = 408; // Timeout
        }

        const isTimeout = status === 408 || errMsg.includes('timeout');
        // Retry on rate limits (429), timeouts (408), temporary overloads (503), or key-restricted access (404/403)
        const shouldRetry = RETRY_STATUS_CODES.includes(status) || isTimeout || status === 404 || status === 403;

        console.error(`[Rotation] ${keyName} failed for model ${modelName}. Status: ${status || 'unknown'}. Message: ${error.message}`);

        errorsList.push({ key: keyName, status, message: error.message });

        if (shouldRetry) {
          // Put this key in cooldown (15 seconds to allow free-tier rate limits to reset)
          const cooldownKey = `${keyIdx}-${modelName}`;
          keyCooldowns[cooldownKey] = Date.now() + 15000;

          if (status === 503 || status === 404 || status === 403) {
            console.log(`[Rotation] Key failed with status ${status}. Retrying immediately with the next key...`);
          } else {
            // Apply exponential backoff (e.g., 2^attempt * 100ms)
            const backoffTime = Math.pow(2, attempt) * 100;
            console.log(`[Rotation] Retrying in ${backoffTime}ms with the next key...`);
            await this.sleep(backoffTime);
          }
        } else {
          // Do NOT retry for 400, 401
          console.error(`[Rotation] Non-retryable error received. Aborting rotation.`);
          throw error;
        }
      }
    }

    // If we've exhausted all keys, throw 503
    const finalError = new Error(`All Gemini API keys exhausted for model ${modelName}. Failures: ${JSON.stringify(errorsList)}`);
    finalError.status = 503;
    throw finalError;
  }
}
