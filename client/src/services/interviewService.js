// ============================================
// interviewService.js - Interview API Calls
// ============================================
// All API calls related to the interview flow.
// Reference: Axios POST/GET, FormData - reference-javascript.md
// ============================================

import API from './api.js';

/**
 * Upload a PDF resume and get extracted text.
 */
const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append('resume', file);

  const response = await API.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

/**
 * Get the user's saved resume.
 */
const getResume = async () => {
  const response = await API.get('/resume');
  return response.data.data;
};

/**
 * Start a new interview session.
 */
const startInterview = async (role, resumeText, totalQuestions) => {
  const response = await API.post('/interview/start', { role, resumeText, totalQuestions });
  return response.data.data;
};

/**
 * Submit a text answer for the current question.
 */
const submitTextAnswer = async (interviewId, answer) => {
  const response = await API.post(`/interview/${interviewId}/answer`, { answer });
  return response.data.data;
};

/**
 * Transcribe an audio blob to text using AssemblyAI.
 */
const transcribeAudio = async (audioBlob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'answer.webm');

  const response = await API.post('/interview/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

/**
 * Submit code for evaluation.
 */
const submitCode = async (interviewId, code, language) => {
  const response = await API.post(`/interview/${interviewId}/code`, { code, language });
  return response.data.data;
};

/**
 * End the interview and get feedback.
 */
const endInterview = async (interviewId) => {
  const response = await API.post(`/interview/${interviewId}/end`);
  return response.data.data;
};

/**
 * Get interview details by ID.
 */
const getInterview = async (interviewId) => {
  const response = await API.get(`/interview/${interviewId}`);
  return response.data.data;
};

export {
  uploadResume,
  getResume,
  startInterview,
  submitTextAnswer,
  transcribeAudio,
  submitCode,
  endInterview,
  getInterview,
};
