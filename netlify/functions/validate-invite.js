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
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { code } = JSON.parse(event.body || '{}');

    if (!code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invite code is required' }),
      };
    }

    // Query for the invite
    const invitesRef = db.collection('invites');
    const querySnapshot = await invitesRef.where('code', '==', code).limit(1).get();

    if (querySnapshot.empty) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Invite not found' }),
      };
    }

    const inviteDoc = querySnapshot.docs[0];
    const invite = inviteDoc.data();

    // Check status and expiration
    if (invite.status !== 'active') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invite is not active' }),
      };
    }

    if (invite.expiresAt && new Date(invite.expiresAt.toDate ? invite.expiresAt.toDate() : invite.expiresAt) < new Date()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invite has expired' }),
      };
    }

    if (invite.usesCount >= invite.usesAllowed) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invite usage limit reached' }),
      };
    }

    // Get tree information
    const treeDoc = await db.collection('trees').doc(invite.treeId).get();
    if (!treeDoc.exists) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Tree not found' }),
      };
    }

    const tree = treeDoc.data();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        invite: {
          id: inviteDoc.id,
          ...invite,
          expiresAt: invite.expiresAt?.toDate ? invite.expiresAt.toDate().toISOString() : invite.expiresAt,
        },
        tree: {
          id: treeDoc.id,
          familyName: tree.familyName,
          familyDescription: tree.familyDescription,
          createdBy: tree.createdBy,
        },
      }),
    };
  } catch (error) {
    console.error('Validate invite error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
