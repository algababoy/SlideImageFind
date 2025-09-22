import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { SearchFilters } from "@/components/search-filters";
import { ImageGrid } from "@/components/image-grid";
import { CommercialUseInfo } from "@/components/commercial-use-info";
import type { SearchResult, ImageSource } from "@shared/schema";
import { getCommercialUseStatus, getSourceDisplayName } from "@/utils/commercial-use";
import {
  Monitor,
  Download,
  Eye,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Search,
  Upload,
  Image as ImageIcon,
  FileUp,
  FileDown,
  Palette,
  Type,
  AlertTriangle,
  X,
} from "lucide-react";

/**
 * Enhanced Class Slides Generator with Sections Support
 * - Per-slide multi sections (multiple text boxes per slide)
 * - Each section has: xStart/xEnd (as % width), font family, color, size, alignment, and content
 * - Dual-handle width control implemented with two range inputs (xStart, xEnd) + live preview bar
 * - Sections are included in JSON export/import and HTML export
 * - Backward compatible: legacy title/content still render if no sections present
 * - Integrated with multi-source Creative Commons image search
 */

type SlideType = "title" | "content" | "image";
type TextAlign = "left" | "center" | "right";
type OverlayType = "none" | "horizontal" | "sides";
type FontFamily = "system" | "serif" | "mono" | "display" | "hand";
type TransitionType = "none" | "fade" | "slide" | "zoom" | "bounce" | "flip" | "rotate";

interface SlideSection {
  id: string;
  heading?: string;
  text: string;
  xStart: number; // 0..100 (% of slide width)
  xEnd: number;   // 0..100 (% of slide width) must be > xStart
  yStart: number; // 0..100 (% of slide height)
  yEnd: number;   // 0..100 (% of slide height) must be > yStart
  fontFamily: FontFamily;
  fontSize: number; // rem in editor/preview; px in export
  color: string; // hex
  align: TextAlign;
  transition?: TransitionType;
  transitionDelay?: number; // seconds
}

interface OverlayBand {
  id: string;
  xStart: number; // 0..100 (% of slide width)
  xEnd: number;   // 0..100 (% of slide width) must be > xStart
  yStart: number; // 0..100 (% of slide height)
  yEnd: number;   // 0..100 (% of slide height) must be > yStart
  color: string;  // hex color
  alpha: number;  // 0..1 transparency
  zIndex?: number; // layering order (higher = on top)
}

interface Slide {
  id: string;
  title: string;
  content: string; // legacy single block
  type: SlideType;
  imageUrl?: string;
  imageSource?: SearchResult; // For MLA citations - using SearchResult for full metadata
  backgroundColor?: string;
  textColor?: string; // legacy color for title/content
  overlayType?: OverlayType;
  overlayColor?: string;
  overlayOpacity?: number; // 0..1
  overlayTransition?: TransitionType;
  textAlign?: TextAlign;   // legacy
  titleSize?: number; // rem
  bodySize?: number;  // rem
  fontSizeScale?: number; // multiplier for all text (default 1.0)
  sections?: SlideSection[]; // NEW
  overlayBands?: OverlayBand[]; // Configurable overlay bands
}

const FONT_STACKS: Record<FontFamily, string> = {
  system: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, \"Apple Color Emoji\", \"Segoe UI Emoji\"",
  serif: "ui-serif, Georgia, Cambria, \"Times New Roman\", Times, serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace",
  display: "\"Poppins\", \"Montserrat\", \"Oswald\", ui-sans-serif, system-ui, Arial",
  hand: "\"Comic Neue\", \"Patrick Hand\", \"Caveat\", cursive, ui-sans-serif",
};

const DEFAULT_SLIDES: Slide[] = [
  {
    id: "1",
    title: "Welcome to PresentationFinder!",
    content: "Create amazing slideshows with Creative Commons images\nFind the perfect images for your presentations",
    type: "title",
    imageUrl: "https://images.unsplash.com/photo-1549144511-f099e773c147?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    backgroundColor: "#3B82F6",
    textColor: "#ffffff",
    overlayType: "horizontal",
    overlayColor: "#000000",
    overlayOpacity: 0.6,
    overlayTransition: "slide",
    textAlign: "center",
    titleSize: 3.5,
    bodySize: 1.4,
    fontSizeScale: 1.0,
    overlayBands: [],
    sections: [
      {
        id: "s-1",
        heading: "Welcome to PresentationFinder!",
        text: "Create amazing slideshows with Creative Commons images\nFind the perfect images for your presentations",
        xStart: 20,
        xEnd: 80,
        yStart: 30,
        yEnd: 70,
        fontFamily: "display",
        fontSize: 2.0,
        color: "#ffffff",
        align: "center",
        transition: "fade",
        transitionDelay: 0.5,
      },
    ],
  },
  {
    id: "2",
    title: "Features",
    content: "🔍 Multi-source image search\n📷 Creative Commons licensing\n🎨 Professional slide design\n📝 MLA citation generation\n🌐 Commercial use guidance",
    type: "content",
    backgroundColor: "#10B981",
    textColor: "#ffffff",
    overlayType: "sides",
    overlayColor: "#000000",
    overlayOpacity: 0.5,
    overlayTransition: "fade",
    textAlign: "left",
    titleSize: 2.6,
    bodySize: 1.2,
    fontSizeScale: 1.0,
    overlayBands: [],
    sections: [
      {
        id: "s-2a",
        heading: "Features",
        text: "🔍 Multi-source image search\n📷 Creative Commons licensing\n🎨 Professional slide design\n📝 MLA citation generation\n🌐 Commercial use guidance",
        xStart: 10,
        xEnd: 60,
        yStart: 20,
        yEnd: 80,
        fontFamily: "system",
        fontSize: 1.3,
        color: "#ffffff",
        align: "left",
        transition: "slide",
        transitionDelay: 0.3,
      },
      {
        id: "s-2b",
        heading: "Commercial Use",
        text: "All images are properly licensed for commercial presentations",
        xStart: 62,
        xEnd: 90,
        yStart: 60,
        yEnd: 85,
        fontFamily: "display",
        fontSize: 1.2,
        color: "#FFD700",
        align: "left",
        transition: "bounce",
        transitionDelay: 0.8,
      },
    ],
  },
];

