/**
 * Approximates CSS oklch() color declarations to standard hsla() format.
 * This is crucial for libraries like html2canvas that fail on CSS oklch color strings.
 */
export function approximateOklchToHsl(cssText: string): string {
  if (!cssText || typeof cssText !== 'string') return cssText;
  
  return cssText.replace(/oklch\(([^)]+)\)/g, (match, content) => {
    try {
      // Split by spaces, slashes, or commas
      // e.g. "0.61 0.21 250" or "0.61 0.21 250 / 0.5" or "61% 0.21 250"
      const parts = content.trim().split(/[\s,]+/);
      
      // Filter out slash divider if present
      const cleanParts = parts.filter((p: string) => p !== '/');
      
      if (cleanParts.length < 3) return match;
      
      const lStr = cleanParts[0];
      const cStr = cleanParts[1];
      const hStr = cleanParts[2];
      const aStr = cleanParts[3];
      
      // Lightness: decimal (0 to 1) or percentage (0% to 100%)
      let l = 0;
      if (lStr.endsWith('%')) {
        l = parseFloat(lStr);
      } else {
        l = parseFloat(lStr) * 100;
      }
      
      // Chroma: 0 to ~0.4 (approximate)
      const c = parseFloat(cStr);
      
      // Hue: 0 to 360
      const h = parseFloat(hStr);
      
      if (isNaN(l) || isNaN(c) || isNaN(h)) return match;
      
      // Approximate Saturation: Chroma of 0.4 corresponds to 100% saturation
      let s = (c / 0.4) * 100;
      if (s > 100) s = 100;
      if (s < 0) s = 0;
      
      // Alpha
      let a = 1;
      if (aStr) {
        if (aStr.endsWith('%')) {
          a = parseFloat(aStr) / 100;
        } else {
          a = parseFloat(aStr);
        }
      }
      if (isNaN(a)) a = 1;
      
      return `hsla(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%, ${a})`;
    } catch (e) {
      return match;
    }
  });
}
