// src/services/backupService.js (v3 - supports name + description + type)

const API_URL = import.meta.env.VITE_BACKUP_API_URL || '';

function checkConfig() {
  if (!API_URL) throw new Error('VITE_BACKUP_API_URL not configured.');
}

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

  // List all backups for a user
  async listBackups(userId) {
    checkConfig();
    const data = await apiFetch(`${API_URL}?action=list&userId=${userId}`);
    return data.backups || [];
  },

  // Create a backup with custom name, description, type
  async createBackup(userId, customName = '', description = '', backupType = 'manual') {
    checkConfig();
    return apiFetch(`${API_URL}?action=create`, {
      method: 'POST',
      body: JSON.stringify({ userId, customName, description, backupType }),
    });
  },

  // Get signed download URL
  async getDownloadUrl(key) {
    checkConfig();
    const data = await apiFetch(`${API_URL}?action=download`, {
      method: 'POST',
      body: JSON.stringify({ key }),
    });
    return data.url;
  },

  // Restore a backup
  async restoreBackup(key, userId) {
    checkConfig();
    return apiFetch(`${API_URL}?action=restore`, {
      method: 'POST',
      body: JSON.stringify({ key, userId }),
    });
  },

  // Delete a backup
  async deleteBackup(key) {
    checkConfig();
    return apiFetch(`${API_URL}?action=delete`, {
      method: 'POST',
      body: JSON.stringify({ key }),
    });
  },
};