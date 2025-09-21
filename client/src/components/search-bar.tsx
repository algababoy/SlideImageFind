import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useState } from "react";
import { POPULAR_SEARCHES } from "@/lib/wikimedia-api";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handlePopularSearch = (searchTerm: string) => {
    setQuery(searchTerm);
    onSearch(searchTerm);
  };

  return (
    <div className="mb-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-4" data-testid="main-title">
          Find Perfect Images for Your Presentations
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="main-description">
          Search millions of Creative Commons licensed images with proper attribution for commercial use in your presentations.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-muted-foreground h-5 w-5" />
          </div>
          <Input 
            type="text" 
            placeholder="Search for images (e.g., business meeting, nature, technology...)"
            className="w-full pl-10 pr-4 py-4 text-lg border border-border rounded-lg bg-card focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            data-testid="search-input"
          />
          <Button 
            type="submit"
            className="absolute inset-y-0 right-0 px-6 bg-primary text-primary-foreground rounded-r-lg hover:bg-primary/90 transition-colors"
            disabled={isLoading || !query.trim()}
            data-testid="search-button"
          >
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>
      </form>

      <div className="max-w-4xl mx-auto mb-8">
        <p className="text-sm text-muted-foreground mb-3" data-testid="popular-searches-label">
          Popular searches:
        </p>
        <div className="flex flex-wrap gap-2" data-testid="popular-searches">
          {POPULAR_SEARCHES.map((search) => (
            <Badge
              key={search}
              variant="secondary"
              className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => handlePopularSearch(search.toLowerCase())}
              data-testid={`popular-search-${search.toLowerCase()}`}
            >
              {search}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
