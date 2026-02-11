import { describe, it, expect, vi } from 'vitest';
import { mockMembers, mockPublicMatchPool } from './mockData';

// Test the core logic without Firebase dependencies
describe('AI Suggestions Logic', () => {
  // Helper functions from the Netlify function - FIXED VERSION
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

  // Debug test to understand the scoring
  it('should debug match score calculation', () => {
    const member1 = mockMembers.member1;
    const member2 = mockMembers.member2;
    
    console.log('Member 1:', member1);
    console.log('Member 2:', member2);
    
    const nameSimilarity = calculateStringSimilarity(
      member1.name.toLowerCase(),
      member2.name.toLowerCase()
    );
    console.log('Name similarity:', nameSimilarity);
    
    const dateProximity = calculateDateProximity(member1.birthDate, member2.birthDate);
    console.log('Date proximity:', dateProximity);
    
    const locationMatch = member1.birthPlace.toLowerCase() === member2.birthPlace.toLowerCase() ? 1 : 0;
    console.log('Location match:', locationMatch);
    
    const tribeMatch = member1.tribe.toLowerCase() === member2.tribe.toLowerCase() ? 1 : 0;
    console.log('Tribe match:', tribeMatch);
    
    const finalScore = calculateMatchScore(member1, member2);
    console.log('Final score:', finalScore);
    
    expect(finalScore).toBeGreaterThan(0);
  });

  it('should calculate high match score for similar members', () => {
    const score = calculateMatchScore(mockMembers.member1, mockMembers.member2);
    expect(score).toBeGreaterThan(0.8);
  });

  it('should calculate low match score for different members', () => {
    const score = calculateMatchScore(mockMembers.member1, mockMembers.member3);
    expect(score).toBeLessThan(0.5);
  });

  it('should generate suggestions from public match pool', () => {
    const member = mockMembers.member1;
    const suggestions = [];

    mockPublicMatchPool.forEach(candidate => {
      // Skip same tree
      if (candidate.treeId === 'tree_1') return;
      
      const matchScore = calculateMatchScore(member, candidate);
      console.log(`Match score for ${candidate.name}:`, matchScore);
      
      if (matchScore > 0.7) {
        suggestions.push({
          id: `sugg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          type: 'cross-tree-match',
          sourceMemberId: 'member_1',
          sourceTreeId: 'tree_1',
          targetMemberId: candidate.memberId,
          targetTreeId: candidate.treeId,
          matchScore: matchScore,
          evidence: generateEvidence(member, candidate),
          status: 'pending',
          requiresApproval: true
        });
      }
    });

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].matchScore).toBeGreaterThan(0.7);
  });

  it('should generate evidence for similar members', () => {
    const evidence = generateEvidence(mockMembers.member1, mockMembers.member2);
    expect(evidence).toContain('Similar names: John Doe ↔ John Doh');
    expect(evidence).toContain('Close birth dates: 1980-05-15 ↔ 1980-05-16');
  });
});
