import React from 'react';
import '../styles/Checkbox.css';

function Checkbox({ label, checked, onChange, value, multiSelect = false }) {
  const handleChange = (e) => {
    if (multiSelect) {
     
      onChange(e.target.value, e.target.checked);
    } else {
      
      onChange(e);
    }
  };

  return (
    <label className="checkbox">
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={handleChange}
        value={value}
      />
      <span className="checkmark" />
      <span className="label-text">{label}</span>
    </label>
  );
}

export default Checkbox;
