export default function NavigationHeader() {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-foreground">LLM Archive</h1>
            </div>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Submit</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Browse</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Extension</a>
          </nav>
          <div className="flex items-center space-x-4">
            <button 
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              data-testid="button-get-extension"
            >
              Get Extension
            </button>
            <div className="w-8 h-8 bg-muted rounded-full"></div>
          </div>
        </div>
      </div>
    </header>
  );
}
