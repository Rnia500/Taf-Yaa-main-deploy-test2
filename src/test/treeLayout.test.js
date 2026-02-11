import { describe, it, expect } from 'vitest';
import { calculateLayout, formatPersonData, filterFamilyByRoot } from '../utils/treeUtils/treeLayout.js';

describe('Tree Layout Tests', () => {
  const mockHandleToggleCollapse = (id) => console.log(`Toggle collapse for ${id}`);
  const mockHandleOpenProfile = (id) => console.log(`Open profile for ${id}`);

  describe('formatPersonData', () => {
    it('should default gender to male if undefined', () => {
      const person = { id: '1', name: 'John', gender: undefined };
      const result = formatPersonData(person, [], mockHandleToggleCollapse, mockHandleOpenProfile);
      expect(result.sex).toBe('M');
      expect(result.gender).toBe('male');
    });

    it('should use provided gender', () => {
      const person = { id: '1', name: 'Jane', gender: 'female' };
      const result = formatPersonData(person, [], mockHandleToggleCollapse, mockHandleOpenProfile);
      expect(result.sex).toBe('F');
      expect(result.gender).toBe('female');
    });
  });

  describe('filterFamilyByRoot', () => {
    it('should filter family members correctly', () => {
      const people = [
        { id: '1', name: 'Root' },
        { id: '2', name: 'Spouse' },
        { id: '3', name: 'Child' },
        { id: '4', name: 'Unrelated' }
      ];
      const marriages = [
        { id: 'm1', marriageType: 'monogamous', spouses: ['1', '2'], childrenIds: ['3'] }
      ];
      const result = filterFamilyByRoot('1', people, marriages);
      expect(result.people).toHaveLength(3);
      expect(result.people.map(p => p.id)).toEqual(['1', '2', '3']);
    });
  });

  describe('calculateLayout', () => {
    it('should filter data by root and assign correct variants', () => {
      const people = [
        { id: '1', name: 'Root', gender: 'male' },
        { id: '2', name: 'Spouse', gender: 'female' },
        { id: '3', name: 'Child', gender: 'male' },
        { id: '4', name: 'Unrelated', gender: 'female' }
      ];
      const marriages = [
        { id: 'm1', marriageType: 'monogamous', spouses: ['1', '2'], childrenIds: ['3'] }
      ];

      const result = calculateLayout('1', people, marriages, mockHandleToggleCollapse, mockHandleOpenProfile, 'vertical');

      // Should only include family members of root
      expect(result.nodes).toHaveLength(3); // Root, spouse, child
      const rootNode = result.nodes.find(n => n.id === '1');
      expect(rootNode.data.variant).toBe('root');
    });

    it('should handle horizontal orientation', () => {
      const people = [
        { id: '1', name: 'Root', gender: 'male' },
        { id: '2', name: 'Spouse', gender: 'female' }
      ];
      const marriages = [
        { id: 'm1', marriageType: 'monogamous', spouses: ['1', '2'], childrenIds: [] }
      ];

      const result = calculateLayout('1', people, marriages, mockHandleToggleCollapse, mockHandleOpenProfile, 'horizontal');

      expect(result.nodes).toHaveLength(3); // Root, spouse, marriage node
      const rootNode = result.nodes.find(n => n.id === '1');
      expect(rootNode.data.variant).toBe('root');
    });
  });
});
