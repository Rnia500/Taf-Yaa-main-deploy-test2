// src/components/tree/CustomControls.jsx
import React from 'react';
import { useReactFlow } from 'reactflow';
import '../../styles/CustomControls.css';

import { ZoomIn, ZoomOut, Maximize, Home, Rotate3d, Aperture  } from 'lucide-react';


const ControlButton = ({ onClick, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    className="control-button"
  >
    {children}
  </button>
);


// The main CustomControls component.
function CustomControls({ handleResetView, handleToggleOrientation, handleQuickCapture  }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();


  const onZoomIn = () => zoomIn({ duration: 300 });
  const onZoomOut = () => zoomOut({ duration: 300 });
  const onFitView = () => fitView({ duration: 300 });

  return (
    <div className="controls-container">
      <ControlButton onClick={onZoomIn} title="Zoom In"><ZoomIn color="var(--color-primary2)" size={20} /></ControlButton>
      <ControlButton onClick={onZoomOut} title="Zoom Out"><ZoomOut color="var(--color-primary2)" size={20} /></ControlButton>
      <ControlButton onClick={onFitView} title="Fit to Screen"><Maximize color="var(--color-primary2)" size={20} /></ControlButton>
      <ControlButton onClick={handleToggleOrientation} title="Change Orientation"><Rotate3d  color="var(--color-primary2)" size={20} /></ControlButton>
      <ControlButton onClick={handleQuickCapture} title="Quick Capture (PNG)"><Aperture  color="var(--color-primary2)" size={20} /></ControlButton>
      <ControlButton onClick={handleResetView} title="Reset View"><Home color="var(--color-primary2)" size={20} /></ControlButton>
    </div>
  );
}

export default CustomControls;