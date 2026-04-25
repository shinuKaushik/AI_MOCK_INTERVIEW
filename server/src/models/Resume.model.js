// ============================================
// Resume.model.js - Resume Database Schema
// ============================================
// Stores uploaded resume data for each user.
// The extracted text is used to generate
// interview questions tailored to the candidate.
// Reference: mongoose.Schema - reference-mongodb.md
// ============================================

import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    // The user who uploaded this resume
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Original filename of the uploaded PDF
    fileName: {
      type: String,
      required: true,
    },

    // Extracted text content from the PDF
    extractedText: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Resume = mongoose.model('Resume', resumeSchema);

export default Resume;
