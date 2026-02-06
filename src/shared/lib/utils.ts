import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Tailwind classes for modern primary button (accent solid, clean hover/active). */
export const primaryButtonClass =
  "border-0 bg-primary font-display font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
