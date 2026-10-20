/**
 * Converts a hex (#RRGGBB, #RGB) or rgba/rgb string into a valid rgba string with specified alpha.
 */
export function setAlpha(color: string, alpha: number): string {
  if (!color) return `rgba(255, 255, 255, ${alpha})`;

  const trimmed = color.trim();

  // If hex format (#ffffff or #fff)
  if (trimmed.startsWith('#')) {
    let hex = trimmed.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    if (hex.length >= 6) {
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }

  // If rgb/rgba format: rgb(r, g, b) or rgba(r, g, b, a)
  const match = trimmed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (match) {
    return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
  }

  return trimmed;
}
