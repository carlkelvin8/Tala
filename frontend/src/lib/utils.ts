import { clsx, type ClassValue } from "clsx" // Import clsx for conditionally joining class names and its ClassValue type for flexible input
import { twMerge } from "tailwind-merge" // Import twMerge to intelligently merge Tailwind CSS classes, resolving conflicts

// Utility function that combines clsx and tailwind-merge for safe, conflict-free className composition
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs)) // First use clsx to handle conditional/array/object class inputs, then pass through twMerge to resolve Tailwind conflicts
}
