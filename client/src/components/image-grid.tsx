import { ImageCard } from "./image-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SearchResult } from "@shared/schema";

interface ImageGridProps {
  images: SearchResult[];
  isLoading: boolean;
  onImageClick: (image: SearchResult) => void;
  onToggleFavorite: (image: SearchResult) => void;
  favorites: Set<string>;
}

export function ImageGrid({ images, isLoading, onImageClick, onToggleFavorite, favorites }: ImageGridProps) {
  if (isLoading) {
    return (
      <div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
        data-testid="loading-grid"
      >
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg overflow-hidden">
            <Skeleton className="aspect-square w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div 
        className="text-center py-12"
        data-testid="no-results"
      >
        <p className="text-muted-foreground text-lg">
          No images found. Try adjusting your search or filters.
        </p>
      </div>
    );
  }

  return (
    <div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
      data-testid="image-grid"
    >
      {images.map((image) => (
        <ImageCard
          key={image.imageUrl}
          image={image}
          onImageClick={onImageClick}
          onToggleFavorite={onToggleFavorite}
          isFavorite={favorites.has(image.imageUrl)}
        />
      ))}
    </div>
  );
}
