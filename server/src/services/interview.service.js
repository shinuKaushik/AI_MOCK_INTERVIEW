// ============================================
// interview.service.js - Interview Service
// ============================================
// Core business logic for the interview flow:
//   1. Start interview → generate questions
//   2. Get next question → with Murf audio
//   3. Submit answer → process and get follow-up
//   4. Submit code → evaluate with AI
//   5. End interview → generate feedback
//
// Reference: async/await, Array methods - reference-javascript.md
// ============================================

import Interview from '../models/Interview.model.js';
import { askGemini } from './gemini.service.js';
import { generateAudio } from './murf.service.js';
import { parseGeminiJSON } from '../utils/prompts.utils.js';
import {
  GENERATE_QUESTIONS_PROMPT,
  INTERVIEW_GREETING_PROMPT,
  FOLLOW_UP_PROMPT,
  FEEDBACK_PROMPT,
  EVALUATE_CODE_PROMPT,
  buildConversationHistory,
} from '../constants/prompts.js';

/**
 * Start a new interview session.
 * Generates questions based on resume and role, then returns greeting with audio.
 */
export const startInterview = async (userId, role, resumeText, candidateName, totalQuestions = 5) => {
  // Step 1: Generate interview questions using Gemini AI
  const questionsPrompt = GENERATE_QUESTIONS_PROMPT(role, resumeText, totalQuestions);
  const questionsResponse = await askGemini(questionsPrompt);
  const aiQuestions = parseGeminiJSON(questionsResponse);

  // Step 2: Prepend "Tell me about yourself" as the first question (like real interviews)
  const introQuestion = {
    text: 'Tell me about yourself — your background, what you\'re currently working on, and what excites you about this role.',
    type: 'behavioral',
    isCodeQuestion: false,
  };
  const questions = [introQuestion, ...aiQuestions];

  // Step 3: Create the interview document in MongoDB
  const interview = await Interview.create({
    userId,
    role,
    resumeText,
    totalQuestions: questions.length,
    currentQuestion: 1,
    questions,
    status: 'in_progress',
  });

  // Step 4: Generate a greeting message
  const greetingPrompt = INTERVIEW_GREETING_PROMPT(role, candidateName);
  const greeting = await askGemini(greetingPrompt);

  // Step 5: Add greeting as a message (the greeting naturally leads into "tell me about yourself")
  interview.messages.push({
    role: 'interviewer',
    content: greeting,
    timestamp: new Date(),
  });

  // Step 6: Generate audio for the greeting (includes "tell me about yourself" via prompt)
  let audioBase64 = null;
  try {
    audioBase64 = await generateAudio(greeting);
  } catch (audioError) {
    console.error('Audio generation failed, continuing without audio:', audioError.message);
  }

  // Step 7: Store audio in the interview document for replay on page reload
  interview.lastAudio = audioBase64 || '';
  await interview.save();

  return {
    interviewId: interview._id,
    greeting: greeting,
    currentQuestion: 1,
    totalQuestions: questions.length,
    question: introQuestion,
    audio: audioBase64,
  };
};

/**
 * Submit an answer and get the next question.
 * Stores the answer in conversation history and generates a follow-up.
 */
export const submitAnswer = async (interviewId, userId, answerText) => {
  // Step 1: Find the interview and verify ownership
  const interview = await Interview.findOne({ _id: interviewId, userId });
  if (!interview) throw new Error('Interview not found');
  if (interview.status === 'completed') throw new Error('Interview already completed');

  // Step 2: Store the candidate's answer in messages
  interview.messages.push({
    role: 'candidate',
    content: answerText,
    timestamp: new Date(),
  });

  // Step 3: Check if there are more questions
  const nextQuestionIndex = interview.currentQuestion; // 0-based index for next
  if (nextQuestionIndex >= interview.questions.length) {
    // No more questions — interview is complete
    interview.status = 'completed';
    await interview.save();

    // Generate farewell audio
    const farewellText = 'Thank you for completing the interview! I really enjoyed our conversation. Let me prepare your detailed feedback report.';
    let farewellAudio = null;
    try {
      farewellAudio = await generateAudio(farewellText);
    } catch (audioError) {
      console.error('Farewell audio failed:', audioError.message);
    }

    return { isComplete: true, message: farewellText, audio: farewellAudio };
  }

  // Step 4: Generate follow-up response using conversation context
  const conversationHistory = buildConversationHistory(interview.messages);
  const nextQuestion = interview.questions[nextQuestionIndex];

  const followUpPrompt = FOLLOW_UP_PROMPT(interview.role, conversationHistory, nextQuestion.text);
  const followUpResponse = await askGemini(followUpPrompt);

  // Add the interviewer's acknowledgment to messages
  interview.messages.push({
    role: 'interviewer',
    content: followUpResponse,
    timestamp: new Date(),
  });

  // Increment question counter
  interview.currentQuestion += 1;
  await interview.save();

  // Generate audio for acknowledgment + question together
  const spokenText = `${followUpResponse} ... ${nextQuestion.text}`;
  let audioBase64 = null;
  try {
    audioBase64 = await generateAudio(spokenText);
  } catch (audioError) {
    console.error('Audio generation failed, continuing without audio:', audioError.message);
  }

  // Store audio in interview for replay on page reload
  interview.lastAudio = audioBase64 || '';
  await interview.save();

  return {
    isComplete: false,
    response: followUpResponse,
    currentQuestion: interview.currentQuestion,
    totalQuestions: interview.totalQuestions,
    question: nextQuestion,
    audio: audioBase64,
  };
};

