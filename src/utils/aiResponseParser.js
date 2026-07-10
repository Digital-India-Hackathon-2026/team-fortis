/**
 * Helper to clean and validate Gemini Vision JSON responses.
 */
export class AiResponseParser {
  /**
   * Parse and validate the response string from Gemini.
   * @param {string} rawResponse 
   * @returns {object} Validated response object
   */
  static parse(rawResponse) {
    if (!rawResponse || typeof rawResponse !== 'string') {
      throw new Error('Response is empty or not a string');
    }

    // Attempt to extract JSON from markdown wrappers if present
    let cleanText = rawResponse.trim();
    if (cleanText.startsWith('```')) {
      // Remove opening block
      cleanText = cleanText.replace(/^```(?:json)?\s*/i, '');
      // Remove closing block
      cleanText = cleanText.replace(/\s*```$/, '');
      cleanText = cleanText.trim();
    }

    let data;
    try {
      data = JSON.parse(cleanText);
    } catch (err) {
      throw new Error(`Failed to parse response as JSON: ${err.message}. Raw: ${rawResponse}`);
    }

    // Required fields check
    const requiredKeys = ['isCivicIssue', 'category', 'subcategory', 'severity', 'suggestedDepartment', 'summary', 'confidence', 'visibleIssues', 'requiresManualReview', 'reviewReason'];
    for (const key of requiredKeys) {
      if (!(key in data)) {
        throw new Error(`Missing required key: "${key}"`);
      }
    }

    // Validate isCivicIssue
    if (typeof data.isCivicIssue !== 'boolean') {
      throw new Error('Property "isCivicIssue" must be a boolean');
    }

    // Validate confidence
    if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 100) {
      throw new Error(`Property "confidence" must be a number between 0 and 100, got: ${data.confidence}`);
    }

    // Validate severity enum
    const allowedSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const severityUpper = String(data.severity).toUpperCase().trim();
    if (!allowedSeverities.includes(severityUpper)) {
      throw new Error(`Property "severity" must be one of LOW, MEDIUM, HIGH, CRITICAL. Got: ${data.severity}`);
    }
    data.severity = severityUpper; // normalize

    // Validate arrays
    if (!Array.isArray(data.visibleIssues)) {
      throw new Error('Property "visibleIssues" must be an array');
    }

    // Validate requiresManualReview
    if (typeof data.requiresManualReview !== 'boolean') {
      throw new Error('Property "requiresManualReview" must be a boolean');
    }

    return data;
  }
}
