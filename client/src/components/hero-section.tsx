interface HeroSectionProps {
  onSearch: (query: string) => void;
}

export default function HeroSection({ onSearch }: HeroSectionProps) {
  const handleStartSearching = () => {
    onSearch("machine learning");
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
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
          <button 
            className="bg-white text-primary px-6 py-3 sm:py-4 rounded-lg font-medium hover:bg-gray-50 transition-colors touch-manipulation text-base"
            onClick={handleStartSearching}
            data-testid="button-start-searching"
          >
            Start Searching
          </button>
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
