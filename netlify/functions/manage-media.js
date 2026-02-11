const { v2: cloudinary } = require('cloudinary');
const admin = require('firebase-admin');



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



exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    const { httpMethod, path } = event;
    const pathParts = path.split('/').filter(Boolean);
    const mediaId = pathParts[pathParts.length - 1];

    switch (httpMethod) {

      case 'GET':
        if (mediaId) {
          const mediaDoc = await db.collection('media').doc(mediaId).get();

          if (!mediaDoc.exists) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Media not found' }),
            };
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              data: { id: mediaDoc.id, ...mediaDoc.data() },
            }),
          };
        }
        break;

   
      case 'POST': {
        const body = JSON.parse(event.body);

        const mediaData = {
          cloudinaryId: body.public_id,
          url: body.secure_url,
          type:
            body.resource_type === 'video'
              ? ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'webm'].includes(body.format)
                ? 'audio'
                : 'video'
              : 'image',
          format: body.format,
          size: body.bytes,
          width: body.width || null,
          height: body.height || null,
          duration: body.duration || null,
          resourceType: body.resource_type,
          treeId: body.treeId,
          personId: body.personId || null,
          role: body.role || 'profile', // Default to profile
          title: body.title || null,
          subTitle: body.subTitle || null,
          description: body.description || null,
          tags: body.tags || [],
          uploadedBy: body.uploadedBy,
          visibility: body.visibility || 'public',
          source: body.source || null,
          uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
          deleted: false,
          deletedAt: null,
        };

       
        let mediaRef; // ✅ FIXED: define outside try so it's visible later

        try {
          mediaRef = await db.collection('media').add(mediaData);
          console.log("✅ Media stored with ID:", mediaRef.id);
        } catch (err) {
          console.error("❌ Firestore write failed:", err);
          throw err;
        }

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            success: true,
            data: { id: mediaRef.id, ...mediaData },
          }),
        };
      }

      // =================== 🟥 DELETE ===================
      case 'DELETE':
        if (mediaId) {
          const mediaDoc = await db.collection('media').doc(mediaId).get();

          if (!mediaDoc.exists) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Media not found' }),
            };
          }

          const mediaData = mediaDoc.data();

          // Delete from Cloudinary
          await cloudinary.uploader.destroy(mediaData.cloudinaryId, {
            resource_type: mediaData.type === 'audio' ? 'video' : 'image',
          });

          // Delete from Firestore
          await db.collection('media').doc(mediaId).delete();

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Media deleted' }),
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
    console.error('Media management error:', error);
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
