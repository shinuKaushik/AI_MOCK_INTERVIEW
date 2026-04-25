// ============================================
// resume.routes.js - Resume Routes
// ============================================
// Defines the URLs for resume operations:
//   POST /api/resume/upload → Upload and parse PDF resume
//   GET  /api/resume        → Get saved resume
// Reference: Router, middleware chaining - reference-backend.md
// ============================================

import { Router } from 'express';
import { uploadResume, getResume } from '../controllers/resume.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import { uploadResume as multerUpload } from '../middleware/upload.middleware.js';

const router = Router();

// All resume routes require authentication
router.use(authenticate);

// POST /api/resume/upload - Upload PDF resume
// multerUpload handles the file, then controller processes it
router.post('/upload', multerUpload, uploadResume);

// GET /api/resume - Get the user's saved resume
router.get('/', getResume);

export default router;
