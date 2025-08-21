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
import { PlusIcon, SearchIcon, FilterIcon } from "lucide-react";
import { Link } from "wouter";
import TicketCard from "@/components/tickets/ticket-card";
import { Ticket } from "@/types";

export default function Tickets() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const queryClient = useQueryClient();

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

  const queryParams = new URLSearchParams();
  if (search) queryParams.append('search', search);
  if (statusFilter !== 'all') queryParams.append('status', statusFilter);
  if (priorityFilter !== 'all') queryParams.append('priority', priorityFilter);
  if (categoryFilter !== 'all') queryParams.append('category', categoryFilter);

  const { data: tickets, isLoading: ticketsLoading, error: ticketsError } = useQuery({
    queryKey: ["/api/tickets", search, statusFilter, priorityFilter, categoryFilter],
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
    enabled: isAuthenticated,
    retry: false,
    refetchInterval: 5000, // Refresh every 5 seconds to show new tickets
  });

  const deleteTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to delete ticket');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ticket deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete ticket",
        variant: "destructive",
      });
    },
  });

  const handleDeleteTicket = (ticketId: string) => {
    deleteTicketMutation.mutate(ticketId);
  };

  // Handle unauthorized errors
  useEffect(() => {
    if (ticketsError && isUnauthorizedError(ticketsError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [ticketsError, toast]);

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
          title="Tickets" 
          subtitle="Manage and track all support tickets" 
        />
        
        <main className="p-6">
          {/* Filters and Search */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search tickets
                </label>
                <div className="relative">
                  <SearchIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="Search by title or description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-tickets"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
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
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
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
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
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
                </div>
              </div>
              
              <Link href="/create-ticket">
                <Button data-testid="button-create-ticket" className="transition-all duration-200 ease-in-out hover:transform hover:scale-105 hover:shadow-lg">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Ticket
                </Button>
              </Link>
            </div>
          </div>

          {/* Tickets List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {ticketsLoading ? "Loading..." : `${tickets?.length || 0} tickets found`}
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <FilterIcon className="w-4 h-4" />
                  <span>Filtered results</span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {ticketsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : tickets && tickets.length > 0 ? (
                <div className="space-y-4">
                  {tickets.map((ticket: Ticket) => (
                    <TicketCard 
                      key={ticket.id} 
                      ticket={ticket} 
                      showDetails 
                      onDelete={() => handleDeleteTicket(ticket.id)}
                      currentUserId={user?.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FilterIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No tickets found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    {search || statusFilter || priorityFilter || categoryFilter
                      ? "Try adjusting your search filters"
                      : "Create your first ticket to get started"
                    }
                  </p>
                  <Link href="/create-ticket">
                    <Button data-testid="button-create-first-ticket">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Create Ticket
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
