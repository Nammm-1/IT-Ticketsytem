import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3Icon,
  TrendingUpIcon,
  ClockIcon,
  UserIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  DownloadIcon,
  CalendarIcon,
  FilterIcon,
  RefreshCwIcon,
  InboxIcon
} from "lucide-react";
import { Link } from "wouter";

interface TicketMetrics {
  total: number;
  new: number;
  inProgress: number;
  pending: number;
  resolved: number;
  closed: number;
}

interface PriorityMetrics {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

interface CategoryMetrics {
  hardware: number;
  software: number;
  network: number;
  access: number;
  other: number;
}

interface UserMetrics {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role: string;
  ticketsAssigned: number;
  ticketsResolved: number;
  avgResolutionTime: number;
}

interface TimeMetrics {
  avgResolutionTime: number;
  avgFirstResponseTime: number;
  slaCompliance: number;
}

interface TeamMember {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: string;
  ticketsAssigned: number;
  ticketsResolved: number;
  ticketsInProgress: number;
  ticketsPending: number;
  avgResolutionTime: number;
  workloadPercentage: number;
  lastActive: string;
}

export default function Reports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [timeRange, setTimeRange] = useState("30d");
  const [reportType, setReportType] = useState("overview");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access reports.",
        variant: "destructive",
      });
      window.location.href = "/api/login";
    }
  }, [isLoading, isAuthenticated, toast]);

  // Check if user has access to reports
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (!['it_staff', 'manager', 'admin'].includes(user.role)) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access reports.",
          variant: "destructive",
        });
        window.location.href = "/";
      }
    }
  }, [isLoading, isAuthenticated, user, toast]);

  // Fetch tickets for metrics
  const { data: tickets, isLoading: ticketsLoading, error: ticketsError } = useQuery({
    queryKey: ["/api/tickets", timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/tickets`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }
      return response.json();
    },
    enabled: isAuthenticated && ['it_staff', 'manager', 'admin'].includes(user?.role || ''),
    retry: false,
  });

  // Fetch analytics data
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/analytics/metrics", timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/metrics`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      return response.json();
    },
    enabled: isAuthenticated && ['it_staff', 'manager', 'admin'].includes(user?.role || ''),
    retry: false,
  });

  // Fetch SLA performance
  const { data: slaPerformance, isLoading: slaLoading } = useQuery({
    queryKey: ["/api/analytics/sla-performance", timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/sla-performance`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch SLA performance');
      }
      return response.json();
    },
    enabled: isAuthenticated && ['it_staff', 'manager', 'admin'].includes(user?.role || ''),
    retry: false,
  });

  // Fetch team status
  const { data: teamStatus, isLoading: teamLoading } = useQuery({
    queryKey: ["/api/analytics/team-status", timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/team-status`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch team status');
      }
      return response.json();
    },
    enabled: isAuthenticated && ['it_staff', 'manager', 'admin'].includes(user?.role || ''),
    retry: false,
  });

  // Calculate metrics from tickets data
  const calculateMetrics = (): {
    ticketMetrics: TicketMetrics;
    priorityMetrics: PriorityMetrics;
    categoryMetrics: CategoryMetrics;
  } => {
    if (!tickets || !Array.isArray(tickets)) {
      return {
        ticketMetrics: { total: 0, new: 0, inProgress: 0, pending: 0, resolved: 0, closed: 0 },
        priorityMetrics: { low: 0, medium: 0, high: 0, critical: 0 },
        categoryMetrics: { hardware: 0, software: 0, network: 0, access: 0, other: 0 }
      };
    }

    const ticketMetrics: TicketMetrics = {
      total: tickets.length,
      new: tickets.filter((t: any) => t.status === 'new').length,
      inProgress: tickets.filter((t: any) => t.status === 'in_progress').length,
      pending: tickets.filter((t: any) => t.status === 'pending').length,
      resolved: tickets.filter((t: any) => t.status === 'resolved').length,
      closed: tickets.filter((t: any) => t.status === 'closed').length,
    };

    const priorityMetrics: PriorityMetrics = {
      low: tickets.filter((t: any) => t.priority === 'low').length,
      medium: tickets.filter((t: any) => t.priority === 'medium').length,
      high: tickets.filter((t: any) => t.priority === 'high').length,
      critical: tickets.filter((t: any) => t.priority === 'critical').length,
    };

    const categoryMetrics: CategoryMetrics = {
      hardware: tickets.filter((t: any) => t.category === 'hardware').length,
      software: tickets.filter((t: any) => t.category === 'software').length,
      network: tickets.filter((t: any) => t.category === 'network').length,
      access: tickets.filter((t: any) => t.category === 'access').length,
      other: tickets.filter((t: any) => t.category === 'other').length,
    };

    return { ticketMetrics, priorityMetrics, categoryMetrics };
  };

  const { ticketMetrics, priorityMetrics, categoryMetrics } = calculateMetrics();

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

  const handleExportReport = (type: string) => {
    toast({
      title: "Export Started",
      description: `Exporting ${type} report...`,
    });
    // TODO: Implement actual export functionality
  };

  const handleRefreshData = () => {
    toast({
      title: "Refreshing",
      description: "Updating report data...",
    });
    // The data will automatically refresh due to React Query
  };

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
          <p className="text-gray-600 dark:text-gray-400">You don't have permission to access reports.</p>
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
          title="Reports & Analytics" 
          subtitle="Comprehensive insights into your IT support operations"
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Controls */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 shadow-lg">
                  <SelectItem value="7d" className="hover:bg-gray-100 dark:hover:bg-gray-700">Last 7 days</SelectItem>
                  <SelectItem value="30d" className="hover:bg-gray-100 dark:hover:bg-gray-700">Last 30 days</SelectItem>
                  <SelectItem value="90d" className="hover:bg-gray-100 dark:hover:bg-gray-700">Last 90 days</SelectItem>
                  <SelectItem value="1y" className="hover:bg-gray-100 dark:hover:bg-gray-700">Last year</SelectItem>
                </SelectContent>
              </Select>

              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-40 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Report Type" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 shadow-lg">
                  <SelectItem value="overview" className="hover:bg-gray-100 dark:hover:bg-gray-700">Overview</SelectItem>
                  <SelectItem value="performance" className="hover:bg-gray-100 dark:hover:bg-gray-700">Performance</SelectItem>
                  <SelectItem value="trends" className="hover:bg-gray-100 dark:hover:bg-gray-700">Trends</SelectItem>
                  <SelectItem value="team" className="hover:bg-gray-100 dark:hover:bg-gray-700">Team Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshData}
                disabled={ticketsLoading || analyticsLoading}
              >
                <RefreshCwIcon className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportReport(reportType)}
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {(ticketsLoading || analyticsLoading || slaLoading || teamLoading) && (
            <div className="mb-8 text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading report data...</p>
            </div>
          )}

          {/* Error State */}
          {ticketsError && (
            <div className="mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertTriangleIcon className="w-5 h-5" />
                <span className="font-medium">Error loading tickets</span>
              </div>
              <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                {ticketsError instanceof Error ? ticketsError.message : 'Failed to load ticket data'}
              </p>
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ticketMetrics.total}</div>
                <p className="text-xs text-muted-foreground">
                  {ticketMetrics.new} new, {ticketMetrics.inProgress} in progress
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
                <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {ticketMetrics.total > 0 
                    ? Math.round((ticketMetrics.resolved + ticketMetrics.closed) / ticketMetrics.total * 100)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {ticketMetrics.resolved + ticketMetrics.closed} resolved
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
                <ClockIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.avgResolutionTime ? `${analytics.avgResolutionTime}h` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Target: 24h
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
                <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {slaPerformance?.critical?.percentage || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Critical tickets
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Reports */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Ticket Status Distribution */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3Icon className="w-5 h-5" />
                  Ticket Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(ticketMetrics).filter(([key]) => key !== 'total').map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          status === 'new' ? 'bg-blue-500' :
                          status === 'inProgress' ? 'bg-yellow-500' :
                          status === 'pending' ? 'bg-orange-500' :
                          status === 'resolved' ? 'bg-green-500' :
                          'bg-gray-500'
                        }`} />
                        <span className="capitalize">{status.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangleIcon className="w-5 h-5" />
                  Priority Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(priorityMetrics).map(([priority, count]) => (
                    <div key={priority} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          priority === 'low' ? 'bg-green-500' :
                          priority === 'medium' ? 'bg-yellow-500' :
                          priority === 'high' ? 'bg-orange-500' :
                          'bg-red-500'
                        }`} />
                        <span className="capitalize">{priority}</span>
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Analysis */}
          <Card className="mb-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FilterIcon className="w-5 h-5" />
                Category Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {Object.entries(categoryMetrics).map(([category, count]) => (
                  <div key={category} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{count}</div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {category}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {ticketMetrics.total > 0 ? Math.round(count / ticketMetrics.total * 100) : 0}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Team Performance */}
          {teamStatus && teamStatus.length > 0 && (
            <Card className="mb-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  Team Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Team Member</th>
                        <th className="text-left p-2">Role</th>
                        <th className="text-left p-2">Tickets Assigned</th>
                        <th className="text-left p-2">Resolution Rate</th>
                        <th className="text-left p-2">Avg Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamStatus.map((member: any) => (
                        <tr key={member.id} className="border-b">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                <span className="text-foreground text-sm font-medium">
                                  {member.firstName?.[0]}{member.lastName?.[0]}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium">
                                  {member.firstName} {member.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground">{member.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-2">
                            <Badge variant="outline" className="capitalize">
                              {member.role?.replace('_', ' ') || 'Unknown Role'}
                            </Badge>
                          </td>
                          <td className="p-2">{member.ticketsAssigned || 0}</td>
                          <td className="p-2">
                            {member.ticketsAssigned > 0 
                              ? Math.round((member.ticketsResolved || 0) / member.ticketsAssigned * 100)
                              : 0}%
                          </td>
                          <td className="p-2">
                            {member.avgResolutionTime ? `${member.avgResolutionTime}h` : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Link href="/ticket-queue">
                  <Button variant="outline">
                    <InboxIcon className="w-4 h-4 mr-2" />
                    View Ticket Queue
                  </Button>
                </Link>
                <Link href="/tickets">
                  <Button variant="outline">
                    <BarChart3Icon className="w-4 h-4 mr-2" />
                    All Tickets
                  </Button>
                </Link>
                <Button variant="outline" onClick={() => handleExportReport('full')}>
                  <DownloadIcon className="w-4 h-4 mr-2" />
                  Export Full Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
