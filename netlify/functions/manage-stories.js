const { v2: cloudinary } = require('cloudinary');
const admin = require('firebase-admin');

// =============== 🔑 ENV + FIREBASE SETUP ===================
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('FIREBASE_PRIVATE_KEY starts with:', process.env.FIREBASE_PRIVATE_KEY?.substring(0, 40));
console.log('FIREBASE_PRIVATE_KEY contains literal \\n?', process.env.FIREBASE_PRIVATE_KEY?.includes('\\n'));

// ✅ Safe normalization for Windows/macOS/Linux
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

console.log('✅ Firebase key format looks good:', privateKey.includes('\n'));

const db = admin.firestore();

cloudinary.config({
  cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.VITE_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ============================================================

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    const { httpMethod, path } = event;
    const pathParts = path.split('/').filter(Boolean);
    const storyId = pathParts[pathParts.length - 1];

    switch (httpMethod) {
      // =================== 🟩 GET ===================
      case 'GET':
        if (storyId) {
          const storyDoc = await db.collection('stories').doc(storyId).get();

          if (!storyDoc.exists) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Story not found' }),
            };
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              data: { id: storyDoc.id, ...storyDoc.data() },
            }),
          };
        } else {
          // Get all stories for a tree
          const { treeId } = event.queryStringParameters || {};
          if (!treeId) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'treeId query parameter required' }),
            };
          }

          const storiesRef = db.collection('stories');
          const q = storiesRef.where('treeId', '==', treeId).where('active', '==', true);
          const querySnapshot = await q.get();

          const stories = [];
          querySnapshot.forEach((doc) => {
            stories.push({ id: doc.id, ...doc.data() });
          });

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              data: stories,
            }),
          };
        }

      // =================== 🟦 POST ===================
      case 'POST': {
        const body = JSON.parse(event.body);

        // Calculate contributors from createdBy and attachment uploaders
        const contributors = new Set();
        contributors.add(body.createdBy);

        if (body.attachments && body.attachments.length > 0) {
          body.attachments.forEach(attachment => {
            if (attachment.uploadedBy) {
              contributors.add(attachment.uploadedBy);
            }
          });
        }

        const storyData = {
          treeId: body.treeId,
          personId: body.personId || null,
          title: body.title,
          subTitle: body.subTitle || null,
          description: body.description || null,
          tags: body.tags || [],
          attachments: body.attachments || [],
          createdBy: body.createdBy,
          contributors: Array.from(contributors),
          visibility: body.visibility || 'public',
          isPinned: body.isPinned || false,
          linkedPersons: body.linkedPersons || [],
          active: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          // Deletion metadata
          isDeleted: false,
          deletedAt: null,
          deletionMode: null,
          pendingDeletion: false,
          undoExpiresAt: null,
          deletionBatchId: null,
        };

        console.log("📖 Story data to be saved:", JSON.stringify(storyData, null, 2));

        const storyRef = await db.collection('stories').add(storyData);
        console.log("✅ Story stored with ID:", storyRef.id);

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            success: true,
            data: { id: storyRef.id, ...storyData },
          }),
        };
      }

      // =================== 🟨 PUT ===================
      case 'PUT':
        if (storyId) {
          const body = JSON.parse(event.body);

          // Get current story to access createdBy and existing attachments
          const currentDoc = await db.collection('stories').doc(storyId).get();
          if (!currentDoc.exists) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Story not found' }),
            };
          }
          const currentStory = currentDoc.data();

          const updateData = {
            ...body,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          // Recalculate contributors if attachments are being updated
          if (body.attachments !== undefined) {
            const contributors = new Set();
            contributors.add(currentStory.createdBy);

            if (body.attachments && body.attachments.length > 0) {
              body.attachments.forEach(attachment => {
                if (attachment.uploadedBy) {
                  contributors.add(attachment.uploadedBy);
                }
              });
            }

            updateData.contributors = Array.from(contributors);
          }

          await db.collection('stories').doc(storyId).update(updateData);

          // Return updated story
          const updatedDoc = await db.collection('stories').doc(storyId).get();
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              data: { id: updatedDoc.id, ...updatedDoc.data() },
            }),
          };
        }
        break;

      // =================== 🟥 DELETE ===================
      case 'DELETE':
        if (storyId) {
          const storyDoc = await db.collection('stories').doc(storyId).get();

          if (!storyDoc.exists) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Story not found' }),
            };
          }

          const storyData = storyDoc.data();

          // Delete associated media attachments from Cloudinary
          if (storyData.attachments && storyData.attachments.length > 0) {
            for (const attachment of storyData.attachments) {
              if (attachment.cloudinaryId) {
                try {
                  await cloudinary.uploader.destroy(attachment.cloudinaryId, {
                    resource_type: attachment.type === 'audio' ? 'video' : 'image',
                  });
                  console.log(`🗑️ Deleted attachment ${attachment.cloudinaryId} from Cloudinary`);
                } catch (cloudinaryError) {
                  console.warn(`⚠️ Failed to delete attachment ${attachment.cloudinaryId}:`, cloudinaryError.message);
                }
              }
            }
          }

          // Delete from Firestore
          await db.collection('stories').doc(storyId).delete();

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Story deleted' }),
          };
        }
        break;

      // =================== 🚫 DEFAULT ===================
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('Story management error:', error);
    console.error('Error stack:', error.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        stack: error.stack,
      }),
    };
  }
};
