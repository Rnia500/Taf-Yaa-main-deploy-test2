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

const db = admin.firestore();

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
    const inviteId = pathParts[pathParts.length - 1];

    // Extract user ID from Authorization header (assuming Firebase Auth token)
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;

    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' }),
      };
    }

    const userId = decodedToken.uid;

    switch (httpMethod) {
      case 'GET':
        if (inviteId) {
          // Get specific invite
          const inviteDoc = await db.collection('invites').doc(inviteId).get();

          if (!inviteDoc.exists) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Invite not found' }),
            };
          }

          const invite = inviteDoc.data();

          // Check if user has permission to view this invite
          const treeDoc = await db.collection('trees').doc(invite.treeId).get();
          if (!treeDoc.exists) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Tree not found' }),
            };
          }

          const tree = treeDoc.data();
          const userRole = tree.members?.[userId]?.role;

          if (!userRole || !['admin', 'moderator'].includes(userRole)) {
            return {
              statusCode: 403,
              headers,
              body: JSON.stringify({ error: 'Forbidden' }),
            };
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              data: { id: inviteDoc.id, ...invite },
            }),
          };
        } else {
          // Get invites for user's trees
          const userTreesQuery = await db.collection('trees')
            .where('members.' + userId + '.role', 'in', ['admin', 'moderator'])
            .get();

          const treeIds = userTreesQuery.docs.map(doc => doc.id);

          if (treeIds.length === 0) {
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ success: true, data: [] }),
            };
          }

          const invitesQuery = await db.collection('invites')
            .where('treeId', 'in', treeIds)
            .get();

          const invites = invitesQuery.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, data: invites }),
          };
        }

      case 'POST': {
        const body = JSON.parse(event.body);

        // Check if user has permission to create invites for this tree
        const treeDoc = await db.collection('trees').doc(body.treeId).get();
        if (!treeDoc.exists) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Tree not found' }),
          };
        }

        const tree = treeDoc.data();
        const userRole = tree.members?.[userId]?.role;

        if (!userRole || !['admin', 'moderator'].includes(userRole)) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Forbidden' }),
          };
        }

        // Generate invite code
        const code = generateInviteCode();

        const inviteData = {
          code,
          treeId: body.treeId,
          createdBy: userId,
          type: body.type || 'member',
          role: body.role || 'viewer',
          fatherId: body.fatherId || null,
          motherId: body.motherId || null,
          personId: body.personId || null,
          usesAllowed: body.usesAllowed || 1,
          usesCount: 0,
          expiresAt: body.expiresAt ? admin.firestore.Timestamp.fromDate(new Date(body.expiresAt)) : null,
          status: 'active',
          notes: body.notes || null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const inviteRef = await db.collection('invites').add(inviteData);

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            success: true,
            data: { id: inviteRef.id, ...inviteData },
          }),
        };
      }

      case 'DELETE':
        if (inviteId) {
          const inviteDoc = await db.collection('invites').doc(inviteId).get();

          if (!inviteDoc.exists) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Invite not found' }),
            };
          }

          const invite = inviteDoc.data();

          // Check permissions
          const treeDoc = await db.collection('trees').doc(invite.treeId).get();
          const tree = treeDoc.data();
          const userRole = tree.members?.[userId]?.role;

          if (!userRole || !['admin', 'moderator'].includes(userRole)) {
            return {
              statusCode: 403,
              headers,
              body: JSON.stringify({ error: 'Forbidden' }),
            };
          }

          // Revoke the invite instead of deleting
          await db.collection('invites').doc(inviteId).update({
            status: 'revoked',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Invite revoked' }),
          };
        }
        break;

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('Manage invites error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};

function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = Math.floor(Math.random() * 5) + 8; // 8 to 12
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
