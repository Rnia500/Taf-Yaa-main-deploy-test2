// src/services/backupService.js
// AWS S3 Backup & Recovery service for Taf'Yaa
// Communicates with: /.netlify/functions/s3-backup

export const backupService = {

  // ── Create a new backup ──────────────────────────────────────────────────
  async createBackup(userId) {
    const response = await fetch('/.netlify/functions/s3-backup?action=create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create backup');
    return data;
  },

  // ── List all backups for a user ──────────────────────────────────────────
  async listBackups(userId) {
    const response = await fetch(
      `/.netlify/functions/s3-backup?action=list&userId=${userId}`
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to list backups');
    return data.backups;
  },

  // ── Get a signed download URL for a backup ───────────────────────────────
  async getDownloadUrl(key) {
    const response = await fetch('/.netlify/functions/s3-backup?action=download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to get download URL');
    return data.url;
  },

  // ── Restore a backup from S3 into Firestore ──────────────────────────────
  async restoreBackup(key, userId) {
    const response = await fetch('/.netlify/functions/s3-backup?action=restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, userId }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to restore backup');
    return data;
  },

  // ── Delete a backup from S3 ──────────────────────────────────────────────
  async deleteBackup(key) {
    const response = await fetch('/.netlify/functions/s3-backup?action=delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to delete backup');
    return data;
  },

  // ── Format file size to human readable ──────────────────────────────────
  formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  },

  // ── Format S3 key to readable backup name ────────────────────────────────
  formatBackupName(key) {
    // key looks like: backups/userId/2026-04-09T12-30-00-000Z.json
    const filename = key.split('/').pop().replace('.json', '');
    try {
      // Try to parse as date
      const dateStr = filename
        .replace(/^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2}).*/, '$1 $2:$3:$4');
      const date = new Date(dateStr);
      if (!isNaN(date)) {
        return date.toLocaleString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        });
      }
    } catch (_) { /* fallback */ }
    return filename;
  },
};
