// ============================================
// prompts.utils.js - Prompt Helper Utilities
// ============================================
// Gemini sometimes returns responses with extra
// text or markdown formatting. These helpers clean
// up the response so we can safely parse the JSON.
// Reference: String methods, JSON.parse() - reference-javascript.md
// ============================================

/**
 * Clean and parse a JSON response from Gemini.
 *
 * Gemini might return JSON wrapped in markdown code blocks like:
 *   ```json
 *   {"key": "value"}
 *   ```
 *
 * This function strips those wrappers and parses the JSON.
 */
export const parseGeminiJSON = (text) => {
  try {
    // Step 1: Remove markdown code block wrappers if present
    let cleanText = text.trim();

    // Remove ```json ... ``` or ``` ... ```
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(?:json)?\s*\n?/, '');
      cleanText = cleanText.replace(/\n?```\s*$/, '');
    }

    // Step 2: Try to parse the cleaned text as JSON
    return JSON.parse(cleanText.trim());
  } catch (error) {
    console.error('Failed to parse Gemini JSON response:', error.message);
    console.error('Raw text was:', text);
    throw new Error('Failed to parse AI response. The AI returned an unexpected format.');
  }
};
