// netlify/functions/s3-backup.js
// Handles all AWS S3 Backup & Recovery operations for Taf'Yaa
// Called by: src/services/backupService.js

const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const admin = require('firebase-admin');

// ─── Firebase Admin Init ───────────────────────────────────────────────────────
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const db = admin.firestore();

// ─── AWS S3 Client ────────────────────────────────────────────────────────────
const s3 = new S3Client({
  region: process.env.VITE_AWS_REGION || 'eu-west-1',
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.VITE_AWS_BUCKET_NAME;

// ─── CORS Headers ─────────────────────────────────────────────────────────────
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

// ─── Helper: read stream to string ───────────────────────────────────────────
async function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    stream.on('error', reject);
  });
}

// ─── Helper: collect all Firestore data for a user ───────────────────────────
async function collectUserData(userId) {
  const data = {
    exportedAt: new Date().toISOString(),
    exportedBy: userId,
    version: '1.0',
    trees: [],
    persons: [],
    stories: [],
    media: [],
    invites: [],
    activities: [],
  };

  // Get all trees this user owns or is a member of
  const treesSnap = await db
    .collection('trees')
    .where('members', 'array-contains', userId)
    .get();

  for (const treeDoc of treesSnap.docs) {
    const treeData = { id: treeDoc.id, ...treeDoc.data() };

    // Sub-collections: persons
    const personsSnap = await db
      .collection('trees')
      .doc(treeDoc.id)
      .collection('persons')
      .get();

    const persons = personsSnap.docs.map((d) => ({ id: d.id, treeId: treeDoc.id, ...d.data() }));
    data.persons.push(...persons);

    data.trees.push(treeData);
  }

  // Stories
  const storiesSnap = await db.collection('stories').where('createdBy', '==', userId).get();
  data.stories = storiesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Media
  const mediaSnap = await db.collection('media').where('uploadedBy', '==', userId).get();
  data.media = mediaSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Activities (last 200)
  const activitiesSnap = await db
    .collection('activities')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(200)
    .get();
  data.activities = activitiesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return data;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    const { httpMethod, queryStringParameters } = event;
    const action = queryStringParameters?.action;
    const body = event.body ? JSON.parse(event.body) : {};
    const { userId } = body;

    // ── POST /s3-backup?action=create ──────────────────────────────────────
    // Creates a full backup of the user's data and uploads it to S3
    if (httpMethod === 'POST' && action === 'create') {
      if (!userId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'userId is required' }) };
      }

      console.log(`🔄 Starting backup for user: ${userId}`);

      // Collect all Firestore data
      const userData = await collectUserData(userId);

      // Prepare S3 key (path inside bucket)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const s3Key = `backups/${userId}/${timestamp}.json`;

      // Upload to S3
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: s3Key,
          Body: JSON.stringify(userData, null, 2),
          ContentType: 'application/json',
          Metadata: {
            userId,
            exportedAt: userData.exportedAt,
            treesCount: String(userData.trees.length),
            personsCount: String(userData.persons.length),
          },
        })
      );

      console.log(`✅ Backup uploaded to S3: ${s3Key}`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Backup created successfully',
          backup: {
            key: s3Key,
            timestamp: userData.exportedAt,
            stats: {
              trees: userData.trees.length,
              persons: userData.persons.length,
              stories: userData.stories.length,
              media: userData.media.length,
            },
          },
        }),
      };
    }

    // ── GET /s3-backup?action=list&userId=xxx ──────────────────────────────
    // Lists all backups for a user from S3
    if (httpMethod === 'GET' && action === 'list') {
      const uid = queryStringParameters?.userId;
      if (!uid) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'userId is required' }) };
      }

      const response = await s3.send(
        new ListObjectsV2Command({
          Bucket: BUCKET,
          Prefix: `backups/${uid}/`,
        })
      );

      const backups = (response.Contents || [])
        .sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified))
        .map((obj) => ({
          key: obj.Key,
          size: obj.Size,
          lastModified: obj.LastModified,
          // Extract timestamp from filename
          timestamp: obj.Key.split('/').pop().replace('.json', '').replace(/-/g, (m, i) => (i === 10 || i === 13 || i === 16 ? ':' : m)),
        }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, backups }),
      };
    }

    // ── POST /s3-backup?action=download ───────────────────────────────────
    // Returns a signed download URL for a specific backup
    if (httpMethod === 'POST' && action === 'download') {
      const { key } = body;
      if (!key) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'key is required' }) };
      }

      const signedUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: BUCKET, Key: key }),
        { expiresIn: 300 } // URL valid for 5 minutes
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, url: signedUrl }),
      };
    }

    // ── POST /s3-backup?action=restore ────────────────────────────────────
    // Reads a backup JSON from S3 and restores it to Firestore
    if (httpMethod === 'POST' && action === 'restore') {
      const { key, userId: uid } = body;
      if (!key || !uid) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'key and userId are required' }) };
      }

      console.log(`🔄 Restoring backup: ${key} for user: ${uid}`);

      // Get the backup file from S3
      const s3Response = await s3.send(
        new GetObjectCommand({ Bucket: BUCKET, Key: key })
      );

      const jsonString = await streamToString(s3Response.Body);
      const backupData = JSON.parse(jsonString);

      // Restore in batches (Firestore batch limit = 500)
      let batch = db.batch();
      let opCount = 0;

      const flush = async () => {
        if (opCount > 0) {
          await batch.commit();
          batch = db.batch();
          opCount = 0;
        }
      };

      // Restore trees
      for (const tree of backupData.trees || []) {
        const { id, ...treeData } = tree;
        batch.set(db.collection('trees').doc(id), treeData, { merge: true });
        opCount++;
        if (opCount >= 400) await flush();
      }

      // Restore persons (sub-collection)
      for (const person of backupData.persons || []) {
        const { id, treeId, ...personData } = person;
        batch.set(
          db.collection('trees').doc(treeId).collection('persons').doc(id),
          personData,
          { merge: true }
        );
        opCount++;
        if (opCount >= 400) await flush();
      }

      // Restore stories
      for (const story of backupData.stories || []) {
        const { id, ...storyData } = story;
        batch.set(db.collection('stories').doc(id), storyData, { merge: true });
        opCount++;
        if (opCount >= 400) await flush();
      }

      await flush(); // final commit

      console.log(`✅ Restore complete for user: ${uid}`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Data restored successfully',
          restored: {
            trees: backupData.trees?.length || 0,
            persons: backupData.persons?.length || 0,
            stories: backupData.stories?.length || 0,
          },
        }),
      };
    }

    // ── DELETE /s3-backup?action=delete ───────────────────────────────────
    if (httpMethod === 'DELETE' && action === 'delete') {
      const { key } = body;
      if (!key) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'key is required' }) };
      }

      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Backup deleted' }),
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Unknown action' }),
    };
  } catch (error) {
    console.error('❌ S3 Backup error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', message: error.message }),
    };
  }
};
