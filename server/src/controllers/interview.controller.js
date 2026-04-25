// ============================================
// interview.controller.js - Interview Controller
// ============================================
// Handles HTTP requests for the interview flow:
//   - Start a new interview
//   - Submit an answer (text or transcribed audio)
//   - Submit code for evaluation
//   - End interview and get feedback
//   - Stream audio for a question
// Reference: req.body, req.params, res.json() - reference-backend.md
// ============================================

import * as interviewService from '../services/interview.service.js';
import { transcribeAudio } from '../services/assemblyai.service.js';
import { streamAudio } from '../services/murf.service.js';

/**
 * POST /api/interview/start
 * Start a new interview session.
 * Body: { role, resumeText, totalQuestions }
 */
export const startInterview = async (req, res, next) => {
  try {
    const { role, resumeText, totalQuestions } = req.body;

    if (!role) {
      return res.status(400).json({ success: false, message: 'Please select a role for the interview.' });
    }
    if (!resumeText) {
      return res.status(400).json({ success: false, message: 'Please upload your resume first.' });
    }

    const result = await interviewService.startInterview(
      req.user._id,
      role,
      resumeText,
      req.user.name,
      totalQuestions || 5
    );

    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/interview/:id/answer
 * Submit a text answer for the current question.
 * Body: { answer }
 */
export const submitTextAnswer = async (req, res, next) => {
  try {
    const { answer } = req.body;

    if (!answer || answer.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide an answer.' });
    }

    const result = await interviewService.submitAnswer(
      req.params.id,
      req.user._id,
      answer
    );

    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/interview/:id/answer-audio
 * Submit a voice answer (audio file).
 * Uses multer to receive the audio blob, then AssemblyAI to transcribe.
 */
export const submitVoiceAnswer = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No audio file received.' });
    }

    // Step 1: Transcribe the audio to text using AssemblyAI
    const transcribedText = await transcribeAudio(
      req.file.buffer,
      req.file.originalname || 'answer.webm'
    );

    // Step 2: Submit the transcribed text as the answer
    const result = await interviewService.submitAnswer(
      req.params.id,
      req.user._id,
      transcribedText
    );

    // Include the transcribed text in the response so frontend can display it
    return res.json({
      success: true,
      data: {
        ...result,
        transcribedText,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/interview/:id/code
 * Submit code for a coding question.
 * Body: { code, language }
 */
export const submitCode = async (req, res, next) => {
  try {
    const { code, language } = req.body;

    if (!code || code.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please write some code before submitting.' });
    }

    const evaluation = await interviewService.submitCode(
      req.params.id,
      req.user._id,
      code,
      language || 'javascript'
    );

    return res.json({ success: true, data: evaluation });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/interview/:id/end
 * End the interview and generate feedback.
 */
export const endInterview = async (req, res, next) => {
  try {
    const result = await interviewService.endInterview(
      req.params.id,
      req.user._id
    );

    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/interview/:id
 * Get interview details by ID.
 */
export const getInterview = async (req, res, next) => {
  try {
    const interview = await interviewService.getInterviewById(
      req.params.id,
      req.user._id
    );

    return res.json({ success: true, data: interview });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/interview/transcribe
 * Transcribe audio without submitting as an answer.
 * Used for the preview-before-submit flow.
 */
export const transcribeOnly = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No audio file received.' });
    }

    const text = await transcribeAudio(
      req.file.buffer,
      req.file.originalname || 'answer.webm'
    );

    return res.json({ success: true, data: { text } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/interview/:id/speak
 * Stream audio for given text using Murf AI.
 * Body: { text }
 */
export const speakText = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: 'No text provided for speech.' });
    }

    // Stream audio directly to the response
    await streamAudio(text, res);
  } catch (error) {
    next(error);
  }
};
