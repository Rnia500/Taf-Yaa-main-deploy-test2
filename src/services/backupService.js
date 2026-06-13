// src/services/backupService.js
const API_URL = import.meta.env.VITE_BACKUP_API_URL || '';

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const text = await res.text();
  if (!text) throw new Error('No response from server.');
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error(`Invalid response: ${text.slice(0, 100)}`); }
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
}

export const backupService = {
  async listBackups(userId) {
    const data = await apiFetch(`${API_URL}?action=list&userId=${userId}`);
    return data.backups || [];
  },

  // customName is now passed and stored in S3 metadata
  async createBackup(userId, customName = '') {
    return apiFetch(`${API_URL}?action=create`, {
      method: 'POST',
      body: JSON.stringify({ userId, customName }),
    });
  },

  async getDownloadUrl(key) {
    const data = await apiFetch(`${API_URL}?action=download`, {
      method: 'POST',
      body: JSON.stringify({ key }),
    });
    return data.url;
  },

  async restoreBackup(key, userId) {
    return apiFetch(`${API_URL}?action=restore`, {
      method: 'POST',
      body: JSON.stringify({ key, userId }),
    });
  },

  async deleteBackup(key) {
    return apiFetch(`${API_URL}?action=delete`, {
      method: 'POST',
      body: JSON.stringify({ key }),
    });
  },
};
