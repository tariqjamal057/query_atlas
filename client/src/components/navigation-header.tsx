import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function NavigationHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <a href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-foreground">LLM Archive</h1>
            </a>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</a>
            <a href="/submit" className="text-muted-foreground hover:text-foreground transition-colors">Submit</a>
            <a href="/browse" className="text-muted-foreground hover:text-foreground transition-colors">Browse</a>
            <a href="/extension" className="text-muted-foreground hover:text-foreground transition-colors">Extension</a>
          </nav>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Desktop Extension Button */}
            <button 
              onClick={handleDownloadExtension}
              className="hidden sm:block bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              data-testid="button-get-extension"
            >
              Get Extension
            </button>
            
            {/* Mobile Extension Button */}
            <button 
              onClick={handleDownloadExtension}
              className="sm:hidden bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              data-testid="button-get-extension-mobile"
            >
              Extension
            </button>
            
            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            {/* User Avatar - Hidden on small mobile */}
            <div className="hidden sm:block w-8 h-8 bg-muted rounded-full"></div>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card">
            <nav className="py-4 space-y-2">
              <a 
                href="/dashboard" 
                className="block px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                data-testid="link-mobile-dashboard"
              >
                Dashboard
              </a>
              <a 
                href="/submit" 
                className="block px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                data-testid="link-mobile-submit"
              >
                Submit
              </a>
              <a 
                href="/browse" 
                className="block px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                data-testid="link-mobile-browse"
              >
                Browse
              </a>
              <a 
                href="/extension" 
                className="block px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                data-testid="link-mobile-extension"
              >
                Extension
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
