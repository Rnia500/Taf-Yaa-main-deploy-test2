import React, { useState, useEffect } from "react";
import { CircleUser } from "lucide-react";
import Card from "./Card";

function ImageCard({
  width = '100%',
  height = 'auto',
  alt = '',
  padding = '0px',
  borderRadius = '20px',
  positionType = 'static',
  position = '',
  backgroundColor = "var(--color-grey)",
  image,
  rounded = false,
  size,
  overlay = null, 
  margin,
}) {
  const [imageURL, setImageURL] = useState('');

  useEffect(() => {
    setImageURL(image);
  }, [image]);

  const finalSize = size || undefined;
  const finalWidth = finalSize || width;
  const finalHeight = finalSize || height;

  const imageStyle = {
    width: '100%',
    height: '100%',
    borderRadius: 'inherit',
    objectFit: 'cover',
    display: 'block',
  };

  // Add positionType and positionClass to Card
  const positionClass = position ? `pos-${position}` : '';

  return (
    <Card
      borderColor="var(--color-transparent)"
      padding={padding}
      rounded={rounded}
      borderRadius={borderRadius}
      backgroundColor={backgroundColor}
      width={finalWidth}
      height={finalHeight}
      style={{ overflow: 'hidden', position: positionType, margin }}
      className={positionClass}
    >
      {imageURL ? (
        <img src={imageURL} alt={alt} loading="lazy" style={imageStyle} width={finalWidth} height={finalHeight} />
      ) : (
        <CircleUser width={finalWidth} height={finalHeight} color="var(--color-primary1)" />
      )}
      {overlay && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: 'inherit',
          pointerEvents: 'none',
          backgroundColor: overlay.backgroundColor || 'rgba(128,128,128,0.45)',
          opacity: overlay.opacity !== undefined ? overlay.opacity : 1,
        }} />
      )}
    </Card>
  );
}

export default ImageCard;
