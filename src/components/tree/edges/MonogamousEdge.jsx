// src/components/tree/edges/MonogamousEdge.jsx
import React from 'react';
//  CHANGE getBezierPath to getStraightPath
import { getStraightPath, BaseEdge } from 'reactflow';

export default function MonogamousEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
}) {
  //  Use the new path generator
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <BaseEdge 
      path={edgePath} 
      style={{ stroke: 'var(--color-gray)', strokeWidth: 2 }} 
    />
  );
}