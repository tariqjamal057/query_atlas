import NavigationHeader from "@/components/navigation-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Search, Bookmark, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { data: stats } = useQuery<{
    totalResults: number;
    thisWeek: number;
    contributors: number;
    totalSaves: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const { data: popularSearches = [] } = useQuery<Array<{
    id: string;
    query: string;
    searchCount: number;
  }>>({
    queryKey: ["/api/popular-searches"],
  });

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of LLM Archive activity and your contribution to the knowledge base.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Results</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-results">
                {stats?.totalResults || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Search results in archive
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-this-week">
                {stats?.thisWeek || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                New submissions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contributors</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-contributors">
                {stats?.contributors || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Active contributors
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Saves</CardTitle>
              <Bookmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-saves">
                {stats?.totalSaves || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Results bookmarked
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Popular Searches */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Searches</CardTitle>
            <CardDescription>
              Most searched topics in the LLM Archive community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {popularSearches.length > 0 ? (
                popularSearches.slice(0, 5).map((search, index: number) => (
                  <div key={search.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
                        {index + 1}
                      </div>
                      <span className="font-medium" data-testid={`popular-search-${index}`}>
                        {search.query}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {search.searchCount} searches
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No popular searches data available yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}