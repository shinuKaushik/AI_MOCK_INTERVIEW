// ============================================
// history.routes.js - History Routes
// ============================================
// All interview history API endpoints:
//   GET    /api/history        → Get paginated history
//   DELETE /api/history/clear  → Clear ALL history
//   GET    /api/history/:id    → Get single entry
//   DELETE /api/history/:id    → Delete single entry
//
// IMPORTANT: /clear must come BEFORE /:id
// Otherwise Express thinks "clear" is an ID!
// Reference: Router, route ordering - reference-backend.md
// ============================================

import { Router } from 'express';
import {
  getHistory,
  getHistoryItem,
  deleteHistoryItem,
  clearHistory,
} from '../controllers/history.controller.js';
import authenticate from '../middleware/auth.middleware.js';

const router = Router();

// All history routes require authentication
router.use(authenticate);

// GET /api/history - Get user's paginated history
router.get('/', getHistory);

// DELETE /api/history/clear - Clear ALL user history
// This MUST be defined BEFORE /:id route!
router.delete('/clear', clearHistory);

// GET /api/history/:id - Get a specific interview entry
router.get('/:id', getHistoryItem);

// DELETE /api/history/:id - Delete a specific interview entry
router.delete('/:id', deleteHistoryItem);

export default router;
