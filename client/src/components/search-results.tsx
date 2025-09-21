import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchResult } from "@shared/schema";
import { Search, ExternalLink, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";

interface SearchResultsProps {
  searchQuery: string;
  onSearch: (query: string) => void;
  showSearchBar: boolean;
}

export default function SearchResults({ searchQuery, onSearch, showSearchBar }: SearchResultsProps) {
  const [currentQuery, setCurrentQuery] = useState(searchQuery);

  const { data: results = [], isLoading, error } = useQuery<SearchResult[]>({
    queryKey: ["/api/search", { q: searchQuery }],
    enabled: !!searchQuery,
  });

  const { data: allResults = [] } = useQuery<SearchResult[]>({
    queryKey: ["/api/search-results"],
    enabled: !searchQuery,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentQuery.trim()) {
      onSearch(currentQuery.trim());
    }
  };

  const handleViewResult = async (result: SearchResult) => {
    try {
      await apiRequest("POST", `/api/search-results/${result.id}/views`);
      window.open(result.publicLink, '_blank');
    } catch (error) {
      console.error("Failed to track view:", error);
      window.open(result.publicLink, '_blank');
    }
  };

  const handleSaveResult = async (result: SearchResult) => {
    try {
      await apiRequest("POST", `/api/search-results/${result.id}/saves`);
    } catch (error) {
      console.error("Failed to save result:", error);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'ChatGPT':
        return <div className="w-6 h-6 bg-green-500 rounded-sm"></div>;
      case 'Claude':
        return <div className="w-6 h-6 bg-orange-500 rounded-full"></div>;
      case 'Gemini':
        return <div className="w-6 h-6 bg-blue-500 rounded-lg"></div>;
      case 'DeepSeek':
        return <div className="w-6 h-6 bg-purple-500 rounded-sm"></div>;
      default:
        return <div className="w-6 h-6 bg-gray-500 rounded-sm"></div>;
    }
  };

  const displayResults = searchQuery ? results : allResults;

  return (
    <div className="space-y-8">
      {showSearchBar && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Search Archive</h2>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search for AI queries, topics, or keywords..."
                value={currentQuery}
                onChange={(e) => setCurrentQuery(e.target.value)}
                className="w-full"
                data-testid="input-search-query"
              />
            </div>
            <Button 
              type="submit"
              className="flex items-center space-x-2"
              data-testid="button-search"
            >
              <Search className="w-5 h-5" />
              <span>Search</span>
            </Button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Popular searches:</span>
            <button 
              className="text-sm bg-muted text-muted-foreground px-3 py-1 rounded-full hover:bg-accent transition-colors"
              onClick={() => onSearch("Machine Learning")}
              data-testid="button-popular-ml"
            >
              Machine Learning
            </button>
            <button 
              className="text-sm bg-muted text-muted-foreground px-3 py-1 rounded-full hover:bg-accent transition-colors"
              onClick={() => onSearch("React Components")}
              data-testid="button-popular-react"
            >
              React Components
            </button>
            <button 
              className="text-sm bg-muted text-muted-foreground px-3 py-1 rounded-full hover:bg-accent transition-colors"
              onClick={() => onSearch("Python Data Analysis")}
              data-testid="button-popular-python"
            >
              Python Data Analysis
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-foreground">
            {searchQuery ? "Search Results" : "Recent Results"}
          </h3>
          <span className="text-sm text-muted-foreground" data-testid="text-results-count">
            {displayResults.length} results found
          </span>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <div className="text-muted-foreground">Loading results...</div>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <div className="text-destructive">Failed to load results. Please try again.</div>
          </div>
        )}

        {!isLoading && !error && displayResults.length === 0 && (
          <div className="text-center py-8">
            <div className="text-muted-foreground">
              {searchQuery ? "No results found for your search." : "No results available yet."}
            </div>
          </div>
        )}

        {displayResults.map((result: SearchResult) => (
          <div 
            key={result.id} 
            className="bg-card rounded-lg border border-border p-6 search-result-card hover:shadow-md transition-shadow"
            data-testid={`card-result-${result.id}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  {getPlatformIcon(result.platform)}
                </div>
                <div>
                  <h4 className="font-medium text-foreground" data-testid={`text-query-${result.id}`}>
                    {result.query}
                  </h4>
                  <p className="text-sm text-muted-foreground" data-testid={`text-source-${result.id}`}>
                    {result.platform} • {new Date(result.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => handleSaveResult(result)}
                  data-testid={`button-save-${result.id}`}
                >
                  <Bookmark className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {result.preview && (
              <p className="text-muted-foreground text-sm mb-4" data-testid={`text-preview-${result.id}`}>
                {result.preview}
              </p>
            )}
            
            <div className="flex items-center justify-between">
              <button
                onClick={() => handleViewResult(result)}
                className="inline-flex items-center space-x-2 text-primary hover:text-primary/80 font-medium text-sm"
                data-testid={`link-view-${result.id}`}
              >
                <ExternalLink className="w-4 h-4" />
                <span>View Original Chat</span>
              </button>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span data-testid={`text-views-${result.id}`}>{result.views} views</span>
                <span data-testid={`text-saves-${result.id}`}>{result.saves} saves</span>
              </div>
            </div>
          </div>
        ))}

        {displayResults.length > 0 && (
          <div className="text-center pt-8">
            <Button 
              variant="secondary"
              data-testid="button-load-more"
            >
              Load More Results
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
