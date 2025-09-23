import NavigationHeader from "@/components/navigation-header";
import SubmitForm from "@/components/submit-form";

export default function Submit() {
  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Submit Search Result</h1>
          <p className="text-muted-foreground">
            Share your AI search results with the LLM Archive community. Help others discover valuable conversations from ChatGPT, Claude, Gemini, and other AI platforms.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Submit Form */}
          <div className="lg:col-span-2">
            <SubmitForm />
          </div>
          
          {/* Sidebar with tips */}
          <div className="space-y-6">
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">💡 Submission Tips</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <span>Use descriptive search queries that clearly indicate the topic</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <span>Ensure your share link is public and accessible to others</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <span>Add a brief description to help others understand the content</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <span>Select the correct AI platform for better categorization</span>
                </li>
              </ul>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">🔒 Privacy & Terms</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>By submitting content, you confirm that:</p>
                <ul className="space-y-2 ml-4">
                  <li>• The shared link is publicly accessible</li>
                  <li>• You have rights to share this content</li>
                  <li>• Content follows community guidelines</li>
                  <li>• No personal or sensitive information is included</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}