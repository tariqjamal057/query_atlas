interface HeroSectionProps {
  onSearch: (query: string) => void;
}

export default function HeroSection({ onSearch }: HeroSectionProps) {
  const handleStartSearching = () => {
    onSearch("machine learning");
  };

  return (
    <section className="hero-gradient text-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Save & Discover AI Search Results
        </h1>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Build a knowledge base of LLM search results. Save your ChatGPT, Claude, and Gemini searches for future reference and discover similar queries from the community.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            className="bg-white text-primary px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            onClick={handleStartSearching}
            data-testid="button-start-searching"
          >
            Start Searching
          </button>
          <button 
            className="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors"
            data-testid="button-submit-results"
          >
            Submit Results
          </button>
        </div>
      </div>
    </section>
  );
}
