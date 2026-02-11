import { describe, it, expect } from 'vitest';
import { suggestionService } from '../services/suggestionService';

describe('Evidence Generation', () => {
  it('should generate evidence for name similarity', () => {
    const person1 = { name: 'John Doe', birthDate: '1980-01-01' };
    const person2 = { name: 'John Doh', birthDate: '1980-01-02' };
    
    const evidence = suggestionService.generateEvidence(person1, person2);
    expect(evidence).toContain('Similar names: John Doe ↔ John Doh');
  });
});
