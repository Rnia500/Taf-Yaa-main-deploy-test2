import React from 'react';
import '../styles/StepperInput.css';

function StepperInput({ value, onChange, min = 0, max = Infinity, step = 1 }) {
  const handleIncrement = () => onChange(Math.min(max, value + step));
  const handleDecrement = () => onChange(Math.max(min, value - step));

  return (
    <div className="stepper">
      <button type="button" onClick={handleDecrement}>-</button>
      <input type="number" value={value} readOnly aria-label="current value" />
      <button type="button" onClick={handleIncrement}>+</button>
    </div>
  );
}

export default StepperInput;
