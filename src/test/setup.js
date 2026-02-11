import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock Firebase completely
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => new Date())
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn()
}));

vi.mock('../config/firebase', () => ({
  db: {},
  auth: {}
}));

// Mock fetch for API calls
global.fetch = vi.fn();

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods to reduce test noise
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
};





