import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to combine Tailwind classes with clsx and twMerge.
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}
