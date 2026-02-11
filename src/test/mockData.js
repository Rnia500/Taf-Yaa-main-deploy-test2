export const mockMembers = {
  member1: {
    id: 'member_1',
    name: 'John Doe',
    birthDate: '1980-05-15',
    dob: '1980-05-15', // Keep both for compatibility
    birthPlace: 'Douala, Cameroon',
    location: 'Douala, Cameroon',
    tribe: 'Bamileke',
    gender: 'male',
    treeId: 'tree_1'
  },
  member2: {
    id: 'member_2',
    name: 'John Doh', // Similar name for testing
    birthDate: '1980-05-16',
    dob: '1980-05-16',
    birthPlace: 'Douala, Cameroon',
    location: 'Douala, Cameroon',
    tribe: 'Bamileke',
    gender: 'male',
    treeId: 'tree_1'
  },
  member3: {
    id: 'member_3',
    name: 'Jane Smith',
    birthDate: '1990-12-01',
    dob: '1990-12-01',
    birthPlace: 'Yaounde, Cameroon',
    location: 'Yaounde, Cameroon',
    tribe: 'Ewondo',
    gender: 'female',
    treeId: 'tree_1'
  }
};

export const mockPublicMatchPool = [
  {
    memberId: 'external_1',
    name: 'John Doe Jr',
    birthDate: '1980-05-20',
    birthPlace: 'Douala, Cameroon',
    tribe: 'Bamileke',
    treeId: 'tree_2'
  },
  {
    memberId: 'external_2',
    name: 'Marie Kameni',
    birthDate: '1975-03-10',
    birthPlace: 'Bafang, Cameroon',
    tribe: 'Bamileke',
    treeId: 'tree_3'
  }
];

export const mockSuggestions = [
  {
    id: 'sugg_1',
    type: 'cross-tree-match',
    sourceMemberId: 'member_1',
    sourceTreeId: 'tree_1',
    targetMemberId: 'member_2',
    targetTreeId: 'tree_2',
    matchScore: 0.85,
    evidence: ['Similar names: John Doe ↔ John Doh', 'Close birth dates: 1980-05-15 ↔ 1980-05-16'],
    status: 'pending',
    requiresApproval: true
  }
];


