import axios from "axios";
import type { SearchResult, ImageSource } from "@shared/schema";

export class ImageSearchService {
  private pixabayApiKey = process.env.PIXABAY_API_KEY;
  private unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
  private pexelsApiKey = process.env.PEXELS_API_KEY;

  async searchMultipleSources(
    query: string,
    licenses: string[] = ["cc0", "cc-by", "cc-by-sa"],
    sources: ImageSource[] = ["wikimedia", "pixabay", "unsplash", "pexels"],
    limit: number = 20
  ): Promise<SearchResult[]> {
    const searches = [];
    const limitPerSource = Math.ceil(limit / sources.length);

    // Create search promises for each source
    if (sources.includes("wikimedia")) {
      searches.push(this.searchWikimedia(query, licenses, limitPerSource));
    }
    
    if (sources.includes("pixabay") && this.pixabayApiKey) {
      searches.push(this.searchPixabay(query, licenses, limitPerSource));
    }
    
    if (sources.includes("unsplash") && this.unsplashAccessKey) {
      searches.push(this.searchUnsplash(query, limitPerSource));
    }
    
    if (sources.includes("pexels") && this.pexelsApiKey) {
      searches.push(this.searchPexels(query, limitPerSource));
    }

    // Execute all searches in parallel
    const results = await Promise.allSettled(searches);
    
    // Combine results from all sources
    const combinedResults: SearchResult[] = [];
    
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        combinedResults.push(...result.value);
      } else {
        console.error(`Search failed for source ${sources[index]}:`, result.reason);
      }
    });

    // Shuffle and limit results
    return this.shuffleArray(combinedResults).slice(0, limit);
  }

  private async searchWikimedia(
    query: string,
    licenses: string[],
    limit: number
  ): Promise<SearchResult[]> {
    const params = {
      action: "query",
      format: "json",
      list: "search",
      srsearch: query,
      srnamespace: "6",
      srlimit: limit,
      origin: "*"
    };

    const response = await axios.get("https://commons.wikimedia.org/w/api.php", { params });
    const searchResults = (response.data.query || {}).search || [];

    if (searchResults.length === 0) return [];

    // Get image details
    const titles = searchResults.map((result: any) => result.title).join('|');
    const imageParams = {
      action: "query",
      format: "json",
      prop: "imageinfo",
      titles: titles,
      iiprop: "url|extmetadata|size",
      iiurlwidth: "1200",
      origin: "*"
    };

    const imageResponse = await axios.get("https://commons.wikimedia.org/w/api.php", { params: imageParams });
    const pages = (imageResponse.data.query || {}).pages || {};

    const results: SearchResult[] = [];

    for (const pageId in pages) {
      const page = pages[pageId];
      const imageInfo = (page.imageinfo || [])[0];
      
      if (!imageInfo) continue;

      const metadata = imageInfo.extmetadata || {};
      const licenseShortName = metadata.LicenseShortName?.value || "";
      const licenseUrl = metadata.LicenseUrl?.value || "";
      const artist = metadata.Artist?.value || "";

      // Filter by license
      const normalizedLicense = licenseShortName.toLowerCase().replace(/\s+/g, '-');
      const isPublicDomain = normalizedLicense.includes('public-domain') || normalizedLicense.includes('cc0');
      
      let licenseMatch = false;
      if (isPublicDomain && licenses.includes('cc0')) {
        licenseMatch = true;
      } else {
        licenseMatch = licenses.some(license => {
          if (license === 'cc-by-sa') {
            return normalizedLicense.includes('cc-by-sa');
          } else if (license === 'cc-by') {
            return normalizedLicense.includes('cc-by') && !normalizedLicense.includes('-sa') && !normalizedLicense.includes('-nc');
          }
          return normalizedLicense.includes(license);
        });
      }

      if (!licenseMatch && licenses.length > 0) continue;

      // Generate attribution
      let attribution = "";
      if (licenseShortName.toLowerCase().includes("cc0")) {
        attribution = `"${page.title.replace("File:", "")}" is licensed under CC0 (Public Domain)`;
      } else {
        attribution = `"${page.title.replace("File:", "")}" by ${artist || "Unknown"} is licensed under ${licenseShortName}`;
      }

      results.push({
        id: `wikimedia-${pageId}`,
        title: page.title.replace("File:", ""),
        imageUrl: imageInfo.url,
        thumbnailUrl: imageInfo.thumburl,
        author: artist,
        license: licenseShortName,
        licenseUrl: licenseUrl,
        sourceUrl: `https://commons.wikimedia.org/wiki/${page.title.replace(/ /g, "_")}`,
        attribution: attribution,
        dimensions: imageInfo.width && imageInfo.height ? `${imageInfo.width} × ${imageInfo.height}` : undefined,
        fileSize: imageInfo.size ? `${(imageInfo.size / 1024 / 1024).toFixed(1)} MB` : undefined,
        source: 'wikimedia'
      });
    }

    return results;
  }

  private async searchPixabay(
    query: string,
    licenses: string[],
    limit: number
  ): Promise<SearchResult[]> {
    if (!this.pixabayApiKey) return [];

    const params = {
      key: this.pixabayApiKey,
      q: query,
      image_type: 'photo',
      safesearch: 'true',
      per_page: Math.max(3, Math.min(limit, 200)), // Pixabay requires minimum 3
      category: 'all'
    };

    const response = await axios.get("https://pixabay.com/api/", { params });
    const hits = response.data.hits || [];

    return hits.map((hit: any) => ({
      id: `pixabay-${hit.id}`,
      title: hit.tags || `Pixabay Image ${hit.id}`,
      imageUrl: hit.largeImageURL || hit.webformatURL,
      thumbnailUrl: hit.webformatURL,
      author: hit.user,
      license: "Pixabay License",
      licenseUrl: "https://pixabay.com/service/license-summary/",
      sourceUrl: hit.pageURL,
      attribution: `Image by ${hit.user} from Pixabay`,
      dimensions: `${hit.imageWidth} × ${hit.imageHeight}`,
      fileSize: hit.imageSize ? `${(hit.imageSize / 1024 / 1024).toFixed(1)} MB` : undefined,
      source: 'pixabay' as ImageSource,
      sourceMetadata: {
        tags: hit.tags,
        downloads: hit.downloads,
        views: hit.views
      }
    }));
  }

  private async searchUnsplash(
    query: string,
    limit: number
  ): Promise<SearchResult[]> {
    if (!this.unsplashAccessKey) return [];

    const response = await axios.get(`https://api.unsplash.com/search/photos`, {
      params: {
        query: query,
        per_page: Math.min(limit, 30),
        client_id: this.unsplashAccessKey
      }
    });

    const results = response.data.results || [];

    return results.map((photo: any) => ({
      id: `unsplash-${photo.id}`,
      title: photo.description || photo.alt_description || `Unsplash Photo ${photo.id}`,
      imageUrl: photo.urls.regular,
      thumbnailUrl: photo.urls.small,
      author: photo.user.name,
      license: "Unsplash License",
      licenseUrl: "https://unsplash.com/license",
      sourceUrl: photo.links.html + "?utm_source=PresentationFinder&utm_medium=referral",
      attribution: `Photo by ${photo.user.name} on Unsplash`,
      dimensions: `${photo.width} × ${photo.height}`,
      source: 'unsplash' as ImageSource,
      sourceMetadata: {
        photographerUrl: photo.user.links.html + "?utm_source=PresentationFinder&utm_medium=referral",
        unsplashUrl: photo.links.html + "?utm_source=PresentationFinder&utm_medium=referral"
      }
    }));
  }

  private async searchPexels(
    query: string,
    limit: number
  ): Promise<SearchResult[]> {
    if (!this.pexelsApiKey) return [];

    const response = await axios.get(`https://api.pexels.com/v1/search`, {
      headers: {
        Authorization: this.pexelsApiKey
      },
      params: {
        query: query,
        per_page: Math.min(limit, 80),
        orientation: 'all'
      }
    });

    const photos = response.data.photos || [];

    return photos.map((photo: any) => ({
      id: `pexels-${photo.id}`,
      title: photo.alt || `Pexels Photo ${photo.id}`,
      imageUrl: photo.src.large,
      thumbnailUrl: photo.src.medium,
      author: photo.photographer,
      license: "Pexels License",
      licenseUrl: "https://www.pexels.com/license/",
      sourceUrl: photo.url,
      attribution: `Photo by ${photo.photographer} from Pexels`,
      dimensions: `${photo.width} × ${photo.height}`,
      source: 'pexels' as ImageSource,
      sourceMetadata: {
        avgColor: photo.avg_color
      }
    }));
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export const imageSearchService = new ImageSearchService();