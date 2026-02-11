// src/components/tree/edges/PolygamousEdge.jsx
import React from 'react';

export default function PolygamousEdge({
  sourceX, sourceY, targetX, targetY,
  markerStart, markerEnd,
  data 
}) {
  const borderRadius = 10;
  const offset = 30; 
  let edgePath;

  const orientation = data?.orientation || 'vertical';

  if (orientation === 'vertical') {
    // ✅ unchanged vertical logic
    const yOffset = -offset;
    if (targetX > sourceX) { // Wife on the right
      edgePath = `M ${sourceX},${sourceY} 
        V ${sourceY + yOffset + borderRadius} 
        A ${borderRadius},${borderRadius} 0 0 1 ${sourceX + borderRadius},${sourceY + yOffset} 
        H ${targetX - borderRadius} 
        A ${borderRadius},${borderRadius} 0 0 1 ${targetX},${sourceY + yOffset + borderRadius} 
        V ${targetY}`;
    } else { // Wife on the left
      edgePath = `M ${sourceX},${sourceY} 
        V ${sourceY + yOffset + borderRadius} 
        A ${borderRadius},${borderRadius} 0 0 0 ${sourceX - borderRadius},${sourceY + yOffset} 
        H ${targetX + borderRadius} 
        A ${borderRadius},${borderRadius} 0 0 0 ${targetX},${sourceY + yOffset + borderRadius} 
        V ${targetY}`;
    }
  }  else {
    //  THE FIX: This is the definitive, corrected SVG path for a horizontal layout.
    const xOffset = -offset; // Go left from the husband

    if (targetY >= sourceY) { // Wife is below or at the same level
      edgePath = `
        M ${sourceX},${sourceY} 
        H ${sourceX + xOffset + borderRadius} 
        A ${borderRadius},${borderRadius} 0 0 0 ${sourceX + xOffset},${sourceY + borderRadius} 
        V ${targetY - borderRadius} 
        A ${borderRadius},${borderRadius} 1 0 0 ${sourceX + xOffset + borderRadius},${targetY} 
        H ${targetX}`;
    } else { // Wife is above
      edgePath = `
        M ${sourceX},${sourceY} 
        H ${sourceX + xOffset + borderRadius} 
        A ${borderRadius},${borderRadius} 0 0 1 ${sourceX + xOffset},${sourceY - borderRadius} 
        V ${targetY + borderRadius} 
        A ${borderRadius},${borderRadius} 0 0 1 ${sourceX + xOffset + borderRadius},${targetY} 
        H ${targetX}`;
    }
  }

  return (
    <path
      d={edgePath}
      fill="none"
      stroke="var(--color-gray)"
      strokeWidth={2}
      markerStart={markerStart}
      markerEnd={markerEnd}
    />
  );
}