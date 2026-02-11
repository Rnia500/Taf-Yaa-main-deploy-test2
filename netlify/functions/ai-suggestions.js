const admin = require('firebase-admin');

// Add comprehensive environment validation
const requiredEnvVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`Missing environment variables: ${missingVars.join(', ')}`);
  return {
    statusCode: 500,
    headers,
    body: JSON.stringify({ error: 'Server configuration error' })
  };
}

// Fix private key formatting issues
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  .replace(/\\n/g, '\n')
  .replace(/"/g, '');

// Add try-catch for Firebase initialization
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
  }
} catch (error) {
  console.error('Firebase initialization failed:', error);
  return {
    statusCode: 500,
    headers,
    body: JSON.stringify({ error: 'Database connection failed' })
  };
}

const db = admin.firestore();

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    const { treeId, memberId } = JSON.parse(event.body);

    // Get member data
    const memberDoc = await db.collection('members').doc(memberId).get();
    if (!memberDoc.exists) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Member not found' }),
      };
    }

    const member = memberDoc.data();
    
    // Search public match pool
    const publicPoolSnapshot = await db.collection('publicMatchPool').get();
    const suggestions = [];

    publicPoolSnapshot.docs.forEach(doc => {
      const candidate = doc.data();
      
      // Skip same tree
      if (candidate.treeId === treeId) return;
      
      const matchScore = calculateMatchScore(member, candidate);
      
      if (matchScore > 0.7) {
        suggestions.push({
          id: `sugg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          type: 'cross-tree-match',
          sourceMemberId: memberId,
          sourceTreeId: treeId,
          targetMemberId: candidate.memberId,
          targetTreeId: candidate.treeId,
          matchScore: matchScore,
          evidence: generateEvidence(member, candidate),
          status: 'pending',
          requiresApproval: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    });

    // Store suggestions in Firestore
    const batch = db.batch();
    suggestions.forEach(suggestion => {
      const suggestionRef = db.collection('suggestions').doc(suggestion.id);
      batch.set(suggestionRef, suggestion);
    });
    
    await batch.commit();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: suggestions,
        count: suggestions.length
      }),
    };

  } catch (error) {
    console.error('AI suggestions error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate suggestions',
        message: error.message 
      }),
    };
  }
};

// Helper functions
function calculateMatchScore(member1, member2) {
  let score = 0;
  let totalWeight = 0;

  // Name similarity (weight: 0.4)
  if (member1.name && member2.name) {
    const similarity = calculateStringSimilarity(
      member1.name.toLowerCase(),
      member2.name.toLowerCase()
    );
    score += similarity * 0.4;
    totalWeight += 0.4;
  }

  // Birth date proximity (weight: 0.3)
  if (member1.birthDate && member2.birthDate) {
    const proximity = calculateDateProximity(member1.birthDate, member2.birthDate);
    score += proximity * 0.3;
    totalWeight += 0.3;
  }

  // Location match (weight: 0.2)
  if (member1.birthPlace && member2.birthPlace) {
    const locationMatch = member1.birthPlace.toLowerCase() === member2.birthPlace.toLowerCase() ? 1 : 0;
    score += locationMatch * 0.2;
    totalWeight += 0.2;
  }

  // Tribe match (weight: 0.1)
  if (member1.tribe && member2.tribe) {
    const tribeMatch = member1.tribe.toLowerCase() === member2.tribe.toLowerCase() ? 1 : 0;
    score += tribeMatch * 0.1;
    totalWeight += 0.1;
  }

  return totalWeight > 0 ? score / totalWeight : 0;
}

function calculateStringSimilarity(str1, str2) {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(str1, str2);
  return 1 - (distance / maxLength);
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

function calculateDateProximity(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const daysDiff = Math.abs((d1 - d2) / (1000 * 60 * 60 * 24));
  
  return Math.max(0, 1 - (daysDiff / 1825));
}

function generateEvidence(member1, member2) {
  const evidence = [];
  
  if (member1.name && member2.name) {
    const similarity = calculateStringSimilarity(
      member1.name.toLowerCase(),
      member2.name.toLowerCase()
    );
    if (similarity > 0.7) {
      evidence.push(`Similar names: ${member1.name} ↔ ${member2.name}`);
    }
  }
  
  if (member1.birthDate && member2.birthDate) {
    const proximity = calculateDateProximity(member1.birthDate, member2.birthDate);
    if (proximity > 0.5) {
      evidence.push(`Close birth dates: ${member1.birthDate} ↔ ${member2.birthDate}`);
    }
  }
  
  return evidence;
}




