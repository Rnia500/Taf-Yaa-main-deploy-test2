import React from 'react';
import '../styles/ToggleSwitch.css';

// In ToggleSwitch.jsx
function ToggleSwitch({ checked, onChange }) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      <span className="slider" />
    </label>
  );
}
export default ToggleSwitch;
