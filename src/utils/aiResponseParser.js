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

    // Required fields check & default assignments
    const requiredKeys = ['isCivicIssue', 'category', 'subcategory', 'severity', 'suggestedDepartment', 'summary', 'confidence', 'visibleIssues', 'requiresManualReview', 'reviewReason'];
    for (const key of requiredKeys) {
      if (!(key in data)) {
        data[key] = null;
      }
    }

    // Validate isCivicIssue
    if (typeof data.isCivicIssue !== 'boolean') {
      data.isCivicIssue = false;
    }

    // Validate confidence
    if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 100) {
      data.confidence = 50;
    }

    // Default fallbacks for missing/null content
    if (!data.category) data.category = 'Other';
    if (!data.subcategory) data.subcategory = 'Other';
    if (!data.suggestedDepartment) data.suggestedDepartment = 'Other';
    if (!data.summary) data.summary = 'No description available';
    if (!Array.isArray(data.visibleIssues)) data.visibleIssues = [];
    if (typeof data.requiresManualReview !== 'boolean') data.requiresManualReview = true;

    // Validate severity enum
    const allowedSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (!data.severity) {
      data.severity = 'LOW';
    }
    const severityUpper = String(data.severity).toUpperCase().trim();
    if (!allowedSeverities.includes(severityUpper)) {
      data.severity = 'LOW';
    } else {
      data.severity = severityUpper; // normalize
    }

    return data;
  }
}