export default function ClassSlides() {
  const [presentationTitle, setPresentationTitle] = useState("My Presentation");
  const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>(["cc0", "cc-by", "cc-by-sa"]);
  const [selectedSources, setSelectedSources] = useState<ImageSource[]>(["wikimedia", "pixabay", "unsplash", "pexels", "openclipart"]);
  const [directImageUrl, setDirectImageUrl] = useState<string>("");
  const [loadingDirectImage, setLoadingDirectImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Overlay band interaction state
  const [selectedBandId, setSelectedBandId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null); // 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'
  const [dragStart, setDragStart] = useState<{x: number, y: number, bandXStart: number, bandYStart: number, bandXEnd: number, bandYEnd: number} | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const currentSlide = slides[currentSlideIndex];

  // Global mouse event listeners for better drag/resize experience
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging || isResizing) {
        // Convert native event to React event for compatibility
        const reactEvent = {
          clientX: e.clientX,
          clientY: e.clientY,
          preventDefault: () => e.preventDefault(),
          stopPropagation: () => e.stopPropagation(),
        } as React.MouseEvent;
        handleMouseMove(reactEvent);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging || isResizing) {
        handleMouseUp();
      }
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, dragStart, selectedBandId, previewRef]);

  // Keyboard event handlers for better UX
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDragging || isResizing) {
          // Cancel drag/resize operation
          setIsDragging(false);
          setIsResizing(false);
          setResizeHandle(null);
          setDragStart(null);
        } else if (selectedBandId) {
          // Deselect band
          setSelectedBandId(null);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDragging, isResizing, selectedBandId]);

  // Search for images using our unified API
  const licensesParam = [...selectedLicenses].sort().join(",");
  const sourcesParam = [...selectedSources].sort().join(",");
  const searchUrl = `/api/search?q=${encodeURIComponent(searchQuery)}&licenses=${licensesParam}&sources=${sourcesParam}&limit=20&offset=0`;
  
  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: [searchUrl],
    enabled: !!searchQuery.trim(),
    staleTime: 30 * 1000, // Cache for 30 seconds to allow filter changes
  });

  const images = (searchResults as any)?.results || [];

  // Filter change handlers
  const handleLicenseChange = (licenses: string[]) => {
    setSelectedLicenses(licenses);
  };

  const handleSourceChange = (sources: ImageSource[]) => {
    setSelectedSources(sources);
  };

  // Utility functions
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
  
  const hexWithOpacity = (hex: string, opacity: number) => {
    const clean = hex.replace("#", "");
    const a = clamp(Math.round(clamp(opacity, 0, 1) * 255), 0, 255)
      .toString(16)
      .padStart(2, "0");
    return `#${clean}${a}`;
  };
  
  const luminance = (hex: string) => {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    const [R, G, B] = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  };
  
  const contrastRatio = (fg: string, bg: string) => {
    const L1 = luminance(fg) + 0.05;
    const L2 = luminance(bg) + 0.05;
    return L1 > L2 ? L1 / L2 : L2 / L1;
  };
  
  const contrastWarning = useMemo(() => {
    const bg = currentSlide?.backgroundColor || "#3B82F6";
    const fg = currentSlide?.textColor || "#ffffff";
    const ratio = contrastRatio(fg, bg);
    return { ratio, warn: ratio < 4.5 };
  }, [currentSlide?.backgroundColor, currentSlide?.textColor]);

  // CRUD operations for slides
  const addSlide = () => {
    setSlides((prev) => {
      const newSlide: Slide = {
        id: Date.now().toString(),
        title: "New Slide",
        content: "",
        type: "content",
        backgroundColor: "#6366F1",
        textColor: "#ffffff",
        overlayType: "none",
        overlayColor: "#000000",
        overlayOpacity: 0.5,
        overlayTransition: "fade",
        textAlign: "center",
        titleSize: 2.2,
        bodySize: 1.1,
        fontSizeScale: 1.0,
        overlayBands: [],
        sections: [
          {
            id: `sec-${Date.now()}`,
            heading: "Text",
            text: "Your text here...",
            xStart: 15,
            xEnd: 85,
            yStart: 25,
            yEnd: 75,
            fontFamily: "system",
            fontSize: 1.2,
            color: "#ffffff",
            align: "left",
            transition: "fade",
            transitionDelay: 0.5,
          },
        ],
      };
      const next = [...prev, newSlide];
      setCurrentSlideIndex(next.length - 1);
      return next;
    });
  };

  const deleteSlide = (slideId: string) => {
    setSlides((prev) => {
      if (prev.length <= 1) {
        toast({ title: "Cannot delete", description: "At least one slide is required.", variant: "destructive" });
        return prev;
      }
      const idx = prev.findIndex((s) => s.id === slideId);
      const next = prev.filter((s) => s.id !== slideId);
      setCurrentSlideIndex((i) => {
        if (idx === -1) return Math.min(i, next.length - 1);
        if (i > idx) return i - 1;
        if (i === idx) return Math.min(i, next.length - 1);
        return i;
      });
      return next;
    });
  };

  const moveSlide = (slideId: string, direction: "up" | "down") => {
    setSlides((prev) => {
      const i = prev.findIndex((s) => s.id === slideId);
      if (i === -1) return prev;
      const j = direction === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      setCurrentSlideIndex((idx) => (idx === i ? j : idx === j ? i : idx));
      return next;
    });
  };

  const updateSlide = (slideId: string, updates: Partial<Slide>) => {
    setSlides((prev) => prev.map((s) => (s.id === slideId ? { ...s, ...updates } : s)));
  };

  // CRUD operations for sections
  const addSection = (slideId: string) => {
    setSlides((prev) =>
      prev.map((s) =>
        s.id === slideId
          ? {
              ...s,
              sections: [
                ...(s.sections || []),
                {
                  id: `sec-${Date.now()}`,
                  heading: "Section",
                  text: "Text...",
                  xStart: 10,
                  xEnd: 90,
                  yStart: 20,
                  yEnd: 80,
                  fontFamily: "system",
                  fontSize: 1.1,
                  color: "#ffffff",
                  align: "left",
                  transition: "fade",
                  transitionDelay: 0.5,
                },
              ],
            }
          : s
      )
    );
  };

  const updateSection = (slideId: string, sectionId: string, updates: Partial<SlideSection>) => {
    setSlides((prev) =>
      prev.map((s) =>
        s.id === slideId
          ? {
              ...s,
              sections: (s.sections || []).map((sec) => (sec.id === sectionId ? { ...sec, ...updates } : sec)),
            }
          : s
      )
    );
  };

  const deleteSection = (slideId: string, sectionId: string) => {
    setSlides((prev) =>
      prev.map((s) =>
        s.id === slideId ? { ...s, sections: (s.sections || []).filter((sec) => sec.id !== sectionId) } : s
      )
    );
  };

  // Generate MLA citations for all images used
  const generateMLACitations = () => {
    const citations: string[] = [];
    slides.forEach((slide, index) => {
      if (slide.imageSource) {
        const source = slide.imageSource;
        let citation = '';
        
        // Generate citation based on source type
        if (source.source === 'wikimedia') {
          citation = `"${source.title}." Wikimedia Commons${source.author ? `, by ${source.author}` : ''}. Web. ${new Date().toISOString().split('T')[0]}. <${source.imageUrl}>.`;
        } else if (source.source === 'unsplash') {
          citation = `${source.author}. "${source.title}." Unsplash. Web. ${new Date().toISOString().split('T')[0]}. <${source.imageUrl}>.`;
        } else if (source.source === 'pixabay') {
          citation = `${source.author}. "${source.title}." Pixabay. Web. ${new Date().toISOString().split('T')[0]}. <${source.imageUrl}>.`;
        } else if (source.source === 'pexels') {
          citation = `${source.author}. "${source.title}." Pexels. Web. ${new Date().toISOString().split('T')[0]}. <${source.imageUrl}>.`;
        } else if (source.source === 'openclipart') {
          citation = `${source.author}. "${source.title}." OpenClipart. Web. ${new Date().toISOString().split('T')[0]}. <${source.imageUrl}>.`;
        }
        
        if (citation) {
          citations.push(`${index + 1}. ${citation}`);
        }
      }
    });
    return citations;
  };

  // Image selection
  const selectImage = (image: SearchResult) => {
    updateSlide(currentSlide.id, { imageUrl: image.imageUrl, imageSource: image });
    setShowImageSearch(false);
    toast({
      title: "Image added",
      description: `Added "${image.title}" from ${getSourceDisplayName(image.source)}`,
    });
  };

  // File upload handling
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        const imageSource: SearchResult = {
          id: `upload-${Date.now()}`,
          title: file.name.replace(/\.[^/.]+$/, ""),
          imageUrl,
          thumbnailUrl: imageUrl,
          author: "Local Upload",
          source: "wikimedia", // Default for local uploads
          license: "Local File",
          sourceUrl: imageUrl,
          attribution: `Local upload: ${file.name}`,
        };
        updateSlide(currentSlide.id, { imageUrl, imageSource });
        toast({ title: "File uploaded", description: "Image added to slide." });
      };
      reader.readAsDataURL(file);
    }
  };

  // Export functionality
  const exportSlides = () => {
    const data = { title: presentationTitle, slides };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${presentationTitle.replace(/[^a-zA-Z0-9]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSlides = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.slides && Array.isArray(data.slides)) {
            setSlides(data.slides);
            setPresentationTitle(data.title || "Imported Presentation");
            setCurrentSlideIndex(0);
            toast({ title: "Import successful", description: "Slides imported successfully." });
          }
        } catch (error) {
          toast({ title: "Import failed", description: "Invalid JSON file.", variant: "destructive" });
        }
      };
      reader.readAsText(file);
    }
  };

  const exportHTML = () => {
    const citations = generateMLACitations();
    const citationsHtml = citations.length > 0 ? `
      <div class="citations-page">
        <h2>Image Citations</h2>
        <div class="citations-list">
          ${citations.map(citation => `<p>${citation}</p>`).join('')}
        </div>
      </div>
    ` : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${presentationTitle}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: ${FONT_STACKS.system}; overflow: hidden; }
        .slideshow { width: 100vw; height: 100vh; position: relative; }
        .slide { 
            width: 100%; height: 100%; position: absolute; top: 0; left: 0; 
            display: flex; align-items: center; justify-content: center;
            background-size: cover; background-position: center;
            opacity: 0; transition: opacity 0.5s ease-in-out;
        }
        .slide.active { opacity: 1; }
        .slide-content { 
            position: relative; z-index: 10; padding: 2rem; 
            max-width: 80%; text-align: center; color: white;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
        }
        .section { position: absolute; }
        .overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 5; }
        .navigation { 
            position: fixed; bottom: 20px; right: 20px; z-index: 1000;
            display: flex; gap: 10px;
        }
        .nav-btn { 
            padding: 10px 15px; background: rgba(0,0,0,0.7); color: white; 
            border: none; border-radius: 5px; cursor: pointer;
        }
        .slide-counter { 
            position: fixed; bottom: 20px; left: 20px; z-index: 1000;
            background: rgba(0,0,0,0.7); color: white; padding: 10px; border-radius: 5px;
        }
        .citations-page {
            padding: 2rem; background: white; color: black; 
            display: none; width: 100vw; height: 100vh; overflow-y: auto;
        }
        .citations-page h2 { margin-bottom: 1rem; }
        .citations-page p { margin-bottom: 0.5rem; }
        
        /* Animation classes */
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes zoomIn { from { transform: scale(0); } to { transform: scale(1); } }
        @keyframes bounceIn { 
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.05); }
            70% { transform: scale(0.9); }
            100% { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 1s ease-in-out; }
        .animate-slideInLeft { animation: slideInLeft 1s ease-out; }
        .animate-zoomIn { animation: zoomIn 0.8s ease-out; }
        .animate-bounceIn { animation: bounceIn 1s ease-out; }
    </style>
