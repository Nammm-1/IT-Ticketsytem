import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Comment, Attachment } from "@/types";
import { 
  SearchIcon, 
  FilterIcon, 
  ClockIcon, 
  UserIcon, 
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  UserCheckIcon,
  InboxIcon,
  SettingsIcon
} from "lucide-react";
import { Link } from "wouter";

export default function TicketQueue() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const queryClient = useQueryClient();

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
        title: "Authentication Required",
        description: "Please log in to access the ticket queue.",
        variant: "destructive",
      });
      window.location.href = "/api/login";
    }
  }, [isLoading, isAuthenticated, toast]);

  // Check if user has access to ticket queue
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (!['it_staff', 'manager', 'admin'].includes(user.role)) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the ticket queue.",
          variant: "destructive",
        });
        window.location.href = "/";
      }
    }
  }, [isLoading, isAuthenticated, user, toast]);

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (search) queryParams.append('search', search);
  if (statusFilter !== 'all') queryParams.append('status', statusFilter);
  if (priorityFilter !== 'all') queryParams.append('priority', priorityFilter);
  if (categoryFilter !== 'all') queryParams.append('category', categoryFilter);
  if (assignedFilter !== 'all') queryParams.append('assignedToId', assignedFilter);
  queryParams.append('sortBy', sortBy);
  queryParams.append('sortOrder', sortOrder);

  const { data: tickets, isLoading: ticketsLoading, error: ticketsError } = useQuery({
    queryKey: ["/api/tickets", search, statusFilter, priorityFilter, categoryFilter, assignedFilter, sortBy, sortOrder],
    queryFn: async () => {
      const url = `/api/tickets${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }
      return response.json();
    },
    enabled: isAuthenticated && ['it_staff', 'manager', 'admin'].includes(user?.role || ''),
    retry: false,
    refetchInterval: 10000, // Refresh every 10 seconds
  });



  const assignTicketMutation = useMutation({
    mutationFn: async ({ ticketId, assignedToId }: { ticketId: string; assignedToId: string }) => {
      const response = await fetch(`/api/tickets/${ticketId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignedToId }),
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to assign ticket');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ticket assigned successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to assign ticket",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status, assignedToId }: { ticketId: string; status: string; assignedToId?: string }) => {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, ...(assignedToId && { assignedToId }) }),
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to update ticket status');
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      if (variables.assignedToId) {
        toast({
          title: "Success",
          description: "Ticket assigned to you and status updated to In Progress",
        });
      } else {
        toast({
          title: "Success",
          description: "Ticket status updated successfully",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive",
      });
    },
  });

  const handleAssignTicket = (ticketId: string, assignedToId: string) => {
    assignTicketMutation.mutate({ ticketId, assignedToId });
  };

  const handleUpdateStatus = (ticketId: string, status: string) => {
    updateStatusMutation.mutate({ ticketId, status });
  };

  const handleStartWorking = (ticketId: string) => {
    // Update both status and assign to current user
    updateStatusMutation.mutate({ 
      ticketId, 
      status: 'in_progress',
      assignedToId: user?.id 
    });
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
      pending: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
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

  const getPriorityDisplay = (priority: string) => {
    const displays = {
      low: "Low",
      medium: "Medium",
      high: "High",
      critical: "Critical",
    };
    return displays[priority as keyof typeof displays] || priority;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Handle unauthorized errors
  useEffect(() => {
    if (ticketsError && isUnauthorizedError(ticketsError as Error)) {
      toast({
        title: "Authentication Required",
        description: "Please log in again to continue.",
        variant: "destructive",
      });
      window.location.href = "/api/login";
    }
  }, [ticketsError, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!['it_staff', 'manager', 'admin'].includes(user?.role || '')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">You don't have permission to access the ticket queue.</p>
          <Button className="mt-4" onClick={() => window.location.href = "/"}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-64 relative z-20">
        <Header 
          title="Ticket Queue" 
          subtitle="Manage and prioritize support tickets"
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Filters and Search */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <SearchIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search tickets..."
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    data-testid="input-ticket-queue-search"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status-filter" className="!bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 !text-gray-900 dark:!text-white shadow-sm">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent className="!bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 shadow-xl z-50">
                    <SelectItem value="all" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">All statuses</SelectItem>
                    <SelectItem value="new" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">New</SelectItem>
                    <SelectItem value="in_progress" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">In Progress</SelectItem>
                    <SelectItem value="pending" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Pending</SelectItem>
                    <SelectItem value="resolved" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Resolved</SelectItem>
                    <SelectItem value="closed" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Closed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger data-testid="select-priority-filter" className="!bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 !text-gray-900 dark:!text-white shadow-sm">
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent className="!bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 shadow-xl z-50">
                    <SelectItem value="all" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">All priorities</SelectItem>
                    <SelectItem value="low" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Low</SelectItem>
                    <SelectItem value="medium" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Medium</SelectItem>
                    <SelectItem value="high" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">High</SelectItem>
                    <SelectItem value="critical" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Critical</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger data-testid="select-category-filter" className="!bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 !text-gray-900 dark:!text-white shadow-sm">
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

                <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                  <SelectTrigger data-testid="select-assigned-filter" className="!bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 !text-gray-900 dark:!text-white shadow-sm">
                    <SelectValue placeholder="All assignments" />
                  </SelectTrigger>
                  <SelectContent className="!bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 shadow-xl z-50">
                    <SelectItem value="all" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">All assignments</SelectItem>
                    <SelectItem value="unassigned" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Unassigned</SelectItem>
                    <SelectItem value="assigned" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Assigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 !bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 !text-gray-900 dark:!text-white shadow-sm">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="!bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 shadow-xl z-50">
                  <SelectItem value="createdAt" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Created Date</SelectItem>
                  <SelectItem value="priority" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Priority</SelectItem>
                  <SelectItem value="status" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Status</SelectItem>
                  <SelectItem value="updatedAt" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Last Updated</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                data-testid="button-sort-order"
              >
                {sortOrder === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </Button>
            </div>
          </div>

          {/* Ticket Queue */}
          <div className="space-y-4">
            {ticketsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Loading tickets...</p>
              </div>
            ) : ticketsError ? (
              <div className="text-center py-8 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg p-6 shadow-sm">
                <AlertTriangleIcon className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
                <p className="text-red-800 dark:text-red-100 font-medium">Failed to load tickets</p>
                <p className="text-sm text-red-700 dark:text-red-200 mt-2">{ticketsError.toString()}</p>
              </div>
            ) : tickets && tickets.length > 0 ? (
              tickets.map((ticket: Ticket) => (
                <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Link href={`/ticket/${ticket.id}`}>
                            <Button variant="ghost" size="sm" className="p-0 h-auto">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary">
                                {ticket.title}
                              </h3>
                            </Button>
                          </Link>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {getPriorityDisplay(ticket.priority)}
                          </Badge>
                          <Badge className={getStatusColor(ticket.status)}>
                            {getStatusDisplay(ticket.status)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <UserIcon className="w-4 h-4" />
                            <span>{ticket.createdBy.firstName} {ticket.createdBy.lastName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" />
                            <span>{getTimeAgo(ticket.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="capitalize">{ticket.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {ticket.assignedTo ? (
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                              <UserCheckIcon className="w-4 h-4" />
                              <span>Assigned to {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}</span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              {ticket.assignedTo.role}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Unassigned</div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAssignTicket(ticket.id, user?.id || '')}
                              disabled={assignTicketMutation.isPending}
                              data-testid={`button-assign-ticket-${ticket.id}`}
                            >
                              Assign to Me
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
                      {ticket.description}
                    </p>
                    
                    {/* Contact Information */}
                    {(ticket.contactPhone || ticket.contactPreference || ticket.bestTimeToContact || ticket.location) && (
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center mb-2">
                          <UserIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Contact Info</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          {ticket.contactPhone && (
                            <div>
                              <span className="font-medium text-blue-700 dark:text-blue-300">📞</span>
                              <span className="ml-1 text-blue-600 dark:text-blue-400">{ticket.contactPhone}</span>
                            </div>
                          )}
                          {ticket.contactPreference && (
                            <div>
                              <span className="font-medium text-blue-700 dark:text-blue-300">📧</span>
                              <span className="ml-1 text-blue-600 dark:text-blue-400 capitalize">{ticket.contactPreference}</span>
                            </div>
                          )}
                          {ticket.bestTimeToContact && (
                            <div>
                              <span className="font-medium text-blue-700 dark:text-blue-300">⏰</span>
                              <span className="ml-1 text-blue-600 dark:text-blue-400">{ticket.bestTimeToContact}</span>
                            </div>
                          )}
                          {ticket.location && (
                            <div>
                              <span className="font-medium text-blue-700 dark:text-blue-300">📍</span>
                              <span className="ml-1 text-blue-600 dark:text-blue-400">{ticket.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Link href={`/ticket/${ticket.id}`}>
                          <Button size="sm" variant="outline" data-testid={`button-view-ticket-${ticket.id}`}>
                            <EyeIcon className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </Link>

                        {ticket.status === 'new' && (
                          <Button
                            size="sm"
                            onClick={() => handleStartWorking(ticket.id)}
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-start-ticket-${ticket.id}`}
                          >
                            Start Working
                          </Button>
                        )}

                        {ticket.status === 'in_progress' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(ticket.id, 'pending')}
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-pause-ticket-${ticket.id}`}
                          >
                            Mark Pending
                          </Button>
                        )}

                        {['in_progress', 'pending'].includes(ticket.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(ticket.id, 'resolved')}
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-resolve-ticket-${ticket.id}`}
                          >
                            <CheckCircleIcon className="w-4 h-4 mr-1" />
                            Mark Resolved
                          </Button>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Created: {formatDate(ticket.createdAt)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <InboxIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tickets found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {search || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'
                    ? "Try adjusting your filters or search terms."
                    : "There are no tickets in the queue at the moment."}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
