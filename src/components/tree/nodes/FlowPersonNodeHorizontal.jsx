// src/components/tree/nodes/FlowPersonNodeHorizontal.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import PersonCardHorizontal from '../../PersonCardHorizontal.jsx';
import usePersonMenuStore from '../../../store/usePersonMenuStore';

function FlowPersonNodeHorizontal({ id, data }) {
  const { actions } = usePersonMenuStore();
  const handleLeftClick = () => { if (data.onOpenProfile) data.onOpenProfile(); };
  const handleRightClick = (event) => {
    event.preventDefault();
    actions.openMenu(id, data.name, { x: event.clientX, y: event.clientY }, data);
  };
  const handleStyle = { background: 'transparent', border: 'none', width: 1, height: 1 };

  return (
    <div 
      style={{ position: 'relative' }}
      onClick={handleLeftClick}
      onContextMenu={handleRightClick}
    >
      {/* INPUT from a parent connection (always on the left) */}
      <Handle type="target" position={Position.Left} id="target-parent" style={handleStyle} />
      <Handle type="source" position={Position.Left} id="source-left" style={handleStyle} />
      {/* OUTPUT to a child connection (always on the right) */}
      <Handle type="source" position={Position.Right} id="source-child" style={handleStyle} />
      
      {/* Connectors for SPOUSES (always on the top and bottom) */}
      <Handle type="source" position={Position.Top} id="source-top" style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="source-bottom" style={handleStyle} />
      
      <PersonCardHorizontal {...data} />
    </div>
  );
}

export default React.memo(FlowPersonNodeHorizontal);