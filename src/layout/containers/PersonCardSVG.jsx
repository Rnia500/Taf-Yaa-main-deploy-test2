import React from "react";

const gradients = {
  root: (
    <linearGradient id="rootGradient" x1="60" y1="-18.4498" x2="60" y2="179.337" gradientUnits="userSpaceOnUse">
      <stop stopColor="#2D6BFF" />
      <stop offset="1" stopColor="#e3edff" />
    </linearGradient>
  ),
  directline: (
    <linearGradient id="directlineGradient" x1="60" y1="-18.4498" x2="60" y2="179.337" gradientUnits="userSpaceOnUse">
      <stop stopColor="#3bb273" />
      <stop offset="1" stopColor="#f3ede0" />
    </linearGradient>
  ),
  spouse: (
    <linearGradient id="spouseGradient" x1="60" y1="-18.4498" x2="60" y2="179.337" gradientUnits="userSpaceOnUse">
      <stop stopColor="#c58c66" />
      <stop offset="1" stopColor="#f3e7d3" />
    </linearGradient>
  ),
  dead: (
    <linearGradient id="deadGradient" x1="60" y1="-18.4498" x2="60" y2="179.337" gradientUnits="userSpaceOnUse">
      <stop stopColor="#b0b0b0" />
      <stop offset="1" stopColor="#f3ede0" />
    </linearGradient>
  ),
  default: (
    <linearGradient id="defaultGradient" x1="60" y1="-18.4498" x2="60" y2="179.337" gradientUnits="userSpaceOnUse">
      <stop stopColor="var(--color-background)" />
      <stop offset="1" stopColor="#F3EDE0" />
    </linearGradient>
  ),
  placeholder: (
    <linearGradient id="placeholderGradient" x1="60" y1="-18.4498" x2="60" y2="179.337" gradientUnits="userSpaceOnUse">
      <stop stopColor="#d1d5db" />
      <stop offset="1" stopColor="#f9fafb" />
    </linearGradient>
  ),
};

const gradientIds = {
  root: "rootGradient",
  directline: "directlineGradient",
  spouse: "spouseGradient",
  dead: "deadGradient",
  default: "defaultGradient",
  placeholder: "placeholderGradient",
};

const PersonCardSVG = ({ children, style, variant = "default", ...props }) => (
  <svg
    width="90"
    height="130"
    viewBox="0 0 120 170"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
    {...props}
  >
    <defs>
      {gradients[variant] || gradients.default}
    </defs>
    <path
      d="M100 0C111.046 0 120 8.95447 120 20V135.352C120 146.397 111.046 155.352 100 155.352H87.2499C80.7732 155.352 74.6974 158.488 70.9461 163.768L68.9541 166.571C65.765 171.06 59.1003 171.06 55.9111 166.571L53.9182 163.767C50.1669 158.488 44.0914 155.352 37.6151 155.352H20C8.95437 155.352 9.80397e-05 146.397 0 135.352V20C0.000194713 8.95447 8.95443 0 20 0H100Z"
      fill={`url(#${gradientIds[variant] || gradientIds.default})`}
    />
    <foreignObject x="0" y="0" width="120" height="170">
      <div style={{ margin:'0px', padding:'0px', width: "100%", height: "100%" }}>
        {children}
      </div>
    </foreignObject>
  </svg>
);

export default PersonCardSVG;