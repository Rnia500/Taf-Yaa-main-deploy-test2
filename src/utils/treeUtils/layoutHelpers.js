// src/utils/layoutHelpers.js

function getRowKey(y) {
  return Math.round(y);
}

function ensureRow(occupancy, rowKey) {
  if (!occupancy.has(rowKey)) occupancy.set(rowKey, []);
  return occupancy.get(rowKey);
}

function canPlaceAt(occupancy, y, height, x, width) {
  const startRow = getRowKey(y);
  const endRow = getRowKey(y + height - 1);
  for (let row = startRow; row <= endRow; row++) {
    const intervals = occupancy.get(row);
    if (!intervals) continue;
    for (const it of intervals) {
      if (!(x + width <= it.startX || x >= it.endX)) {
        return false; // overlap
      }
    }
  }
  return true;
}

function reserveInterval(occupancy, y, height, x, width) {
  const startRow = getRowKey(y);
  const endRow = getRowKey(y + height - 1);
  for (let row = startRow; row <= endRow; row++) {
    const intervals = ensureRow(occupancy, row);
    intervals.push({ startX: x, endX: x + width });
    intervals.sort((a, b) => a.startX - b.startX);
  }
}

export function insertIntoOccupancy(occupancy, y, startX, width, height, preferredDirection = 'right') {
  let finalX = startX;
  let guard = 0;
  const spacing = 40; // could use HORIZONTAL_SPACING

  while (guard < 128) {
    guard++;
    if (canPlaceAt(occupancy, y, height, finalX, width)) {
      reserveInterval(occupancy, y, height, finalX, width);
      return finalX;
    }
    finalX = preferredDirection === 'left'
      ? finalX - (width + spacing)
      : finalX + (width + spacing);
  }

  // fallback (should never hit unless spacing is too small)
  reserveInterval(occupancy, y, height, finalX, width);
  return finalX;
}


// src/utils/layoutHelpers.js
function createTreeNode(id, marriage, NODE_WIDTH, NODE_HEIGHT, isSpouse = false) {
  return {
    id: id,
    children: [],
    marriage: marriage,
    isSpouse: isSpouse,
    x: 0, y: 0, width: NODE_WIDTH, height: NODE_HEIGHT, modifier: 0,
  };
}

export function buildTree(nodesMap, marriages, NODE_WIDTH, NODE_HEIGHT, expectedRootId = null) {
  const treeNodes = new Map();
  let root = null;

  for (const id of nodesMap.keys()) {
    treeNodes.set(id, createTreeNode(id, null, NODE_WIDTH, NODE_HEIGHT));
  }


  // Link children to parents
  for (const marriage of marriages) {
    let parents = [];
    let childrenIds = [];

    if (marriage.marriageType === 'polygamous') {
      parents = [treeNodes.get(marriage.husbandId)];
      childrenIds = marriage.wives.flatMap(w => w.childrenIds || []);
    } else {
      const [p1, p2] = marriage.spouses || [];
      const parent1 = treeNodes.get(p1);
      const parent2 = treeNodes.get(p2);

      if (parent1 && !parent1.isSpouse) parents.push(parent1);
      if (parent2 && !parent2.isSpouse) parents.push(parent2);
      if (parents.length === 0 && parent1) parents.push(parent1);

      childrenIds = marriage.childrenIds || [];
    }
    
    const primaryParent = parents[0];
    if (!primaryParent) {
      continue;
    }

    primaryParent.marriage = marriage;

    for (const childId of childrenIds) {
      const childNode = treeNodes.get(childId);
      if (childNode) {
        if (marriage.marriageType === 'monogamous') {
          const [p1, p2] = marriage.spouses || [];
          const spouseId = primaryParent.id === p1 ? p2 : p1;
          const spouseNode = treeNodes.get(spouseId);
          if (spouseNode) spouseNode.isSpouse = true;
        }
        primaryParent.children.push(childNode);
      }
    }
  }

  // : Use expectedRootId if provided, otherwise fall back to old logic
  if (expectedRootId && treeNodes.has(expectedRootId)) {
    root = treeNodes.get(expectedRootId);
    // console.log("DBG:buildTree -> using expected root:", root.id);
  } else {
    // Fallback to old logic
    const allChildrenIds = new Set(Array.from(treeNodes.values()).flatMap(n => n.children.map(c => c.id)));
    for (const node of treeNodes.values()) {
      if (!allChildrenIds.has(node.id)) {
        root = node;
        break;
      }
    }

    if (!root && treeNodes.size > 0) {
      root = treeNodes.values().next().value;
    }
  }

  return { root, treeNodes };
}
