// src/components/tree/nodes/MarriageNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import mariageUnionUrl from '../../../assets/SVGs/MariageUnion.svg';

export default function MarriageNode({ data }) {
  const iconSize = 24;
  const stemWidth = 2;
  
  // These are now the lengths for the different orientations
  const verticalStemLength = 30;
  const horizontalStemLength = 30;

  const isHorizontal = data?.orientation === 'horizontal';
  const hasChildren = data?.hasChildren;
  
  const handleStyle = { background: 'transparent', border: 'none', width: 1, height: 1 };

  // The node's dimensions now depend on the orientation
  const nodeWidth = isHorizontal && hasChildren ? iconSize + horizontalStemLength : iconSize;
  const nodeHeight = !isHorizontal && hasChildren ? iconSize + verticalStemLength : iconSize;

  const iconContainerStyle = {
    position: 'relative', 
    width: iconSize, 
    height: iconSize,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={{ position: 'relative', width: nodeWidth, height: nodeHeight }}>
      <div style={iconContainerStyle}>
        
        {/* Handles for VERTICAL layout */}
        {!isHorizontal && (
          <>
            <Handle type="target" position={Position.Left} id="target-left" style={handleStyle} />
            <Handle type="target" position={Position.Right} id="target-right" style={handleStyle} />
          </>
        )}

        {/* Handles for HORIZONTAL layout */}
        {isHorizontal && (
          <>
            <Handle type="target" position={Position.Top} id="target-top" style={handleStyle} />
            <Handle type="target" position={Position.Bottom} id="target-bottom" style={handleStyle} />
          </>
        )}
        
        <img src={mariageUnionUrl} alt="Marriage Union" style={{ width: iconSize, height: iconSize }} />
      </div>

      {/* Conditionally render the VERTICAL stem */}
      {hasChildren && !isHorizontal && (
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: iconSize, width: stemWidth, height: verticalStemLength, backgroundColor: 'var(--color-gray)' }} />
      )}
      
      {/* Conditionally render the HORIZONTAL stem */}
      {hasChildren && isHorizontal && (
        <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: iconSize, width: horizontalStemLength, height: stemWidth, backgroundColor: 'var(--color-gray)' }} />
      )}

      {/* Conditional Handles for children */}
      {hasChildren && !isHorizontal && (
        <Handle type="source" position={Position.Bottom} id="source-bottom" style={handleStyle} />
      )}
      {hasChildren && isHorizontal && (
        <Handle type="source" position={Position.Right} id="source-right" style={handleStyle} />
      )}
    </div>
  );
}