</head>
<body>
    <div class="slideshow">
        ${slides.map((slide, index) => {
          const useSections = slide.sections && slide.sections.length > 0;
          return `
            <div class="slide ${index === 0 ? 'active' : ''}" style="
                background: ${slide.imageUrl 
                  ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('${slide.imageUrl}')`
                  : slide.backgroundColor || '#3B82F6'};
                background-size: cover;
                background-position: center;
            ">
                ${slide.overlayType === 'horizontal' ? `
                    <div class="overlay" style="
                        background: ${hexWithOpacity(slide.overlayColor || '#000000', slide.overlayOpacity || 0.5)};
                        top: 30%; bottom: 30%;
                    "></div>
                ` : ''}
                
                ${slide.overlayType === 'sides' ? `
                    <div class="overlay" style="
                        background: linear-gradient(90deg, 
                            ${hexWithOpacity(slide.overlayColor || '#000000', slide.overlayOpacity || 0.5)} 0%, 
                            transparent 33.33%, 
                            transparent 66.66%, 
                            ${hexWithOpacity(slide.overlayColor || '#000000', slide.overlayOpacity || 0.5)} 100%);
                    "></div>
                ` : ''}
                
                ${slide.overlayBands && slide.overlayBands.length > 0 ? slide.overlayBands
                  .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
                  .map(band => {
                    const left = Math.min(band.xStart, band.xEnd);
                    const width = Math.max(band.xStart, band.xEnd) - left;
                    const top = Math.min(band.yStart, band.yEnd);
                    const height = Math.max(band.yStart, band.yEnd) - top;
                    return `<div style="position: absolute; left: ${left}%; width: ${width}%; top: ${top}%; height: ${height}%; background-color: ${band.color}; opacity: ${band.alpha}; z-index: ${(band.zIndex || 0) + 10};"></div>`;
                  }).join('') : ''}
                
                ${useSections ? slide.sections!.map(section => `
                    <div class="section" style="
                        left: ${Math.min(section.xStart, section.xEnd)}%;
                        width: ${Math.max(section.xStart, section.xEnd) - Math.min(section.xStart, section.xEnd)}%;
                        top: ${Math.min(section.yStart, section.yEnd)}%;
                        height: ${Math.max(section.yStart, section.yEnd) - Math.min(section.yStart, section.yEnd)}%;
                        color: ${section.color};
                        text-align: ${section.align};
                        font-family: ${FONT_STACKS[section.fontFamily]};
                        animation-delay: ${section.transitionDelay || 0}s;
                        z-index: 100;
                    " class="${section.transition ? `animate-${section.transition === 'fade' ? 'fadeIn' : section.transition === 'slide' ? 'slideInLeft' : section.transition === 'zoom' ? 'zoomIn' : section.transition === 'bounce' ? 'bounceIn' : ''}` : ''}">
                        ${section.heading ? `<h3 style="margin-bottom: 0.5rem; font-size: ${(section.fontSize + 0.3) * (slide.fontSizeScale || 1.0) * 16}px; font-weight: bold;">${section.heading}</h3>` : ''}
                        <div style="font-size: ${section.fontSize * (slide.fontSizeScale || 1.0) * 16}px; line-height: 1.45; white-space: pre-line;">${section.text}</div>
                    </div>
                `).join('') : `
                    <div class="slide-content" style="
                        text-align: ${slide.textAlign || 'center'};
                        color: ${slide.textColor || '#ffffff'};
                    ">
                        <h1 style="font-size: ${(slide.titleSize || 3.5) * (slide.fontSizeScale || 1.0) * 16}px; margin-bottom: 1.5rem;">${slide.title}</h1>
                        <p style="font-size: ${(slide.bodySize || 1.4) * (slide.fontSizeScale || 1.0) * 16}px; white-space: pre-line;">${slide.content}</p>
                    </div>
                `}
            </div>
          `;
        }).join('')}
    </div>
    
    ${citationsHtml}
    
    <div class="slide-counter">
        <span id="current-slide">1</span> / <span id="total-slides">${slides.length}</span>
    </div>
    
    <div class="navigation">
        <button class="nav-btn" onclick="prevSlide()">← Previous</button>
        <button class="nav-btn" onclick="nextSlide()">Next →</button>
        <button class="nav-btn" onclick="toggleCitations()">Citations</button>
    </div>
    
    <script>
        let currentSlide = 0;
        const totalSlides = ${slides.length};
        const showingCitations = false;
        
        function showSlide(index) {
            document.querySelectorAll('.slide').forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
            });
            document.getElementById('current-slide').textContent = index + 1;
        }
        
        function nextSlide() {
            if (currentSlide < totalSlides - 1) {
                currentSlide++;
                showSlide(currentSlide);
            }
        }
        
        function prevSlide() {
            if (currentSlide > 0) {
                currentSlide--;
                showSlide(currentSlide);
            }
        }
        
        function toggleCitations() {
            const slideshow = document.querySelector('.slideshow');
            const citations = document.querySelector('.citations-page');
            const nav = document.querySelector('.navigation');
            const counter = document.querySelector('.slide-counter');
            
            if (citations.style.display === 'block') {
                citations.style.display = 'none';
                slideshow.style.display = 'block';
                nav.style.display = 'flex';
                counter.style.display = 'block';
            } else {
                citations.style.display = 'block';
                slideshow.style.display = 'none';
                nav.style.display = 'none';
                counter.style.display = 'none';
            }
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevSlide();
            } else if (e.key === 'c' || e.key === 'C') {
                toggleCitations();
            }
        });
    </script>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${presentationTitle.replace(/[^a-zA-Z0-9]/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Two-handle range slider component for X positioning
  const XPositionSlider = ({ section, onUpdate }: { section: SlideSection, onUpdate: (updates: Partial<SlideSection>) => void }) => {
    const handleStartChange = (value: number) => {
      const newStart = clamp(value, 0, section.xEnd - 1);
      onUpdate({ xStart: newStart });
    };

    const handleEndChange = (value: number) => {
      const newEnd = clamp(value, section.xStart + 1, 100);
      onUpdate({ xEnd: newEnd });
    };

    const left = Math.min(section.xStart, section.xEnd);
    const width = Math.max(section.xStart, section.xEnd) - left;

    return (
      <div className="space-y-2">
        <Label>Horizontal Position (Left → Right)</Label>
        <div className="relative">
          {/* Track */}
          <div className="h-6 bg-gray-200 rounded relative">
            {/* Active span */}
            <div 
              className="absolute top-0 h-6 bg-blue-500 rounded"
              style={{ left: `${left}%`, width: `${width}%` }}
            />
            {/* Start handle */}
            <input
              type="range"
              min="0"
              max="99"
              value={section.xStart}
              onChange={(e) => handleStartChange(Number(e.target.value))}
              className="absolute top-0 w-full h-6 opacity-0 cursor-pointer"
              style={{ zIndex: 2 }}
            />
            {/* End handle */}
            <input
              type="range"
              min="1"
              max="100"
              value={section.xEnd}
              onChange={(e) => handleEndChange(Number(e.target.value))}
              className="absolute top-0 w-full h-6 opacity-0 cursor-pointer"
              style={{ zIndex: 1 }}
            />
            {/* Handle indicators */}
            <div 
              className="absolute top-1 w-4 h-4 bg-white border-2 border-blue-500 rounded-full"
              style={{ left: `calc(${section.xStart}% - 8px)` }}
            />
            <div 
              className="absolute top-1 w-4 h-4 bg-white border-2 border-blue-700 rounded-full"
              style={{ left: `calc(${section.xEnd}% - 8px)` }}
            />
          </div>
        </div>
        <div className="text-sm text-gray-600 text-center">
          {left}% → {left + width}% (width: {width}%)
        </div>
      </div>
    );
  };

  // Two-handle range slider component for Y positioning
  const YPositionSlider = ({ section, onUpdate }: { section: SlideSection, onUpdate: (updates: Partial<SlideSection>) => void }) => {
    const handleStartChange = (value: number) => {
      const newStart = clamp(value, 0, section.yEnd - 1);
      onUpdate({ yStart: newStart });
    };

    const handleEndChange = (value: number) => {
      const newEnd = clamp(value, section.yStart + 1, 100);
      onUpdate({ yEnd: newEnd });
    };

    const top = Math.min(section.yStart, section.yEnd);
    const height = Math.max(section.yStart, section.yEnd) - top;

    return (
      <div className="space-y-2">
        <Label>Vertical Position (Top → Bottom)</Label>
        <div className="relative">
          {/* Track - vertical orientation */}
          <div className="w-6 h-24 bg-gray-200 rounded relative mx-auto">
            {/* Active span */}
            <div 
              className="absolute left-0 w-6 bg-green-500 rounded"
              style={{ top: `${top}%`, height: `${height}%` }}
            />
            {/* Start handle (top) */}
            <input
              type="range"
              min="0"
              max="99"
              value={section.yStart}
              onChange={(e) => handleStartChange(Number(e.target.value))}
              className="absolute left-0 w-6 h-24 opacity-0 cursor-pointer"
              style={{ zIndex: 2, transform: 'rotate(90deg)', transformOrigin: 'left top', width: '96px', left: '24px', top: '0px' }}
            />
            {/* End handle (bottom) */}
            <input
              type="range"
              min="1"
              max="100"
              value={section.yEnd}
              onChange={(e) => handleEndChange(Number(e.target.value))}
              className="absolute left-0 w-6 h-24 opacity-0 cursor-pointer"
              style={{ zIndex: 1, transform: 'rotate(90deg)', transformOrigin: 'left top', width: '96px', left: '24px', top: '0px' }}
            />
            {/* Handle indicators */}
            <div 
              className="absolute left-1 w-4 h-4 bg-white border-2 border-green-500 rounded-full"
              style={{ top: `calc(${section.yStart}% - 8px)` }}
            />
            <div 
              className="absolute left-1 w-4 h-4 bg-white border-2 border-green-700 rounded-full"
              style={{ top: `calc(${section.yEnd}% - 8px)` }}
            />
          </div>
        </div>
        <div className="text-sm text-gray-600 text-center">
          {top}% → {top + height}% (height: {height}%)
        </div>
      </div>
    );
  };

  // Reset section index when changing slides
  useEffect(() => {
    setCurrentSectionIndex(0);
  }, [currentSlideIndex]);

  // Preview mode navigation
  useEffect(() => {
    if (!isPreviewMode) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const currentSlideData = slides[currentSlideIndex];
      const sectionsCount = currentSlideData?.sections?.length || 0;
      
      if (e.key === 'ArrowLeft' && currentSlideIndex > 0) {
        setCurrentSlideIndex(currentSlideIndex - 1);
      } else if ((e.key === 'ArrowRight' || e.key === ' ') && currentSlideIndex < slides.length - 1) {
        setCurrentSlideIndex(currentSlideIndex + 1);
        e.preventDefault();
      } else if (e.key === 'ArrowUp' && sectionsCount > 0 && currentSectionIndex > 0) {
        setCurrentSectionIndex(currentSectionIndex - 1);
        e.preventDefault();
      } else if (e.key === 'ArrowDown' && sectionsCount > 0 && currentSectionIndex < sectionsCount - 1) {
        setCurrentSectionIndex(currentSectionIndex + 1);
        e.preventDefault();
      } else if (e.key === 'Escape') {
        setIsPreviewMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPreviewMode, currentSlideIndex, currentSectionIndex, slides.length, slides]);

  // Helper functions for overlay bands management
  const addOverlayBand = () => {
    if (!currentSlide) return;
    const newBand: OverlayBand = {
      id: `band-${Date.now()}`,
      xStart: 20,
      xEnd: 80,
      yStart: 30,
      yEnd: 70,
      color: '#000000',
      alpha: 0.5,
      zIndex: 1
    };
    const updatedBands = [...(currentSlide.overlayBands || []), newBand];
    updateSlide(currentSlide.id, { overlayBands: updatedBands });
  };

  const updateOverlayBand = (bandId: string, updates: Partial<OverlayBand>) => {
    if (!currentSlide) return;
    const updatedBands = (currentSlide.overlayBands || []).map(band =>
      band.id === bandId ? { ...band, ...updates } : band
    );
    updateSlide(currentSlide.id, { overlayBands: updatedBands });
  };

  // Mouse event handlers for drag and resize
  const handleBandMouseDown = (e: React.MouseEvent, bandId: string, handle?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!previewRef.current) return;
    
    const rect = previewRef.current.getBoundingClientRect();
    const band = currentSlide?.overlayBands?.find(b => b.id === bandId);
    if (!band) return;
    
    setSelectedBandId(bandId);
    
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const x = (clientX / rect.width) * 100;
    const y = (clientY / rect.height) * 100;
    
    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      setIsDragging(true);
    }
    
    setDragStart({
      x,
      y,
      bandXStart: band.xStart,
      bandYStart: band.yStart,
      bandXEnd: band.xEnd,
      bandYEnd: band.yEnd,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging && !isResizing) return;
    if (!dragStart || !selectedBandId || !previewRef.current) return;
    
    const rect = previewRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const x = Math.max(0, Math.min(100, (clientX / rect.width) * 100));
    const y = Math.max(0, Math.min(100, (clientY / rect.height) * 100));
    
    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;
    
    if (isDragging) {
      // Move the entire band while preserving size
      const bandWidth = Math.abs(dragStart.bandXEnd - dragStart.bandXStart);
      const bandHeight = Math.abs(dragStart.bandYEnd - dragStart.bandYStart);
      
      // Clamp delta to keep band within bounds
      const maxDeltaX = Math.min(deltaX, 100 - Math.max(dragStart.bandXStart, dragStart.bandXEnd));
      const minDeltaX = Math.max(deltaX, 0 - Math.min(dragStart.bandXStart, dragStart.bandXEnd));
      const clampedDeltaX = Math.max(minDeltaX, Math.min(maxDeltaX, deltaX));
      
      const maxDeltaY = Math.min(deltaY, 100 - Math.max(dragStart.bandYStart, dragStart.bandYEnd));
      const minDeltaY = Math.max(deltaY, 0 - Math.min(dragStart.bandYStart, dragStart.bandYEnd));
      const clampedDeltaY = Math.max(minDeltaY, Math.min(maxDeltaY, deltaY));
      
      const newXStart = dragStart.bandXStart + clampedDeltaX;
      const newYStart = dragStart.bandYStart + clampedDeltaY;
      const newXEnd = dragStart.bandXEnd + clampedDeltaX;
      const newYEnd = dragStart.bandYEnd + clampedDeltaY;
      
      updateOverlayBand(selectedBandId, {
        xStart: newXStart,
        yStart: newYStart,
        xEnd: newXEnd,
        yEnd: newYEnd,
      });
    } else if (isResizing && resizeHandle) {
      // Resize the band based on the handle with minimum size constraints
      let newXStart = dragStart.bandXStart;
      let newYStart = dragStart.bandYStart;
      let newXEnd = dragStart.bandXEnd;
      let newYEnd = dragStart.bandYEnd;
      
      const minSize = 2; // Minimum 2% size
      
      // Handle horizontal resizing
      if (resizeHandle.includes('w')) {
        newXStart = Math.max(0, Math.min(newXEnd - minSize, x));
      }
      if (resizeHandle.includes('e')) {
        newXEnd = Math.min(100, Math.max(newXStart + minSize, x));
      }
      
      // Handle vertical resizing
      if (resizeHandle.includes('n')) {
        newYStart = Math.max(0, Math.min(newYEnd - minSize, y));
      }
      if (resizeHandle.includes('s')) {
        newYEnd = Math.min(100, Math.max(newYStart + minSize, y));
      }
      
      updateOverlayBand(selectedBandId, {
        xStart: newXStart,
        yStart: newYStart,
        xEnd: newXEnd,
        yEnd: newYEnd,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setDragStart(null);
  };

  // Clear selection when clicking outside
  const handlePreviewClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedBandId(null);
    }
  };

  const deleteOverlayBand = (bandId: string) => {
    if (!currentSlide) return;
    const updatedBands = (currentSlide.overlayBands || []).filter(band => band.id !== bandId);
    updateSlide(currentSlide.id, { overlayBands: updatedBands });
  };

  // Helper function to render overlay bands
  const renderOverlayBands = (bands: OverlayBand[], isPreview: boolean = false) => {
    if (!bands || bands.length === 0) return null;
    
    return bands
      .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)) // Sort by z-index
      .map((band) => {
        const left = Math.min(band.xStart, band.xEnd);
        const width = Math.max(band.xStart, band.xEnd) - left;
        const top = Math.min(band.yStart, band.yEnd);
        const height = Math.max(band.yStart, band.yEnd) - top;
        const isSelected = selectedBandId === band.id;
        
        return (
          <div key={band.id} className="absolute">
            {/* Main band element */}
            <div
              className={`absolute cursor-move ${isSelected ? 'ring-2 ring-blue-400' : ''}`}
              style={{
                left: `${left}%`,
                width: `${width}%`,
                top: `${top}%`,
                height: `${height}%`,
                backgroundColor: band.color,
                opacity: band.alpha,
                zIndex: (band.zIndex || 0) + 10,
              }}
              onMouseDown={(e) => handleBandMouseDown(e, band.id)}
              data-testid={`overlay-band-${band.id}`}
            />
            
            {/* Resize handles (only show for selected band and in edit mode) */}
            {isSelected && !isPreviewMode && (
              <>
                {/* Corner handles */}
                <div
                  className="absolute w-3 h-3 bg-blue-500 border border-white cursor-nw-resize"
                  style={{
                    left: `calc(${left}% - 6px)`,
                    top: `calc(${top}% - 6px)`,
                    zIndex: (band.zIndex || 0) + 20,
                  }}
                  onMouseDown={(e) => handleBandMouseDown(e, band.id, 'nw')}
                  data-testid={`resize-handle-nw-${band.id}`}
                />
                <div
                  className="absolute w-3 h-3 bg-blue-500 border border-white cursor-ne-resize"
                  style={{
                    left: `calc(${left + width}% - 6px)`,
                    top: `calc(${top}% - 6px)`,
                    zIndex: (band.zIndex || 0) + 20,
                  }}
                  onMouseDown={(e) => handleBandMouseDown(e, band.id, 'ne')}
                  data-testid={`resize-handle-ne-${band.id}`}
                />
                <div
                  className="absolute w-3 h-3 bg-blue-500 border border-white cursor-sw-resize"
                  style={{
                    left: `calc(${left}% - 6px)`,
                    top: `calc(${top + height}% - 6px)`,
                    zIndex: (band.zIndex || 0) + 20,
                  }}
                  onMouseDown={(e) => handleBandMouseDown(e, band.id, 'sw')}
                  data-testid={`resize-handle-sw-${band.id}`}
                />
                <div
                  className="absolute w-3 h-3 bg-blue-500 border border-white cursor-se-resize"
                  style={{
                    left: `calc(${left + width}% - 6px)`,
                    top: `calc(${top + height}% - 6px)`,
                    zIndex: (band.zIndex || 0) + 20,
                  }}
                  onMouseDown={(e) => handleBandMouseDown(e, band.id, 'se')}
                  data-testid={`resize-handle-se-${band.id}`}
                />
                
                {/* Edge handles */}
                <div
                  className="absolute w-3 h-3 bg-blue-500 border border-white cursor-n-resize"
                  style={{
                    left: `calc(${left + width/2}% - 6px)`,
                    top: `calc(${top}% - 6px)`,
                    zIndex: (band.zIndex || 0) + 20,
                  }}
                  onMouseDown={(e) => handleBandMouseDown(e, band.id, 'n')}
                  data-testid={`resize-handle-n-${band.id}`}
                />
                <div
                  className="absolute w-3 h-3 bg-blue-500 border border-white cursor-s-resize"
                  style={{
                    left: `calc(${left + width/2}% - 6px)`,
                    top: `calc(${top + height}% - 6px)`,
                    zIndex: (band.zIndex || 0) + 20,
                  }}
                  onMouseDown={(e) => handleBandMouseDown(e, band.id, 's')}
                  data-testid={`resize-handle-s-${band.id}`}
                />
                <div
                  className="absolute w-3 h-3 bg-blue-500 border border-white cursor-w-resize"
                  style={{
                    left: `calc(${left}% - 6px)`,
                    top: `calc(${top + height/2}% - 6px)`,
                    zIndex: (band.zIndex || 0) + 20,
                  }}
                  onMouseDown={(e) => handleBandMouseDown(e, band.id, 'w')}
                  data-testid={`resize-handle-w-${band.id}`}
                />
                <div
                  className="absolute w-3 h-3 bg-blue-500 border border-white cursor-e-resize"
                  style={{
                    left: `calc(${left + width}% - 6px)`,
                    top: `calc(${top + height/2}% - 6px)`,
                    zIndex: (band.zIndex || 0) + 20,
                  }}
                  onMouseDown={(e) => handleBandMouseDown(e, band.id, 'e')}
                  data-testid={`resize-handle-e-${band.id}`}
                />
              </>
            )}
          </div>
        );
      });
  };

  // Render section content for preview
  const renderSection = (section: SlideSection, isPreview = false, isHighlighted = false) => {
    const left = Math.min(section.xStart, section.xEnd);
    const width = Math.max(section.xStart, section.xEnd) - left;
    const top = Math.min(section.yStart, section.yEnd);
    const height = Math.max(section.yStart, section.yEnd) - top;
    const slide = slides.find(s => s.sections?.some(sec => sec.id === section.id));
    const fontSizeScale = slide?.fontSizeScale || 1.0;
    const fontSizeRem = section.fontSize * fontSizeScale;
    
    // Generate transition CSS class
    const getTransitionClass = (transition: TransitionType | undefined) => {
      switch (transition) {
        case 'fade': return 'animate-fadeIn';
        case 'slide': return 'animate-slideInLeft';
        case 'zoom': return 'animate-zoomIn';
        case 'bounce': return 'animate-bounceIn';
        case 'flip': return 'animate-flipInX';
        case 'rotate': return 'animate-rotateIn';
        default: return '';
      }
    };
    
    return (
      <div
        key={section.id}
        className={`absolute ${getTransitionClass(section.transition)} ${
          isHighlighted && isPreview ? 'ring-2 ring-yellow-400 ring-opacity-80' : ''
        }`}
        style={{
          left: `${left}%`,
          width: `${width}%`,
          top: `${top}%`,
          height: `${height}%`,
          color: section.color,
          textAlign: section.align,
          fontFamily: FONT_STACKS[section.fontFamily],
          animationDelay: `${section.transitionDelay || 0}s`,
          backgroundColor: 'transparent',
          borderRadius: isHighlighted && isPreview ? '8px' : '0',
          boxShadow: isHighlighted && isPreview ? '0 0 20px rgba(255, 255, 0, 0.3)' : 'none',
          zIndex: 100, // Ensure text sections always render above overlay bands and handles
        }}
      >
        {section.heading && (
          <h3 style={{
            margin: '0 0 0.5rem 0',
            fontSize: `${(section.fontSize + 0.3) * fontSizeScale}rem`,
            fontWeight: 'bold',
            color: section.color,
          }}>
            {section.heading}
          </h3>
        )}
        <div style={{
          fontSize: `${fontSizeRem}rem`,
          lineHeight: '1.45',
          wordBreak: 'break-word',
          whiteSpace: 'pre-line',
        }}>
          {section.text}
        </div>
      </div>
    );
  };

  if (isPreviewMode) {
    const slide = slides[currentSlideIndex];
    const useSections = slide?.sections && slide.sections.length > 0;

    return (
      <div className="fixed inset-0 bg-black z-50">
        <div 
          className="w-full h-full relative flex items-center justify-center"
          style={{
            backgroundColor: slide?.backgroundColor || '#3B82F6',
            backgroundImage: slide?.imageUrl 
              ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('${slide.imageUrl}')` 
              : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Overlays */}
          {slide?.overlayType === 'horizontal' && (
            <div 
              className="absolute inset-0"
              style={{
                background: hexWithOpacity(slide.overlayColor || '#000000', slide.overlayOpacity || 0.5),
                top: '30%',
                bottom: '30%'
              }}
            />
          )}

          {/* Custom Overlay Bands */}
          {renderOverlayBands(slide?.overlayBands || [], true)}
          
          {slide?.overlayType === 'sides' && (
            <div 
              className="absolute inset-0"
              style={{
                background: `linear-gradient(90deg, 
                  ${hexWithOpacity(slide.overlayColor || '#000000', slide.overlayOpacity || 0.5)} 0%, 
                  transparent 33.33%, 
                  transparent 66.66%, 
                  ${hexWithOpacity(slide.overlayColor || '#000000', slide.overlayOpacity || 0.5)} 100%)`
              }}
            />
          )}
          
          {/* Content */}
          {useSections ? (
            slide.sections!.map((section, index) => renderSection(section, true, index === currentSectionIndex))
          ) : (
            <div className={`relative z-10 px-8 max-w-4xl ${
              slide?.textAlign === 'left' ? 'text-left' : 
              slide?.textAlign === 'right' ? 'text-right' : 'text-center'
            }`}>
              <h1 className="font-bold mb-6 text-white drop-shadow-lg" style={{
                fontSize: `${(slide?.titleSize || 3.5) * (slide?.fontSizeScale || 1.0)}rem`
              }}>
                {slide?.title}
              </h1>
              <p className="leading-relaxed text-white drop-shadow whitespace-pre-line" style={{
                fontSize: `${(slide?.bodySize || 1.4) * (slide?.fontSizeScale || 1.0)}rem`
              }}>
                {slide?.content}
              </p>
            </div>
          )}
        </div>
        
        {/* Navigation */}
        <div className="fixed bottom-6 left-6 text-white bg-black bg-opacity-70 px-4 py-2 rounded-lg text-sm">
          {currentSlideIndex + 1} / {slides.length}
          {useSections && slide.sections!.length > 0 && (
            <div className="text-xs mt-1 opacity-80">
              Section: {currentSectionIndex + 1} / {slide.sections!.length}
            </div>
          )}
        </div>
        
        <div className="fixed bottom-6 right-6 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
            disabled={currentSlideIndex === 0}
            className="bg-black bg-opacity-70 text-white hover:bg-opacity-90"
            data-testid="preview-prev-button"
          >
            ←
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
            disabled={currentSlideIndex === slides.length - 1}
            className="bg-black bg-opacity-70 text-white hover:bg-opacity-90"
            data-testid="preview-next-button"
          >
            →
          </Button>
          <Button
            size="sm"
            onClick={() => setIsPreviewMode(false)}
            className="bg-black bg-opacity-70 text-white hover:bg-opacity-90"
            data-testid="preview-exit-button"
          >
            Exit Preview
          </Button>
        </div>
        
        <div className="fixed top-6 right-6 text-white bg-black bg-opacity-70 px-3 py-2 rounded text-sm">
          ← → Space: slides • ↑ ↓: sections • Esc: exit
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Monitor className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Slide Generator</h1>
              <Input
                value={presentationTitle}
                onChange={(e) => setPresentationTitle(e.target.value)}
                className="mt-1 w-64 text-sm"
                placeholder="Presentation name"
                data-testid="presentation-title-input"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsPreviewMode(true)} data-testid="preview-button">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="import-export-button">
                  <FileUp className="h-4 w-4 mr-2" />
                  Import/Export
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import/Export</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Button onClick={exportSlides} className="w-full" data-testid="export-json-button">
                      <Download className="h-4 w-4 mr-2" />
                      Export JSON
                    </Button>
                  </div>
                  <div>
                    <Button onClick={exportHTML} className="w-full" data-testid="export-html-button">
                      <FileDown className="h-4 w-4 mr-2" />
                      Export HTML
                    </Button>
                  </div>
                  <div>
                    <Input
                      type="file"
                      accept=".json"
                      onChange={importSlides}
                      className="w-full"
                      data-testid="import-json-input"
                    />
                    <Label className="text-sm text-gray-600 mt-1">Import JSON</Label>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Slide List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Slides</span>
                  <Button onClick={addSlide} size="sm" data-testid="add-slide-button">
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-2 p-4">
                  {slides.map((slide, index) => (
                    <div
                      key={slide.id}
                      className={`p-3 border rounded cursor-pointer ${
                        index === currentSlideIndex ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => setCurrentSlideIndex(index)}
                      data-testid={`slide-item-${index}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{index + 1}. {slide.title}</span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveSlide(slide.id, 'up');
                            }}
                            disabled={index === 0}
                            data-testid={`move-slide-up-${index}`}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveSlide(slide.id, 'down');
                            }}
                            disabled={index === slides.length - 1}
                            data-testid={`move-slide-down-${index}`}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSlide(slide.id);
                            }}
                            data-testid={`delete-slide-${index}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {slide.sections && slide.sections.length > 0 
                          ? `${slide.sections.length} section(s)`
                          : 'Legacy mode'
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Editor */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Editing - Slide {currentSlideIndex + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Basic slide properties */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="slide-title">Title</Label>
                    <Input
                      id="slide-title"
                      value={currentSlide?.title || ''}
                      onChange={(e) => updateSlide(currentSlide.id, { title: e.target.value })}
                      data-testid="slide-title-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="slide-type">Type</Label>
                    <select
                      id="slide-type"
                      value={currentSlide?.type || 'content'}
                      onChange={(e) => updateSlide(currentSlide.id, { type: e.target.value as SlideType })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      data-testid="slide-type-select"
                    >
                      <option value="title">Title</option>
                      <option value="content">Content</option>
                      <option value="image">Image</option>
                    </select>
                  </div>
                </div>

                {/* Legacy content (backward compatibility) */}
                <div>
                  <Label htmlFor="slide-content">Legacy Content (shown if no sections)</Label>
                  <Textarea
                    id="slide-content"
                    value={currentSlide?.content || ''}
                    onChange={(e) => updateSlide(currentSlide.id, { content: e.target.value })}
                    rows={3}
                    data-testid="slide-content-textarea"
                  />
                </div>

                {/* Background and colors */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bg-color">Background Color</Label>
                    <Input
                      id="bg-color"
                      type="color"
                      value={currentSlide?.backgroundColor || '#3B82F6'}
                      onChange={(e) => updateSlide(currentSlide.id, { backgroundColor: e.target.value })}
                      data-testid="background-color-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="text-color">Legacy Text Color</Label>
                    <Input
                      id="text-color"
                      type="color"
                      value={currentSlide?.textColor || '#ffffff'}
                      onChange={(e) => updateSlide(currentSlide.id, { textColor: e.target.value })}
                      data-testid="text-color-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="font-scale">Font Size Scale</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        id="font-scale"
                        type="range"
                        min="0.5"
                        max="3.0"
                        step="0.1"
                        value={currentSlide?.fontSizeScale || 1.0}
                        onChange={(e) => updateSlide(currentSlide.id, { fontSizeScale: parseFloat(e.target.value) })}
                        className="flex-1"
                        data-testid="font-scale-slider"
                      />
                      <span className="text-sm text-gray-600 min-w-[2.5rem]">
                        {(currentSlide?.fontSizeScale || 1.0).toFixed(1)}x
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Contrast</Label>
                    <div className={`flex items-center gap-2 text-sm ${contrastWarning.warn ? 'text-red-600' : 'text-green-600'}`}>
                      {contrastWarning.warn && <AlertTriangle className="h-4 w-4" />}
                      Ratio: {contrastWarning.ratio.toFixed(1)}
                    </div>
                  </div>
                </div>

                {/* Overlay Bands Management */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Overlay Bands</Label>
                    <Button onClick={addOverlayBand} size="sm" variant="outline" data-testid="add-overlay-band-button">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Band
                    </Button>
                  </div>
                  
                  {currentSlide?.overlayBands && currentSlide.overlayBands.length > 0 && (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {currentSlide.overlayBands.map((band, index) => (
                        <div key={band.id} className="p-3 border rounded-lg bg-gray-50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Band {index + 1}</span>
                            <Button 
                              onClick={() => deleteOverlayBand(band.id)} 
                              size="sm" 
                              variant="outline"
                              className="h-6 w-6 p-0"
                              data-testid={`delete-band-${band.id}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          {/* Position controls */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">X Start (%)</Label>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={band.xStart}
                                onChange={(e) => updateOverlayBand(band.id, { xStart: parseInt(e.target.value) })}
                                className="w-full"
                                data-testid={`band-x-start-${band.id}`}
                              />
                              <span className="text-xs text-gray-600">{band.xStart}%</span>
                            </div>
                            <div>
                              <Label className="text-xs">X End (%)</Label>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={band.xEnd}
                                onChange={(e) => updateOverlayBand(band.id, { xEnd: parseInt(e.target.value) })}
                                className="w-full"
                                data-testid={`band-x-end-${band.id}`}
                              />
                              <span className="text-xs text-gray-600">{band.xEnd}%</span>
                            </div>
                            <div>
                              <Label className="text-xs">Y Start (%)</Label>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={band.yStart}
                                onChange={(e) => updateOverlayBand(band.id, { yStart: parseInt(e.target.value) })}
                                className="w-full"
                                data-testid={`band-y-start-${band.id}`}
                              />
                              <span className="text-xs text-gray-600">{band.yStart}%</span>
                            </div>
                            <div>
                              <Label className="text-xs">Y End (%)</Label>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={band.yEnd}
                                onChange={(e) => updateOverlayBand(band.id, { yEnd: parseInt(e.target.value) })}
                                className="w-full"
                                data-testid={`band-y-end-${band.id}`}
                              />
                              <span className="text-xs text-gray-600">{band.yEnd}%</span>
                            </div>
                          </div>
                          
                          {/* Color and alpha controls */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label className="text-xs">Color</Label>
                              <input
                                type="color"
                                value={band.color}
                                onChange={(e) => updateOverlayBand(band.id, { color: e.target.value })}
                                className="w-full h-8 border rounded"
                                data-testid={`band-color-${band.id}`}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Alpha</Label>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={band.alpha}
                                onChange={(e) => updateOverlayBand(band.id, { alpha: parseFloat(e.target.value) })}
                                className="w-full"
                                data-testid={`band-alpha-${band.id}`}
                              />
                              <span className="text-xs text-gray-600">{band.alpha}</span>
                            </div>
                            <div>
                              <Label className="text-xs">Z-Index</Label>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                value={band.zIndex || 1}
                                onChange={(e) => updateOverlayBand(band.id, { zIndex: parseInt(e.target.value) || 1 })}
                                className="w-full h-8 px-2 border rounded"
                                data-testid={`band-z-index-${band.id}`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {(!currentSlide?.overlayBands || currentSlide.overlayBands.length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No overlay bands. Click "Add Band" to create movable, resizable background elements.
                    </p>
                  )}
                </div>

                {/* Image settings */}
                <div>
                  <Label>Background Image</Label>
                  <div className="flex gap-2 mt-2">
                    <Dialog open={showImageSearch} onOpenChange={setShowImageSearch}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" data-testid="search-images-button">
                          <Search className="h-4 w-4 mr-2" />
                          Search Images
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>Search Creative Commons Images</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                          
                          {/* Commercial Use Info */}
                          <CommercialUseInfo />
                          
                          {/* Search Filters */}
                          <SearchFilters 
                            selectedLicenses={selectedLicenses}
                            selectedSources={selectedSources}
                            onLicenseChange={handleLicenseChange}
                            onSourceChange={handleSourceChange}
                          />
                          
                          {/* Search Input */}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Search for images (e.g., nature, technology, education)"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="flex-1"
                              data-testid="image-search-input"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  // The query will automatically trigger due to useQuery
                                }
                              }}
                            />
                            <Button 
                              onClick={() => {
                                // Force refresh by slightly changing the query
                                setSearchQuery(prev => prev + ' ');
                                setSearchQuery(prev => prev.trim());
                              }}
                              disabled={!searchQuery.trim() || searching}
                              data-testid="search-submit-button"
                            >
                              {searching ? 'Searching...' : 'Search'}
                            </Button>
                          </div>
                          
                          {/* Results */}
                          <div className="max-h-96 overflow-y-auto">
                            <ImageGrid 
                              images={images}
                              isLoading={searching}
                              onImageClick={selectImage}
                              onToggleFavorite={() => {}} // Not implementing favorites in slide maker
                              favorites={new Set()}
                            />
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} data-testid="upload-image-button">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    
                    {currentSlide?.imageUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateSlide(currentSlide.id, { imageUrl: '', imageSource: undefined })}
                        data-testid="remove-image-button"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  
                  {/* Image attribution display */}
                  {currentSlide?.imageSource && (
                    <div className="mt-2 p-3 bg-gray-100 rounded text-sm">
                      <div className="font-medium">Image Attribution:</div>
                      <div>Title: {currentSlide.imageSource.title}</div>
                      <div>Author: {currentSlide.imageSource.author}</div>
                      <div>Source: {getSourceDisplayName(currentSlide.imageSource.source)}</div>
                      <div>License: {currentSlide.imageSource.license}</div>
                      <div>
                        <a 
                          href={currentSlide.imageSource.imageUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View Source →
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sections Management */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Text Sections</h3>
                    <Button onClick={() => addSection(currentSlide.id)} size="sm" data-testid="add-section-button">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Section
                    </Button>
                  </div>
                  
                  {currentSlide?.sections && currentSlide.sections.length > 0 ? (
                    <div className="space-y-4">
                      {currentSlide.sections.map((section, sectionIndex) => (
                        <Card key={section.id} className={sectionIndex === currentSectionIndex ? 'border-blue-500' : ''}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center justify-between">
                              <span>Section {sectionIndex + 1}</span>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setCurrentSectionIndex(sectionIndex)}
                                  className={sectionIndex === currentSectionIndex ? 'bg-blue-100' : ''}
                                  data-testid={`select-section-${sectionIndex}`}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteSection(currentSlide.id, section.id)}
                                  data-testid={`delete-section-${sectionIndex}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            
                            {/* Text Content */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Heading (optional)</Label>
                                <Input
                                  value={section.heading || ''}
                                  onChange={(e) => updateSection(currentSlide.id, section.id, { heading: e.target.value })}
                                  placeholder="Section heading"
                                  data-testid={`section-heading-${sectionIndex}`}
                                />
                              </div>
                              <div>
                                <Label>Font Family</Label>
                                <select
                                  value={section.fontFamily}
                                  onChange={(e) => updateSection(currentSlide.id, section.id, { fontFamily: e.target.value as FontFamily })}
                                  className="w-full p-2 border border-gray-300 rounded-md"
                                  data-testid={`section-font-${sectionIndex}`}
                                >
                                  <option value="system">System</option>
                                  <option value="serif">Serif</option>
                                  <option value="mono">Monospace</option>
                                  <option value="display">Display</option>
                                  <option value="hand">Handwriting</option>
                                </select>
                              </div>
                            </div>
                            
                            <div>
                              <Label>Text Content</Label>
                              <Textarea
                                value={section.text}
                                onChange={(e) => updateSection(currentSlide.id, section.id, { text: e.target.value })}
                                rows={3}
                                placeholder="Section text content"
                                data-testid={`section-text-${sectionIndex}`}
                              />
                            </div>
                            
                            {/* Styling */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                <Label>Font Size (rem)</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0.5"
                                  max="5"
                                  value={section.fontSize}
                                  onChange={(e) => updateSection(currentSlide.id, section.id, { fontSize: parseFloat(e.target.value) })}
                                  data-testid={`section-font-size-${sectionIndex}`}
                                />
                              </div>
                              <div>
                                <Label>Text Color</Label>
                                <Input
                                  type="color"
                                  value={section.color}
                                  onChange={(e) => updateSection(currentSlide.id, section.id, { color: e.target.value })}
                                  data-testid={`section-color-${sectionIndex}`}
                                />
                              </div>
                              <div>
                                <Label>Alignment</Label>
                                <select
                                  value={section.align}
                                  onChange={(e) => updateSection(currentSlide.id, section.id, { align: e.target.value as TextAlign })}
                                  className="w-full p-2 border border-gray-300 rounded-md"
                                  data-testid={`section-align-${sectionIndex}`}
                                >
                                  <option value="left">Left</option>
                                  <option value="center">Center</option>
                                  <option value="right">Right</option>
                                </select>
                              </div>
                              <div>
                                <Label>Transition</Label>
                                <select
                                  value={section.transition || 'none'}
                                  onChange={(e) => updateSection(currentSlide.id, section.id, { transition: e.target.value as TransitionType })}
                                  className="w-full p-2 border border-gray-300 rounded-md"
                                  data-testid={`section-transition-${sectionIndex}`}
                                >
                                  <option value="none">None</option>
                                  <option value="fade">Fade</option>
                                  <option value="slide">Slide</option>
                                  <option value="zoom">Zoom</option>
                                  <option value="bounce">Bounce</option>
                                </select>
                              </div>
                            </div>
                            
                            {/* Positioning */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <XPositionSlider 
                                section={section}
                                onUpdate={(updates) => updateSection(currentSlide.id, section.id, updates)}
                              />
                              <YPositionSlider 
                                section={section}
                                onUpdate={(updates) => updateSection(currentSlide.id, section.id, updates)}
                              />
                            </div>
                            
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No sections added. Add a section to start editing text content with precise positioning.</p>
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  ref={previewRef}
                  className="aspect-video bg-gray-100 border rounded-lg relative overflow-hidden"
                  style={{
                    backgroundColor: currentSlide?.backgroundColor || '#3B82F6',
                    backgroundImage: currentSlide?.imageUrl 
                      ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('${currentSlide.imageUrl}')` 
                      : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onClick={handlePreviewClick}
                >
                  {/* Overlays */}
                  {currentSlide?.overlayType === 'horizontal' && (
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: hexWithOpacity(currentSlide.overlayColor || '#000000', currentSlide.overlayOpacity || 0.5),
                        top: '30%',
                        bottom: '30%'
                      }}
                    />
                  )}

                  {/* Custom Overlay Bands */}
                  {renderOverlayBands(currentSlide?.overlayBands || [], true)}
                  
                  {currentSlide?.overlayType === 'sides' && (
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(90deg, 
                          ${hexWithOpacity(currentSlide.overlayColor || '#000000', currentSlide.overlayOpacity || 0.5)} 0%, 
                          transparent 33.33%, 
                          transparent 66.66%, 
                          ${hexWithOpacity(currentSlide.overlayColor || '#000000', currentSlide.overlayOpacity || 0.5)} 100%)`
                      }}
                    />
                  )}
                  
                  {/* Content */}
                  {currentSlide?.sections && currentSlide.sections.length > 0 ? (
                    currentSlide.sections.map(section => renderSection(section))
                  ) : (
                    <div className={`relative z-10 px-4 max-w-sm ${
                      currentSlide?.textAlign === 'left' ? 'text-left' : 
                      currentSlide?.textAlign === 'right' ? 'text-right' : 'text-center'
                    }`}>
                      <h2 className="font-bold mb-4 text-white drop-shadow-lg text-xl">
                        {currentSlide?.title}
                      </h2>
                      <p className="text-sm leading-relaxed text-white drop-shadow whitespace-pre-line">
                        {currentSlide?.content}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 text-center">
                  <Button
                    onClick={() => setIsPreviewMode(true)}
                    className="w-full"
                    data-testid="fullscreen-preview-button"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Full Screen Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}