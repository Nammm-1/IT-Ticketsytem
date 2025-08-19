import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import TicketCard from "@/components/tickets/ticket-card";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusIcon, SearchIcon, FilterIcon } from "lucide-react";
import { Link } from "wouter";

export default function Tickets() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

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
  if (statusFilter) queryParams.append('status', statusFilter);
  if (priorityFilter) queryParams.append('priority', priorityFilter);
  if (categoryFilter) queryParams.append('category', categoryFilter);

  const { data: tickets, isLoading: ticketsLoading, error: ticketsError } = useQuery({
    queryKey: ["/api/tickets", search, statusFilter, priorityFilter, categoryFilter],
    enabled: isAuthenticated,
    retry: false,
  });

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
                    <SelectTrigger data-testid="select-status-filter">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger data-testid="select-priority-filter">
                      <SelectValue placeholder="All priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All priorities</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger data-testid="select-category-filter">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All categories</SelectItem>
                      <SelectItem value="hardware">Hardware</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="network">Network</SelectItem>
                      <SelectItem value="access">Access</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Link href="/create-ticket">
                <Button data-testid="button-create-ticket">
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
                  {tickets.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} showDetails />
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
