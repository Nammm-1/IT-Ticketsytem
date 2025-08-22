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
import { ArrowLeftIcon, CloudUploadIcon, XIcon, PaperclipIcon } from "lucide-react";
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
    contactPhone: "",
    contactPreference: "email",
    location: "",
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Inject CSS to force dropdown backgrounds to be opaque
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .select-content {
        background-color: white !important;
        background: white !important;
        opacity: 1 !important;
      }
      .dark .select-content {
        background-color: rgb(31, 41, 55) !important;
        background: rgb(31, 41, 55) !important;
        opacity: 1 !important;
      }
      .select-item {
        background-color: white !important;
        background: white !important;
        opacity: 1 !important;
      }
      .dark .select-item {
        background-color: rgb(31, 41, 55) !important;
        background: rgb(31, 41, 55) !important;
        opacity: 1 !important;
      }
      .select-trigger {
        background-color: white !important;
        background: white !important;
        opacity: 1 !important;
      }
      .dark .select-trigger {
        background-color: rgb(31, 41, 55) !important;
        background: rgb(31, 41, 55) !important;
        opacity: 1 !important;
      }
      [data-radix-popper-content-wrapper] {
        background-color: white !important;
        background: white !important;
        opacity: 1 !important;
      }
      .dark [data-radix-popper-content-wrapper] {
        background-color: rgb(31, 41, 55) !important;
        background: rgb(31, 41, 55) !important;
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
    mutationFn: async (ticketData: typeof formData & { files: File[] }) => {
      // First create the ticket
      const response = await apiRequest("POST", "/api/tickets", {
        title: ticketData.title,
        description: ticketData.description,
        category: ticketData.category,
        priority: ticketData.priority,
        contactPhone: ticketData.contactPhone,
        contactPreference: ticketData.contactPreference,
        location: ticketData.location,
      });
      
      const ticket = await response.json();
      
      // Then upload attachments if any
      if (ticketData.files.length > 0) {
        const formData = new FormData();
        ticketData.files.forEach((file) => {
          formData.append("attachments", file);
        });
        
        await fetch(`/api/tickets/${ticket.id}/attachments`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });
      }
      
      return ticket;
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

    createTicketMutation.mutate({ ...formData, files: selectedFiles });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
                        <SelectTrigger data-testid="select-ticket-category" className="!bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 !text-gray-900 dark:!text-white shadow-sm">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="!bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 shadow-xl z-50">
                          <SelectItem value="hardware" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Hardware</SelectItem>
                          <SelectItem value="software" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Software</SelectItem>
                          <SelectItem value="network" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Network</SelectItem>
                          <SelectItem value="access" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Access</SelectItem>
                          <SelectItem value="other" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Priority *
                      </label>
                      <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                        <SelectTrigger data-testid="select-ticket-priority" className="!bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 !text-gray-900 dark:!text-white shadow-sm">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent className="!bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 shadow-xl z-50">
                          <SelectItem value="low" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Low</SelectItem>
                          <SelectItem value="medium" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Medium</SelectItem>
                          <SelectItem value="high" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">High</SelectItem>
                          <SelectItem value="critical" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Critical</SelectItem>
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

                  {/* Contact Information Section */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Contact Information
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Help IT support reach you for additional information or updates
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Phone Number / Email
                        </label>
                        <Input
                          type="tel"
                          placeholder="+1 (555) 123-4567 or email@example.com"
                          value={formData.contactPhone}
                          onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                          data-testid="input-contact-phone"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Preferred Contact Method
                        </label>
                        <Select value={formData.contactPreference} onValueChange={(value) => handleInputChange("contactPreference", value)}>
                          <SelectTrigger data-testid="select-contact-preference" className="!bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 !text-gray-900 dark:!text-white shadow-sm">
                            <SelectValue placeholder="Select preference" />
                          </SelectTrigger>
                          <SelectContent className="!bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 shadow-xl z-50">
                            <SelectItem value="email" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Email</SelectItem>
                            <SelectItem value="phone" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Phone</SelectItem>
                            <SelectItem value="both" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Both</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Location/Department
                        </label>
                        <Input
                          type="text"
                          placeholder="e.g., 3rd Floor, Marketing Dept, Remote"
                          value={formData.location}
                          onChange={(e) => handleInputChange("location", e.target.value)}
                          data-testid="input-location"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Attachments
                    </label>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.pdf,.txt,.log,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileSelect}
                      id="file-upload-create"
                      data-testid="input-ticket-attachments"
                    />
                    <label htmlFor="file-upload-create" className="block">
                      <div 
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                          isDragOver 
                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        data-testid="dropzone-ticket-attachments"
                      >
                        <CloudUploadIcon className={`w-8 h-8 mx-auto mb-2 ${
                          isDragOver ? 'text-blue-500' : 'text-gray-400'
                        }`} />
                        <p className={`text-sm mb-1 ${
                          isDragOver 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {isDragOver ? 'Drop files here' : 'Drop files here or click to browse'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Support for images, documents, and logs (max 10MB)
                        </p>
                      </div>
                    </label>

                    {/* Selected Files Preview */}
                    {selectedFiles.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Selected files ({selectedFiles.length}):
                        </p>
                        <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center bg-white dark:bg-gray-700 rounded-md p-2 shadow-sm">
                              <PaperclipIcon className="w-4 h-4 text-gray-500 mr-2" />
                              <div className="text-sm text-gray-800 dark:text-gray-200 max-w-32 truncate">
                                {file.name}
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                ({formatFileSize(file.size)})
                              </span>
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                                data-testid={`button-remove-attachment-${index}`}
                              >
                                <XIcon className="w-4 h-4 text-gray-500 hover:text-red-500" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setLocation("/tickets")}
                      className="transition-all duration-200 ease-in-out hover:transform hover:scale-105 hover:shadow-md"
                      data-testid="button-cancel-ticket"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createTicketMutation.isPending}
                      className="transition-all duration-200 ease-in-out hover:transform hover:scale-105 hover:shadow-lg disabled:hover:transform-none disabled:hover:shadow-none"
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
