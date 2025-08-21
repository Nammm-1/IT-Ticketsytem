import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchIcon, BookOpenIcon, TagIcon, PlusIcon } from "lucide-react";
import { KnowledgeArticle } from "@/types";
import { formatDistanceToNow } from "date-fns";

export default function KnowledgeBase() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticle | null>(null);

  // Inject CSS to fix transparent dropdowns and other UI elements
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Force opaque backgrounds for all UI components */
      .select-content, .select-item, .select-trigger,
      [data-radix-popper-content-wrapper],
      .bg-red-50, .bg-blue-50, .bg-yellow-50, .bg-green-50,
      .dark .bg-red-900\\/20, .dark .bg-blue-900\\/20, .dark .bg-yellow-900\\/20, .dark .bg-green-900\\/20,
      .bg-white, .dark .bg-gray-800,
      .bg-gray-50, .dark .bg-gray-900,
      .bg-primary, .bg-secondary,
      .bg-destructive, .bg-muted,
      .bg-popover, .bg-card,
      .bg-accent, .bg-accent-foreground {
        background-color: var(--background) !important;
        background: var(--background) !important;
        opacity: 1 !important;
      }
      
      /* Force opaque borders */
      .border, .border-red-200, .border-blue-200, .border-yellow-200, .border-green-200,
      .dark .border-red-800, .dark .border-blue-800, .dark .border-yellow-800, .dark .border-green-800,
      .border-gray-300, .dark .border-gray-600 {
        border-color: var(--border) !important;
        opacity: 1 !important;
      }
      
      /* Force opaque text */
      .text-red-500, .text-blue-600, .text-yellow-600, .text-green-600,
      .dark .text-red-400, .dark .text-blue-400, .dark .text-yellow-400, .dark .text-green-400 {
        color: var(--foreground) !important;
        opacity: 1 !important;
      }
      
      /* Ensure modals and overlays are opaque */
      .fixed.inset-0.bg-black.bg-opacity-50,
      .bg-white, .dark .bg-gray-800,
      .bg-gray-50, .dark .bg-gray-900 {
        background-color: var(--background) !important;
        background: var(--background) !important;
        opacity: 1 !important;
      }
      
      /* Fix any remaining transparent elements */
      .bg-opacity-50, .bg-opacity-20, .bg-opacity-10 {
        opacity: 1 !important;
      }
      
      /* Ensure form elements have proper backgrounds */
      input, select, textarea, button {
        background-color: var(--background) !important;
        background: var(--background) !important;
        opacity: 1 !important;
      }
      
      /* Fix modal backgrounds */
      .modal, .dialog, .popover, .tooltip {
        background-color: var(--background) !important;
        background: var(--background) !important;
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Redirect to login if not authenticated - Knowledge base is public but we still want auth for better UX
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: articles, isLoading: articlesLoading, error: articlesError } = useQuery<KnowledgeArticle[]>({
    queryKey: ["/api/knowledge-base", search, categoryFilter === 'all' ? '' : categoryFilter],
    enabled: true, // Knowledge base is accessible to all users
    retry: false,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (articlesError && isUnauthorizedError(articlesError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [articlesError, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      hardware: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      software: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      network: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      access: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <Header 
          title="Knowledge Base" 
          subtitle="Find solutions to common IT issues" 
        />
        
        <main className="p-6">
          {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search articles
                </label>
                <div className="relative">
                  <SearchIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="Search for solutions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-articles"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48 !bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 !text-gray-900 dark:!text-white shadow-sm" data-testid="select-article-category">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent className="!bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 shadow-xl z-50">
                    <SelectItem value="all" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">All categories</SelectItem>
                    <SelectItem value="hardware" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Hardware</SelectItem>
                    <SelectItem value="software" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Software</SelectItem>
                    <SelectItem value="network" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Network</SelectItem>
                    <SelectItem value="access" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Access</SelectItem>
                    <SelectItem value="other" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articlesLoading ? (
              [...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/5"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : articles && articles.length > 0 ? (
              articles.map((article: KnowledgeArticle) => (
                <Card key={article.id} className="hover:shadow-lg transition-all duration-200 ease-in-out cursor-pointer" data-testid={`card-article-${article.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg leading-6 hover:text-primary transition-colors duration-200">{article.title}</CardTitle>
                      <Badge className={getCategoryColor(article.category)}>
                        {article.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(article.createdAt).toLocaleDateString()}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                      {article.content.substring(0, 150)}...
                    </p>
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <TagIcon className="w-4 h-4 text-gray-400" />
                        <div className="flex flex-wrap gap-1">
                          {article.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {article.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{article.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpenIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No articles found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {search || categoryFilter
                    ? "Try adjusting your search filters"
                    : "Knowledge base articles will appear here"
                  }
                </p>
              </div>
            )}
          </div>

          {/* Popular Categories */}
          {!search && categoryFilter === 'all' && (
            <div className="mt-12">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Browse by Category
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { name: "Hardware", icon: "💻", category: "hardware" },
                  { name: "Software", icon: "📱", category: "software" },
                  { name: "Network", icon: "🌐", category: "network" },
                  { name: "Access", icon: "🔐", category: "access" },
                  { name: "Other", icon: "❓", category: "other" },
                ].map((item) => (
                  <Button
                    key={item.category}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 ease-in-out hover:shadow-md"
                    onClick={() => setCategoryFilter(item.category)}
                    data-testid={`button-category-${item.category}`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-sm font-medium">{item.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
