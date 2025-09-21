import type { SearchResult } from "@shared/schema";
import { LICENSE_OPTIONS } from "@/lib/wikimedia-api";

export function getCommercialUseStatus(image: SearchResult): boolean {
  const licenseOption = LICENSE_OPTIONS.find(opt => 
    image.license.toLowerCase().includes(opt.value)
  );
  
  // If we found a matching CC license option, use its commercial status
  if (licenseOption) {
    return licenseOption.commercial;
  }
  
  // For non-CC platforms, all our supported sources allow commercial use
  switch (image.source) {
    case 'pixabay':
    case 'unsplash': 
    case 'pexels':
    case 'openclipart':
      return true;
    case 'wikimedia':
      // For Wikimedia, check common CC license patterns and public domain variants
      const license = image.license.toLowerCase();
      return license.includes('cc0') || 
             license.includes('cc-by') || 
             license.includes('cc by') ||
             license.includes('public domain') ||
             license.includes('pd') ||
             license.includes('no rights reserved') ||
             license.includes('pdm') ||
             license.includes('cc public domain mark');
    default:
      return false;
  }
}

export function getSourceDisplayName(source: string): string {
  const sourceNames: Record<string, string> = {
    'wikimedia': 'Wikimedia Commons',
    'pixabay': 'Pixabay',
    'unsplash': 'Unsplash',
    'pexels': 'Pexels',
    'openclipart': 'Openclipart'
  };
  
  return sourceNames[source] || source.charAt(0).toUpperCase() + source.slice(1);
}