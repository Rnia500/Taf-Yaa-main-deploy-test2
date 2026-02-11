// src/utils/layoutVertical.js
import {
  VERTICAL_NODE_WIDTH,
  VERTICAL_NODE_HEIGHT,
  HORIZONTAL_SPACING, 
  VERTICAL_SPACING, 
  MARRIAGE_ICON_Y_OFFSET,
  MARRIAGE_ICON_X_OFFSET,
} from './treeLayoutConstants.js';

import {
  createParentChildEdge,
  createMonogamousEdge,
  createPolygamousEdge,
  createEdgeWithGuard,
} from './edgeHelpers.js';

import { buildTree } from './layoutHelpers.js';

const NODE_WIDTH = VERTICAL_NODE_WIDTH;
const NODE_HEIGHT = VERTICAL_NODE_HEIGHT;
const GAP = HORIZONTAL_SPACING;


/*  Placeholders  */
function createAndInjectPlaceholders(nodesMap, marriages) {
  const processedMarriages = JSON.parse(JSON.stringify(marriages));

  for (const marriage of processedMarriages) {
    //  Monogamous 
    if (marriage.marriageType === 'monogamous') {
      const emptyIndex = marriage.spouses.findIndex(id => !id);
      if (emptyIndex !== -1) {
        const knownSpouseId = marriage.spouses.find(id => id);
        const knownSpouseNode = nodesMap.get(knownSpouseId);
        const knownSpouse = knownSpouseNode?.data;
        const placeholderId = `placeholder-spouse-${marriage.id}`;

        if (!nodesMap.has(placeholderId)) {
          nodesMap.set(placeholderId, {
            id: placeholderId,
            type: 'person',
            data: {
              id: placeholderId,
              name: "Unknown Partner",
              gender: knownSpouse?.gender === 'male' ? 'female' : 'male',
              isPlaceholder: true,
              variant: 'spouse'
            },
            position: { x: 0, y: 0 },
            isPositioned: false
          });
        }
        marriage.spouses[emptyIndex] = placeholderId;
      }
    }

    //  Polygamous 
    if (marriage.marriageType === 'polygamous') {
      if (!marriage.husbandId) {
        const placeholderId = `placeholder-husband-${marriage.id}`;
        if (!nodesMap.has(placeholderId)) {
          let derivedGender = 'male';
          if (marriage.wives && marriage.wives.length > 0) {
            const firstWifeId = marriage.wives[0].wifeId;
            const wifeNode = nodesMap.get(firstWifeId);
            const wifeGender = wifeNode?.data?.gender;
            if (wifeGender) derivedGender = wifeGender === 'male' ? 'female' : 'male';
          }
          nodesMap.set(placeholderId, {
            id: placeholderId,
            type: 'person',
            data: { id: placeholderId, name: "Unknown Husband", gender: derivedGender, isPlaceholder: true, variant: 'placeholder' },
            position: { x: 0, y: 0 },
            isPositioned: false
          });
        }
        marriage.husbandId = placeholderId;
      }
      if (marriage.wives?.length) {
        for (let i = 0; i < marriage.wives.length; i++) {
          if (!marriage.wives[i].wifeId) {
            const placeholderId = `placeholder-wife-${marriage.id}-${i}`;
            if (!nodesMap.has(placeholderId)) {
              let derivedGender = 'female';
              const husbandNode = nodesMap.get(marriage.husbandId);
              const husbandGender = husbandNode?.data?.gender;
              if (husbandGender) derivedGender = husbandGender === 'male' ? 'female' : 'male';

              nodesMap.set(placeholderId, {
                id: placeholderId,
                type: 'person',
                data: { id: placeholderId, name: "Unknown Wife", gender: derivedGender, isPlaceholder: true, variant: 'placeholder' },
                position: { x: 0, y: 0 },
                isPositioned: false
              });
            }
            marriage.wives[i].wifeId = placeholderId;
          }
        }
      }
    }
  }

  return { processedMarriages, nodesMap };
}


/*  Helpers  */
function topLeftXFromCenterX(centerX) { return centerX - NODE_WIDTH / 2; }

