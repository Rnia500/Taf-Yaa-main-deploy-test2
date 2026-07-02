// src/utils/edgeHelpers.js
// Centralized edge creation helpers to avoid repetition and ensure consistency
// Handles monogamous, polygamous, spouse, and parent-child edges.

export function createParentChildEdge(source, target, options = {}) {
  return {
    id: `edge-parentChild-${source}-${target}`,
    source,
    target,
    type: "parentChild",
    sourceHandle: options.sourceHandle || "source-child",
    targetHandle: options.targetHandle || "target-parent",
    markerStart: "circle",
    markerEnd: "arrow-custom",
    ...options
  };
}

export function createMonogamousEdge(source, target, marriageId, options = {}) {
  // normalize marriageId safely
  const cleanMarriageId = String(marriageId || "").replace(/^marriage-/, "") || "unknown";

  return {
    id: `edge-monogamous-${source}-${target}-marriage-${cleanMarriageId}`,
    source,
    target,
    type: "monogamousEdge",
    sourceHandle: options.sourceHandle || "source-bottom",
    targetHandle: options.targetHandle || "target-top",
    markerStart: "circle",
    markerEnd: "arrow-custom",
    ...options
  };
}

export function createPolygamousEdge(source, target, marriageId, options = {}) {
  // Strip "marriage-" prefix so IDs are stable regardless of how marriageId is passed in
  const cleanMarriageId = String(marriageId || "").replace(/^marriage-/, "") || "unknown";

return {
  id: `edge-polygamous-${source}-${target}-marriage-${cleanMarriageId}`,
  source,
  target,
  type: "polygamousEdge",
  sourceHandle: options.sourceHandle /*|| "source-left"*/,
  targetHandle: options.targetHandle /*|| "target-parent"*/,
  markerStart: "circle",
  ...options,
  data: {
    orientation: options.orientation /*|| "horizontal"*/
  }
};

}

export function createSpouseEdge(source, target, options = {}) {
  return {
    id: `edge-spouse-${source}-${target}`,
    source,
    target,
    type: "spouse",
    sourceHandle: options.sourceHandle || "source-right",
    targetHandle: options.targetHandle || "target-left",
    markerStart: "circle",
    markerEnd: "arrow-custom",
    ...options
  };
}

// Helper function to safely create edges with node existence checks
// Module-level seen-IDs set — reset per layout call via resetEdgeSeen()
const _seenEdgeIds = new Set();
export function resetEdgeSeen() { _seenEdgeIds.clear(); }

export function createEdgeWithGuard(edgeCreator, nodesMap, ...args) {
  const edge = edgeCreator(...args);

  // Check if both source and target nodes exist
  if (!nodesMap.has(edge.source) || !nodesMap.has(edge.target)) {
    return null;
  }

  // Deduplicate: skip if same edge ID already emitted this layout pass
  if (_seenEdgeIds.has(edge.id)) {
    return null;
  }
  _seenEdgeIds.add(edge.id);

  return edge;
}

// Batch edge creation with guards
export function createEdgesWithGuards(edgeCreator, nodesMap, edgeConfigs) {
  const edges = [];

  for (const config of edgeConfigs) {
    const edge = createEdgeWithGuard(edgeCreator, nodesMap, ...config);
    if (edge) edges.push(edge);
  }

  return edges;
}