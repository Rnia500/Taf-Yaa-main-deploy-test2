import { vi } from 'vitest';

// Mock Firestore functions
export const mockFirestore = {
  collection: vi.fn(() => ({
    doc: vi.fn(() => ({
      get: vi.fn(() => Promise.resolve({
        exists: true,
        data: () => ({
          id: 'member_1',
          name: 'John Doe',
          birthDate: '1980-05-15',
          birthPlace: 'Bamenda',
          tribe: 'Bamileke',
          treeId: 'tree_1'
        })
      })),
      set: vi.fn(() => Promise.resolve()),
    })),
    getDocs: vi.fn(() => Promise.resolve({
      docs: [
        {
          id: 'member_2',
          data: () => ({
            memberId: 'member_2',
            treeId: 'tree_2',
            name: 'John Doh',
            birthDate: '1980-05-16',
            birthPlace: 'Bamenda',
            tribe: 'Bamileke'
          })
        }
      ]
    })),
    where: vi.fn(() => mockFirestore.collection()),
    orderBy: vi.fn(() => mockFirestore.collection()),
  })),
  doc: vi.fn(() => ({
    set: vi.fn(() => Promise.resolve()),
    get: vi.fn(() => Promise.resolve({
      exists: true,
      data: () => ({})
    }))
  })),
  batch: vi.fn(() => ({
    set: vi.fn(),
    commit: vi.fn(() => Promise.resolve())
  }))
};

export const db = mockFirestore;
export const auth = {};

// Mock Firebase functions
export const serverTimestamp = vi.fn(() => new Date());
export const collection = vi.fn((db, name) => mockFirestore.collection(name));
export const doc = vi.fn((db, collection, id) => mockFirestore.doc(id));
export const setDoc = vi.fn(() => Promise.resolve());
export const getDoc = vi.fn(() => Promise.resolve({
  exists: () => true,
  data: () => ({ id: 'test', name: 'Test Person', birthDate: '1980-01-01' })
}));
export const getDocs = vi.fn(() => mockFirestore.collection().getDocs());
export const query = vi.fn((...args) => args);
export const where = vi.fn(() => ({}));
export const orderBy = vi.fn(() => ({}));