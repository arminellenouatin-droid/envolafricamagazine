import React from "react";
import { HeaderSvgIcon } from "@/components/HeaderIcons";

export interface SvgIconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

export function SvgIcon({ name, className = "w-4 h-4", style }: SvgIconProps) {
  return <HeaderSvgIcon name={name} className={className} style={style} />;
}

export default SvgIcon;
