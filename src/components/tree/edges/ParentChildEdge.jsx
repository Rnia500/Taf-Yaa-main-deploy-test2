// src/components/tree/edges/ParentChildEdge.jsx
import React from 'react';
import { getBezierPath, BaseEdge, useReactFlow } from 'reactflow';

// This is the final, interactive version of the component.
export default function ParentChildEdge({
  source, // The ID of the parent node
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerStart,
  markerEnd,
}) {
  const { getNodes } = useReactFlow();

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // This function is called when the user clicks the circle marker.
  const onCollapseClick = (event) => {
    event.stopPropagation(); // Prevents the canvas from being dragged

    const nodes = getNodes();
    const sourceNode = nodes.find((n) => n.id === source);

    if (sourceNode && sourceNode.data && typeof sourceNode.data.onToggleCollapse === 'function') {
      sourceNode.data.onToggleCollapse();
      console.log(`Called centralized onToggleCollapse for node: ${source}`);
    } else {
      console.warn(
        `No centralized onToggleCollapse found for node ${source}; collapse not toggled.`
      );
    }
  };

  return (
    //use an SVG group <g> to group the edge and the clickable area.
    <g>
      <BaseEdge 
        path={edgePath}
        markerStart={markerStart}
        markerEnd={markerEnd}
        style={{ stroke: 'var(--color-gray)', strokeWidth: 2 }} 
      />
      {/* 
        This is an invisible rectangle placed over the circle marker.
        It's slightly larger than the circle, making it much easier to click.
      */}
      <rect
        x={sourceX - 8}
        y={sourceY - 8}
        width={16}
        height={16}
        fill="transparent"
        style={{ cursor: 'pointer' }}
        onClick={onCollapseClick}
      />
    </g>
  );
}