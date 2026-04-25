// ============================================
// gemini.service.js - Gemini AI Service
// ============================================
// A wrapper around the Gemini API.
// Other services (interview, feedback, etc.)
// use this to send prompts to Gemini.
// Reference: async/await, try-catch - reference-javascript.md
// ============================================

import { generateContent } from '../config/gemini.config.js';

/**
 * Send a prompt to Gemini and get the text response.
 */
export const askGemini = async (prompt) => {
  try {
    const response = await generateContent(prompt);

    if (!response) {
      throw new Error('Gemini returned an empty response');
    }

    return response;
  } catch (error) {
    console.error('Gemini Service Error:', error.message);
    throw new Error('The AI service is currently unavailable. Please try again later.');
  }
};
