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
  // Use full marriageId for uniqueness
  const cleanMarriageId = String(marriageId || "").replace(/^marriage-/, "") || "unknown";

return {
  id: `edge-polygamous-${source}-${target}-marriage-${marriageId}`,
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
export function createEdgeWithGuard(edgeCreator, nodesMap, ...args) {
  const edge = edgeCreator(...args);

  // Check if both source and target nodes exist
  if (!nodesMap.has(edge.source) || !nodesMap.has(edge.target)) {
    console.warn(
      `Skipping edge creation: source "${edge.source}" or target "${edge.target}" not found in nodesMap`
    );
    return null;
  }

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
