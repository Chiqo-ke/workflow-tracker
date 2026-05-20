import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "warning" | "success" | "ghost";
type Size = "sm" | "md";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export default function Button({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...rest
}: Props) {
  const classes = ["btn", `btn-${variant}`, size === "sm" ? "btn-sm" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
