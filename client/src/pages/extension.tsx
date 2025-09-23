import NavigationHeader from "@/components/navigation-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Chrome, Zap, Shield, Search, Bookmark } from "lucide-react";
import { useState } from "react";

export default function Extension() {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadExtension = async () => {
    setIsDownloading(true);
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
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mr-4">
              <Chrome className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">LLM Archive Extension</h1>
              <p className="text-xl text-muted-foreground">
                Automatically capture and save your AI conversations
              </p>
            </div>
          </div>
          
          <Button 
            onClick={handleDownloadExtension}
            disabled={isDownloading}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg"
            data-testid="button-download-extension"
          >
            <Download className="w-5 h-5 mr-2" />
            {isDownloading ? 'Downloading...' : 'Download Extension'}
          </Button>
          
          <div className="flex items-center justify-center mt-4 space-x-2">
            <Badge variant="secondary">Chrome</Badge>
            <Badge variant="secondary">Free</Badge>
            <Badge variant="secondary">Open Source</Badge>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <Zap className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Auto-Capture</CardTitle>
              <CardDescription>
                Automatically detect and capture conversations from ChatGPT, Claude, Gemini, and DeepSeek
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Search className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Smart Detection</CardTitle>
              <CardDescription>
                Intelligently identifies valuable conversations and extracts key information
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Bookmark className="w-8 h-8 text-primary mb-2" />
              <CardTitle>One-Click Save</CardTitle>
              <CardDescription>
                Save conversations to your LLM Archive with a single click
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Privacy First</CardTitle>
              <CardDescription>
                Only captures public share links, never accesses private conversations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Chrome className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Chrome Optimized</CardTitle>
              <CardDescription>
                Built specifically for Chrome with Manifest V3 for security and performance
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Download className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Easy Setup</CardTitle>
              <CardDescription>
                Simple installation process with clear instructions and instant activation
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Installation Instructions */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Installation Instructions</CardTitle>
            <CardDescription>
              Follow these simple steps to install the LLM Archive Chrome extension
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Download Extension</h4>
                    <p className="text-sm text-muted-foreground">Click the download button to get the extension ZIP file</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Extract Files</h4>
                    <p className="text-sm text-muted-foreground">Extract the ZIP file to a folder on your computer</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Open Chrome Extensions</h4>
                    <p className="text-sm text-muted-foreground">Go to chrome://extensions/ in your Chrome browser</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium">Enable Developer Mode</h4>
                    <p className="text-sm text-muted-foreground">Toggle "Developer mode" switch in the top right corner</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                    5
                  </div>
                  <div>
                    <h4 className="font-medium">Load Extension</h4>
                    <p className="text-sm text-muted-foreground">Click "Load unpacked" and select the extracted folder</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                    6
                  </div>
                  <div>
                    <h4 className="font-medium">Start Using</h4>
                    <p className="text-sm text-muted-foreground">The extension is now installed and ready to use!</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supported Platforms */}
        <Card>
          <CardHeader>
            <CardTitle>Supported Platforms</CardTitle>
            <CardDescription>
              The extension works with these AI platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="w-8 h-8 bg-green-500 rounded-sm mx-auto mb-2"></div>
                <h4 className="font-medium">ChatGPT</h4>
                <p className="text-sm text-muted-foreground">OpenAI</p>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="w-8 h-8 bg-orange-500 rounded-full mx-auto mb-2"></div>
                <h4 className="font-medium">Claude</h4>
                <p className="text-sm text-muted-foreground">Anthropic</p>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="w-8 h-8 bg-blue-500 rounded-lg mx-auto mb-2"></div>
                <h4 className="font-medium">Gemini</h4>
                <p className="text-sm text-muted-foreground">Google</p>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="w-8 h-8 bg-purple-500 rounded-sm mx-auto mb-2"></div>
                <h4 className="font-medium">DeepSeek</h4>
                <p className="text-sm text-muted-foreground">DeepSeek AI</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}