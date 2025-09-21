import { useQuery } from "@tanstack/react-query";
import SubmitForm from "./submit-form";
import { SearchQuery } from "@shared/schema";

interface SidebarProps {
  searchQuery: string;
  onSearch?: (query: string) => void;
}

export default function Sidebar({ searchQuery, onSearch }: SidebarProps) {
  const { data: relatedSearches = [] } = useQuery<SearchQuery[]>({
    queryKey: ["/api/related-searches", { q: searchQuery }],
    enabled: !!searchQuery,
  });

  const handleDownloadExtension = async () => {
    try {
      // Download the extension ZIP file
      const response = await fetch('/api/download-extension');
      if (!response.ok) throw new Error('Failed to download extension');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'llm-archive-extension.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Show installation instructions
      alert('Extension downloaded! To install:\n\n1. Extract the ZIP file\n2. Open Chrome and go to chrome://extensions/\n3. Enable "Developer mode" (top right)\n4. Click "Load unpacked" and select the extracted folder\n5. The LLM Archive extension is now installed!');
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download extension. Please try again.');
    }
  };

  const { data: popularSearches = [] } = useQuery<SearchQuery[]>({
    queryKey: ["/api/popular-searches"],
    enabled: !searchQuery,
  });

  const { data: stats } = useQuery<{totalResults: number, thisWeek: number, contributors: number, searchesToday: number}>({
    queryKey: ["/api/stats"],
  });

  const displaySearches = searchQuery ? relatedSearches : popularSearches;

  return (
    <div className="space-y-6">
      <SubmitForm />

      {/* Related/Popular Searches */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {searchQuery ? "Related Searches" : "Popular Searches"}
        </h3>
        <div className="space-y-3">
          {displaySearches.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No searches available yet.
            </div>
          ) : (
            displaySearches.map((search: SearchQuery) => (
              <div 
                key={search.id} 
                className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
              >
                <button 
                  onClick={() => onSearch?.(search.query)} 
                  className="text-sm text-foreground hover:text-primary transition-colors text-left"
                  data-testid={`link-search-${search.id}`}
                >
                  {search.query}
                </button>
                <span 
                  className="text-xs text-muted-foreground"
                  data-testid={`text-count-${search.id}`}
                >
                  {search.resultCount}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Archive Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Results</span>
              <span className="font-semibold text-foreground" data-testid="text-total-results">
                {stats.totalResults.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">This Week</span>
              <span className="font-semibold text-foreground" data-testid="text-this-week">
                {stats.thisWeek.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Contributors</span>
              <span className="font-semibold text-foreground" data-testid="text-contributors">
                {stats.contributors.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Searches Today</span>
              <span className="font-semibold text-foreground" data-testid="text-searches-today">
                {stats.searchesToday.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Chrome Extension CTA */}
      <div className="bg-gradient-to-br from-primary to-blue-600 rounded-lg p-6 text-white">
        <h3 className="text-lg font-semibold mb-2">Chrome Extension</h3>
        <p className="text-sm text-blue-100 mb-4">
          Automatically capture and save your AI search results with our Chrome extension.
        </p>
        <button 
          onClick={handleDownloadExtension}
          className="w-full bg-white text-primary py-2 rounded-md font-medium hover:bg-gray-50 transition-colors"
          data-testid="button-add-to-chrome"
        >
          Add to Chrome
        </button>
      </div>
    </div>
  );
}
