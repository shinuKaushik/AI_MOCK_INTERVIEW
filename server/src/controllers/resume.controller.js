// ============================================
// resume.controller.js - Resume Controller
// ============================================
// Handles HTTP requests for resume operations:
//   - Upload and parse PDF resume
//   - Get saved resume
// Reference: req.file (multer), res.json() - reference-backend.md
// ============================================

import * as resumeService from '../services/resume.service.js';

/**
 * POST /api/resume/upload
 * Upload a PDF resume, extract text, and save to database.
 */
export const uploadResume = async (req, res, next) => {
  try {
    // Check if file was uploaded (multer attaches it to req.file)
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded. Please select a PDF.' });
    }

    // Step 1: Parse the PDF and extract text
    const extractedText = await resumeService.parseResumePDF(req.file.buffer);

    // Step 2: Save the resume to database
    const resume = await resumeService.saveResume(
      req.user._id,
      req.file.originalname,
      extractedText
    );

    // Return the extracted text and resume info
    return res.json({
      success: true,
      data: {
        resumeId: resume._id,
        fileName: resume.fileName,
        preview: extractedText.substring(0, 500),
        text: extractedText,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/resume
 * Get the current user's saved resume.
 */
export const getResume = async (req, res, next) => {
  try {
    const resume = await resumeService.getUserResume(req.user._id);

    if (!resume) {
      return res.status(404).json({ success: false, message: 'No resume found. Please upload one.' });
    }

    return res.json({
      success: true,
      data: {
        resumeId: resume._id,
        fileName: resume.fileName,
        preview: resume.extractedText.substring(0, 500),
        text: resume.extractedText,
      },
    });
  } catch (error) {
    next(error);
  }
};