function parentBlockWidth(marriage) {
  if (!marriage) return NODE_WIDTH;
  if (marriage.marriageType === 'monogamous') return 2 * NODE_WIDTH + GAP;
  if (marriage.marriageType === 'polygamous') {
    const n = (marriage.wives?.length || 0) + 1;
    return n * NODE_WIDTH + (n - 1) * GAP;
  }
  return NODE_WIDTH;
}

function firstPass(node) {
  if (!node.children?.length) {
    node.subtreeWidth = parentBlockWidth(node.marriage);
    return node.subtreeWidth;
  }
  let total = 0;
  for (let i = 0; i < node.children.length; i++) {
    total += firstPass(node.children[i]);
    if (i > 0) total += GAP;
  }
  node.subtreeWidth = Math.max(parentBlockWidth(node.marriage), total);
  return node.subtreeWidth;
}

function secondPass(node, centerX, centerY, nodesMap) {
  const rfNode = nodesMap.get(node.id);

  if (rfNode) {
    const isDead = !!rfNode.data?.deathDate;
    rfNode.position = { x: topLeftXFromCenterX(centerX), y: centerY };
    rfNode.isPositioned = true;

    rfNode.data = {
      ...rfNode.data,
      isDead,
      variant: isDead ? "dead" : "directline",
    };
  }

  const marriage = node.marriage;

  //  Monogamous Marriage 
  if (marriage?.marriageType === "monogamous") {
    const blockW = parentBlockWidth(marriage);
    const leftC = centerX - blockW / 2 + NODE_WIDTH / 2;
    const rightC = leftC + NODE_WIDTH + GAP;

    const [s1, s2] = marriage.spouses;
    const spouseId = node.id === s1 ? s2 : s1;
    const spouseRF = nodesMap.get(spouseId);

    if (rfNode) rfNode.position.x = topLeftXFromCenterX(leftC);

    if (spouseRF) {
      const isDead = !!spouseRF.data?.deathDate;
      const newVariant = isDead ? "dead" : "spouse";
      spouseRF.position = { x: topLeftXFromCenterX(rightC), y: centerY };
      spouseRF.isPositioned = true;
      spouseRF.data = {
        ...spouseRF.data,
        isDead,
        variant: newVariant,
      };
    }
  }

  //  Polygamous Marriage 
  if (marriage?.marriageType === "polygamous") {
    const wives = marriage.wives || [];
    const blockW = parentBlockWidth(marriage);
    let slotC = centerX - blockW / 2 + NODE_WIDTH / 2;
    const leftCount = Math.floor(wives.length / 2);

    for (let i = leftCount - 1; i >= 0; i--) {
      const wRF = nodesMap.get(wives[i].wifeId);
      if (wRF) {
        const isDead = !!wRF.data?.deathDate;
        const currentVariant = wRF.data.variant;
        const newVariant = isDead ? "dead" : (currentVariant !== "directline" ? currentVariant : "spouse");
        wRF.position = { x: topLeftXFromCenterX(slotC), y: centerY };
        wRF.isPositioned = true;
        wRF.data = { ...wRF.data, isDead, variant: newVariant };
      }
      slotC += NODE_WIDTH + GAP;
    }

    if (rfNode) rfNode.position.x = topLeftXFromCenterX(slotC);
    slotC += NODE_WIDTH + GAP;

    for (let i = leftCount; i < wives.length; i++) {
      const wRF = nodesMap.get(wives[i].wifeId);
      if (wRF) {
        const isDead = !!wRF.data?.deathDate;
        const currentVariant = wRF.data.variant;
        const newVariant = isDead ? "dead" : (currentVariant !== "directline" ? currentVariant : "spouse");
        wRF.position = { x: topLeftXFromCenterX(slotC), y: centerY };
        wRF.isPositioned = true;
        wRF.data = { ...wRF.data, isDead, variant: newVariant };
      }
      slotC += NODE_WIDTH + GAP;
    }
  }

  //  Children 
  if (node.children?.length) {
    const childY = centerY + NODE_HEIGHT + VERTICAL_SPACING;
    let total = node.children.reduce(
      (sum, c, i) => sum + c.subtreeWidth + (i > 0 ? GAP : 0),
      0
    );
    let childC = centerX - total / 2;
    for (let i = 0; i < node.children.length; i++) {
      childC += node.children[i].subtreeWidth / 2;
      secondPass(node.children[i], childC, childY, nodesMap);
      childC += node.children[i].subtreeWidth / 2 + GAP;
    }
  }
}


