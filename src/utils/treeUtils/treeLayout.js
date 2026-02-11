import { layoutVertical } from "./layoutVertical";
import { layoutHorizontal } from "./layoutHorizontal";
import {
  VERTICAL_NODE_WIDTH,
  VERTICAL_NODE_HEIGHT,
  HORIZONTAL_NODE_WIDTH,
  HORIZONTAL_NODE_HEIGHT,
} from "./treeLayoutConstants";

// Re-export constants for use in other modules
export {
  VERTICAL_NODE_WIDTH,
  VERTICAL_NODE_HEIGHT,
  HORIZONTAL_NODE_WIDTH,
  HORIZONTAL_NODE_HEIGHT,
} from "./treeLayoutConstants";

// Re-export layout functions
export { layoutVertical } from "./layoutVertical";
export { layoutHorizontal } from "./layoutHorizontal";



export function traceLineage(personId, people, marriages) {
  const highlightedNodesSet = new Set();
  const highlightedEdgesSet = new Set();
  const visited = new Set();

  function addNode(id) {
    if (!id) return;
    highlightedNodesSet.add(id);
  }

  function addEdgeId(id) {
    if (!id) return;
    highlightedEdgesSet.add(id);
  }

  function findAncestors(currentPersonId) {
    if (!currentPersonId || visited.has(currentPersonId)) return;
    visited.add(currentPersonId);

    const parentMarriage = marriages.find(
      m =>
        (m.marriageType === 'monogamous' && m.childrenIds.includes(currentPersonId)) ||
        (m.marriageType === 'polygamous' && m.wives.some(w => w.childrenIds.includes(currentPersonId)))
    );
    if (!parentMarriage) return;

    if (parentMarriage.marriageType === 'monogamous') {
      const [p1, p2] = parentMarriage.spouses;
      const marriageNodeId = `marriage-${parentMarriage.id}`;

      addNode(p1);
      addNode(p2);
      addNode(marriageNodeId);

      addEdgeId(`edge-${p1}-${marriageNodeId}`);
      addEdgeId(`edge-${p2}-${marriageNodeId}`);
      addEdgeId(`edge-${marriageNodeId}-${currentPersonId}`);

      findAncestors(p1);
      findAncestors(p2);
    } else if (parentMarriage.marriageType === 'polygamous') {
      const husbandId = parentMarriage.husbandId;
      const wifeData = parentMarriage.wives.find(w => w.childrenIds.includes(currentPersonId));
      if (wifeData) {
        const wifeId = wifeData.wifeId;

        addNode(husbandId);
        addNode(wifeId);

        addEdgeId(`edge-${husbandId}-${wifeId}`);
        addEdgeId(`edge-${wifeId}-${currentPersonId}`);

        findAncestors(husbandId);
        findAncestors(wifeId);
      }
    }
  }

  addNode(personId);
  findAncestors(personId);

  return { nodes: Array.from(highlightedNodesSet), edges: Array.from(highlightedEdgesSet) };
}

