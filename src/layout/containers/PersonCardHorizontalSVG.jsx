import React from "react";

const gradients = {
  root: (
    <linearGradient id="rootGradientHorizontal" x1="-22.0664" y1="46.75" x2="223.603" y2="46.75" gradientUnits="userSpaceOnUse">
      <stop stopColor="#2D6BFF" />
      <stop offset="1" stopColor="#e3edff" />
    </linearGradient>
  ),
  directline: (
    <linearGradient id="directlineGradientHorizontal" x1="-22.0664" y1="46.75" x2="223.603" y2="46.75" gradientUnits="userSpaceOnUse">
      <stop stopColor="#3bb273" />
      <stop offset="1" stopColor="#f3ede0" />
    </linearGradient>
  ),
  spouse: (
    <linearGradient id="spouseGradientHorizontal" x1="-22.0664" y1="46.75" x2="223.603" y2="46.75" gradientUnits="userSpaceOnUse">
      <stop stopColor="#c58c66" />
      <stop offset="1" stopColor="#f3e7d3" />
    </linearGradient>
  ),
  dead: (
    <linearGradient id="deadGradientHorizontal" x1="-22.0664" y1="46.75" x2="223.603" y2="46.75" gradientUnits="userSpaceOnUse">
      <stop stopColor="#b0b0b0" />
      <stop offset="1" stopColor="#f3ede0" />
    </linearGradient>
  ),
  default: (
    <linearGradient id="defaultGradientHorizontal" x1="-22.0664" y1="46.75" x2="223.603" y2="46.75" gradientUnits="userSpaceOnUse">
      <stop stopColor="#C48F67" />
      <stop offset="1" stopColor="#F3EDE0" />
    </linearGradient>
  ),
  placeholder: (
    <linearGradient id="placeholderGradientHorizontal" x1="-22.0664" y1="46.75" x2="223.603" y2="46.75" gradientUnits="userSpaceOnUse">
      <stop stopColor="#d1d5db" />
      <stop offset="1" stopColor="#f9fafb" />
    </linearGradient>
  ),
};

const gradientIds = {
  root: "rootGradientHorizontal",
  directline: "directlineGradientHorizontal",
  spouse: "spouseGradientHorizontal",
  dead: "deadGradientHorizontal",
  default: "defaultGradientHorizontal",
  placeholder: "placeholderGradientHorizontal",
};

const PersonCardHorizontalSVG = ({ children, style, variant = "default", width = 170, ...props }) => {
  const aspectRatio = 80 / 184;
  const height = width * aspectRatio;
  const viewBoxWidth = 211;
  const viewBoxHeight = 94;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      {...props}
    >
      <defs>
        {gradients[variant] || gradients.default}
      </defs>
      <path
        d="M0.849976 20C0.849976 8.95443 9.80445 0.000198931 20.85 0L178.047 0C189.093 0.000176121 198.047 8.95441 198.047 20V23.6578C198.047 29.6733 201.612 35.117 207.126 37.5215V37.5215C213.529 40.3138 213.529 49.3951 207.126 52.1875V52.1875C201.612 54.5926 198.047 60.0367 198.047 66.0526V73.5C198.047 84.5456 189.093 93.4998 178.047 93.5L20.85 93.5C9.80444 93.4998 0.849976 84.5456 0.849976 73.5L0.849976 20Z"
        fill={`url(#${gradientIds[variant] || gradientIds.default})`}
      />
      <foreignObject x="0" y="0" width={viewBoxWidth} height={viewBoxHeight}>
        <div style={{ margin: '0px', padding: '0px', width: "95%", height: "100%" }}>
          {children}
        </div>
      </foreignObject>
    </svg>
  );
};

export default PersonCardHorizontalSVG;
