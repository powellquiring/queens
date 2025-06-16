"use client";

import type { SVGProps } from "react";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface QueenIconProps extends SVGProps<SVGSVGElement> {
  isVisible?: boolean;
}

export function QueenIcon({ className, isVisible = true, ...props }: QueenIconProps) {
  return (
    <Crown
      className={cn(
        "h-full w-full text-accent fill-accent/30",
        "transition-all duration-300 ease-in-out",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50",
        className
      )}
      aria-label="Queen"
      {...props}
    />
  );
}