export function filterFamilyByRoot(rootId, allPeople, allMarriages) {
  if (!rootId) {
    throw new Error("filterFamilyByRoot: rootId is required");
  }
  if (!Array.isArray(allPeople)) {
    throw new Error("filterFamilyByRoot: allPeople must be an array");
  }
  if (!Array.isArray(allMarriages)) {
    throw new Error("filterFamilyByRoot: allMarriages must be an array");
  }

  const visiblePeopleIds = new Set();
  const queue = [rootId];

  while (queue.length > 0) {
    const currentPersonId = queue.shift();
    if (visiblePeopleIds.has(currentPersonId)) continue;
    visiblePeopleIds.add(currentPersonId);

    const personMarriages = allMarriages.filter(m =>
      !m.isDeleted && !m.pendingDeletion && (
        (m.marriageType === "monogamous" && m.spouses.includes(currentPersonId)) ||
        (m.marriageType === "polygamous" && m.husbandId === currentPersonId)
      )
    );

    for (const marriage of personMarriages) {
      if (marriage.marriageType === "monogamous") {
        marriage.spouses.forEach(id => visiblePeopleIds.add(id));
      } else {
        marriage.wives.forEach(w => visiblePeopleIds.add(w.wifeId));
      }

      const children = marriage.marriageType === "monogamous"
        ? marriage.childrenIds
        : marriage.wives.flatMap(w => w.childrenIds);

      children.forEach(childId => queue.push(childId));
    }
  }

  const visiblePeople = allPeople.filter(p => visiblePeopleIds.has(p.id));
  const visibleMarriages = allMarriages.filter(m => {
    // Filter out deleted marriages
    if (m.isDeleted || m.pendingDeletion) {
      return false;
    }
    
    if (m.marriageType === "monogamous") {
      if (m.spouses.some(id => !id)) return false;
      return m.spouses.every(id => visiblePeopleIds.has(id));
    }
    if (m.marriageType === "polygamous") return visiblePeopleIds.has(m.husbandId);
    return false;
  });

  return { people: visiblePeople, marriages: visibleMarriages };
}
export function formatPersonData(person, marriages, handleToggleCollapse, handleOpenProfile) {
  if (!person) return {};
  const hasChildren = marriages.some(m =>
    (m.marriageType === "monogamous" &&
      m.spouses?.includes(person.id) &&
      (m.childrenIds?.length ?? 0) > 0) ||

    (m.marriageType === "polygamous" &&
      (
        (m.husbandId === person.id && m.wives?.some(w => (w.childrenIds?.length ?? 0) > 0)) ||
        m.wives?.some(w => w.wifeId === person.id && (w.childrenIds?.length ?? 0) > 0)
      )
    )
  );

  let variant = person.variant || "directline";
  if (person.isDeceased || person.dod) {
    variant = "dead";
  }

  const gender = person.gender || "male"; // Default to male if gender is undefined
  return {
    id: person.id,
    name: person.name,
    profileImage: person.photoUrl,
    sex: gender === "male" ? "M" : "F",
    birthDate: person.dob,
    deathDate: person.dod,
    isDead: person.dod ? true : false,
    role: person.role,
    isCollapsed: person.isCollapsed,
    hasChildren,
    isPlaceholder: person.isPlaceholder || false,
    isSoftDeleted: person.deletionMode === "soft" && person.pendingDeletion || false,
    undoExpiresAt: person.undoExpiresAt,
    onToggleCollapse: () => handleToggleCollapse(person.id),
    onOpenProfile: () => handleOpenProfile(person.id),
    variant,
    gender, // Include gender for components that use it
  };
}

export function getDescendantIds(personId, marriages) {
  const descendants = new Set();
  const visitedMarriages = new Set();

  function findDescendants(currentPersonId) {
    for (const marriage of marriages) {
      let childrenInMarriage = [];
      let isParentInMarriage = false;

      if (marriage.marriageType === "monogamous" && marriage.spouses.includes(currentPersonId)) {
        isParentInMarriage = true;
        childrenInMarriage = marriage.childrenIds;
      } else if (marriage.marriageType === "polygamous") {
        if (marriage.husbandId === currentPersonId) {
          isParentInMarriage = true;
          childrenInMarriage = marriage.wives.flatMap(w => w.childrenIds);
        } else {
          const wifeData = marriage.wives.find(w => w.wifeId === currentPersonId);
          if (wifeData) {
            isParentInMarriage = true;
            childrenInMarriage = wifeData.childrenIds;
          }
        }
      }

      if (isParentInMarriage && !visitedMarriages.has(marriage.id)) {
        visitedMarriages.add(marriage.id);
        for (const childId of childrenInMarriage) {
          if (!descendants.has(childId)) {
            descendants.add(childId);
            findDescendants(childId);
          }
        }
      }
    }
  }

  findDescendants(personId);
  return Array.from(descendants);
}


export function findHighestAncestor(startPersonId, allPeople, allMarriages) {
  let currentPersonId = startPersonId;
  let highestAncestorId = startPersonId;
  const visited = new Set(); 
  
  while (currentPersonId && !visited.has(currentPersonId)) {
    visited.add(currentPersonId);
    
   
    const parentMarriage = allMarriages.find(m => 
      (m.childrenIds?.includes(currentPersonId)) || 
      (m.marriageType === 'polygamous' && m.wives.some(w => w.childrenIds?.includes(currentPersonId)))
    );

    if (parentMarriage) {
     
      const newParentId = parentMarriage.husbandId || parentMarriage.spouses?.[0];
      if (newParentId) {
        currentPersonId = newParentId;
        highestAncestorId = newParentId;
      } else {
        
        break;
      }
    } else {
      
      break;
    }
  }

  return highestAncestorId;
}




