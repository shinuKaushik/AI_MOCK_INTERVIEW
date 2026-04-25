// ============================================
// interview.routes.js - Interview Routes
// ============================================
// Defines the URLs for the interview flow:
//   POST /api/interview/start          → Start new interview
//   POST /api/interview/:id/answer     → Submit text answer
//   POST /api/interview/:id/answer-audio → Submit voice answer
//   POST /api/interview/:id/code       → Submit code
//   POST /api/interview/:id/end        → End interview
//   GET  /api/interview/:id            → Get interview details
//   POST /api/interview/:id/speak      → Stream audio for text
// Reference: Router, route parameters - reference-backend.md
// ============================================

import { Router } from 'express';
import {
  startInterview,
  submitTextAnswer,
  submitVoiceAnswer,
  submitCode,
  endInterview,
  getInterview,
  transcribeOnly,
  speakText,
} from '../controllers/interview.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import { uploadAudio } from '../middleware/upload.middleware.js';

const router = Router();

// All interview routes require authentication
router.use(authenticate);

// POST /api/interview/start - Start a new interview
router.post('/start', startInterview);

// POST /api/interview/transcribe - Transcribe audio only (for preview)
router.post('/transcribe', uploadAudio, transcribeOnly);

// POST /api/interview/:id/answer - Submit a text answer
router.post('/:id/answer', submitTextAnswer);

// POST /api/interview/:id/answer-audio - Submit a voice answer (audio file)
// uploadAudio middleware handles the audio blob from MediaRecorder
router.post('/:id/answer-audio', uploadAudio, submitVoiceAnswer);

// POST /api/interview/:id/code - Submit code for evaluation
router.post('/:id/code', submitCode);

// POST /api/interview/:id/end - End interview and get feedback
router.post('/:id/end', endInterview);

// GET /api/interview/:id - Get interview details
router.get('/:id', getInterview);

// POST /api/interview/:id/speak - Stream audio for text (Murf TTS)
router.post('/:id/speak', speakText);

export default router;
