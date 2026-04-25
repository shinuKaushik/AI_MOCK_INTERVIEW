// ============================================
// history.controller.js - History Controller
// ============================================
// Handles HTTP requests for interview history:
//   - Get paginated history list
//   - Get a single interview entry
//   - Delete one entry
//   - Clear all history
// Reference: req.query, req.params - reference-backend.md
// ============================================

import * as historyService from '../services/history.service.js';

/**
 * GET /api/history?page=1&limit=10
 */
export const getHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await historyService.getUserHistory(req.user._id, page, limit);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/history/:id
 */
export const getHistoryItem = async (req, res, next) => {
  try {
    const entry = await historyService.getHistoryEntry(req.params.id, req.user._id);
    return res.json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/history/:id
 */
export const deleteHistoryItem = async (req, res, next) => {
  try {
    await historyService.deleteHistoryEntry(req.params.id, req.user._id);
    return res.json({ success: true, data: { message: 'Interview deleted' } });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/history/clear
 */
export const clearHistory = async (req, res, next) => {
  try {
    const result = await historyService.clearUserHistory(req.user._id);
    return res.json({ success: true, data: { message: 'All history cleared', deletedCount: result.deletedCount } });
  } catch (error) {
    next(error);
  }
};
