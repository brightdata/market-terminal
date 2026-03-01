import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Prepends the Next.js basePath (defined in next.config.ts) to internal API paths
// so fetch() calls work correctly both locally and under a Vercel path rewrite.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function apiPath(path: string): string {
  return `${BASE_PATH}${path}`;
}