/*  Edges  */
function createEdges(marriages, nodesMap) {
  const edges = [];
  for (const marriage of marriages) {
    if (marriage.marriageType === 'polygamous') {
      const { husbandId, wives = [] } = marriage;
      for (const w of wives) {
        const e = createEdgeWithGuard(
          createPolygamousEdge, nodesMap, husbandId, w.wifeId, marriage.id,
          { orientation: 'vertical', sourceHandle: 'source-top', targetHandle: 'target-top' }
        );
        if (e) edges.push(e);

        for (const childId of (w.childrenIds || [])) {
          const ec = createEdgeWithGuard(createParentChildEdge, nodesMap, w.wifeId, childId);
          if (ec) edges.push(ec);
        }
      }
    } else if (marriage.marriageType === 'monogamous') {
      const [p1, p2] = marriage.spouses;
      const n1 = nodesMap.get(p1), n2 = nodesMap.get(p2);
      if (!n1?.position || !n2?.position) continue;

      const leftId = n1.position.x < n2.position.x ? p1 : p2;
      const rightId = leftId === p1 ? p2 : p1;
      const mId = `marriage-${marriage.id}`;

      const mx = (n1.position.x + n2.position.x) / 2 + (NODE_WIDTH / 2) + MARRIAGE_ICON_X_OFFSET;
      const my = n1.position.y + NODE_HEIGHT - (NODE_HEIGHT / 2) + MARRIAGE_ICON_Y_OFFSET;

      nodesMap.set(mId, {
        id: mId, type: 'marriage', position: { x: mx, y: my },
        data: { hasChildren: (marriage.childrenIds || []).length > 0, orientation: 'vertical' },
        isPositioned: true,
      });

      const e1 = createEdgeWithGuard(createMonogamousEdge, nodesMap, leftId, mId, marriage.id, {
        sourceHandle: 'source-right',
        targetHandle: 'target-left'
      });
      const e2 = createEdgeWithGuard(createMonogamousEdge, nodesMap, rightId, mId, marriage.id, {
        sourceHandle: 'source-left',
        targetHandle: 'target-right'
      });

      if (e1) edges.push(e1);
      if (e2) edges.push(e2);

      for (const cId of (marriage.childrenIds || [])) {
        const ec = createEdgeWithGuard(createParentChildEdge, nodesMap, mId, cId);
        if (ec) edges.push(ec);
      }
    }
  }
  return edges;
}

/*  Main  */
export function layoutVertical(nodesMap, marriages, initialEdges, rootId) {
  if (!nodesMap?.size || !marriages?.length) {
    return { nodes: Array.from(nodesMap.values()), edges: initialEdges };
  }

  const { processedMarriages, nodesMap: updatedNodesMap } = createAndInjectPlaceholders(nodesMap, marriages);

  const { root } = buildTree(updatedNodesMap, processedMarriages, NODE_WIDTH, NODE_HEIGHT, rootId);
  if (!root) return { nodes: Array.from(updatedNodesMap.values()), edges: initialEdges };

  firstPass(root);
  secondPass(root, 0, 0, updatedNodesMap);


  function setRootVariantFor(ids, nodesMap) {
    ids.forEach(id => {
      const node = nodesMap.get(id);
      if (node) {
        node.data.variant = node.data.deathDate ? "dead" : "root";
      }
    });
  }

  const allRootIds = [root.id];
  setRootVariantFor(allRootIds, updatedNodesMap);

  const edges = createEdges(processedMarriages, updatedNodesMap);

  return { nodes: Array.from(updatedNodesMap.values()), edges };
}
