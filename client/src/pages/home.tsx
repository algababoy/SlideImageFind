import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { SearchBar } from "@/components/search-bar";
import { FilterSidebar } from "@/components/filter-sidebar";
import { ImageGrid } from "@/components/image-grid";
import { ImageModal } from "@/components/image-modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Grid3X3, List } from "lucide-react";
import type { WikimediaImage, SearchFilters } from "@/types/wikimedia";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    licenses: ["cc0", "cc-by", "cc-by-sa"],
    size: "large",
    fileTypes: ["jpg", "png"],
  });
  const [selectedImage, setSelectedImage] = useState<WikimediaImage | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState("relevance");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const { toast } = useToast();

  // Search images query
  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ["/api/search", searchQuery, filters.licenses.join(",")],
    enabled: !!searchQuery,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      licenses: ["cc0", "cc-by", "cc-by-sa"],
      size: "any",
      fileTypes: [],
    });
  }, []);

  const handleImageClick = useCallback((image: WikimediaImage) => {
    setSelectedImage(image);
  }, []);

  const handleToggleFavorite = useCallback((image: WikimediaImage) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(image.imageUrl)) {
      newFavorites.delete(image.imageUrl);
      toast({
        title: "Removed from favorites",
        description: `"${image.title}" removed from your favorites.`,
      });
    } else {
      newFavorites.add(image.imageUrl);
      toast({
        title: "Added to favorites",
        description: `"${image.title}" added to your favorites.`,
      });
    }
    setFavorites(newFavorites);
  }, [favorites, toast]);

  const images = (searchResults as any)?.results || [];
  const totalResults = (searchResults as any)?.total || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />

        {error && (
          <div 
            className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6 text-center"
            data-testid="error-message"
          >
            <p className="text-destructive">
              Failed to search images. Please try again.
            </p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <FilterSidebar 
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />

          <div className="flex-1">
            {searchQuery && (
              <>
                {/* Results Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <div>
                    <h3 
                      className="text-xl font-semibold text-foreground"
                      data-testid="results-count"
                    >
                      {totalResults.toLocaleString()} results
                    </h3>
                    <p className="text-muted-foreground" data-testid="search-query">
                      for "{searchQuery}"
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-40" data-testid="sort-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Most Relevant</SelectItem>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="quality">Highest Quality</SelectItem>
                        <SelectItem value="size">Largest Size</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex border border-border rounded-md">
                      <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="sm"
                        className="rounded-r-none"
                        onClick={() => setViewMode("grid")}
                        data-testid="grid-view-button"
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="sm"
                        className="rounded-l-none"
                        onClick={() => setViewMode("list")}
                        data-testid="list-view-button"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <ImageGrid 
                  images={images}
                  isLoading={isLoading}
                  onImageClick={handleImageClick}
                  onToggleFavorite={handleToggleFavorite}
                  favorites={favorites}
                />
              </>
            )}

            {!searchQuery && (
              <div 
                className="text-center py-12"
                data-testid="search-prompt"
              >
                <p className="text-muted-foreground text-lg">
                  Enter a search term above to find Creative Commons images for your presentations.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <ImageModal 
        image={selectedImage}
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={selectedImage ? favorites.has(selectedImage.imageUrl) : false}
      />
    </div>
  );
}
