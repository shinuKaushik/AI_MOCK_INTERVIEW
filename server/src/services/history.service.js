// ============================================
// history.service.js - History Service
// ============================================
// Handles all database operations for the
// interview history feature.
// Reference: Mongoose queries, pagination - reference-mongodb.md
// ============================================

import Interview from '../models/Interview.model.js';

/**
 * Get paginated interview history for a user.
 *
 * @param {string} userId - The user's MongoDB ID
 * @param {number} page - Page number (starting from 1)
 * @param {number} limit - Number of items per page
 * @returns {object} - { entries, totalEntries, totalPages, currentPage }
 */
export const getUserHistory = async (userId, page = 1, limit = 10) => {
  // Calculate how many documents to skip
  const skip = (page - 1) * limit;

  // Run both queries in parallel for better performance
  // Reference: Promise.all() - reference-javascript.md
  const [entries, totalEntries] = await Promise.all([
    // Get the interview entries (sorted by newest first)
    // Only select fields needed for the history list view
    Interview.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('role status overallScore totalQuestions createdAt'),

    // Count total entries (for pagination info)
    Interview.countDocuments({ userId }),
  ]);

  return {
    entries,
    totalEntries,
    totalPages: Math.ceil(totalEntries / limit),
    currentPage: page,
  };
};

/**
 * Get a single interview entry with full details.
 */
export const getHistoryEntry = async (entryId, userId) => {
  const entry = await Interview.findOne({
    _id: entryId,
    userId,
  }).select('-__v');

  if (!entry) {
    throw new Error('Interview not found');
  }

  return entry;
};

/**
 * Delete a single interview entry.
 */
export const deleteHistoryEntry = async (entryId, userId) => {
  const entry = await Interview.findOneAndDelete({
    _id: entryId,
    userId,
  });

  if (!entry) {
    throw new Error('Interview not found');
  }

  return entry;
};

/**
 * Delete ALL interview entries for a user.
 */
export const clearUserHistory = async (userId) => {
  const result = await Interview.deleteMany({ userId });
  return { deletedCount: result.deletedCount };
};
