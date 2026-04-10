// src/services/backupService.js
// AWS S3 Backup & Recovery service for Taf'Yaa
// Calls AWS Lambda via API Gateway

// ─── API URL ──────────────────────────────────────────────────────────────────
// After you deploy the Lambda and create the API Gateway,
// paste your API Gateway URL here:
const API_URL = import.meta.env.VITE_BACKUP_API_URL || '';

// Helper — throws a clear error if API_URL is not configured yet
function checkConfig() {
  if (!API_URL) {
    throw new Error(
      'Backup API not configured yet. Please add VITE_BACKUP_API_URL to your .env file.'
    );
  }
}

// ─── Safe fetch wrapper ───────────────────────────────────────────────────────
async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  const text = await response.text();

  // Guard against empty responses (e.g. when function not running locally)
  if (!text || text.trim() === '') {
    throw new Error('No response from backup server. Make sure the Lambda function is deployed.');
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Invalid response from server: ${text.slice(0, 100)}`);
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }

  return data;
}

// ─── Backup Service ───────────────────────────────────────────────────────────
export const backupService = {

  // Create a full backup and upload to S3
  async createBackup(userId) {
    checkConfig();
    return apiFetch(`${API_URL}?action=create`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  // List all backups for a user
  async listBackups(userId) {
    checkConfig();
    const data = await apiFetch(`${API_URL}?action=list&userId=${userId}`);
    return data.backups;
  },

  // Get a signed download URL for a specific backup
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

  // Format bytes to readable size
  formatSize(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  },
};
