// Mobile-optimized class utility
export function cn(...classes: Array<string | boolean | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
