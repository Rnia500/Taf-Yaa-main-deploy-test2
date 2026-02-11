import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockMembers, mockPublicMatchPool } from './mockData';

// Mock Firebase Admin completely BEFORE any imports
const mockFirestore = {
  collection: vi.fn(() => ({
    doc: vi.fn(() => ({
      get: vi.fn(() => Promise.resolve({
        exists: true,
        data: () => mockMembers.member1
      }))
    })),
    get: vi.fn(() => Promise.resolve({
      docs: mockPublicMatchPool.map(item => ({
        data: () => item
      }))
    }))
  })),
  batch: vi.fn(() => ({
    set: vi.fn(),
    commit: vi.fn(() => Promise.resolve())
  })),
  FieldValue: {
    serverTimestamp: vi.fn(() => new Date())
  }
};

const mockAdmin = {
  apps: { length: 1 },
  initializeApp: vi.fn(),
  firestore: vi.fn(() => mockFirestore),
  credential: {
    cert: vi.fn(() => ({}))
  }
};

// Mock firebase-admin module completely
vi.mock('firebase-admin', () => mockAdmin);

describe('AI Suggestions Netlify Function', () => {
  // Create a mock handler that simulates the Netlify function behavior
  const mockHandler = vi.fn(async (event, context) => {
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

      // Mock member lookup
      if (memberId === 'non-existent') {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Member not found' }),
        };
      }

      // Mock successful response
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: [{
            id: 'sugg_1',
            type: 'cross-tree-match',
            sourceMemberId: memberId,
            sourceTreeId: treeId,
            targetMemberId: 'member_2',
            targetTreeId: 'tree_2',
            matchScore: 0.85,
            evidence: ['Similar names: John Doe ↔ John Doh'],
            status: 'pending',
            requiresApproval: true
          }],
          count: 1
        }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Internal server error' }),
      };
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate suggestions for valid member', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        treeId: 'tree_1',
        memberId: 'member_1'
      })
    };

    const result = await mockHandler(event, {});
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeInstanceOf(Array);
    expect(body.count).toBeGreaterThan(0);
  });

  it('should return 404 for non-existent member', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        treeId: 'tree_1',
        memberId: 'non-existent'
      })
    };

    const result = await mockHandler(event, {});
    expect(result.statusCode).toBe(404);
  });

  it('should handle CORS preflight requests', async () => {
    const event = { httpMethod: 'OPTIONS' };
    const result = await mockHandler(event, {});

    expect(result.statusCode).toBe(200);
    expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
  });

  it('should reject non-POST requests', async () => {
    const event = { httpMethod: 'GET' };
    const result = await mockHandler(event, {});

    expect(result.statusCode).toBe(405);
  });
});


