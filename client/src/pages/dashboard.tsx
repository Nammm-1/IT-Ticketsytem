import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import MetricsCards from "@/components/dashboard/metrics-cards";
import TeamStatus from "@/components/dashboard/team-status";
import SLAStatus from "@/components/dashboard/sla-status";
import TicketCard from "@/components/tickets/ticket-card";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { PlusIcon, BookOpenIcon, BarChart3Icon } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

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

  const { data: recentTickets, isLoading: ticketsLoading, error: ticketsError } = useQuery({
    queryKey: ["/api/tickets"],
    queryParams: { limit: 5 },
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
          title="Dashboard" 
          subtitle="Welcome back, manage your IT support tickets efficiently" 
        />
        
        <main className="p-6">
          {/* Metrics Cards */}
          <MetricsCards />

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Tickets */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Tickets</h3>
                  <Link href="/tickets">
                    <Button variant="ghost" size="sm" data-testid="button-view-all-tickets">
                      View All
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {ticketsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : recentTickets && recentTickets.length > 0 ? (
                  <div className="space-y-4">
                    {recentTickets.map((ticket) => (
                      <TicketCard key={ticket.id} ticket={ticket} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No tickets found</p>
                    <Link href="/create-ticket">
                      <Button className="mt-4" data-testid="button-create-first-ticket">
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Create Your First Ticket
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link href="/create-ticket">
                    <Button className="w-full justify-center" data-testid="button-create-ticket">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Create New Ticket
                    </Button>
                  </Link>
                  <Link href="/knowledge-base">
                    <Button variant="outline" className="w-full justify-center" data-testid="button-knowledge-base">
                      <BookOpenIcon className="w-4 h-4 mr-2" />
                      Browse Knowledge Base
                    </Button>
                  </Link>
                  {user?.role && ['it_staff', 'manager', 'admin'].includes(user.role) && (
                    <Button variant="outline" className="w-full justify-center" data-testid="button-generate-report">
                      <BarChart3Icon className="w-4 h-4 mr-2" />
                      Generate Report
                    </Button>
                  )}
                </div>
              </div>

              {/* Team Status - Only for IT staff and above */}
              {user?.role && ['it_staff', 'manager', 'admin'].includes(user.role) && (
                <TeamStatus />
              )}

              {/* SLA Status - Only for IT staff and above */}
              {user?.role && ['it_staff', 'manager', 'admin'].includes(user.role) && (
                <SLAStatus />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
