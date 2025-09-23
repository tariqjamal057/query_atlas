import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface HeroSectionProps {
  onSearch: (query: string) => void;
}

export default function HeroSection({ onSearch }: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <section className="hero-gradient text-white py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
          Save & Discover AI Search Results
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
          Build a knowledge base of LLM search results. Save your ChatGPT, Claude, and Gemini searches for future reference and discover similar queries from the community.
        </p>
        
        {/* Search Archive Section */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 mb-6 sm:mb-8 max-w-2xl mx-auto" data-testid="hero-search-section">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4" data-testid="hero-search-title">Search Archive</h2>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search for AI queries, topics, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 text-base bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                data-testid="input-search-archive"
              />
            </div>
            <Button 
              type="submit"
              className="flex items-center justify-center space-x-2 h-12 px-6 bg-primary hover:bg-primary/90"
              data-testid="button-search-archive"
            >
              <Search className="w-5 h-5" />
              <span>Search</span>
            </Button>
          </form>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
          <button 
            className="border-2 border-white text-white px-6 py-3 sm:py-4 rounded-lg font-medium hover:bg-white/10 transition-colors touch-manipulation text-base"
            data-testid="button-submit-results"
          >
            Submit Results
          </button>
        </div>
      </div>
    </section>
  );
}
