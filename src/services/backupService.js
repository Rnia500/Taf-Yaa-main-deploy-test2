// src/services/backupService.js
// AWS S3 Backup & Recovery service for Taf'Yaa

// ─── Your API Gateway URL ─────────────────────────────────────────────────────
// This reads from your .env file (VITE_BACKUP_API_URL)
const API_URL = import.meta.env.VITE_BACKUP_API_URL || '';

// ─── Check URL is configured ──────────────────────────────────────────────────
function checkConfig() {
  if (!API_URL) {
    throw new Error('Backup API not configured. Add VITE_BACKUP_API_URL to your .env and Amplify env variables.');
  }
}

// ─── Safe fetch that gives readable errors ────────────────────────────────────
async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  const text = await response.text();

  if (!text || text.trim() === '') {
    throw new Error('No response from backup server. Check that your Lambda is deployed.');
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Invalid response: ${text.slice(0, 100)}`);
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }

  return data;
}

// ─── Backup Service ───────────────────────────────────────────────────────────
export const backupService = {

  // Create a full backup → uploads to S3
  async createBackup(userId) {
    checkConfig();
    return apiFetch(`${API_URL}?action=create`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  // List all backups for a user from S3
  async listBackups(userId) {
    checkConfig();
    const data = await apiFetch(`${API_URL}?action=list&userId=${userId}`);
    return data.backups;
  },

  // Get a signed download URL for a specific backup file
  async getDownloadUrl(key) {
    checkConfig();
    const data = await apiFetch(`${API_URL}?action=download`, {
      method: 'POST',
      body: JSON.stringify({ key }),
    });
    return data.url;
  },

  // Restore a backup from S3 into Firestore
  async restoreBackup(key, userId) {
    checkConfig();
    return apiFetch(`${API_URL}?action=restore`, {
      method: 'POST',
      body: JSON.stringify({ key, userId }),
    });
  },

  // Delete a backup from S3
  async deleteBackup(key) {
    checkConfig();
    return apiFetch(`${API_URL}?action=delete`, {
      method: 'DELETE',
      body: JSON.stringify({ key }),
    });
  },

  // Format bytes → readable size
  formatSize(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  },
};