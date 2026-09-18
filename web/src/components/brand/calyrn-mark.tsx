import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

type CalyrnMarkProps = SVGProps<SVGSVGElement> & {
  className?: string;
};

export function CalyrnMark({ className, ...props }: CalyrnMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      {...props}
    >
      <path
        d="M49.5 14.5A24.75 24.75 0 1 0 49.5 49.5"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M44.5 21.5A16.25 16.25 0 1 0 44.5 42.5"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.68"
      />
      <path
        d="M39.5 28A8.25 8.25 0 1 0 39.5 36"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.38"
      />
    </svg>
  );
}
