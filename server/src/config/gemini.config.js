// ============================================
// gemini.config.js - Gemini AI Client Setup
// ============================================
// Initializes the Google Generative AI client.
// Used by gemini.service.js to send prompts.
// Reference: async/await, try-catch - reference-javascript.md
// ============================================

import { GoogleGenAI } from "@google/genai";

// Create and configure the Gemini AI client
// The API key comes from your .env file
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// The model we'll use for all interview-related tasks
// gemini-2.5-flash is fast, smart, and great for conversation
const MODEL_NAME = "gemini-2.5-flash";

const generateContent = async (prompt) => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    throw new Error(`Gemini API failed: ${error.message}`);
  }
};

export { generateContent };
