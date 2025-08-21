import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { SLAStatus } from "@/components/dashboard/sla-status";
import { TeamStatus } from "@/components/dashboard/team-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, User } from "@/types";
import { 
  PlusIcon, 
  ClockIcon, 
  UserIcon, 
  ArrowRightIcon,
  CalendarIcon,
  AlertTriangleIcon,
  ListIcon
} from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();

  // Fetch recent tickets
  const { data: recentTickets, isLoading: ticketsLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
    retry: false,
  });

  // Fetch user data
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'pending': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusDisplay = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getPriorityDisplay = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const getFirstNameDisplay = (u?: { firstName?: string; lastName?: string }) => {
    if (u?.firstName && u.firstName.trim().length > 0) {
      return u.firstName.split(" ")[0];
    }
    if (u?.lastName && u.lastName.trim().length > 0) {
      return u.lastName.split(" ")[0];
    }
    return 'User';
  };

  const getUserName = (user: { firstName?: string; lastName?: string; email?: string }) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || 'Unknown User';
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-64 relative z-20">
        <Header 
          title="Dashboard" 
          subtitle="Welcome back! Here's what's happening with your tickets."
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {getFirstNameDisplay(currentUser)}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Here's an overview of your help desk system
            </p>
          </div>

          {/* Metrics Cards - Only for IT staff, managers, and admins */}
          {user?.role && ['it_staff', 'manager', 'admin'].includes(user.role) && (
            <MetricsCards />
          )}

          {/* SLA Status - Only for IT staff, managers, and admins */}
          {user?.role && ['it_staff', 'manager', 'admin'].includes(user.role) && (
            <div className="mb-8">
              <SLAStatus />
            </div>
          )}

          {/* Team Status - Only for IT staff, managers, and admins */}
          {user?.role && ['it_staff', 'manager', 'admin'].includes(user.role) && (
            <div className="mb-8">
              <TeamStatus />
            </div>
          )}

          {/* Recent Tickets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Tickets</CardTitle>
                <Link href="/tickets">
                  <Button variant="outline" size="sm">
                    View All
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {ticketsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : recentTickets && recentTickets.length > 0 ? (
                  <div className="space-y-4">
                    {recentTickets.slice(0, 5).map((ticket) => (
                      <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getStatusColor(ticket.status)}>
                              {getStatusDisplay(ticket.status)}
                            </Badge>
                            <Badge className={getPriorityColor(ticket.priority)}>
                              {getPriorityDisplay(ticket.priority)}
                            </Badge>
                          </div>
                          <h4 className="font-medium text-sm mb-1 line-clamp-1">
                            {ticket.title}
                          </h4>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <UserIcon className="w-3 h-3" />
                              {getUserName(ticket.createdBy)}
                            </span>
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3" />
                              {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <Link href={`/ticket/${ticket.id}`}>
                          <Button variant="ghost" size="sm">
                            <ArrowRightIcon className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <AlertTriangleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No tickets found
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex space-x-4">
                    <Link href="/create-ticket">
                      <Button className="transition-all duration-200 ease-in-out hover:transform hover:scale-105 hover:shadow-lg">
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Create Ticket
                      </Button>
                    </Link>
                    <Link href="/tickets">
                      <Button variant="outline" className="transition-all duration-200 ease-in-out hover:transform hover:scale-105 hover:shadow-md">
                        <ListIcon className="w-4 h-4 mr-2" />
                        View Tickets
                      </Button>
                    </Link>
                  </div>
                  
                  <Link href="/tickets">
                    <Button variant="outline" className="w-full justify-start" size="lg">
                      <ClockIcon className="w-5 h-5 mr-3" />
                      View My Tickets
                    </Button>
                  </Link>

                  {user?.role && ['it_staff', 'manager', 'admin'].includes(user.role) && (
                    <>
                      <Link href="/ticket-queue">
                        <Button variant="outline" className="w-full justify-start" size="lg">
                          <ClockIcon className="w-5 h-5 mr-3" />
                          Ticket Queue
                        </Button>
                      </Link>
                      
                      <Link href="/team-workload">
                        <Button variant="outline" className="w-full justify-start" size="lg">
                          <UserIcon className="w-5 h-5 mr-3" />
                          Team Workload
                        </Button>
                      </Link>
                      
                      <Link href="/reports">
                        <Button variant="outline" className="w-full justify-start" size="lg">
                          <AlertTriangleIcon className="w-5 h-5 mr-3" />
                          Reports & Analytics
                        </Button>
                      </Link>
                    </>
                  )}

                  {user?.role === 'admin' && (
                    <Link href="/user-management">
                      <Button variant="outline" className="w-full justify-start" size="lg">
                        <UserIcon className="w-5 h-5 mr-3" />
                        User Management
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
