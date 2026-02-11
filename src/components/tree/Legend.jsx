
import React, { useState, useEffect } from 'react';


const LegendItem = ({ gradient, label }) => {
  const style = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#555',
  };

  const swatchStyle = {
    width: '16px',
    height: '16px',
    borderRadius: '4px',
    background: gradient,
  };

  return (
    <div style={style}>
      <div style={swatchStyle}></div>
      <span>{label}</span>
    </div>
  );
};


export default function Legend() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const legendContainerStyle = {
    position: 'absolute', // This is the key to overlaying it on the canvas
    bottom: '10px',
    left: '50%',
    transform: 'translateX(-50%)', // Center it horizontally
    zIndex: 10,
    background: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '8px',
    padding: '8px 12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column', // Stack items vertically
    gap: '6px',
  };

  const mobileLegendContainerStyle = {
    position: 'fixed',
    top: 'var(--topbar-height, 60px)', // Just below the nav bar
    left: '10px',
    right: '10px',
    zIndex: 10,
    background: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '8px',
    padding: '8px 12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  };

  const legendItemsContainerStyle = {
    display: 'flex',
    flexDirection: 'row', // Legend items in a row
    gap: '8px',
    flexWrap: 'wrap', // Allow items to wrap if needed
    justifyContent: 'center', // Center items horizontally
    alignItems: 'center', // Center items vertically
  };

  return (
    <div style={isMobile ? mobileLegendContainerStyle : legendContainerStyle}>
      <div style={{ fontWeight: 'bold', alignSelf:'center', fontSize: '13px', marginBottom: '4px' }}>Legend</div>
      <div style={legendItemsContainerStyle}>
        <LegendItem
          gradient="linear-gradient(135deg, #2D6BFF, #e3edff)"
          label="Root Node"
        />
        <LegendItem
          gradient="linear-gradient(135deg, #3bb273, #f3ede0)"
          label="Direct Line"
        />
        <LegendItem
          gradient="linear-gradient(135deg, #c58c66, #f3e7d3)"
          label="Spouse"
        />
        <LegendItem
          gradient="linear-gradient(135deg, #b0b0b0, #f3ede0)"
          label="Deceased"
        />
      </div>
    </div>
  );
}
