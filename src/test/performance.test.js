import { describe, it, expect } from 'vitest';
import { suggestionService } from '../services/suggestionService';

describe('SuggestionService Performance', () => {
  it('should calculate match scores efficiently for large datasets', () => {
    const member1 = {
      name: 'John Doe',
      birthDate: '1980-05-15',
      birthPlace: 'Bamenda',
      tribe: 'Bamileke'
    };

    // Generate 1000 test members
    const testMembers = Array.from({ length: 1000 }, (_, i) => ({
      name: `Test Member ${i}`,
      birthDate: `198${i % 10}-0${(i % 9) + 1}-${(i % 28) + 1}`,
      birthPlace: `City ${i % 10}`,
      tribe: `Tribe ${i % 5}`
    }));

    const startTime = performance.now();
    
    const scores = testMembers.map(member => 
      suggestionService.calculateMatchScore(member1, member)
    );
    
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(scores).toHaveLength(1000);
    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
  });

  it('should handle string similarity calculation efficiently', () => {
    const longString1 = 'A'.repeat(1000);
    const longString2 = 'B'.repeat(1000);

    const startTime = performance.now();
    const similarity = suggestionService.calculateStringSimilarity(longString1, longString2);
    const endTime = performance.now();

    expect(similarity).toBeGreaterThanOrEqual(0);
    expect(endTime - startTime).toBeLessThan(100); // Should be fast
  });
});
