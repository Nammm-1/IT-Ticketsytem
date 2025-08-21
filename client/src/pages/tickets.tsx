import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  PlusIcon, 
  SearchIcon,
  FilterIcon,
  TicketIcon,
  ClockIcon,
  AlertTriangleIcon,
  CalendarIcon,
  UserIcon
} from "lucide-react";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdBy: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
}

export default function Tickets() {
  const [, setLocation] = useLocation();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, statusFilter, priorityFilter, categoryFilter]);

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/tickets');
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = tickets;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.category === categoryFilter);
    }

    setFilteredTickets(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'pending': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'hardware': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200';
      case 'software': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-200';
      case 'network': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-200';
      case 'access': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <PlusIcon className="h-4 w-4" />;
      case 'in_progress': return <ClockIcon className="h-4 w-4" />;
      case 'pending': return <AlertTriangleIcon className="h-4 w-4" />;
      case 'resolved': return <CalendarIcon className="h-4 w-4" />;
      case 'closed': return <CalendarIcon className="h-4 w-4" />;
      default: return <TicketIcon className="h-4 w-4" />;
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
    setStatusFilter("all");
    setPriorityFilter("all");
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
          title="Support Tickets" 
          subtitle="Manage and track all support requests"
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Filters and Search */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                <FilterIcon className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400" />
                Filters and Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                
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
              Showing {filteredTickets.length} of {tickets.length} tickets
            </p>
          </div>

          {/* Tickets Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTickets.map((ticket) => (
              <Card 
                key={ticket.id}
                className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:scale-105 transition-all duration-200 ease-in-out cursor-pointer"
                onClick={() => setLocation(`/ticket/${ticket.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
                        {ticket.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                        {ticket.description}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center ml-3">
                      {getStatusIcon(ticket.status)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                    <Badge className={getCategoryColor(ticket.category)}>
                      {ticket.category}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4" />
                      <span>Created by {getUserDisplayName(ticket.createdBy)}</span>
                    </div>
                    {ticket.assignedTo && (
                      <div className="flex items-center space-x-2">
                        <UserIcon className="h-4 w-4" />
                        <span>Assigned to {getUserDisplayName(ticket.assignedTo)}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTickets.length === 0 && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No tickets found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm || statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all"
                    ? "Try adjusting your filters or search terms"
                    : "Get started by creating your first ticket"}
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
