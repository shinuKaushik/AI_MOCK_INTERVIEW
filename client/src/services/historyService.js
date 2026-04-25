// ============================================
// historyService.js - History API Calls
// ============================================
// Reference: Axios GET/DELETE, query params - reference-javascript.md
// ============================================

import API from './api.js';

// Fetch paginated interview history
// Reference: Template literals, async/await - reference-javascript.md
const getHistory = async (page = 1, limit = 10) => {
  const response = await API.get(`/history?page=${page}&limit=${limit}`);
  return response.data.data;
};

// Delete a single interview entry
const deleteHistoryItem = async (id) => {
  const response = await API.delete(`/history/${id}`);
  return response.data;
};

// Clear all interview history
const clearHistory = async () => {
  const response = await API.delete('/history/clear');
  return response.data;
};

export { getHistory, deleteHistoryItem, clearHistory };
