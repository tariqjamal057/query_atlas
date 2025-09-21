import NavigationHeader from "@/components/navigation-header";
import HeroSection from "@/components/hero-section";
import SearchResults from "@/components/search-results";
import Sidebar from "@/components/sidebar";
import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearchActive(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      {!isSearchActive && <HeroSection onSearch={handleSearch} />}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Mobile Sidebar Toggle */}
        <div className="lg:hidden mb-6">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-between bg-card border border-border rounded-lg p-4 text-left hover:bg-muted transition-colors"
            data-testid="button-toggle-sidebar"
          >
            <span className="font-medium text-foreground">
              {isSidebarOpen ? 'Hide' : 'Show'} Sidebar
            </span>
            {isSidebarOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <SearchResults 
              searchQuery={searchQuery}
              onSearch={handleSearch}
              showSearchBar={isSearchActive}
            />
          </div>
          
          {/* Sidebar */}
          <div className={`order-1 lg:order-2 transition-all duration-300 ${
            isSidebarOpen ? 'block' : 'hidden'
          } lg:block`}>
            <Sidebar searchQuery={searchQuery} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-foreground">LLM Archive</h2>
              </div>
              <p className="text-muted-foreground mb-4 max-w-md">
                Building the world's largest repository of AI search results to help everyone learn and discover faster.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Features</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Chrome Extension</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">API</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Documentation</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Help Center</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Contact</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2024 LLM Archive. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
