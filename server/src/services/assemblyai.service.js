// ============================================
// assemblyai.service.js - Speech-to-Text Service
// ============================================
// Converts audio recordings to text using
// AssemblyAI's transcription API.
//
// Used when candidates answer questions verbally:
//   1. Frontend records audio via MediaRecorder
//   2. Sends audio blob to backend via multer
//   3. This service transcribes it to text
//
// Reference: async/await, try-catch - reference-javascript.md
// ============================================

import { AssemblyAI } from 'assemblyai';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Initialize AssemblyAI client with API key
const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY,
});

/**
 * Convert audio buffer to text using AssemblyAI.
 *
 * Steps:
 * 1. Save buffer to a temporary file (AssemblyAI needs a file path)
 * 2. Transcribe the audio file
 * 3. Delete the temporary file
 * 4. Return the transcribed text
 *
 * @param {Buffer} audioBuffer - The audio file buffer from multer
 * @param {string} originalName - Original filename (for extension)
 * @returns {string} - Transcribed text
 */
export const transcribeAudio = async (audioBuffer, originalName) => {
  // Create a temporary file path
  // Reference: path.join(), os.tmpdir() - Node.js built-in modules
  const extension = path.extname(originalName) || '.webm';
  const tempPath = path.join(os.tmpdir(), `interview-audio-${Date.now()}${extension}`);

  try {
    // Step 1: Save the audio buffer to a temporary file
    fs.writeFileSync(tempPath, audioBuffer);

    // Step 2: Transcribe the audio using AssemblyAI
    // speech_models (plural, array) is required in newer versions of the API
    const transcript = await client.transcripts.transcribe({
      audio: tempPath,
      speech_models: ['universal-2'],
    });

    // Step 3: Check if transcription was successful
    if (transcript.status === 'error') {
      throw new Error(`Transcription failed: ${transcript.error}`);
    }

    // Return the transcribed text (or a fallback message)
    return transcript.text || '[No speech detected in the recording]';
  } catch (error) {
    console.error('AssemblyAI Transcription Error:', error.message);
    throw new Error('Speech-to-text service is currently unavailable.');
  } finally {
    // Step 4: Always delete the temporary file to free up space
    // Reference: try-finally for cleanup - reference-javascript.md
    try {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch (cleanupError) {
      console.error('Temp file cleanup error:', cleanupError.message);
    }
  }
};
