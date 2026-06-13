// src/services/analyticsService.ts
// Taf'Yaa — Firebase Analytics Service
// Tracks all meaningful user interactions for the dashboard

import { logEvent } from "firebase/analytics";
import { analytics } from "../config/firebase.js";

// ─── Event logging ────────────────────────────────────────────────────────────
function log(eventName: string, params?: Record<string, any>) {
  if (!analytics) return;
  try {
    logEvent(analytics, eventName, params);
  } catch (e) {
    console.warn("Analytics log failed:", e);
  }
}

export const analyticsService = {

  // ── Page views ──────────────────────────────────────────────────────────────
  pageView(pageName: string, treeId?: string) {
    log("page_view", { page_title: pageName, tree_id: treeId });
  },

  // ── Tree events ─────────────────────────────────────────────────────────────
  treeCreated(treeId: string) {
    log("tree_created", { tree_id: treeId });
  },
  treeViewed(treeId: string) {
    log("tree_viewed", { tree_id: treeId });
  },
  personAdded(treeId: string) {
    log("person_added", { tree_id: treeId });
  },
  personEdited(treeId: string) {
    log("person_edited", { tree_id: treeId });
  },
  personDeleted(treeId: string) {
    log("person_deleted", { tree_id: treeId });
  },

  // ── Story events ─────────────────────────────────────────────────────────────
  storyCreated(treeId: string, method: "text" | "voice") {
    log("story_created", { tree_id: treeId, method });
  },
  storyViewed(storyId: string) {
    log("story_viewed", { story_id: storyId });
  },

  // ── Backup events ────────────────────────────────────────────────────────────
  backupCreated(userId: string) {
    log("backup_created", { user_id: userId });
  },
  backupRestored(userId: string) {
    log("backup_restored", { user_id: userId });
  },
  backupDownloaded(userId: string) {
    log("backup_downloaded", { user_id: userId });
  },

  // ── Voice transcription ──────────────────────────────────────────────────────
  voiceRecordingStarted(language: string) {
    log("voice_recording_started", { language });
  },
  voiceTranscribed(language: string, engine: string) {
    log("voice_transcribed", { language, engine });
  },

  // ── Translation ───────────────────────────────────────────────────────────────
  contentTranslated(targetLang: string, engine: string) {
    log("content_translated", { target_language: targetLang, engine });
  },

  // ── Chat events ───────────────────────────────────────────────────────────────
  messageSent(type: "group" | "direct") {
    log("message_sent", { chat_type: type });
  },
  roleRequestSent() {
    log("role_request_sent");
  },

  // ── Auth events ───────────────────────────────────────────────────────────────
  userSignedUp(method: string) {
    log("sign_up", { method });
  },
  userLoggedIn(method: string) {
    log("login", { method });
  },

  // ── Photo events ──────────────────────────────────────────────────────────────
  photoUploaded(treeId: string) {
    log("photo_uploaded", { tree_id: treeId });
  },
};