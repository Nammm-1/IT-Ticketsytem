import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import { ArrowLeftIcon, CloudUploadIcon } from "lucide-react";
import { Link } from "wouter";

export default function CreateTicket() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "",
  });

  // Redirect to login if not authenticated
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

  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: typeof formData) => {
      const response = await apiRequest("POST", "/api/tickets", ticketData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ticket created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      setLocation("/tickets");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to create ticket",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category || !formData.priority) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createTicketMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <Header 
          title="Create New Ticket" 
          subtitle="Submit a new IT support request" 
        />
        
        <main className="p-6">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <Link href="/tickets">
                <Button variant="ghost" size="sm" data-testid="button-back-to-tickets">
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Back to Tickets
                </Button>
              </Link>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Ticket Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title *
                    </label>
                    <Input
                      type="text"
                      required
                      placeholder="Brief description of the issue"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      data-testid="input-ticket-title"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category *
                      </label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                        <SelectTrigger data-testid="select-ticket-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hardware">Hardware</SelectItem>
                          <SelectItem value="software">Software</SelectItem>
                          <SelectItem value="network">Network</SelectItem>
                          <SelectItem value="access">Access</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Priority *
                      </label>
                      <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                        <SelectTrigger data-testid="select-ticket-priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description *
                    </label>
                    <Textarea
                      required
                      rows={6}
                      placeholder="Detailed description of the issue, steps to reproduce, error messages, etc."
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      className="resize-none"
                      data-testid="textarea-ticket-description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Attachments
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                      <CloudUploadIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Drop files here or <Button type="button" variant="link" className="p-0 h-auto font-medium text-primary">browse</Button>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Support for images, documents, and logs (max 10MB)
                      </p>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.pdf,.txt,.log"
                        data-testid="input-ticket-attachments"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Link href="/tickets">
                      <Button type="button" variant="outline" data-testid="button-cancel-ticket">
                        Cancel
                      </Button>
                    </Link>
                    <Button 
                      type="submit" 
                      disabled={createTicketMutation.isPending}
                      data-testid="button-submit-ticket"
                    >
                      {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
