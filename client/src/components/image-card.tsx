import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import type { WikimediaImage } from "@/types/wikimedia";
import { useState } from "react";
import { LICENSE_OPTIONS } from "@/lib/wikimedia-api";

interface ImageCardProps {
  image: WikimediaImage;
  onImageClick: (image: WikimediaImage) => void;
  onToggleFavorite: (image: WikimediaImage) => void;
  isFavorite: boolean;
}

export function ImageCard({ image, onImageClick, onToggleFavorite, isFavorite }: ImageCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const licenseOption = LICENSE_OPTIONS.find(opt => 
    image.license.toLowerCase().includes(opt.value)
  );
  
  const isCommercial = licenseOption?.commercial ?? false;

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
      data-testid={`image-card-${image.title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <div className="aspect-square relative overflow-hidden">
        {!imageLoaded && (
          <div className="w-full h-full bg-muted animate-pulse" />
        )}
        <img 
          src={image.thumbnailUrl}
          alt={image.title}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
            imageLoaded ? 'block' : 'hidden'
          }`}
          onClick={() => onImageClick(image)}
          onLoad={() => setImageLoaded(true)}
          data-testid="image-thumbnail"
        />
        <div className="absolute top-2 right-2 flex space-x-1">
          <Badge 
            className="text-xs font-medium bg-accent text-accent-foreground"
            data-testid="license-badge"
          >
            {image.license}
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 bg-black/50 text-white hover:bg-black/70"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(image);
            }}
            data-testid="favorite-button"
          >
            <Heart className={`h-3 w-3 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
        </div>
        {image.dimensions && (
          <div 
            className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded"
            data-testid="image-dimensions"
          >
            {image.dimensions}
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h4 
          className="font-medium text-foreground mb-1 line-clamp-2"
          data-testid="image-title"
        >
          {image.title}
        </h4>
        <p 
          className="text-sm text-muted-foreground mb-2"
          data-testid="image-author"
        >
          by {image.author || "Unknown"}
        </p>
        <div className="flex justify-between items-center">
          <Badge 
            variant={isCommercial ? "default" : "destructive"}
            className="text-xs"
            data-testid="commercial-badge"
          >
            {isCommercial ? "✓ Commercial Use" : "✗ Commercial"}
          </Badge>
          <Button 
            size="sm"
            onClick={() => onImageClick(image)}
            data-testid="download-button"
          >
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
