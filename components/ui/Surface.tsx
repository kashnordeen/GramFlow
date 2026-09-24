import type { HTMLAttributes, ReactNode } from "react";

type SurfaceElement = "article" | "div" | "section";
type SurfaceTone = "base" | "raised" | "feature";

interface SurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: SurfaceElement;
  children: ReactNode;
  tone?: SurfaceTone;
}

export function Surface({
  as: Element = "div",
  children,
  className = "",
  tone = "base",
  ...props
}: SurfaceProps) {
  return (
    <Element
      className={`surface ${className}`.trim()}
      data-tone={tone}
      {...props}
    >
      {children}
    </Element>
  );
}
