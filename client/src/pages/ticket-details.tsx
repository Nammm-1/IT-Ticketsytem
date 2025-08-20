import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import { 
  ArrowLeftIcon, 
  CloudUploadIcon, 
  DownloadIcon, 
  TrashIcon, 
  PaperclipIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon
} from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface TicketAttachment {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  uploadedBy: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

interface TicketComment {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  assignedTo?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
  createdBy: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  comments: TicketComment[];
  attachments: TicketAttachment[];
}

export default function TicketDetails() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [ticketId, setTicketId] = useState<string>("");
  const [newComment, setNewComment] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Get ticket ID from URL
  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const ticketIndex = pathParts.indexOf('ticket');
    if (ticketIndex !== -1 && ticketIndex + 1 < pathParts.length) {
      setTicketId(pathParts[ticketIndex + 1]);
    }
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

  const { data: ticket, isLoading: ticketLoading, error: ticketError } = useQuery<Ticket>({
    queryKey: ["/api/tickets", ticketId],
    enabled: Boolean(ticketId),
    retry: false,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (ticketError && isUnauthorizedError(ticketError as Error)) {
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
  }, [ticketError, toast]);

  const updateTicketMutation = useMutation({
    mutationFn: async (updates: Partial<Ticket>) => {
      const response = await apiRequest("PATCH", `/api/tickets/${ticketId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ticket updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
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
        description: "Failed to update ticket",
        variant: "destructive",
      });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (commentData: { content: string; isInternal: boolean }) => {
      const response = await apiRequest("POST", `/api/tickets/${ticketId}/comments`, commentData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
      setNewComment("");
      setIsInternalComment(false);
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
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
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  const uploadAttachmentsMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("attachments", file);
      });
      
      // For file uploads, we need to send without credentials to avoid CORS issues
      const response = await fetch(`/api/tickets/${ticketId}/attachments`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Attachments uploaded successfully",
      });
      setSelectedFiles([]);
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
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
        description: "Failed to upload attachments",
        variant: "destructive",
      });
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      const response = await apiRequest("DELETE", `/api/tickets/${ticketId}/attachments/${attachmentId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Attachment deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
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
        description: "Failed to delete attachment",
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    addCommentMutation.mutate({
      content: newComment.trim(),
      isInternal: isInternalComment,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUploadAreaClick = () => {
    console.log('Upload area clicked!'); // Debug log
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    } else {
      console.error('File input not found!');
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

  const handleUploadAttachments = () => {
    if (selectedFiles.length === 0) return;
    uploadAttachmentsMutation.mutate(selectedFiles);
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    if (confirm("Are you sure you want to delete this attachment?")) {
      deleteAttachmentMutation.mutate(attachmentId);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getUserName = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.email) {
      return user.email;
    }
    return "Unknown User";
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      pending: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      closed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    };
    return colors[status as keyof typeof colors] || colors.new;
  };

  const getStatusDisplay = (status: string) => {
    const displays = {
      new: "New",
      in_progress: "In Progress",
      pending: "Pending",
      resolved: "Resolved",
      closed: "Closed",
    };
    return displays[status as keyof typeof displays] || status;
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

  if (ticketLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Header title="Loading..." subtitle="Please wait..." />
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Header title="Ticket Not Found" subtitle="The requested ticket could not be found" />
          <div className="p-6">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  The ticket you're looking for doesn't exist or you don't have permission to view it.
                </p>
                <Link href="/tickets">
                  <Button>Back to Tickets</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <Header 
          title={`Ticket #${ticket?.id?.slice(0, 8)}`}
          subtitle={ticket?.title}
        />
        
        <main className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/tickets">
              <Button variant="ghost" size="sm">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Tickets
              </Button>
            </Link>
            
            {/* Delete Button - only show for tickets user can delete */}
            {ticket?.createdBy?.id === user?.id && ticket?.status === 'new' && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete this ticket? This action cannot be undone.`)) {
                    // Redirect to tickets page after deletion
                    window.location.href = '/tickets';
                  }
                }}
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete Ticket
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Ticket Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Ticket Information */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{ticket?.title}</CardTitle>
                    <div className="flex space-x-2">
                      <Badge className={getPriorityColor(ticket?.priority || '')}>
                        {ticket?.priority?.charAt(0).toUpperCase() + ticket?.priority?.slice(1)}
                      </Badge>
                      <Badge className={getStatusColor(ticket?.status || '')}>
                        {getStatusDisplay(ticket?.status || '')}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {ticket?.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Category:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400 capitalize">{ticket?.category}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Created:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {formatDistanceToNow(new Date(ticket?.createdAt || ''), { addSuffix: true })}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Created by:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {getUserName(ticket?.createdBy)}
                      </span>
                    </div>
                    {ticket?.assignedTo && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Assigned to:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">
                          {getUserName(ticket?.assignedTo)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status Update */}
                  {ticket?.status !== 'resolved' && ticket?.status !== 'closed' && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Update Status:
                        </span>
                        <Select 
                          value={ticket?.status} 
                          onValueChange={(value) => updateTicketMutation.mutate({ status: value })}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Comments */}
              <Card>
                <CardHeader>
                  <CardTitle>Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitComment} className="mb-6">
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                      />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isInternalComment}
                            onChange={(e) => setIsInternalComment(e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Internal note (only visible to IT staff)
                          </span>
                        </label>
                        <Button type="submit" disabled={!newComment.trim() || addCommentMutation.isPending}>
                          {addCommentMutation.isPending ? "Adding..." : "Add Comment"}
                        </Button>
                      </div>
                    </div>
                  </form>

                  <div className="space-y-4">
                    {ticket?.comments?.map((comment: TicketComment) => (
                      <div key={comment.id} className="border-l-4 border-gray-200 dark:border-gray-700 pl-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {getUserName(comment.user)}
                            </span>
                            {comment.isInternal && (
                              <Badge variant="secondary" className="text-xs">
                                Internal
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Attachments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PaperclipIcon className="w-4 h-4 mr-2" />
                    Attachments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Upload New Attachments */}
                  <div className="space-y-3">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      accept=".jpg,.jpeg,.png,.pdf,.txt,.log,.doc,.docx,.xls,.xlsx"
                    />
                    <label htmlFor="file-upload" className="block">
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 ${
                          isDragOver
                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        <CloudUploadIcon className={`w-6 h-6 mx-auto mb-2 ${
                          isDragOver ? 'text-blue-500' : 'text-gray-400'
                        }`} />
                        <p className={`text-sm ${
                          isDragOver 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {isDragOver ? 'Drop files here' : 'Drop files here or click to browse'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Max 10MB per file
                        </p>
                      </div>
                    </label>
                    
                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Selected files ({selectedFiles.length}):
                        </p>
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span className="truncate">{file.name}</span>
                            <span className="text-xs">({formatFileSize(file.size)})</span>
                          </div>
                        ))}
                        <Button 
                          onClick={handleUploadAttachments}
                          disabled={uploadAttachmentsMutation.isPending}
                          size="sm"
                          className="w-full"
                        >
                          {uploadAttachmentsMutation.isPending ? "Uploading..." : "Upload Files"}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Existing Attachments */}
                  {ticket?.attachments?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Attached files:
                      </p>
                      {ticket?.attachments?.map((attachment: TicketAttachment) => (
                        <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <div className="flex items-center space-x-2 min-w-0">
                            <PaperclipIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm text-gray-900 dark:text-white truncate">
                                {attachment.fileName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatFileSize(attachment.fileSize)} • {getUserName(attachment.uploadedBy)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(`/api/tickets/${ticketId}/attachments/${attachment.id}/download`, '_blank')}
                            >
                              <DownloadIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteAttachment(attachment.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ticket Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Ticket Created</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(ticket?.createdAt || ''), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  {ticket?.updatedAt !== ticket?.createdAt && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-gray-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Last Updated</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(ticket?.updatedAt || ''), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {ticket?.resolvedAt && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Resolved</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(ticket?.resolvedAt || ''), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
