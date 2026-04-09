// src/pages/BackupPage.jsx
// AWS S3 Backup & Recovery page for Taf'Yaa
// Feature: Cloud Backup powered by Amazon S3

import React, { useState, useEffect, useCallback } from 'react';
import {
  CloudUpload, CloudDownload, Trash2, RefreshCw,
  ShieldCheck, Clock, Database, AlertTriangle, CheckCircle, Server
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { backupService } from '../services/backupService';
import Column from '../layout/containers/Column';
import Row from '../layout/containers/Row';
import Text from '../components/Text';
import Button from '../components/Button';
import Loading from '../components/Loading';

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color = '#2563eb' }) => (
  <div style={{
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flex: 1,
    minWidth: 140,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 10,
      background: color + '18',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {React.cloneElement(icon, { size: 22, color })}
    </div>
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

// ─── Backup Row ───────────────────────────────────────────────────────────────
const BackupRow = ({ backup, onDownload, onRestore, onDelete, isRestoring }) => {
  const [loadingAction, setLoadingAction] = useState(null);

  const handle = async (action, fn) => {
    setLoadingAction(action);
    try { await fn(); }
    finally { setLoadingAction(null); }
  };

  const date = new Date(backup.lastModified);
  const formattedDate = date.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 10,
      padding: '14px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      flexWrap: 'wrap',
    }}>
      {/* Icon */}
      <div style={{
        width: 38, height: 38, borderRadius: 8,
        background: '#eff6ff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Database size={18} color="#2563eb" />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
          {formattedDate}
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
          {backupService.formatSize(backup.size)}  ·  {backup.key.split('/').pop()}
        </div>
      </div>

      {/* AWS Badge */}
      <div style={{
        fontSize: 11, fontWeight: 600,
        background: '#fff7ed', color: '#ea580c',
        border: '1px solid #fed7aa',
        borderRadius: 20, padding: '3px 10px',
      }}>
        AWS S3
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <Button
          variant="secondary"
          size="sm"
          icon={<CloudDownload size={14} />}
          loading={loadingAction === 'download'}
          onClick={() => handle('download', () => onDownload(backup.key))}
        >
          Download
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw size={14} />}
          loading={loadingAction === 'restore' || isRestoring}
          onClick={() => handle('restore', () => onRestore(backup.key))}
        >
          Restore
        </Button>
        <Button
          variant="danger"
          size="sm"
          icon={<Trash2 size={14} />}
          loading={loadingAction === 'delete'}
          onClick={() => handle('delete', () => onDelete(backup.key))}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

// ─── Alert Banner ─────────────────────────────────────────────────────────────
const Alert = ({ type = 'info', message, onClose }) => {
  const config = {
    success: { bg: '#f0fdf4', border: '#86efac', color: '#15803d', Icon: CheckCircle },
    error:   { bg: '#fef2f2', border: '#fca5a5', color: '#dc2626', Icon: AlertTriangle },
    info:    { bg: '#eff6ff', border: '#93c5fd', color: '#1d4ed8', Icon: ShieldCheck },
  }[type];

  return (
    <div style={{
      background: config.bg,
      border: `1px solid ${config.border}`,
      borderRadius: 10, padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 10,
      marginBottom: 16,
    }}>
      <config.Icon size={18} color={config.color} />
      <span style={{ fontSize: 14, color: config.color, flex: 1 }}>{message}</span>
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: config.color, fontSize: 16 }}>×</button>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const BackupPage = () => {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid;

  const [backups, setBackups] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [creating, setCreating]       = useState(false);
  const [restoring, setRestoring]     = useState(false);
  const [alert, setAlert]             = useState(null);   // { type, message }
  const [confirmRestore, setConfirmRestore] = useState(null); // key to restore

  // ── Load backups ────────────────────────────────────────────────────────
  const loadBackups = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const list = await backupService.listBackups(userId);
      setBackups(list);
    } catch (err) {
      setAlert({ type: 'error', message: `Could not load backups: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadBackups(); }, [loadBackups]);

  // ── Create backup ───────────────────────────────────────────────────────
  const handleCreate = async () => {
    try {
      setCreating(true);
      setAlert(null);
      const result = await backupService.createBackup(userId);
      setAlert({
        type: 'success',
        message: `✅ Backup created! ${result.backup.stats.trees} tree(s), ${result.backup.stats.persons} person(s) saved to AWS S3.`,
      });
      await loadBackups();
    } catch (err) {
      setAlert({ type: 'error', message: `Backup failed: ${err.message}` });
    } finally {
      setCreating(false);
    }
  };

  // ── Download backup ─────────────────────────────────────────────────────
  const handleDownload = async (key) => {
    try {
      const url = await backupService.getDownloadUrl(key);
      const a = document.createElement('a');
      a.href = url;
      a.download = key.split('/').pop();
      a.click();
    } catch (err) {
      setAlert({ type: 'error', message: `Download failed: ${err.message}` });
    }
  };

  // ── Restore backup ──────────────────────────────────────────────────────
  const handleRestore = async (key) => {
    // Show confirmation first
    setConfirmRestore(key);
  };

  const confirmRestoreAction = async () => {
    try {
      setRestoring(true);
      setAlert(null);
      const result = await backupService.restoreBackup(confirmRestore, userId);
      setAlert({
        type: 'success',
        message: `✅ Restore complete! ${result.restored.trees} tree(s), ${result.restored.persons} person(s) restored.`,
      });
    } catch (err) {
      setAlert({ type: 'error', message: `Restore failed: ${err.message}` });
    } finally {
      setRestoring(false);
      setConfirmRestore(null);
    }
  };

  // ── Delete backup ────────────────────────────────────────────────────────
  const handleDelete = async (key) => {
    try {
      await backupService.deleteBackup(key);
      setAlert({ type: 'success', message: 'Backup deleted from AWS S3.' });
      setBackups((prev) => prev.filter((b) => b.key !== key));
    } catch (err) {
      setAlert({ type: 'error', message: `Delete failed: ${err.message}` });
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: '#eff6ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Server size={22} color="#2563eb" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>
              Backup & Recovery
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
              Powered by <strong style={{ color: '#ea580c' }}>Amazon S3</strong> — your data is safely stored in the cloud
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard icon={<Database />} label="Total Backups"   value={backups.length}     color="#2563eb" />
        <StatCard icon={<ShieldCheck />} label="Storage"       value="AWS S3"             color="#16a34a" />
        <StatCard icon={<Clock />}  label="Last Backup"
          value={backups[0] ? new Date(backups[0].lastModified).toLocaleDateString('en-GB', { day:'2-digit', month:'short' }) : '—'}
          color="#9333ea"
        />
      </div>

      {/* Alert */}
      {alert && (
        <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
      )}

      {/* Confirm Restore Modal */}
      {confirmRestore && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 28,
            maxWidth: 420, width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
              <AlertTriangle size={22} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#111827' }}>
                  Restore this backup?
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
                  This will overwrite your current Firestore data with the selected backup.
                  Your existing data will be <strong>merged</strong> — nothing will be permanently deleted.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="secondary" size="sm" onClick={() => setConfirmRestore(null)}>
                Cancel
              </Button>
              <Button
                variant="primary" size="sm"
                icon={<RefreshCw size={14} />}
                loading={restoring}
                onClick={confirmRestoreAction}
              >
                Yes, Restore
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Action bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16, gap: 12, flexWrap: 'wrap',
      }}>
        <Text style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
          Your Backups ({backups.length})
        </Text>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            variant="secondary" size="sm"
            icon={<RefreshCw size={14} />}
            onClick={loadBackups}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            variant="primary" size="sm"
            icon={<CloudUpload size={14} />}
            loading={creating}
            onClick={handleCreate}
          >
            Create Backup
          </Button>
        </div>
      </div>

      {/* Backup list */}
      {loading ? (
        <Loading />
      ) : backups.length === 0 ? (
        <div style={{
          background: '#f9fafb',
          border: '2px dashed #e5e7eb',
          borderRadius: 12,
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <CloudUpload size={40} color="#d1d5db" style={{ marginBottom: 12 }} />
          <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#374151' }}>
            No backups yet
          </p>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: '#9ca3af' }}>
            Create your first backup to store your family tree data safely on AWS S3
          </p>
          <Button
            variant="primary" size="sm"
            icon={<CloudUpload size={14} />}
            loading={creating}
            onClick={handleCreate}
          >
            Create First Backup
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {backups.map((backup) => (
            <BackupRow
              key={backup.key}
              backup={backup}
              onDownload={handleDownload}
              onRestore={handleRestore}
              onDelete={handleDelete}
              isRestoring={restoring}
            />
          ))}
        </div>
      )}

      {/* Info footer */}
      <div style={{
        marginTop: 28,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        padding: '14px 18px',
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <ShieldCheck size={16} color="#64748b" style={{ marginTop: 1, flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
          All backups are encrypted and stored in your private <strong>AWS S3 bucket</strong>.
          Backups include your family trees, member profiles, and stories.
          Media files (photos, audio) remain stored in Cloudinary and are referenced in the backup.
        </p>
      </div>
    </div>
  );
};

export default BackupPage;
