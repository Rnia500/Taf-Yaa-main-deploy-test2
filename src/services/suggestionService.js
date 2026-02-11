import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const suggestionService = {
  // Generate relationship suggestions
  async generateSuggestions(treeId, personId) {
    try {
      const suggestions = [];
      
      // Get all people in the tree with error handling
      let treeMembers;
      try {
        treeMembers = await this.getTreeMembers(treeId);
      } catch (error) {
        console.error('Failed to get tree members:', error);
        throw new Error('Unable to access family tree data');
      }
      
      const targetPerson = treeMembers.find(p => p.id === personId);
      if (!targetPerson) {
        throw new Error('Person not found in family tree');
      }
      
      // Internal suggestions with error handling
      try {
        const internalSuggestions = this.findInternalMatches(targetPerson, treeMembers);
        suggestions.push(...internalSuggestions);
      } catch (error) {
        console.error('Internal matching failed:', error);
        // Continue with external matching even if internal fails
      }
      
      // External suggestions with error handling
      try {
        const externalSuggestions = await this.findExternalMatches(targetPerson, treeId);
        suggestions.push(...externalSuggestions);
      } catch (error) {
        console.error('External matching failed:', error);
        // Continue even if external matching fails
      }
      
      // Store suggestions with batch error handling
      const successfulStores = [];
      for (const suggestion of suggestions) {
        try {
          await this.storeSuggestion(suggestion);
          successfulStores.push(suggestion);
        } catch (error) {
          console.error('Failed to store suggestion:', suggestion.id, error);
        }
      }
      
      return successfulStores;
    } catch (error) {
      console.error('Generate suggestions error:', error);
      throw new Error(`Failed to generate suggestions: ${error.message}`);
    }
  },

  // Find matches within the same tree
  findInternalMatches(person, treeMembers) {
    const suggestions = [];
    
    for (const member of treeMembers) {
      if (member.id === person.id) continue;
      
      const matchScore = this.calculateMatchScore(person, member);
      
      if (matchScore > 0.7) {
        suggestions.push({
          id: `internal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          type: 'internal',
          sourcePersonId: person.id,
          targetPersonId: member.id,
          sourceTreeId: person.treeId,
          targetTreeId: member.treeId,
          matchScore: matchScore,
          suggestedRelation: this.determineSuggestedRelation(person, member),
          evidence: this.generateEvidence(person, member),
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      }
    }
    
    return suggestions;
  },

  // Find matches from public match pool
  async findExternalMatches(person, currentTreeId) {
    try {
      const publicPoolQuery = query(
        collection(db, 'publicMatchPool'),
        where('treeId', '!=', currentTreeId)
      );
      
      const snapshot = await getDocs(publicPoolQuery);
      const publicMatches = snapshot.docs.map(doc => doc.data());
      
      const suggestions = [];
      
      for (const match of publicMatches) {
        const matchScore = this.calculateExternalMatchScore(person, match);
        
        if (matchScore > 0.8) {
          suggestions.push({
            id: `external_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            type: 'external',
            sourcePersonId: person.id,
            targetPersonId: match.personId,
            sourceTreeId: person.treeId,
            targetTreeId: match.treeId,
            matchScore: matchScore,
            suggestedRelation: this.determineSuggestedRelation(person, match),
            evidence: this.generateEvidence(person, match),
            status: 'pending',
            requiresApproval: true,
            createdAt: new Date().toISOString()
          });
        }
      }
      
      return suggestions;
    } catch (error) {
      console.error('Error finding external matches:', error);
      return [];
    }
  },

  // Calculate match score between two people
  calculateMatchScore(person1, person2) {
    let totalScore = 0;
    let maxPossibleScore = 0;

    // Name similarity (40% weight)
    if (person1.name && person2.name) {
      const similarity = this.calculateStringSimilarity(
        person1.name.toLowerCase().trim(),
        person2.name.toLowerCase().trim()
      );
      totalScore += similarity * 0.4;
      maxPossibleScore += 0.4;
    }

    // Birth date proximity (30% weight) - handle both dob and birthDate
    const date1 = person1.dob || person1.birthDate;
    const date2 = person2.dob || person2.birthDate;
    if (date1 && date2) {
      const proximity = this.calculateDateProximity(date1, date2);
      totalScore += proximity * 0.3;
      maxPossibleScore += 0.3;
    }

    // Location similarity (20% weight)
    const location1 = person1.birthPlace || person1.location;
    const location2 = person2.birthPlace || person2.location;
    if (location1 && location2) {
      const locationSimilarity = this.calculateStringSimilarity(
        location1.toLowerCase().trim(),
        location2.toLowerCase().trim()
      );
      totalScore += locationSimilarity * 0.2;
      maxPossibleScore += 0.2;
    }

    // Tribe similarity (10% weight)
    if (person1.tribe && person2.tribe) {
      const tribeSimilarity = person1.tribe.toLowerCase() === person2.tribe.toLowerCase() ? 1 : 0;
      totalScore += tribeSimilarity * 0.1;
      maxPossibleScore += 0.1;
    }

    return maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;
  },

  // Add all missing helper methods
  calculateStringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;
    
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;
    
    const distance = this.levenshteinDistance(str1, str2);
    return Math.max(0, 1 - (distance / maxLength));
  },

  levenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill().map(() => Array(str1.length + 1).fill(0));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,     // deletion
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i - 1] + cost // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  },

  calculateDateProximity(date1, date2) {
    try {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      
      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
      
      const daysDiff = Math.abs((d1 - d2) / (1000 * 60 * 60 * 24));
      const maxDays = 365 * 5; // 5 years threshold
      
      return Math.max(0, 1 - (daysDiff / maxDays));
    } catch (error) {
      console.error('Date proximity calculation error:', error);
      return 0;
    }
  },

  // Extract location similarity from bio text
  extractLocationSimilarity(bio1, bio2) {
    // Simple implementation - look for common location keywords
    const locations1 = this.extractLocations(bio1);
    const locations2 = this.extractLocations(bio2);
    
    const commonLocations = locations1.filter(loc => 
      locations2.some(loc2 => 
        this.calculateStringSimilarity(loc.toLowerCase(), loc2.toLowerCase()) > 0.8
      )
    );
    
    return commonLocations.length > 0 ? 0.8 : 0;
  },

  // Extract potential location names from text
  extractLocations(text) {
    // Basic implementation - could be enhanced with NLP
    const commonLocationWords = [
      'village', 'town', 'city', 'region', 'province', 'quarter',
      'bamenda', 'douala', 'yaounde', 'bafoussam', 'bafang'
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => 
      word.length > 3 && 
      (commonLocationWords.includes(word) || /^[A-Z]/.test(word))
    );
  },

  // Determine suggested relationship type
  determineSuggestedRelation(person1, person2) {
    // Simple age-based heuristic
    if (person1.birthDate && person2.birthDate) {
      const age1 = new Date().getFullYear() - new Date(person1.birthDate).getFullYear();
      const age2 = new Date().getFullYear() - new Date(person2.birthDate).getFullYear();
      const ageDiff = Math.abs(age1 - age2);

      if (ageDiff < 5) return 'sibling';
      if (ageDiff > 15 && age1 > age2) return 'child';
      if (ageDiff > 15 && age2 > age1) return 'parent';
      return 'cousin';
    }

    return 'relative';
  },

  // Generate evidence for match
  generateEvidence(person1, person2) {
    const evidence = [];
    
    if (person1.name && person2.name) {
      const similarity = this.calculateStringSimilarity(
        person1.name.toLowerCase(),
        person2.name.toLowerCase()
      );
      if (similarity > 0.7) {
        evidence.push(`Similar names: ${person1.name} ↔ ${person2.name}`);
      }
    }
    
    if (person1.birthDate && person2.birthDate) {
      const proximity = this.calculateDateProximity(person1.birthDate, person2.birthDate);
      if (proximity > 0.5) {
        evidence.push(`Close birth dates: ${person1.birthDate} ↔ ${person2.birthDate}`);
      }
    }
    
    return evidence;
  },

  // Store suggestion in database
  async storeSuggestion(suggestion) {
    try {
      await setDoc(doc(db, 'suggestions', suggestion.id), {
        ...suggestion,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error storing suggestion:', error);
    }
  },

  // Get suggestions for a tree
  async getTreeSuggestions(treeId) {
    try {
      const suggestionsQuery = query(
        collection(db, 'suggestions'),
        where('sourceTreeId', '==', treeId),
        where('status', '==', 'pending'),
        orderBy('matchScore', 'desc')
      );
      
      const snapshot = await getDocs(suggestionsQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Failed to get suggestions: ${error.message}`);
    }
  },

  // Get a specific person by ID
  async getPerson(personId) {
    try {
      const personDoc = await getDoc(doc(db, 'people', personId));
      if (!personDoc.exists()) {
        throw new Error('Person not found');
      }
      return { id: personDoc.id, ...personDoc.data() };
    } catch (error) {
      throw new Error(`Failed to get person: ${error.message}`);
    }
  },

  // Get tree members
  async getTreeMembers(treeId, limit = 1000) {
    try {
      const membersQuery = query(
        collection(db, 'people'),
        where('treeId', '==', treeId),
        orderBy('createdAt', 'desc'),
        limit(limit) // Add limit to prevent memory issues
      );

      const snapshot = await getDocs(membersQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Failed to get tree members: ${error.message}`);
    }
  },

  // Add AI-powered relationship detection via Netlify function
  async generateAISuggestions(treeId, personId) {
    try {
      const response = await fetch('/.netlify/functions/ai-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ treeId, memberId: personId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      throw new Error(`Failed to generate AI suggestions: ${error.message}`);
    }
  },

  // Find potential matches between a person and a list of members
  findPotentialMatches(person, members) {
    const matches = [];

    for (const member of members) {
      if (member.id === person.id) continue;

      const matchScore = this.calculateMatchScore(person, member);

      if (matchScore > 0.7) {
        matches.push({
          id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          sourcePersonId: person.id,
          targetPersonId: member.id,
          sourceTreeId: person.treeId,
          targetTreeId: member.treeId,
          matchScore: matchScore,
          suggestedRelation: this.determineSuggestedRelation(person, member),
          evidence: this.generateEvidence(person, member),
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      }
    }

    return matches;
  },

  // Cross-tree matching for diaspora families
  async findCrossTreeMatches(person) {
    try {
      const publicTreesQuery = query(
        collection(db, 'trees'),
        where('isPublic', '==', true),
        where('mergeOptIn', '==', true)
      );

      const snapshot = await getDocs(publicTreesQuery);
      const suggestions = [];

      for (const treeDoc of snapshot.docs) {
        const treeData = treeDoc.data();
        if (treeData.id === person.treeId) continue;

        const treeMembers = await this.getTreeMembers(treeData.id);
        const matches = this.findPotentialMatches(person, treeMembers);

        suggestions.push(...matches.map(match => ({
          ...match,
          type: 'cross-tree',
          targetTreeId: treeData.id,
          requiresApproval: true
        })));
      }

      return suggestions;
    } catch (error) {
      console.error('Cross-tree matching error:', error);
      return [];
    }
  },

  // Process suggestions in batches
  async findExternalMatches(person, treeId, batchSize = 100) {
    try {
      const publicPoolQuery = query(
        collection(db, 'publicMatchPool'),
        where('isActive', '==', true),
        limit(batchSize) // Process in smaller batches
      );
      
      const snapshot = await getDocs(publicPoolQuery);
      const publicMatches = snapshot.docs.map(doc => doc.data());
      
      const suggestions = [];
      
      // Process matches in chunks to avoid memory issues
      for (let i = 0; i < publicMatches.length; i += 50) {
        const chunk = publicMatches.slice(i, i + 50);
        
        for (const match of chunk) {
          const matchScore = this.calculateExternalMatchScore(person, match);
          
          if (matchScore > 0.8) {
            suggestions.push({
              id: `external_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
              type: 'external',
              sourcePersonId: person.id,
              targetPersonId: match.personId,
              sourceTreeId: person.treeId,
              targetTreeId: match.treeId,
              matchScore: matchScore,
              suggestedRelation: this.determineSuggestedRelation(person, match),
              evidence: this.generateEvidence(person, match),
              status: 'pending',
              requiresApproval: true,
              createdAt: new Date().toISOString()
            });
          }
        }
        
        // Allow garbage collection between chunks
        if (i % 200 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      return suggestions;
    } catch (error) {
      console.error('Error finding external matches:', error);
      return [];
    }
  }
};
