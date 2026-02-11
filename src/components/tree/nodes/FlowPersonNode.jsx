// src/components/tree/nodes/FlowPersonNode.jsx
import React, { useRef, useEffect } from 'react'; // Import useRef and useEffect
import { Handle, Position } from 'reactflow';
import PersonCard from '../../PersonCard.jsx';
import usePersonMenuStore from '../../../store/usePersonMenuStore';
import useSidebarStore from '../../../store/useSidebarStore';

const LONG_PRESS_DURATION = 500; 

function FlowPersonNode({ id, data }) {
  const { actions } = usePersonMenuStore();
  const timerRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  // Handles a normal left-click
  const handleLeftClick = () => {
    // Open sidebar on left click
    useSidebarStore.getState().openSidebar(id);
  };

  // Handles a right-click
  const handleRightClick = (event) => {
    event.preventDefault();
    clearTimeout(timerRef.current);
    actions.openMenu(id, data.name, { x: event.clientX, y: event.clientY }, data);
  };

  // Starts the timer on mouse down or touch start
  const handlePressStart = (event) => {
    // Only trigger long press for left mouse button (button 0) or touch events
    if (event.button !== undefined && event.button !== 0) {
      return;
    }
    
    clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const position = { 
        x: event.clientX || event.touches[0].clientX, 
        y: event.clientY || event.touches[0].clientY 
      };
      actions.openMenu(id, data.name, position, data);
    }, LONG_PRESS_DURATION);
  };

  const handlePressEnd = () => {
    clearTimeout(timerRef.current);
  };

  const handleStyle = { 
    background: 'transparent', 
    border: 'none',
    width: 1,
    height: 1,
  };

  return (
    <div 
      style={{ position: 'relative', cursor: 'pointer' }}
      onClick={handleLeftClick}
      onContextMenu={handleRightClick}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
    >
      <Handle type="target" position={Position.Top} id="target-parent" style={handleStyle} />
      <Handle type="source" position={Position.Top} id="source-top" style={handleStyle} />
      <Handle type="source" position={Position.Left} id="source-left" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="source-right" style={handleStyle} />
      
      <PersonCard {...data} />
      
      <Handle type="source" position={Position.Bottom} id="source-child" style={handleStyle} />
    </div>
  );
}

export default React.memo(FlowPersonNode);
