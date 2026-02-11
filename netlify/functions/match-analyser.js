// netlify/functions/match-analyzer.js
function calculateSimilarity(person1, person2) {
  const evidence = [];
  let totalScore = 0;
  let weights = 0;
  
  // Name similarity (40% weight)
  const nameSim = calculateNameSimilarity(person1.name, person2.name);
  if (nameSim > 0.3) {
    evidence.push({
      type: 'name_similarity',
      score: nameSim,
      details: `Names match ${Math.round(nameSim * 100)}%`
    });
    totalScore += nameSim * 0.4;
    weights += 0.4;
  }
  
  // Date proximity (30% weight)
  if (person1.dob && person2.dob) {
    const dateSim = calculateDateProximity(person1.dob, person2.dob);
    if (dateSim > 0.5) {
      evidence.push({
        type: 'date_proximity',
        score: dateSim, 
        details: `Birth dates within acceptable range`
      });
      totalScore += dateSim * 0.3;
      weights += 0.3;
    }
  }
  
  // Location similarity (20% weight)
  if (person1.village && person2.village) {
    const locationSim = calculateLocationSimilarity(person1.village, person2.village);
    if (locationSim > 0.6) {
      evidence.push({
        type: 'location_match',
        score: locationSim,
        details: `Same or nearby location`
      });
      totalScore += locationSim * 0.2;
      weights += 0.2;
    }
  }
  
  // Parent name matching (10% weight)
  const parentSim = calculateParentSimilarity(person1, person2);
  if (parentSim > 0.7) {
    evidence.push({
      type: 'parent_match',
      score: parentSim,
      details: 'Parent names match'
    });
    totalScore += parentSim * 0.1;
    weights += 0.1;
  }
  
  const overall = weights > 0 ? totalScore / weights : 0;
  
  return {
    overall,
    evidence,
    breakdown: {
      nameScore: nameSim,
      dateScore: person1.dob && person2.dob ? calculateDateProximity(person1.dob, person2.dob) : 0,
      locationScore: person1.village && person2.village ? calculateLocationSimilarity(person1.village, person2.village) : 0
    }
  };
}

// Levenshtein distance for name matching
function calculateNameSimilarity(name1, name2) {
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();
  
  // Exact match
  if (n1 === n2) return 1.0;
  
  // Calculate Levenshtein distance
  const distance = levenshteinDistance(n1, n2);
  const maxLength = Math.max(n1.length, n2.length);
  
  return Math.max(0, 1 - (distance / maxLength));
}

function levenshteinDistance(str1, str2) {
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
}

function calculateDateProximity(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  const yearDiff = Math.abs(d1.getFullYear() - d2.getFullYear());
  
  // Same year = 1.0, each year apart reduces score
  return Math.max(0, 1 - (yearDiff / 20)); // 20 year max difference
}