export function getSpouseOptions(selectedParentId, people, marriages) {
  if (!selectedParentId) return { spouse: null, wives: [] };

  const person = people.find(p => p.id === selectedParentId);
  if (!person) return { spouse: null, wives: [] };

  // Find marriages where this person is a spouse
  const personMarriages = marriages.filter(m =>
    (m.marriageType === "monogamous" && m.spouses?.includes(selectedParentId)) ||
    (m.marriageType === "polygamous" && (m.husbandId === selectedParentId || m.wives?.some(w => w.wifeId === selectedParentId)))
  );

  // For monogamous: return the spouse
  const monogamousMarriage = personMarriages.find(m => m.marriageType === "monogamous");
  if (monogamousMarriage) {
    const spouseId = monogamousMarriage.spouses.find(id => id !== selectedParentId);
    const spouse = spouseId ? people.find(p => p.id === spouseId) : null;
    return { spouse, wives: [] };
  }

  // For polygamous: if male, return all wives; if female, return husband
  const polygamousMarriage = personMarriages.find(m => m.marriageType === "polygamous");
  if (polygamousMarriage) {
    if (person.gender === "male" && polygamousMarriage.husbandId === selectedParentId) {
      const wives = polygamousMarriage.wives?.map(w => people.find(p => p.id === w.wifeId)).filter(Boolean) || [];
      return { spouse: null, wives };
    } else if (person.gender === "female") {
      const wifeData = polygamousMarriage.wives?.find(w => w.wifeId === selectedParentId);
      if (wifeData) {
        const husband = people.find(p => p.id === polygamousMarriage.husbandId);
        return { spouse: husband, wives: [] };
      }
    }
  }

  // No spouse found
  return { spouse: null, wives: [] };
}

export function calculateLayout(
  rootId,
  people,
  marriages,
  handleToggleCollapse,
  handleOpenProfile,
  orientation = "vertical"
) {
  if (!rootId) {
    throw new Error("calculateLayout: rootId is required");
  }
  if (!Array.isArray(people)) {
    throw new Error("calculateLayout: people must be an array");
  }
  if (!Array.isArray(marriages)) {
    throw new Error("calculateLayout: marriages must be an array");
  }
  if (typeof handleToggleCollapse !== "function") {
    throw new Error("calculateLayout: handleToggleCollapse must be a function");
  }
  if (typeof handleOpenProfile !== "function") {
    throw new Error("calculateLayout: handleOpenProfile must be a function");
  }

  // Filter family members relevant to the chosen root
  const { people: visiblePeople, marriages: visibleMarriages } =
    filterFamilyByRoot(rootId, people, marriages);

  const isVertical = orientation === "vertical";
  const NODE_WIDTH = isVertical ? VERTICAL_NODE_WIDTH : HORIZONTAL_NODE_WIDTH;
  const NODE_HEIGHT = isVertical ? VERTICAL_NODE_HEIGHT : HORIZONTAL_NODE_HEIGHT;

  const edges = [];
  const nodesMap = new Map();

  // Track collapsed descendants (to skip them)
  const collapsedDescendantIds = new Set();
  visiblePeople.forEach((person) => {
    if (person.isCollapsed) {
      getDescendantIds(person.id, visibleMarriages).forEach((id) =>
        collapsedDescendantIds.add(id)
      );
    }
  });

// Ensure spouse/wives of collapsed person are also collapsed
visibleMarriages.forEach((marriage) => {
  if (marriage.marriageType === "monogamous") {
    const [p1, p2] = marriage.spouses;
    if (collapsedDescendantIds.has(p1)) collapsedDescendantIds.add(p2);
    if (collapsedDescendantIds.has(p2)) collapsedDescendantIds.add(p1);
  } else if (marriage.marriageType === "polygamous") {
    const { husbandId, wives } = marriage;
    if (collapsedDescendantIds.has(husbandId)) {
      wives.forEach((w) => collapsedDescendantIds.add(w.wifeId));
    }
    wives.forEach((w) => {
      if (collapsedDescendantIds.has(w.wifeId)) {
        collapsedDescendantIds.add(husbandId);
        wives.forEach((other) => collapsedDescendantIds.add(other.wifeId));
      }
    });
  }
});


  // Build person nodes map (without assigning variant!)
  const personNodeType = isVertical ? "person" : "personHorizontal";
  visiblePeople.forEach((person) => {
    if (!collapsedDescendantIds.has(person.id)) {
      nodesMap.set(person.id, {
        id: person.id,
        type: personNodeType,
        data: formatPersonData(
          person,
          visibleMarriages,
          handleToggleCollapse,
          handleOpenProfile
          // 🚫 variant removed — layout will assign later
        ),
        position: { x: 0, y: 0 },
        isPositioned: false,
      });
    }
  });

  // Helper: sort marriages by traversal
  const getMarriagesByGeneration = () => {
    const sortedMarriages = [];
    const queue = [rootId];
    const visitedPeople = new Set([rootId]);
    const visitedMarriages = new Set();

    while (queue.length > 0) {
      const currentPersonId = queue.shift();

      const personMarriages = visibleMarriages.filter((m) => {
        if (visitedMarriages.has(m.id)) return false;
        if (m.marriageType === "monogamous")
          return m.spouses.includes(currentPersonId);
        if (m.marriageType === "polygamous")
          return (
            m.husbandId === currentPersonId ||
            m.wives.some((w) => w.wifeId === currentPersonId)
          );
        return false;
      });

      for (const marriage of personMarriages) {
        visitedMarriages.add(marriage.id);
        sortedMarriages.push(marriage);

        let children = [];
        if (marriage.marriageType === "monogamous")
          children = marriage.childrenIds || [];
        else children = (marriage.wives || []).flatMap((w) => w.childrenIds || []);

        for (const childId of children) {
          if (childId && !visitedPeople.has(childId)) {
            visitedPeople.add(childId);
            if (nodesMap.has(childId)) queue.push(childId);
          }
        }
      }
    }

    // Include soft-deleted nodes that might not be connected through marriages
    for (const [personId, node] of nodesMap) {
      if (node.data?.isSoftDeleted && !visitedPeople.has(personId)) {
        // Find any marriages where this person is a child
        const parentMarriages = visibleMarriages.filter(m => {
          if (m.marriageType === "monogamous") {
            return m.childrenIds?.includes(personId);
          } else if (m.marriageType === "polygamous") {
            return m.wives?.some(w => w.childrenIds?.includes(personId));
          }
          return false;
        });

        // If we found parent marriages, add them to sortedMarriages
        for (const marriage of parentMarriages) {
          if (!visitedMarriages.has(marriage.id)) {
            visitedMarriages.add(marriage.id);
            sortedMarriages.push(marriage);
          }
        }
      }
    }

    return sortedMarriages;
  };

  const sortedMarriages = getMarriagesByGeneration();

  // Delegate to orientation-specific layout (they set variants + positions)
  return isVertical
    ? layoutVertical(nodesMap, sortedMarriages, edges, rootId)
    : layoutHorizontal(nodesMap, sortedMarriages, edges, rootId);
}

