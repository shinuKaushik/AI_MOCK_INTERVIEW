// ============================================
// resume.service.js - Resume Service
// ============================================
// Handles resume upload, PDF text extraction,
// and storing resume data in MongoDB.
// Reference: pdf-parse for PDF extraction
// Reference: async/await - reference-javascript.md
// ============================================

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import Resume from '../models/Resume.model.js';

/**
 * Parse a PDF buffer and extract text content.
 * Uses pdfjs-dist (same approach as the ATS Resume Analyzer project).
 *
 * @param {Buffer} pdfBuffer - The PDF file buffer from multer
 * @returns {string} - Extracted text from all pages
 */
export const parseResumePDF = async (pdfBuffer) => {
  try {
    // Convert Buffer to Uint8Array (required by pdfjs-dist)
    const uint8Array = new Uint8Array(
      pdfBuffer.buffer,
      pdfBuffer.byteOffset,
      pdfBuffer.byteLength
    );

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;

    let extractedText = '';

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const strings = content.items.map((item) => item.str);
      extractedText += strings.join(' ');
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from the PDF');
    }

    return extractedText;
  } catch (error) {
    console.error('PDF Parse Error:', error.message);
    throw new Error('Failed to parse PDF. Please upload a valid PDF file.');
  }
};

/**
 * Save or update a user's resume in the database.
 *
 * @param {string} userId - The user's MongoDB ID
 * @param {string} fileName - Original filename
 * @param {string} extractedText - Text extracted from PDF
 * @returns {object} - The saved resume document
 */
export const saveResume = async (userId, fileName, extractedText) => {
  // Update existing resume or create a new one
  // Reference: findOneAndUpdate with upsert - reference-mongodb.md
  const resume = await Resume.findOneAndUpdate(
    { userId },
    { userId, fileName, extractedText },
    { returnDocument: 'after', upsert: true }
  );

  return resume;
};

/**
 * Get a user's saved resume.
 *
 * @param {string} userId - The user's MongoDB ID
 * @returns {object|null} - The resume document or null
 */
export const getUserResume = async (userId) => {
  const resume = await Resume.findOne({ userId }).select('-__v');
  return resume;
};
