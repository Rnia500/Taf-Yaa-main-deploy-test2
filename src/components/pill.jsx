import Card from '../layout/containers/Card';
import React from 'react';


export default function Pill({
  children,
  backgroundColor = 'white',
  color = '#333',
  padding = '2px 10px',
  borderRadius = '999px',
  margin = '0',
  shadow = false,
  icon,
  rightIcon,
  className = '',
  style = {},
  ...props
}) {
  return (
    <Card
      fitContent
      padding={padding}
      backgroundColor={backgroundColor}
      borderRadius={borderRadius}
      margin={margin}
      shadow={shadow}
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', color, ...style }}
      {...props}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      <span>{children}</span>
      {rightIcon && <span style={{ marginLeft: 8, display: 'flex', alignItems: 'center' }}>{rightIcon}</span>}
    </Card>
  );
}