export function getDirectLinePeople(people, marriages) {
  const directLineIds = new Set();

  console.log('getDirectLinePeople: Input data:', { peopleCount: people.length, marriagesCount: marriages.length });
  console.log('getDirectLinePeople: Marriages:', marriages);

  marriages.forEach(marriage => {
    console.log('getDirectLinePeople: Processing marriage:', marriage);
    if (marriage.isDeleted) {
      console.log('getDirectLinePeople: Skipping deleted marriage');
      return; // skip deleted records
    }

    if (marriage.marriageType === "monogamous") {
      const [spouseA, spouseB] = marriage.spouses || [];
      console.log('getDirectLinePeople: Monogamous marriage spouses:', spouseA, spouseB);
      // Add both spouses to direct line (they can be parents even without children yet)
      if (spouseA) directLineIds.add(spouseA);
      if (spouseB) directLineIds.add(spouseB);
      // Add children if they exist
      if (marriage.childrenIds?.length > 0) {
        marriage.childrenIds.forEach(id => directLineIds.add(id));
      }
    }

    else if (marriage.marriageType === "polygamous") {
      const husbandId = marriage.husbandId;
      const wives = marriage.wives || [];

      console.log('getDirectLinePeople: Polygamous marriage husband:', husbandId, 'wives:', wives);
      // Add husband to direct line
      if (husbandId) directLineIds.add(husbandId);

      wives.forEach(wife => {
        // Add wife to direct line
        if (wife.wifeId) directLineIds.add(wife.wifeId);
        // Add children if they exist
        if (wife.childrenIds?.length > 0) {
          wife.childrenIds.forEach(id => directLineIds.add(id));
        }
      });
    }
  });

  console.log('getDirectLinePeople: Direct line IDs collected:', Array.from(directLineIds));

  // Find the root (highest ancestor) among direct line people
  let rootId = null;
  const directLinePeople = people.filter(p => directLineIds.has(p.id));
  for (const person of directLinePeople) {
    const hasParents = marriages.some(m =>
      (m.marriageType === "monogamous" && m.childrenIds?.includes(person.id)) ||
      (m.marriageType === "polygamous" && m.wives.some(w => w.childrenIds?.includes(person.id)))
    );
    if (!hasParents) {
      rootId = person.id;
      break; // Assume first one found is the root
    }
  }

  // Exclude spouse of the root if found
  if (rootId) {
    const rootSpouse = getSpouseOptions(rootId, directLinePeople, marriages);
    if (rootSpouse.spouse) {
      directLineIds.delete(rootSpouse.spouse.id);
    }
    if (rootSpouse.wives.length > 0) {
      rootSpouse.wives.forEach(wife => directLineIds.delete(wife.id));
    }
  }

  // Filter only people whose IDs are in direct line, remove duplicates, and exclude placeholders/deleted
  const uniqueDirectLinePeople = [];
  const seenIds = new Set();

  people.forEach(person => {
    if (directLineIds.has(person.id) && !seenIds.has(person.id) &&
        !person.isPlaceholder && !person.isDeleted && !person.pendingDeletion) {
      uniqueDirectLinePeople.push(person);
      seenIds.add(person.id);
    }
  });

  return uniqueDirectLinePeople;
}
