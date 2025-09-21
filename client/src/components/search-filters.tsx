import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { ImageSource } from "@shared/schema";

interface SearchFiltersProps {
  selectedLicenses: string[];
  selectedSources: ImageSource[];
  onLicenseChange: (licenses: string[]) => void;
  onSourceChange: (sources: ImageSource[]) => void;
}

const LICENSE_OPTIONS = [
  { id: 'cc0', label: 'CC0 (Public Domain)', description: 'No attribution required' },
  { id: 'cc-by', label: 'CC BY', description: 'Attribution required' },
  { id: 'cc-by-sa', label: 'CC BY-SA', description: 'Attribution + ShareAlike' }
];

const SOURCE_OPTIONS: { id: ImageSource; label: string; description: string }[] = [
  { id: 'wikimedia', label: 'Wikimedia Commons', description: 'Community-curated repository' },
  { id: 'pixabay', label: 'Pixabay', description: 'Free stock photography' },
  { id: 'unsplash', label: 'Unsplash', description: 'Beautiful free photos' },
  { id: 'pexels', label: 'Pexels', description: 'Free stock photos & videos' },
  { id: 'openclipart', label: 'OpenClipart', description: 'Public domain clipart & SVGs' }
];

export function SearchFilters({ 
  selectedLicenses, 
  selectedSources, 
  onLicenseChange, 
  onSourceChange 
}: SearchFiltersProps) {
  const handleLicenseToggle = (licenseId: string) => {
    const newLicenses = selectedLicenses.includes(licenseId)
      ? selectedLicenses.filter(id => id !== licenseId)
      : [...selectedLicenses, licenseId];
    onLicenseChange(newLicenses);
  };

  const handleSourceToggle = (sourceId: ImageSource) => {
    const newSources = selectedSources.includes(sourceId)
      ? selectedSources.filter(id => id !== sourceId)
      : [...selectedSources, sourceId];
    onSourceChange(newSources);
  };

  return (
    <div className="max-w-4xl mx-auto mb-8">
      <div className="grid md:grid-cols-2 gap-6 p-6 bg-card border border-border rounded-lg">
        
        {/* License Filters */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-foreground" data-testid="license-filter-title">
            License Types
          </h3>
          <div className="space-y-3">
            {LICENSE_OPTIONS.map((license) => (
              <div key={license.id} className="flex items-start space-x-3">
                <Checkbox
                  id={`license-${license.id}`}
                  checked={selectedLicenses.includes(license.id)}
                  onCheckedChange={() => handleLicenseToggle(license.id)}
                  data-testid={`license-checkbox-${license.id}`}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor={`license-${license.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {license.label}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {license.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Source Filters */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-foreground" data-testid="source-filter-title">
            Image Sources
          </h3>
          <div className="space-y-3">
            {SOURCE_OPTIONS.map((source) => (
              <div key={source.id} className="flex items-start space-x-3">
                <Checkbox
                  id={`source-${source.id}`}
                  checked={selectedSources.includes(source.id)}
                  onCheckedChange={() => handleSourceToggle(source.id)}
                  data-testid={`source-checkbox-${source.id}`}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor={`source-${source.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {source.label}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {source.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Active Filters Display */}
      {(selectedLicenses.length > 0 || selectedSources.length > 0) && (
        <div className="mt-4 p-4 bg-accent/20 border border-accent/30 rounded-lg">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-foreground">Active filters:</span>
            {selectedLicenses.map(license => (
              <Badge key={license} variant="secondary" data-testid={`active-license-${license}`}>
                {LICENSE_OPTIONS.find(l => l.id === license)?.label}
              </Badge>
            ))}
            {selectedSources.map(source => (
              <Badge key={source} variant="outline" data-testid={`active-source-${source}`}>
                {SOURCE_OPTIONS.find(s => s.id === source)?.label}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}