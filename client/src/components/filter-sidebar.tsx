import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LICENSE_OPTIONS, SIZE_OPTIONS, FILE_TYPE_OPTIONS } from "@/lib/wikimedia-api";
import type { SearchFilters } from "@/types/wikimedia";

interface FilterSidebarProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
}

export function FilterSidebar({ filters, onFiltersChange, onClearFilters }: FilterSidebarProps) {
  const handleLicenseChange = (license: string, checked: boolean) => {
    const newLicenses = checked 
      ? [...filters.licenses, license]
      : filters.licenses.filter(l => l !== license);
    
    onFiltersChange({ ...filters, licenses: newLicenses });
  };

  const handleSizeChange = (size: string) => {
    onFiltersChange({ ...filters, size });
  };

  const handleFileTypeChange = (fileType: string, checked: boolean) => {
    const newFileTypes = checked
      ? [...filters.fileTypes, fileType]
      : filters.fileTypes.filter(ft => ft !== fileType);
    
    onFiltersChange({ ...filters, fileTypes: newFileTypes });
  };

  return (
    <div className="lg:w-64 flex-shrink-0">
      <Card className="sticky top-4" data-testid="filters-card">
        <CardHeader>
          <CardTitle data-testid="filters-title">Filter Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* License Filter */}
          <div data-testid="license-filter">
            <h4 className="font-medium text-foreground mb-3">License Type</h4>
            <div className="space-y-2">
              {LICENSE_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id={`license-${option.value}`}
                      checked={filters.licenses.includes(option.value)}
                      onCheckedChange={(checked) => handleLicenseChange(option.value, checked as boolean)}
                      data-testid={`license-checkbox-${option.value}`}
                    />
                    <Label 
                      htmlFor={`license-${option.value}`} 
                      className="text-sm cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                  <Badge 
                    variant={option.commercial ? "default" : "destructive"} 
                    className="text-xs"
                  >
                    {option.commercial ? "✓ Commercial" : "✗ Commercial"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Image Size Filter */}
          <div data-testid="size-filter">
            <h4 className="font-medium text-foreground mb-3">Image Size</h4>
            <RadioGroup value={filters.size} onValueChange={handleSizeChange}>
              {SIZE_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={option.value} 
                    id={`size-${option.value}`}
                    data-testid={`size-radio-${option.value}`}
                  />
                  <Label 
                    htmlFor={`size-${option.value}`} 
                    className="text-sm cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* File Type Filter */}
          <div data-testid="file-type-filter">
            <h4 className="font-medium text-foreground mb-3">File Type</h4>
            <div className="space-y-2">
              {FILE_TYPE_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`filetype-${option.value}`}
                    checked={filters.fileTypes.includes(option.value)}
                    onCheckedChange={(checked) => handleFileTypeChange(option.value, checked as boolean)}
                    data-testid={`filetype-checkbox-${option.value}`}
                  />
                  <Label 
                    htmlFor={`filetype-${option.value}`} 
                    className="text-sm cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Button 
            variant="secondary" 
            className="w-full"
            onClick={onClearFilters}
            data-testid="clear-filters-button"
          >
            Clear Filters
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
