import React from "react";
import Select from "react-select";

function SelectDropdown({ label, options = [], value, onChange, placeholder, style: _style }) {
  // normalize options
  const formattedOptions = options.map(opt =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  // find selected option
  const selectedOption =
    formattedOptions.find(opt => opt.value === value) || null;

  // normalize onChange (to mimic e.target.value)
  const handleChange = (selected) => {
    onChange({ target: { value: selected ? selected.value : "" } });
  };

  // custom inline styles for react-select
  const customStyles = {
    control: (base, state) => ({
      ...base,
      padding: "clamp(4px, 1vw, 8px) clamp(4px, 1vw, 8px)",
      border: `2px solid ${state.isFocused ? "var(--color-primary)" : "var(--color-gray-light)"}`,
      borderRadius: "12px",
      fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
      background: "var(--color-white)",
      color: "var(--color-text-primary)",
      fontFamily: "inherit",
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: state.isFocused ? "0 0 0 2px var(--color-primary-light)" : "none",
      "&:hover": {
        borderColor: "var(--color-primary-light)"
      }
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "12px",
      marginTop: "4px",
      zIndex: 10000
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 99999
    }),
    option: (base, state) => ({
      ...base,
      padding: "12px",
      background: state.isSelected
        ? "var(--color-primary)"
        : state.isFocused
          ? "var(--color-primary-light)"
          : "var(--color-white)",
      color: state.isSelected || state.isFocused
        ? "var(--color-white)"
        : "var(--color-text-primary)",
      cursor: "pointer"
    }),
    placeholder: (base) => ({
      ...base,
      color: "var(--color-gray-dark)"
    }),
    singleValue: (base) => ({
      ...base,
      color: "var(--color-text-primary)"
    })
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {label && (
        <label
          style={{
            marginBottom: "8px",
            fontWeight: 200,
            color: "var(--color-text-primary)",
            fontSize: "0.8rem"
          }}
        >
          {label}
        </label>
      )}
      <Select
        options={formattedOptions}
        value={selectedOption}
        onChange={handleChange}
        placeholder={placeholder}
        isClearable
        isSearchable
        styles={customStyles}
        menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
        menuPosition="fixed"
      />
    </div>
  );
}

export default SelectDropdown;