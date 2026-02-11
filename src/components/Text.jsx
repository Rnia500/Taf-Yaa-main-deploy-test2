import React from "react";
import clsx from "clsx";
import "../styles/Text.css";

function Text({
  children,
  as: Component = "span",
  variant = "body1",
  color = "primary-text",
  align = "left",
  bold = false,
  italic = false,
  underline = false,
  paragraph = false,
  uppercase = false,
  ellipsis = false,
  ellipsisLines = 1, // 1 = single-line, >1 = multi-line clamp
  className = "",
  style = {},
  ...rest
}) {
  const classes = clsx(
    "text",
    `text-${variant}`,
    bold && "text-bold",
    italic && "text-italic",
    underline && "text-underline",
    uppercase && "text-uppercase",
    ellipsis && ellipsisLines === 1 && "text-ellipsis",
    ellipsis && ellipsisLines > 1 && "text-line-clamp",
    ellipsis && ellipsisLines > 1 && `text-line-clamp-${ellipsisLines}`,
    className
  );

  const inlineStyle = {
    ...(color !== "primary-text" && { color: `var(--color-${color})` }),
    textAlign: align,
    ...(paragraph && { textIndent: "2em" }),
    ...style,
  };

  return (
    <Component className={classes} style={inlineStyle} {...rest}>
      {children}
    </Component>
  );
}

export default Text;
