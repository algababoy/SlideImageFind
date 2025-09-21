export const POPULAR_SEARCHES = [
  "Business",
  "Technology", 
  "Nature",
  "Education",
  "Healthcare",
  "Finance"
];

export const LICENSE_OPTIONS = [
  { 
    value: "cc0", 
    label: "CC0 (Public Domain)", 
    commercial: true,
    description: "No rights reserved - free for any use"
  },
  { 
    value: "cc-by", 
    label: "CC-BY", 
    commercial: true,
    description: "Attribution required"
  },
  { 
    value: "cc-by-sa", 
    label: "CC-BY-SA", 
    commercial: true,
    description: "Attribution + ShareAlike"
  },
  { 
    value: "cc-by-nc", 
    label: "CC-BY-NC", 
    commercial: false,
    description: "Attribution + Non-commercial only"
  },
];

export const SIZE_OPTIONS = [
  { value: "any", label: "Any Size" },
  { value: "large", label: "Large (1024px+)" },
  { value: "medium", label: "Medium (512-1024px)" },
];

export const FILE_TYPE_OPTIONS = [
  { value: "jpg", label: "JPG" },
  { value: "png", label: "PNG" },
  { value: "svg", label: "SVG" },
];

export function downloadImage(imageUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    // Success handled by toast in component
  }).catch(() => {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  });
}
