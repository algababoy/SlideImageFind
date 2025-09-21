export interface WikimediaImage {
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  author?: string;
  license: string;
  licenseUrl?: string;
  sourceUrl: string;
  attribution: string;
  dimensions?: string;
  fileSize?: string;
}

export interface SearchResult {
  results: WikimediaImage[];
  total: number;
  query: string;
}

export interface SearchFilters {
  licenses: string[];
  size: string;
  fileTypes: string[];
}
