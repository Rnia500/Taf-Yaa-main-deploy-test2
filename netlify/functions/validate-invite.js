import admin from "firebase-admin";

// ── Firebase Admin init (only runs once per warm Lambda container) ─────────
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replace escaped newlines — env vars can't hold real line breaks
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}
const db = admin.firestore();

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

export const handler = async (event) => {
  // FIX: HTTP API sends method here, not event.httpMethod
  const httpMethod = event.requestContext?.http?.method || event.httpMethod;

  if (httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { code } = body;

    if (!code) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Invite code is required" }),
      };
    }

    // Find the invite by code
    const invitesSnap = await db
      .collection("invites")
      .where("code", "==", code)
      .limit(1)
      .get();

    if (invitesSnap.empty) {
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Invalid invite code" }),
      };
    }

    const inviteDoc = invitesSnap.docs[0];
    const invite = { id: inviteDoc.id, ...inviteDoc.data() };

    // Check status
    if (invite.status === "revoked") {
      return {
        statusCode: 410,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "This invite has been revoked" }),
      };
    }

    // Check expiry
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return {
        statusCode: 410,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "This invite has expired" }),
      };
    }

    // Check usage limit
    const usedCount = invite.usedCount || 0;
    if (invite.usesAllowed && usedCount >= invite.usesAllowed) {
      return {
        statusCode: 410,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "This invite has already been used" }),
      };
    }

    // Fetch the associated tree
    const treeDoc = await db.collection("trees").doc(invite.treeId).get();
    if (!treeDoc.exists) {
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "The family tree for this invite no longer exists" }),
      };
    }
    const tree = { id: treeDoc.id, ...treeDoc.data() };

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ invite, tree }),
    };
  } catch (err) {
    console.error("validate-invite error:", err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message }),
    };
  }
};