/**
 * Submit code for a coding question and get AI evaluation.
 */
/**
 * Submit code for a coding question — evaluates AND advances to next question.
 * No separate voice/text answer needed for code questions.
 */
export const submitCode = async (interviewId, userId, code, language) => {
  const interview = await Interview.findOne({ _id: interviewId, userId });
  if (!interview) {
    const error = new Error('Interview not found');
    error.statusCode = 404;
    throw error;
  }
  if (interview.status === 'completed') {
    const error = new Error('Interview already completed');
    error.statusCode = 400;
    throw error;
  }

  // Get the current coding question
  const questionIndex = interview.currentQuestion - 1;
  const question = interview.questions[questionIndex];
  const codeType = question.codeType || 'write';

  // Evaluate the code using Gemini (pass codeType for context-aware evaluation)
  const evalPrompt = EVALUATE_CODE_PROMPT(question.text, code, language, codeType);
  const evalResponse = await askGemini(evalPrompt);
  const evaluation = parseGeminiJSON(evalResponse);

  // Store the code submission
  interview.codeSubmissions.push({
    questionIndex,
    codeType,
    code,
    language,
    evaluation,
    timestamp: new Date(),
  });

  // Add to conversation history
  interview.messages.push({
    role: 'candidate',
    content: `[Code ${codeType} in ${language}] Score: ${evaluation.score}/100\n${code}`,
    timestamp: new Date(),
  });

  // Advance to next question (code submission counts as the answer)
  const nextQuestionIndex = interview.currentQuestion;
  if (nextQuestionIndex >= interview.questions.length) {
    interview.status = 'completed';
    await interview.save();

    const farewellText = 'Thank you for completing the interview! I really enjoyed our conversation. Let me prepare your detailed feedback report.';
    let farewellAudio = null;
    try {
      farewellAudio = await generateAudio(farewellText);
    } catch (audioError) {
      console.error('Farewell audio failed:', audioError.message);
    }

    return { evaluation, isComplete: true, audio: farewellAudio };
  }

  // Generate follow-up for next question
  const conversationHistory = buildConversationHistory(interview.messages);
  const nextQuestion = interview.questions[nextQuestionIndex];

  const followUpPrompt = FOLLOW_UP_PROMPT(interview.role, conversationHistory, nextQuestion.text);
  const followUpResponse = await askGemini(followUpPrompt);

  interview.messages.push({
    role: 'interviewer',
    content: followUpResponse,
    timestamp: new Date(),
  });

  interview.currentQuestion += 1;

  // Generate audio
  const spokenText = `${followUpResponse} ... ${nextQuestion.text}`;
  let audioBase64 = null;
  try {
    audioBase64 = await generateAudio(spokenText);
  } catch (audioError) {
    console.error('Audio generation failed:', audioError.message);
  }

  interview.lastAudio = audioBase64 || '';
  await interview.save();

  return {
    evaluation,
    isComplete: false,
    response: followUpResponse,
    currentQuestion: interview.currentQuestion,
    totalQuestions: interview.totalQuestions,
    question: nextQuestion,
    audio: audioBase64,
  };
};

/**
 * End the interview and generate detailed feedback.
 */
export const endInterview = async (interviewId, userId) => {
  const interview = await Interview.findOne({ _id: interviewId, userId });
  if (!interview) {
    const error = new Error('Interview not found');
    error.statusCode = 404;
    throw error;
  }

  // If already completed with feedback, return existing feedback
  if (interview.status === 'completed' && interview.feedback) {
    return {
      interviewId: interview._id,
      feedback: interview.feedback,
      overallScore: interview.overallScore,
    };
  }

  // Build conversation history for feedback generation
  const conversationHistory = buildConversationHistory(interview.messages);

  // Build code submissions summary
  let codeSubmissionsSummary = '';
  if (interview.codeSubmissions.length > 0) {
    codeSubmissionsSummary = interview.codeSubmissions
      .map((sub, i) => `Submission ${i + 1} (${sub.language}):\n${sub.code}\nEvaluation: ${JSON.stringify(sub.evaluation)}`)
      .join('\n\n');
  }

  // Generate feedback using Gemini
  const feedbackPrompt = FEEDBACK_PROMPT(interview.role, conversationHistory, codeSubmissionsSummary);
  const feedbackResponse = await askGemini(feedbackPrompt);
  const feedback = parseGeminiJSON(feedbackResponse);

  // Save feedback and mark interview as completed
  interview.feedback = feedback;
  interview.overallScore = feedback.overallScore || 0;
  interview.status = 'completed';
  await interview.save();

  return {
    interviewId: interview._id,
    feedback,
    overallScore: feedback.overallScore,
  };
};

/**
 * Get a single interview by ID (with ownership check).
 */
export const getInterviewById = async (interviewId, userId) => {
  const interview = await Interview.findOne({ _id: interviewId, userId }).select('-__v');
  if (!interview) {
    const error = new Error('Interview not found');
    error.statusCode = 404;
    throw error;
  }
  return interview;
};
