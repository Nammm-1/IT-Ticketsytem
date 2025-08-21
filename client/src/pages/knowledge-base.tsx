import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  PlusIcon, 
  SearchIcon,
  BookOpen,
  FileText,
  CalendarIcon,
  UserIcon,
  TagIcon,
  EditIcon,
  XIcon,
  TrashIcon
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
  views: number;
}

interface CreateEditArticle {
  title: string;
  content: string;
  category: string;
  tags: string[];
}

export default function KnowledgeBase() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Create/Edit modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [articleForm, setArticleForm] = useState<CreateEditArticle>({
    title: "",
    content: "",
    category: "hardware",
    tags: []
  });
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user can create/edit articles
  const canManageArticles = user && ['admin', 'manager'].includes(user.role);

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [articles, searchTerm, categoryFilter]);

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/knowledge-base');
      if (response.ok) {
        const data = await response.json();
        setArticles(data);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterArticles = () => {
    let filtered = articles;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(article => article.category === categoryFilter);
    }

    setFilteredArticles(filtered);
  };

  const openCreateModal = () => {
    setArticleForm({
      title: "",
      content: "",
      category: "hardware",
      tags: []
    });
    setEditingArticle(null);
    setShowCreateModal(true);
  };

  const openEditModal = (article: Article) => {
    setArticleForm({
      title: article.title,
      content: article.content,
      category: article.category,
      tags: [...article.tags]
    });
    setEditingArticle(article);
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingArticle(null);
    setArticleForm({
      title: "",
      content: "",
      category: "hardware",
      tags: []
    });
    setTagInput("");
  };

  const addTag = () => {
    if (tagInput.trim() && !articleForm.tags.includes(tagInput.trim())) {
      setArticleForm({
        ...articleForm,
        tags: [...articleForm.tags, tagInput.trim()]
      });
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setArticleForm({
      ...articleForm,
      tags: articleForm.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleForm.title.trim() || !articleForm.content.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingArticle 
        ? `/api/knowledge-base/${editingArticle.id}`
        : '/api/knowledge-base';
      
      const method = editingArticle ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(articleForm)
      });

      if (response.ok) {
        await fetchArticles();
        closeModal();
      } else {
        const error = await response.json();
        console.error('Error saving article:', error);
      }
    } catch (error) {
      console.error('Error saving article:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteArticle = async (articleId: string) => {
    if (!confirm('Are you sure you want to delete this article?')) {
      return;
    }

    try {
      const response = await fetch(`/api/knowledge-base/${articleId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        await fetchArticles();
      } else {
        const error = await response.json();
        console.error('Error deleting article:', error);
      }
    } catch (error) {
      console.error('Error deleting article:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'hardware': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200';
      case 'software': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-200';
      case 'network': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-200';
      case 'access': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-200';
      case 'procedures': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const getUserDisplayName = (user: any) => {
    if (!user) return 'Unknown';
    
    // If user is a string (email or name)
    if (typeof user === 'string') {
      if (user.trim().length > 0) {
        return user.split(" ")[0];
      }
      return 'Unknown';
    }
    
    // If user is an object with firstName/lastName
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    // If user is an object with just firstName
    if (user.firstName) {
      return user.firstName;
    }
    
    // If user is an object with email
    if (user.email && typeof user.email === 'string') {
      return user.email.split('@')[0]; // Get username part of email
    }
    
    return 'Unknown';
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-64 relative z-20">
        <Header 
          title="Knowledge Base" 
          subtitle="Self-service solutions and documentation for common issues"
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header with Create Button */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Knowledge Base Articles
            </h1>
            {canManageArticles && (
              <Button
                onClick={openCreateModal}
                className="bg-black hover:bg-gray-800 text-white transition-all duration-200 ease-in-out hover:transform hover:scale-105 hover:shadow-md"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Article
              </Button>
            )}
          </div>

          {/* Search and Filters */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                <SearchIcon className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400" />
                Search Articles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                  <Input
                    placeholder="Search articles, tags, or content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="hardware">Hardware</option>
                  <option value="software">Software</option>
                  <option value="network">Network</option>
                  <option value="access">Access</option>
                  <option value="procedures">Procedures</option>
                </select>
                
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="transition-all duration-200 ease-in-out hover:transform hover:scale-105 hover:shadow-md"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600 dark:text-gray-400">
              Showing {filteredArticles.length} of {articles.length} articles
            </p>
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <Card 
                key={article.id}
                className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:scale-105 transition-all duration-200 ease-in-out cursor-pointer group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                        {article.content}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center ml-3">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className={getCategoryColor(article.category)}>
                      {article.category}
                    </Badge>
                    {article.tags.slice(0, 2).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {article.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{article.tags.length - 2} more
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4" />
                      <span>By {getUserDisplayName(article.author)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Updated {new Date(article.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4" />
                      <span>{article.views} views</span>
                    </div>
                  </div>

                  {/* Action Buttons for Admins/Managers */}
                  {canManageArticles && (
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(article);
                        }}
                        className="text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <EditIcon className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteArticle(article.id);
                        }}
                        className="text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700"
                      >
                        <TrashIcon className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No articles found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm || categoryFilter !== "all"
                    ? "Try adjusting your search terms or category filter"
                    : "Get started by creating your first knowledge base article"}
                </p>
                {canManageArticles && (
                  <Button
                    onClick={openCreateModal}
                    className="mt-4 bg-black hover:bg-gray-800 text-white"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create First Article
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Create/Edit Article Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl bg-white dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                {editingArticle ? 'Edit Article' : 'Create New Article'}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeModal}
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-gray-900 dark:text-white">
                    Article Title *
                  </Label>
                  <Input
                    id="title"
                    value={articleForm.title}
                    onChange={(e) => setArticleForm({...articleForm, title: e.target.value})}
                    placeholder="Enter article title..."
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-gray-900 dark:text-white">
                    Category *
                  </Label>
                  <select
                    id="category"
                    value={articleForm.category}
                    onChange={(e) => setArticleForm({...articleForm, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="hardware">Hardware</option>
                    <option value="software">Software</option>
                    <option value="network">Network</option>
                    <option value="access">Access</option>
                    <option value="procedures">Procedures</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content" className="text-gray-900 dark:text-white">
                    Content *
                  </Label>
                  <Textarea
                    id="content"
                    value={articleForm.content}
                    onChange={(e) => setArticleForm({...articleForm, content: e.target.value})}
                    placeholder="Enter article content..."
                    rows={8}
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white resize-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-gray-900 dark:text-white">
                    Tags
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add a tag..."
                      className="flex-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button
                      type="button"
                      onClick={addTag}
                      variant="outline"
                      className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      Add
                    </Button>
                  </div>
                  
                  {articleForm.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {articleForm.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                          >
                            <XIcon className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeModal}
                    className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !articleForm.title.trim() || !articleForm.content.trim()}
                    className="bg-black hover:bg-gray-800 text-white disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : (editingArticle ? 'Update Article' : 'Create Article')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
