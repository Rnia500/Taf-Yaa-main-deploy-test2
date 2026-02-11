import React from 'react';
import '../styles/DateInput.css';

function DateInput({ label, value, onChange, disabled = false }) {
  return (
    <div className="date-wrapper">
      {label && <label className="date-label">{label}</label>}
      <input
        type="date"
        value={value}
        onChange={onChange}
        className="date-field"
        disabled={disabled}
      />
    </div>
  );
}

export default DateInput;
