// ============================================
// murf.service.js - Murf AI Text-to-Speech Service
// ============================================
// Converts text to speech using the Murf FALCON API.
// Streams base64-encoded audio chunks back to the
// caller for real-time playback.
//
// Murf FALCON Features:
//   - <130ms latency
//   - 1¢ per minute flat rate
//   - 35+ languages
//   - 99.38% pronunciation accuracy
//
// Reference: fetch() with streaming - reference-javascript.md
// ============================================

const MURF_BASE_URL = 'https://global.api.murf.ai/v1/speech/stream';
const MURF_VOICE_ID = 'en-US-natalie';
const MURF_LOCALE = 'en-US';

/**
 * Stream audio from Murf AI TTS API.
 *
 * Sends text to Murf FALCON and streams base64-encoded
 * audio chunks through an Express response object.
 *
 * @param {string} text - The text to convert to speech
 * @param {object} res - Express response object for streaming
 */
export const streamAudio = async (text, res) => {
  try {
    const payload = {
      text: text,
      voiceId: MURF_VOICE_ID,
      model: 'FALCON',
      multiNativeLocale: MURF_LOCALE,
      sampleRate: 24000,
      format: 'MP3',
    };

    // Set up request headers with API key authentication
    const headers = {
      'Content-Type': 'application/json',
      'api-key': process.env.MURF_API_KEY,
    };

    // Send request to Murf API with streaming enabled
    const response = await fetch(MURF_BASE_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    // Check if the API call was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Murf API Error:', errorText);
      throw new Error(`Murf API failed with status ${response.status}`);
    }

    // Set response headers for streaming text (base64 encoded audio)
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Read the response body as a stream
    const reader = response.body.getReader();

    // Process each chunk as it arrives
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Convert the binary chunk to base64 string and send to client
      // Reference: Buffer.from() for binary conversion
      const base64Chunk = Buffer.from(value).toString('base64');
      res.write(base64Chunk + '\n');
    }

    // End the response stream
    res.end();
  } catch (error) {
    console.error('Murf Service Error:', error.message);
    // If headers have already been sent (streaming started), end the response
    // instead of throwing, to avoid ERR_HTTP_HEADERS_SENT crash
    if (res.headersSent) {
      res.end();
      return;
    }
    throw new Error('Voice generation service is currently unavailable.');
  }
};

/**
 * Generate audio from Murf AI and return as base64 string.
 * (Non-streaming version - waits for complete audio)
 *
 * @param {string} text - The text to convert to speech
 * @returns {string} - Base64 encoded audio data
 */
export const generateAudio = async (text) => {
  try {
    // Add a brief pause at start to prevent Murf from clipping the first word
    const payload = {
      text: `[pause 1s] ${text}`,
      voiceId: MURF_VOICE_ID,
      model: 'FALCON',
      multiNativeLocale: MURF_LOCALE,
      sampleRate: 24000,
      format: 'MP3',
    };

    const headers = {
      'Content-Type': 'application/json',
      'api-key': process.env.MURF_API_KEY,
    };

    const response = await fetch(MURF_BASE_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Murf API Error:', errorText);
      throw new Error(`Murf API failed with status ${response.status}`);
    }

    // Read the entire response as an ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();

    // Convert to base64 string
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');

    return base64Audio;
  } catch (error) {
    console.error('Murf Generate Audio Error:', error.message);
    throw new Error('Voice generation service is currently unavailable.');
  }
};
