import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Share, Copy, Download } from "lucide-react";
import type { SearchResult } from "@shared/schema";
import { downloadImage, copyToClipboard } from "@/lib/wikimedia-api";
import { useToast } from "@/hooks/use-toast";
import { getCommercialUseStatus, getSourceDisplayName } from "@/utils/commercial-use";

interface ImageModalProps {
  image: SearchResult | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleFavorite: (image: SearchResult) => void;
  isFavorite: boolean;
}

export function ImageModal({ image, isOpen, onClose, onToggleFavorite, isFavorite }: ImageModalProps) {
  const { toast } = useToast();

  if (!image) return null;

  const isCommercial = getCommercialUseStatus(image);

  const handleDownloadOriginal = () => {
    downloadImage(image.imageUrl, `${image.title}-original`);
    toast({
      title: "Download Started",
      description: "Your image download has begun.",
    });
  };

  const handleCopyAttribution = () => {
    copyToClipboard(image.attribution);
    toast({
      title: "Attribution Copied",
      description: "Attribution text copied to clipboard.",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: image.title,
        text: `Check out this Creative Commons image: ${image.title}`,
        url: image.sourceUrl,
      });
    } else {
      copyToClipboard(image.sourceUrl);
      toast({
        title: "Link Copied",
        description: "Image link copied to clipboard.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl w-full max-h-[90vh] overflow-hidden p-0"
        data-testid="image-modal"
      >
        <div className="flex">
          {/* Image Preview */}
          <div className="flex-1 p-6">
            <a 
              href={image.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="modal-image-link"
            >
              <img 
                src={image.imageUrl}
                alt={image.title}
                className="w-full h-auto rounded-lg max-h-96 object-contain hover:opacity-90 transition-opacity cursor-pointer"
                data-testid="modal-image"
              />
            </a>
          </div>
          
          {/* Image Details */}
          <div className="w-80 p-6 border-l border-border">
            <DialogHeader className="mb-4">
              <DialogTitle 
                className="text-lg font-semibold text-foreground line-clamp-2"
                data-testid="modal-title"
              >
                {image.title}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Author</label>
                <p className="text-muted-foreground" data-testid="modal-author">
                  {image.author || "Unknown"}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground">License</label>
                <div className="flex items-center space-x-2 mt-1">
                  {image.licenseUrl ? (
                    <a 
                      href={image.licenseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Badge className="text-xs font-medium bg-accent text-accent-foreground hover:bg-accent/80 cursor-pointer">
                        {image.license}
                      </Badge>
                    </a>
                  ) : (
                    <Badge className="text-xs font-medium bg-accent text-accent-foreground">
                      {image.license}
                    </Badge>
                  )}
                  <Badge 
                    variant={isCommercial ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {isCommercial ? "✓ Commercial Use" : "✗ Commercial"}
                  </Badge>
                </div>
              </div>
              
              {image.dimensions && (
                <div>
                  <label className="text-sm font-medium text-foreground">Dimensions</label>
                  <p className="text-muted-foreground" data-testid="modal-dimensions">
                    {image.dimensions} pixels
                  </p>
                </div>
              )}
              
              {image.fileSize && (
                <div>
                  <label className="text-sm font-medium text-foreground">File Size</label>
                  <p className="text-muted-foreground" data-testid="modal-file-size">
                    {image.fileSize}
                  </p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-foreground">Source</label>
                <a 
                  href={image.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="text-primary hover:underline text-sm block"
                  data-testid="modal-source-link"
                >
                  {getSourceDisplayName(image.source)}
                </a>
              </div>
              
              {/* Attribution Text */}
              <div>
                <label className="text-sm font-medium text-foreground">Attribution Text</label>
                <div className="bg-muted p-3 rounded-md mt-2">
                  <p className="text-sm text-muted-foreground" data-testid="modal-attribution">
                    {image.attribution}
                  </p>
                  <Button 
                    variant="link" 
                    size="sm"
                    className="text-xs text-primary hover:underline mt-1 p-0"
                    onClick={handleCopyAttribution}
                    data-testid="copy-attribution-button"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy to clipboard
                  </Button>
                </div>
              </div>
              
              {/* Download Options */}
              <div className="space-y-2">
                <Button 
                  className="w-full"
                  onClick={handleDownloadOriginal}
                  data-testid="download-original-button"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Original
                </Button>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => onToggleFavorite(image)}
                  data-testid="modal-favorite-button"
                >
                  <Heart className={`h-4 w-4 mr-1 ${isFavorite ? 'fill-current' : ''}`} />
                  {isFavorite ? 'Saved' : 'Save'}
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleShare}
                  data-testid="modal-share-button"
                >
                  <Share className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
