import React from 'react';
import '../styles/Slider.css';

function Slider({ min = 0, max = 100, step = 1, value, onChange, label }) {
  return (
    <div className="slider-container">
      {label && <label className="slider-label">{label}</label>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
      <span className="slider-value">{value}</span>
    </div>
  );
}

export default Slider;