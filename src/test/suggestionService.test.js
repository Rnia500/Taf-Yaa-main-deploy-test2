import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create a test version of the suggestion service without Firebase dependencies
const testSuggestionService = {
  calculateStringSimilarity(str1, str2) {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;
    
    const distance = this.levenshteinDistance(str1, str2);
    return 1 - (distance / maxLength);
  },

  levenshteinDistance(str1, str2) {
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
  },

  calculateDateProximity(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const daysDiff = Math.abs((d1 - d2) / (1000 * 60 * 60 * 24));
    
    return Math.max(0, 1 - (daysDiff / 1825));
  },

  calculateMatchScore(member1, member2) {
    let score = 0;
    let totalWeight = 0;

    // Name similarity (weight: 0.4)
    if (member1.name && member2.name) {
      const similarity = this.calculateStringSimilarity(
        member1.name.toLowerCase(),
        member2.name.toLowerCase()
      );
      score += similarity * 0.4;
      totalWeight += 0.4;
    }

    // Birth date proximity (weight: 0.3)
    if (member1.birthDate && member2.birthDate) {
      const proximity = this.calculateDateProximity(member1.birthDate, member2.birthDate);
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
  },

  generateEvidence(member1, member2) {
    const evidence = [];
    
    if (member1.name && member2.name) {
      const similarity = this.calculateStringSimilarity(
        member1.name.toLowerCase(),
        member2.name.toLowerCase()
      );
      if (similarity > 0.7) {
        evidence.push(`Similar names: ${member1.name} ↔ ${member2.name}`);
      }
    }
    
    if (member1.birthDate && member2.birthDate) {
      const proximity = this.calculateDateProximity(member1.birthDate, member2.birthDate);
      if (proximity > 0.5) {
        evidence.push(`Close birth dates: ${member1.birthDate} ↔ ${member2.birthDate}`);
      }
    }
    
    return evidence;
  }
};

describe('SuggestionService - String Similarity', () => {
  it('should calculate perfect similarity for identical strings', () => {
    const similarity = testSuggestionService.calculateStringSimilarity('john doe', 'john doe');
    expect(similarity).toBe(1);
  });

  it('should calculate high similarity for similar names', () => {
    const similarity = testSuggestionService.calculateStringSimilarity('john doe', 'john doh');
    expect(similarity).toBeGreaterThan(0.8);
  });

  it('should calculate low similarity for different names', () => {
    const similarity = testSuggestionService.calculateStringSimilarity('john doe', 'jane smith');
    expect(similarity).toBeLessThan(0.5);
  });

  it('should handle empty strings', () => {
    const similarity = testSuggestionService.calculateStringSimilarity('', '');
    expect(similarity).toBe(1);
  });
});

describe('SuggestionService - Match Score Calculation', () => {
  const mockMembers = {
    member1: {
      name: 'John Doe',
      birthDate: '1980-05-15',
      birthPlace: 'Bamenda',
      tribe: 'Bamileke'
    },
    member2: {
      name: 'John Doh',
      birthDate: '1980-05-16',
      birthPlace: 'Bamenda',
      tribe: 'Bamileke'
    },
    member3: {
      name: 'Jane Smith',
      birthDate: '1975-03-20',
      birthPlace: 'Douala',
      tribe: 'Duala'
    }
  };

  it('should calculate high match score for very similar members', () => {
    const score = testSuggestionService.calculateMatchScore(mockMembers.member1, mockMembers.member2);
    console.log('Match score:', score); // Debug log
    expect(score).toBeGreaterThan(0.8);
  });

  it('should calculate low match score for different members', () => {
    const score = testSuggestionService.calculateMatchScore(mockMembers.member1, mockMembers.member3);
    expect(score).toBeLessThan(0.5);
  });

  it('should handle missing data gracefully', () => {
    const member1 = { name: 'John Doe' };
    const member2 = { birthDate: '1980-01-01' };
    const score = testSuggestionService.calculateMatchScore(member1, member2);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

