import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { CommercialUseInfo } from "@/components/commercial-use-info";
import { SearchFilters } from "@/components/search-filters";
import { ImageGrid } from "@/components/image-grid";
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
} from "lucide-react";

/**
 * Enhanced Class Slides Generator with Creative Commons Image Integration
 * - Multi-source image search (Wikimedia, Pixabay, Unsplash, Pexels, OpenClipart)
 * - Commercial use guidance for slideshow selling
 * - Proper attribution and hot linking to original sources
 * - Per-slide multi sections (multiple text boxes per slide)
 * - HTML export with proper citations
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

interface Slide {
  id: string;
  title: string;
  content: string; // legacy single block
  type: SlideType;
  imageUrl?: string;
  imageSource?: SearchResult; // Use our SearchResult for complete attribution
  backgroundColor?: string;
  textColor?: string; // legacy color for title/content
  overlayType?: OverlayType;
  overlayColor?: string;
  overlayOpacity?: number; // 0..1
  overlayTransition?: TransitionType;
  textAlign?: TextAlign;   // legacy
  titleSize?: number; // rem
  bodySize?: number;  // rem
  sections?: SlideSection[]; // NEW
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
    title: "Welcome to Your Presentation",
    content: "Create amazing slideshows with Creative Commons images\nthat you can use commercially!",
    type: "title",
    backgroundColor: "#3B82F6",
    textColor: "#ffffff",
    overlayType: "horizontal",
    overlayColor: "#000000",
    overlayOpacity: 0.6,
    overlayTransition: "slide",
    textAlign: "center",
    titleSize: 3.5,
    bodySize: 1.4,
    sections: [
      {
        id: "s-1",
        heading: "Welcome to Your Presentation",
        text: "Create amazing slideshows with Creative Commons images\nthat you can use commercially!",
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
    content: `🖼️ Search 5 image sources\n📜 Proper attribution\n💼 Commercial use guidance\n🎨 Custom styling\n📤 HTML export`,
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
    sections: [
      {
        id: "s-2a",
        heading: "Features",
        text: `🖼️ Search 5 image sources\n📜 Proper attribution\n💼 Commercial use guidance\n🎨 Custom styling\n📤 HTML export`,
        xStart: 10,
        xEnd: 90,
        yStart: 20,
        yEnd: 80,
        fontFamily: "system",
        fontSize: 1.3,
        color: "#ffffff",
        align: "left",
        transition: "slide",
        transitionDelay: 0.3,
      },
    ],
  },
];

export default function SlideMaker() {
  const [presentationTitle, setPresentationTitle] = useState("My Presentation");
  const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<ImageSource[]>([]);
  const [directImageUrl, setDirectImageUrl] = useState<string>("");
  const [loadingDirectImage, setLoadingDirectImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const currentSlide = slides[currentSlideIndex];

  // Search for images using our existing API
  const licensesParam = [...selectedLicenses].sort().join(",");
  const sourcesParam = [...selectedSources].sort().join(",");
  const searchUrl = `/api/search?q=${encodeURIComponent(searchQuery)}&licenses=${licensesParam}&sources=${sourcesParam}&limit=20&offset=0`;
  
  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: [searchUrl],
    enabled: !!searchQuery.trim(),
    staleTime: 30 * 1000, // Cache for 30 seconds to allow filter changes
  });

  const images = (searchResults as any)?.results || [];

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
        toast({ title: "Cannot delete", description: "Must have at least one slide.", variant: "destructive" });
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

  // Image selection from search results
  const selectImage = (image: SearchResult) => {
    updateSlide(currentSlide.id, { 
      imageUrl: image.imageUrl, 
      imageSource: image 
    });
    setShowImageSearch(false);
    toast({ 
      title: "Image added", 
      description: `From ${getSourceDisplayName(image.source)} - ${getCommercialUseStatus(image) ? 'Commercial use allowed' : 'Check license terms'}`,
      variant: "default" 
    });
  };

  // Generate citations for all images used
  const generateCitations = () => {
    const citations: string[] = [];
    slides.forEach((slide, index) => {
      if (slide.imageSource) {
        const img = slide.imageSource;
        const sourceDisplay = getSourceDisplayName(img.source);
        let citation = '';
        
        switch (img.source) {
          case 'wikimedia':
            citation = `"${img.title}." ${sourceDisplay}${img.author ? `, by ${img.author}` : ''}. Web. ${new Date().toLocaleDateString()}. <${img.sourceUrl}>.`;
            break;
          case 'unsplash':
          case 'pexels':
          case 'pixabay':
            citation = `${img.author || 'Unknown'}. "${img.title}." ${sourceDisplay}. Web. ${new Date().toLocaleDateString()}. <${img.sourceUrl}>.`;
            break;
          case 'openclipart':
            citation = `"${img.title}." ${sourceDisplay}. Public Domain. Web. ${new Date().toLocaleDateString()}. <${img.sourceUrl}>.`;
            break;
          default:
            citation = `"${img.title}." ${sourceDisplay}. ${img.license}. Web. ${new Date().toLocaleDateString()}. <${img.sourceUrl}>.`;
        }
        
        if (citation) {
          citations.push(`${index + 1}. ${citation}`);
        }
      }
    });
    return citations;
  };

  // Filter change handlers
  const handleLicenseChange = (licenses: string[]) => {
    setSelectedLicenses(licenses);
  };

  const handleSourceChange = (sources: ImageSource[]) => {
    setSelectedSources(sources);
  };

  // File upload handling
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        const imageSource: SearchResult = {
          id: Date.now().toString(),
          title: file.name.replace(/\.[^/.]+$/, ""),
          imageUrl,
          thumbnailUrl: imageUrl,
          author: 'User Upload',
          license: 'Personal Use',
          source: 'upload' as any,
          sourceUrl: imageUrl,
          attribution: `"${file.name}" - Personal Upload`
        };
        updateSlide(currentSlide.id, { imageUrl, imageSource });
      };
      reader.readAsDataURL(file);
    }
  };

  // Export/Import functions
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
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.slides && Array.isArray(data.slides)) {
          setSlides(data.slides);
          setPresentationTitle(data.title || "Imported Presentation");
          setCurrentSlideIndex(0);
          toast({ title: "Import successful", description: "Presentation imported successfully." });
        } else {
          throw new Error("Invalid format");
        }
      } catch (error) {
        toast({ title: "Import error", description: "Invalid JSON file.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  const exportHTML = () => {
    const fontStacksCSS = Object.entries(FONT_STACKS)
      .map(([key, stack]) => `.font-${key} { font-family: ${stack}; }`)
      .join('\n        ');

    const slidesHTML = slides.map((slide, index) => {
      // Use sections if available, otherwise legacy content
      const useSections = slide.sections && slide.sections.length > 0;
      
      let contentHTML = '';
      
      if (useSections) {
        contentHTML = slide.sections!.map(section => {
          const left = Math.min(section.xStart, section.xEnd);
          const width = Math.max(section.xStart, section.xEnd) - left;
          const top = Math.min(section.yStart, section.yEnd);
          const height = Math.max(section.yStart, section.yEnd) - top;
          const fontSizePx = Math.round(section.fontSize * 16);
          
          const getAnimationClass = (transition: TransitionType | undefined) => {
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
          
          const animationClass = getAnimationClass(section.transition);
          const animationDelay = section.transitionDelay ? `animation-delay: ${section.transitionDelay}s;` : '';
          
          const headingHTML = section.heading 
            ? `<h3 style="margin: 0 0 0.5rem 0; font-size: ${fontSizePx + 4}px; color: ${section.color};">${section.heading}</h3>`
            : '';
          
          return `
            <section class="sec ${animationClass}" style="position:absolute; left:${left}%; width:${width}%; top:${top}%; height:${height}%; color:${section.color}; text-align:${section.align}; font-family:${FONT_STACKS[section.fontFamily]}; ${animationDelay}">
              ${headingHTML}
              <div style="font-size:${fontSizePx}px; line-height:1.45; word-break:break-word; white-space: pre-line;">${section.text}</div>
            </section>`;
        }).join('');
      } else {
        // Legacy rendering
        const alignClass = slide.textAlign === 'left' ? 'text-left' : slide.textAlign === 'right' ? 'text-right' : 'text-center';
        contentHTML = `
          <div class="relative z-10 px-8 max-w-4xl ${alignClass}">
            <h1 class="font-bold mb-6 text-white drop-shadow-lg text-5xl">${slide.title}</h1>
            <p class="text-xl leading-relaxed text-white drop-shadow whitespace-pre-line">${slide.content}</p>
          </div>`;
      }

      const getOverlayAnimationClass = (transition: TransitionType | undefined) => {
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
      
      const overlayAnimationClass = getOverlayAnimationClass(slide.overlayTransition);
      
      const overlayHTML = slide.overlayType === 'horizontal' ? `
        <div class="${overlayAnimationClass}" style="position: absolute; inset: 0; background: ${hexWithOpacity(slide.overlayColor || '#000000', slide.overlayOpacity || 0.5)}; top: 30%; bottom: 30%;"></div>
      ` : slide.overlayType === 'sides' ? `
        <div class="${overlayAnimationClass}" style="position: absolute; inset: 0; background: linear-gradient(90deg, ${hexWithOpacity(slide.overlayColor || '#000000', slide.overlayOpacity || 0.5)} 0%, transparent 33.33%, transparent 66.66%, ${hexWithOpacity(slide.overlayColor || '#000000', slide.overlayOpacity || 0.5)} 100%);"></div>
      ` : '';

      return `
        <div class="slide" style="
          width: 100vw; height: 100vh; position: relative; display: flex; align-items: center; justify-content: center;
          background: ${slide.imageUrl ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('${slide.imageUrl}')` : slide.backgroundColor || '#3B82F6'};
          background-size: cover; background-position: center;
        ">
          ${overlayHTML}
          ${contentHTML}
        </div>`;
    }).join('');

    // Generate citations page
    const citations = generateCitations();
    const citationsPage = citations.length > 0 ? `
      <div class="slide citations" style="
        width: 100vw; height: 100vh; position: relative; display: flex; align-items: flex-start; justify-content: center;
        background: #f8f9fa; padding: 60px 40px; box-sizing: border-box;
      ">
        <div style="max-width: 800px; width: 100%;">
          <h1 style="color: #2c3e50; margin-bottom: 40px; font-size: 2.5rem; text-align: center;">Image Sources & Attribution</h1>
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            ${citations.map(citation => `<p style="margin: 15px 0; line-height: 1.6; color: #2c3e50; font-size: 1.1rem;">${citation}</p>`).join('')}
          </div>
          <p style="text-align: center; margin-top: 30px; color: #666; font-style: italic;">All images used in this presentation are properly attributed according to their respective licenses.</p>
        </div>
      </div>` : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${presentationTitle}</title>
  <style>
    body {
      margin: 0;
      font-family: system-ui, -apple-system, sans-serif;
      overflow: hidden;
    }
    .slide {
      display: flex;
      opacity: 0;
      position: absolute;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      transition: opacity 0.8s ease-in-out, transform 0.8s ease;
      transform: translateX(100%);
      pointer-events: none;
      z-index: 0;
    }
    .slide.active {
      opacity: 1;
      transform: translateX(0);
      pointer-events: auto;
      z-index: 1;
    }
    .slide.prev {
      transform: translateX(-100%);
    }
    ${fontStacksCSS}
    .text-left { text-align: left; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    
    /* Animation CSS */
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideInLeft {
      from { transform: translateX(-100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes zoomIn {
      from { transform: scale(0); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    
    @keyframes bounceIn {
      0% { transform: scale(0.3); opacity: 0; }
      50% { transform: scale(1.05); opacity: 0.8; }
      70% { transform: scale(0.9); opacity: 0.9; }
      100% { transform: scale(1); opacity: 1; }
    }
    
    @keyframes flipInX {
      from { transform: perspective(400px) rotateX(90deg); opacity: 0; }
      40% { transform: perspective(400px) rotateX(-20deg); }
      60% { transform: perspective(400px) rotateX(10deg); opacity: 1; }
      80% { transform: perspective(400px) rotateX(-5deg); }
      to { transform: perspective(400px) rotateX(0deg); opacity: 1; }
    }
    
    @keyframes rotateIn {
      from { transform: rotate(-200deg); opacity: 0; }
      to { transform: rotate(0deg); opacity: 1; }
    }
    
    .animate-fadeIn {
      animation: fadeIn 1s ease-out forwards;
    }
    
    .animate-slideInLeft {
      animation: slideInLeft 1s ease-out forwards;
    }
    
    .animate-zoomIn {
      animation: zoomIn 0.8s ease-out forwards;
    }
    
    .animate-bounceIn {
      animation: bounceIn 1.2s ease-out forwards;
    }
    
    .animate-flipInX {
      animation: flipInX 1s ease-out forwards;
    }
    
    .animate-rotateIn {
      animation: rotateIn 1s ease-out forwards;
    }
  </style>
</head>
<body>
  ${slidesHTML}
  ${citationsPage}
  
  <div style="position: fixed; bottom: 20px; left: 20px; z-index: 1000; color: white; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px; font-size: 14px;">
    <span id="slideNumber">1</span> / <span id="totalSlides">${slides.length + (citations.length > 0 ? 1 : 0)}</span>
  </div>
  
  <script>
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const slideNumber = document.getElementById('slideNumber');
    const totalSlides = document.getElementById('totalSlides');
    
    function showSlide(n) {
      const prevSlide = currentSlide;
      
      slides.forEach((slide, i) => {
        slide.classList.remove('active', 'prev');
        if (i === n) {
          slide.classList.add('active');
        } else if (i === prevSlide && i < n) {
          slide.classList.add('prev');
        }
      });
      
      if (slides[n]) {
        slideNumber.textContent = n + 1;
        
        // Special styling for citations page
        if (slides[n].classList.contains('citations')) {
          document.body.style.overflow = 'auto';
        } else {
          document.body.style.overflow = 'hidden';
        }
      }
    }
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' && currentSlide > 0) {
        currentSlide--;
        showSlide(currentSlide);
      } else if ((e.key === 'ArrowRight' || e.key === ' ') && currentSlide < slides.length - 1) {
        currentSlide++;
        showSlide(currentSlide);
        e.preventDefault();
      }
    });
    
    // Initialize first slide
    setTimeout(() => showSlide(0), 100);
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
          <div className="h-6 bg-gray-200 rounded relative">
            <div 
              className="absolute top-0 h-6 bg-blue-500 rounded"
              style={{ left: `${left}%`, width: `${width}%` }}
            />
            <input
              type="range"
              min="0"
              max="99"
              value={section.xStart}
              onChange={(e) => handleStartChange(Number(e.target.value))}
              className="absolute top-0 w-full h-6 opacity-0 cursor-pointer"
              style={{ zIndex: 2 }}
            />
            <input
              type="range"
              min="1"
              max="100"
              value={section.xEnd}
              onChange={(e) => handleEndChange(Number(e.target.value))}
              className="absolute top-0 w-full h-6 opacity-0 cursor-pointer"
              style={{ zIndex: 1 }}
            />
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
          <div className="w-6 h-24 bg-gray-200 rounded relative mx-auto">
            <div 
              className="absolute left-0 w-6 bg-green-500 rounded"
              style={{ top: `${top}%`, height: `${height}%` }}
            />
            <input
              type="range"
              min="0"
              max="99"
              value={section.yStart}
              onChange={(e) => handleStartChange(Number(e.target.value))}
              className="absolute left-0 w-6 h-24 opacity-0 cursor-pointer"
              style={{ zIndex: 2, transform: 'rotate(90deg)', transformOrigin: 'left top', width: '96px', left: '24px', top: '0px' }}
            />
            <input
              type="range"
              min="1"
              max="100"
              value={section.yEnd}
              onChange={(e) => handleEndChange(Number(e.target.value))}
              className="absolute left-0 w-6 h-24 opacity-0 cursor-pointer"
              style={{ zIndex: 1, transform: 'rotate(90deg)', transformOrigin: 'left top', width: '96px', left: '24px', top: '0px' }}
            />
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

  if (isPreviewMode) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <div className="absolute top-4 right-4 z-50">
          <Button
            onClick={() => setIsPreviewMode(false)}
            variant="secondary"
            size="sm"
            data-testid="exit-preview"
          >
            <Eye className="h-4 w-4 mr-2" />
            Exit Preview
          </Button>
        </div>
        
        <div className="absolute bottom-4 left-4 z-50 text-white bg-black/70 px-3 py-2 rounded">
          <span>{currentSlideIndex + 1}</span> / <span>{slides.length}</span>
        </div>
        
        <div className="absolute bottom-4 right-4 z-50 space-x-2">
          <Button
            onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
            disabled={currentSlideIndex === 0}
            variant="secondary"
            size="sm"
            data-testid="prev-slide"
          >
            ←
          </Button>
          <Button
            onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
            disabled={currentSlideIndex === slides.length - 1}
            variant="secondary"
            size="sm"
            data-testid="next-slide"
          >
            →
          </Button>
        </div>
        
        <div 
          className="w-full h-full flex items-center justify-center relative"
          style={{
            background: currentSlide?.imageUrl 
              ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('${currentSlide.imageUrl}')` 
              : currentSlide?.backgroundColor || '#3B82F6',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
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
          
          {currentSlide?.overlayType === 'sides' && (
            <div 
              className="absolute inset-0"
              style={{
                background: `linear-gradient(90deg, ${hexWithOpacity(currentSlide.overlayColor || '#000000', currentSlide.overlayOpacity || 0.5)} 0%, transparent 33.33%, transparent 66.66%, ${hexWithOpacity(currentSlide.overlayColor || '#000000', currentSlide.overlayOpacity || 0.5)} 100%)`
              }}
            />
          )}
          
          {/* Content - Sections or Legacy */}
          {currentSlide?.sections && currentSlide.sections.length > 0 ? (
            currentSlide.sections.map(section => {
              const left = Math.min(section.xStart, section.xEnd);
              const width = Math.max(section.xStart, section.xEnd) - left;
              const top = Math.min(section.yStart, section.yEnd);
              const height = Math.max(section.yStart, section.yEnd) - top;
              
              return (
                <div 
                  key={section.id}
                  className="absolute"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    top: `${top}%`,
                    height: `${height}%`,
                    color: section.color,
                    textAlign: section.align,
                    fontFamily: FONT_STACKS[section.fontFamily],
                    fontSize: `${section.fontSize}rem`,
                    lineHeight: '1.45'
                  }}
                >
                  {section.heading && (
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: `${section.fontSize + 0.3}rem` }}>
                      {section.heading}
                    </h3>
                  )}
                  <div style={{ whiteSpace: 'pre-line' }}>
                    {section.text}
                  </div>
                </div>
              );
            })
          ) : (
            <div className={`relative z-10 px-8 max-w-4xl text-${currentSlide?.textAlign || 'center'}`}>
              <h1 className="font-bold mb-6 text-white drop-shadow-lg" style={{ fontSize: `${currentSlide?.titleSize || 3.5}rem` }}>
                {currentSlide?.title}
              </h1>
              <p className="leading-relaxed text-white drop-shadow whitespace-pre-line" style={{ fontSize: `${currentSlide?.bodySize || 1.4}rem` }}>
                {currentSlide?.content}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Input
              value={presentationTitle}
              onChange={(e) => setPresentationTitle(e.target.value)}
              className="text-xl font-bold max-w-md"
              data-testid="presentation-title"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setIsPreviewMode(true)}
              variant="default"
              size="sm"
              data-testid="preview-button"
            >
              <Monitor className="h-4 w-4 mr-2" />
              Preview
            </Button>
            
            <Button
              onClick={exportHTML}
              variant="outline"
              size="sm"
              data-testid="export-html-button"
            >
              <Download className="h-4 w-4 mr-2" />
              Export HTML
            </Button>
            
            <Button
              onClick={exportSlides}
              variant="outline"
              size="sm"
              data-testid="export-json-button"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
            
            <label htmlFor="import-file" className="cursor-pointer">
              <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 cursor-pointer" data-testid="import-button">
                <FileUp className="h-4 w-4 mr-2" />
                Import JSON
              </div>
            </label>
            <input
              id="import-file"
              type="file"
              accept=".json"
              onChange={importSlides}
              className="hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Slide List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Slides ({slides.length})</CardTitle>
                  <Button
                    onClick={addSlide}
                    size="sm"
                    data-testid="add-slide-button"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {slides.map((slide, index) => (
                    <div
                      key={slide.id}
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        currentSlideIndex === index ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                      }`}
                      onClick={() => setCurrentSlideIndex(index)}
                      data-testid={`slide-item-${index}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{slide.title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {slide.sections && slide.sections.length > 0 
                              ? `${slide.sections.length} sections` 
                              : slide.content.substring(0, 50)
                            }
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-1 ml-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveSlide(slide.id, "up");
                            }}
                            disabled={index === 0}
                            variant="ghost"
                            size="sm"
                            data-testid={`move-up-${index}`}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveSlide(slide.id, "down");
                            }}
                            disabled={index === slides.length - 1}
                            variant="ghost"
                            size="sm"
                            data-testid={`move-down-${index}`}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSlide(slide.id);
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            data-testid={`delete-slide-${index}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Editor */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Edit Slide</CardTitle>
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
                      className="w-full p-2 border border-input rounded-md"
                      value={currentSlide?.type || 'content'}
                      onChange={(e) => updateSlide(currentSlide.id, { type: e.target.value as SlideType })}
                      data-testid="slide-type-select"
                    >
                      <option value="title">Title</option>
                      <option value="content">Content</option>
                      <option value="image">Image</option>
                    </select>
                  </div>
                </div>

                {/* Legacy content */}
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
                    <Label>Contrast</Label>
                    <div className={`flex items-center gap-2 text-sm ${contrastWarning.warn ? 'text-red-600' : 'text-green-600'}`}>
                      {contrastWarning.warn && <AlertTriangle className="h-4 w-4" />}
                      Ratio: {contrastWarning.ratio.toFixed(1)}
                    </div>
                  </div>
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
                      <DialogContent className="max-w-6xl max-h-[90vh]">
                        <DialogHeader>
                          <DialogTitle>Search Creative Commons Images</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
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
                              placeholder="Search for images..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && setSearchQuery(searchQuery)}
                              data-testid="image-search-input"
                            />
                            <Button 
                              onClick={() => setSearchQuery(searchQuery)} 
                              disabled={searching}
                              data-testid="search-submit-button"
                            >
                              <Search className="h-4 w-4" />
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
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="upload-image-button"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  
                  {currentSlide?.imageUrl && (
                    <div className="mt-2">
                      <img
                        src={currentSlide.imageUrl}
                        alt="Background"
                        className="w-full h-32 object-cover rounded border"
                      />
                      {currentSlide.imageSource && (
                        <div className="mt-2 p-2 bg-muted rounded text-sm">
                          <p><strong>Source:</strong> {getSourceDisplayName(currentSlide.imageSource.source)}</p>
                          <p><strong>Author:</strong> {currentSlide.imageSource.author}</p>
                          <p><strong>License:</strong> {currentSlide.imageSource.license}</p>
                          <p><strong>Commercial Use:</strong> {getCommercialUseStatus(currentSlide.imageSource) ? 'Allowed' : 'Check terms'}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Overlay settings */}
                <div className="border-t pt-4">
                  <Label className="text-base font-semibold mb-3 block">Overlay Options</Label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="overlay-type">Type</Label>
                      <select
                        id="overlay-type"
                        className="w-full p-2 border border-input rounded-md"
                        value={currentSlide?.overlayType || 'none'}
                        onChange={(e) => updateSlide(currentSlide.id, { overlayType: e.target.value as OverlayType })}
                        data-testid="overlay-type-select"
                      >
                        <option value="none">None</option>
                        <option value="horizontal">Horizontal Band</option>
                        <option value="sides">Side Borders</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="overlay-color">Color</Label>
                      <Input
                        id="overlay-color"
                        type="color"
                        value={currentSlide?.overlayColor || '#000000'}
                        onChange={(e) => updateSlide(currentSlide.id, { overlayColor: e.target.value })}
                        disabled={currentSlide?.overlayType === 'none'}
                        data-testid="overlay-color-input"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="overlay-opacity">Opacity ({Math.round((currentSlide?.overlayOpacity || 0.5) * 100)}%)</Label>
                      <Input
                        id="overlay-opacity"
                        type="range"
                        min="0.1"
                        max="0.9"
                        step="0.1"
                        value={currentSlide?.overlayOpacity || 0.5}
                        onChange={(e) => updateSlide(currentSlide.id, { overlayOpacity: parseFloat(e.target.value) })}
                        disabled={currentSlide?.overlayType === 'none'}
                        data-testid="overlay-opacity-input"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="text-align">Legacy Text Align</Label>
                      <select
                        id="text-align"
                        className="w-full p-2 border border-input rounded-md"
                        value={currentSlide?.textAlign || 'center'}
                        onChange={(e) => updateSlide(currentSlide.id, { textAlign: e.target.value as TextAlign })}
                        data-testid="text-align-select"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Sections Editor */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-base font-semibold">Text Sections</Label>
                    <Button
                      onClick={() => addSection(currentSlide.id)}
                      size="sm"
                      variant="outline"
                      data-testid="add-section-button"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Section
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {(currentSlide?.sections || []).map((section, index) => (
                      <Card key={section.id} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Section {index + 1}</h4>
                          <Button
                            onClick={() => deleteSection(currentSlide.id, section.id)}
                            size="sm"
                            variant="ghost"
                            data-testid={`delete-section-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Heading (optional)</Label>
                            <Input
                              value={section.heading || ''}
                              onChange={(e) => updateSection(currentSlide.id, section.id, { heading: e.target.value })}
                              placeholder="Section heading..."
                              data-testid={`section-heading-${index}`}
                            />
                          </div>
                          <div>
                            <Label>Font Family</Label>
                            <select
                              value={section.fontFamily}
                              onChange={(e) => updateSection(currentSlide.id, section.id, { fontFamily: e.target.value as FontFamily })}
                              className="w-full p-2 border border-input rounded-md"
                              data-testid={`section-font-${index}`}
                            >
                              <option value="system">System</option>
                              <option value="serif">Serif</option>
                              <option value="mono">Monospace</option>
                              <option value="display">Display</option>
                              <option value="hand">Handwriting</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div>
                            <Label>Font Size (rem)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              min="0.5"
                              max="5"
                              value={section.fontSize}
                              onChange={(e) => updateSection(currentSlide.id, section.id, { fontSize: parseFloat(e.target.value) || 1.1 })}
                              data-testid={`section-font-size-${index}`}
                            />
                          </div>
                          <div>
                            <Label>Color</Label>
                            <Input
                              type="color"
                              value={section.color}
                              onChange={(e) => updateSection(currentSlide.id, section.id, { color: e.target.value })}
                              data-testid={`section-color-${index}`}
                            />
                          </div>
                          <div>
                            <Label>Alignment</Label>
                            <select
                              value={section.align}
                              onChange={(e) => updateSection(currentSlide.id, section.id, { align: e.target.value as TextAlign })}
                              className="w-full p-2 border border-input rounded-md"
                              data-testid={`section-align-${index}`}
                            >
                              <option value="left">Left</option>
                              <option value="center">Center</option>
                              <option value="right">Right</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <Label>Text</Label>
                          <Textarea
                            value={section.text}
                            onChange={(e) => updateSection(currentSlide.id, section.id, { text: e.target.value })}
                            rows={3}
                            placeholder="Section content..."
                            data-testid={`section-text-${index}`}
                          />
                        </div>
                        
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <XPositionSlider
                            section={section}
                            onUpdate={(updates) => updateSection(currentSlide.id, section.id, updates)}
                          />
                          <YPositionSlider
                            section={section}
                            onUpdate={(updates) => updateSection(currentSlide.id, section.id, updates)}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                  
                  {(!currentSlide?.sections || currentSlide.sections.length === 0) && (
                    <div className="text-center py-6 text-muted-foreground">
                      <Type className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No sections. Legacy title/content will be displayed.</p>
                      <Button
                        onClick={() => addSection(currentSlide.id)}
                        variant="outline"
                        className="mt-2"
                        data-testid="create-first-section-button"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Section
                      </Button>
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
                  className="relative w-full aspect-video border rounded-lg overflow-hidden cursor-pointer"
                  style={{
                    background: currentSlide?.imageUrl 
                      ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('${currentSlide.imageUrl}')` 
                      : currentSlide?.backgroundColor || '#3B82F6',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                  onClick={() => setIsPreviewMode(true)}
                  data-testid="slide-preview"
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
                  
                  {currentSlide?.overlayType === 'sides' && (
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(90deg, ${hexWithOpacity(currentSlide.overlayColor || '#000000', currentSlide.overlayOpacity || 0.5)} 0%, transparent 33.33%, transparent 66.66%, ${hexWithOpacity(currentSlide.overlayColor || '#000000', currentSlide.overlayOpacity || 0.5)} 100%)`
                      }}
                    />
                  )}
                  
                  {/* Content - Sections or Legacy */}
                  {currentSlide?.sections && currentSlide.sections.length > 0 ? (
                    <div className="absolute inset-0">
                      {currentSlide.sections.map(section => {
                        const left = Math.min(section.xStart, section.xEnd);
                        const width = Math.max(section.xStart, section.xEnd) - left;
                        const top = Math.min(section.yStart, section.yEnd);
                        const height = Math.max(section.yStart, section.yEnd) - top;
                        
                        return (
                          <div 
                            key={section.id}
                            className="absolute text-xs"
                            style={{
                              left: `${left}%`,
                              width: `${width}%`,
                              top: `${top}%`,
                              height: `${height}%`,
                              color: section.color,
                              textAlign: section.align,
                              fontFamily: FONT_STACKS[section.fontFamily],
                              fontSize: `${section.fontSize * 0.5}rem`,
                              lineHeight: '1.2',
                              overflow: 'hidden'
                            }}
                          >
                            {section.heading && (
                              <div style={{ fontWeight: 'bold', marginBottom: '0.2rem' }}>
                                {section.heading}
                              </div>
                            )}
                            <div style={{ whiteSpace: 'pre-line' }}>
                              {section.text.length > 100 ? section.text.substring(0, 100) + '...' : section.text}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={`relative z-10 px-4 h-full flex flex-col justify-center text-${currentSlide?.textAlign || 'center'}`}>
                      <h2 className="font-bold mb-2 text-white drop-shadow-lg text-sm">
                        {currentSlide?.title}
                      </h2>
                      <p className="text-xs leading-relaxed text-white drop-shadow whitespace-pre-line">
                        {currentSlide?.content && currentSlide.content.length > 100 
                          ? currentSlide.content.substring(0, 100) + '...' 
                          : currentSlide?.content
                        }
                      </p>
                    </div>
                  )}
                  
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    Click to preview
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}