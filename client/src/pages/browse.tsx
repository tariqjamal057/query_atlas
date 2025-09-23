import NavigationHeader from "@/components/navigation-header";
import SearchResults from "@/components/search-results";
import { useState } from "react";

export default function Browse() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Browse Archive</h1>
          <p className="text-muted-foreground">
            Discover and explore AI search results shared by the community. Find conversations, tutorials, and insights from ChatGPT, Claude, Gemini, and other AI platforms.
          </p>
        </div>

        <SearchResults 
          searchQuery={searchQuery}
          onSearch={handleSearch}
          showSearchBar={true}
        />
      </main>
    </div>
  );
}