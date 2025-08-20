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
import { Progress } from "@/components/ui/progress";
import { 
  UsersIcon,
  ClockIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  UserIcon,
  CalendarIcon,
  FilterIcon,
  RefreshCwIcon,
  BarChart3Icon,
  LoaderIcon,
  TargetIcon,
  ZapIcon
} from "lucide-react";
import { Link } from "wouter";

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

interface WorkloadMetrics {
  totalTeamMembers: number;
  totalTickets: number;
  avgWorkload: number;
  overloadedMembers: number;
  underutilizedMembers: number;
  balancedWorkload: number;
}

interface TicketDistribution {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

export default function TeamWorkload() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [timeRange, setTimeRange] = useState("30d");
  const [viewType, setViewType] = useState("overview");
  const [sortBy, setSortBy] = useState("workload");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access team workload.",
        variant: "destructive",
      });
      window.location.href = "/api/login";
    }
  }, [isLoading, isAuthenticated, toast]);

  // Check if user has access to team workload
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (!['it_staff', 'manager', 'admin'].includes(user.role)) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access team workload.",
          variant: "destructive",
        });
        window.location.href = "/";
      }
    }
  }, [isLoading, isAuthenticated, user, toast]);

  // Fetch team status data
  const { data: teamStatus, isLoading: teamLoading, error: teamError } = useQuery({
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

  // Fetch tickets for workload analysis
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
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

  // Fetch all users for team composition
  const { data: allUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch(`/api/users`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    },
    enabled: isAuthenticated && ['it_staff', 'manager', 'admin'].includes(user?.role || ''),
    retry: false,
  });

  // Calculate team workload metrics
  const calculateWorkloadMetrics = (): {
    teamMembers: TeamMember[];
    metrics: WorkloadMetrics;
    distribution: TicketDistribution[];
  } => {
    if (!teamStatus || !tickets || !allUsers) {
      return {
        teamMembers: [],
        metrics: {
          totalTeamMembers: 0,
          totalTickets: 0,
          avgWorkload: 0,
          overloadedMembers: 0,
          underutilizedMembers: 0,
          balancedWorkload: 0
        },
        distribution: []
      };
    }

    // Filter only IT staff, managers, and admins
    const teamUsers = allUsers.filter((u: any) => 
      ['it_staff', 'manager', 'admin'].includes(u.role)
    );

    // Calculate workload for each team member
    const teamMembers: TeamMember[] = teamUsers.map((member: any) => {
      const memberTickets = tickets.filter((t: any) => t.assignedTo?.id === member.id);
      const resolvedTickets = memberTickets.filter((t: any) => 
        ['resolved', 'closed'].includes(t.status)
      );
      const inProgressTickets = memberTickets.filter((t: any) => 
        t.status === 'in_progress'
      );
      const pendingTickets = memberTickets.filter((t: any) => 
        t.status === 'pending'
      );

      const workloadPercentage = Math.min(
        (memberTickets.length / Math.max(tickets.length, 1)) * 100, 
        100
      );

      return {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        role: member.role,
        ticketsAssigned: memberTickets.length,
        ticketsResolved: resolvedTickets.length,
        ticketsInProgress: inProgressTickets.length,
        ticketsPending: pendingTickets.length,
        avgResolutionTime: member.avgResolutionTime || 0,
        workloadPercentage,
        lastActive: member.lastActive || new Date().toISOString()
      };
    });

    // Sort team members based on selected criteria
    if (sortBy === 'workload') {
      teamMembers.sort((a, b) => b.workloadPercentage - a.workloadPercentage);
    } else if (sortBy === 'tickets') {
      teamMembers.sort((a, b) => b.ticketsAssigned - a.ticketsAssigned);
    } else if (sortBy === 'performance') {
      teamMembers.sort((a, b) => a.avgResolutionTime - b.avgResolutionTime);
    }

    // Calculate overall metrics
    const totalTickets = tickets.length;
    const avgWorkload = teamMembers.length > 0 
      ? teamMembers.reduce((sum, m) => sum + m.workloadPercentage, 0) / teamMembers.length 
      : 0;
    
    const overloadedMembers = teamMembers.filter(m => m.workloadPercentage > 80).length;
    const underutilizedMembers = teamMembers.filter(m => m.workloadPercentage < 20).length;
    const balancedWorkload = teamMembers.filter(m => 
      m.workloadPercentage >= 20 && m.workloadPercentage <= 80
    ).length;

    // Calculate ticket distribution
    const statusCounts = tickets.reduce((acc: any, ticket: any) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {});

    const distribution: TicketDistribution[] = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count: count as number,
      percentage: (count as number) / totalTickets * 100,
      color: status === 'new' ? 'bg-blue-500' :
             status === 'in_progress' ? 'bg-yellow-500' :
             status === 'pending' ? 'bg-orange-500' :
             status === 'resolved' ? 'bg-green-500' :
             'bg-gray-500'
    }));

    return {
      teamMembers,
      metrics: {
        totalTeamMembers: teamUsers.length,
        totalTickets,
        avgWorkload: Math.round(avgWorkload * 100) / 100,
        overloadedMembers,
        underutilizedMembers,
        balancedWorkload
      },
      distribution
    };
  };

  const { teamMembers, metrics, distribution } = calculateWorkloadMetrics();

  // Handle unauthorized errors
  useEffect(() => {
    if (teamError && isUnauthorizedError(teamError as Error)) {
      toast({
        title: "Authentication Required",
        description: "Please log in again to continue.",
        variant: "destructive",
      });
      window.location.href = "/api/login";
    }
  }, [teamError, toast]);

  const handleRefreshData = () => {
    toast({
      title: "Refreshing",
      description: "Updating team workload data...",
    });
  };

  const getWorkloadColor = (percentage: number) => {
    if (percentage >= 80) return "text-red-600 dark:text-red-400";
    if (percentage >= 60) return "text-orange-600 dark:text-orange-400";
    if (percentage >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  const getWorkloadStatus = (percentage: number) => {
    if (percentage >= 80) return "Overloaded";
    if (percentage >= 60) return "High";
    if (percentage >= 40) return "Moderate";
    if (percentage >= 20) return "Low";
    return "Underutilized";
  };

  const formatTime = (hours: number) => {
    if (hours < 1) return "< 1h";
    if (hours < 24) return `${Math.round(hours)}h`;
    const days = Math.round(hours / 24);
    return `${days}d`;
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
          <p className="text-gray-600 dark:text-gray-400">You don't have permission to access team workload.</p>
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
          title="Team Workload" 
          subtitle="Monitor team performance and workload distribution"
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

              <Select value={viewType} onValueChange={setViewType}>
                <SelectTrigger className="w-40 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="View Type" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 shadow-lg">
                  <SelectItem value="overview" className="hover:bg-gray-100 dark:hover:bg-gray-700">Overview</SelectItem>
                  <SelectItem value="detailed" className="hover:bg-gray-100 dark:hover:bg-gray-700">Detailed</SelectItem>
                  <SelectItem value="performance" className="hover:bg-gray-100 dark:hover:bg-gray-700">Performance</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 shadow-lg">
                  <SelectItem value="workload" className="hover:bg-gray-100 dark:hover:bg-gray-700">Workload %</SelectItem>
                  <SelectItem value="tickets" className="hover:bg-gray-100 dark:hover:bg-gray-700">Ticket Count</SelectItem>
                  <SelectItem value="performance" className="hover:bg-gray-100 dark:hover:bg-gray-700">Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshData}
              disabled={teamLoading || ticketsLoading || usersLoading}
            >
              <RefreshCwIcon className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Loading State */}
          {(teamLoading || ticketsLoading || usersLoading) && (
            <div className="mb-8 text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading team workload data...</p>
            </div>
          )}

          {/* Error State */}
          {teamError && (
            <div className="mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertTriangleIcon className="w-5 h-5" />
                <span className="font-medium">Error loading team data</span>
              </div>
              <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                {teamError instanceof Error ? teamError.message : 'Failed to load team workload data'}
              </p>
            </div>
          )}

          {/* Team Overview Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalTeamMembers}</div>
                <p className="text-xs text-muted-foreground">
                  Active IT staff
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalTickets}</div>
                <p className="text-xs text-muted-foreground">
                  In system
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Workload</CardTitle>
                <TargetIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.avgWorkload}%</div>
                <p className="text-xs text-muted-foreground">
                  Per team member
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Workload Balance</CardTitle>
                <ZapIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.balancedWorkload}</div>
                <p className="text-xs text-muted-foreground">
                  Balanced members
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Workload Distribution Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUpIcon className="w-5 h-5" />
                  Workload Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-foreground text-sm font-medium">
                              {member.firstName?.[0]}{member.lastName?.[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {member.firstName} {member.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {member.role?.replace('_', ' ') || 'Unknown Role'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${getWorkloadColor(member.workloadPercentage)}`}>
                            {member.workloadPercentage.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getWorkloadStatus(member.workloadPercentage)}
                          </div>
                        </div>
                      </div>
                      <Progress 
                        value={member.workloadPercentage} 
                        className="h-2"
                        style={{
                          '--progress-background': member.workloadPercentage >= 80 ? '#ef4444' :
                                                  member.workloadPercentage >= 60 ? '#f97316' :
                                                  member.workloadPercentage >= 40 ? '#eab308' :
                                                  '#22c55e'
                        } as React.CSSProperties}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Workload Status Summary */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangleIcon className="w-5 h-5" />
                  Workload Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium">Overloaded</span>
                    </div>
                    <Badge variant="destructive">{metrics.overloadedMembers}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium">High Workload</span>
                    </div>
                    <Badge variant="secondary">{metrics.totalTeamMembers - metrics.overloadedMembers - metrics.underutilizedMembers - metrics.balancedWorkload}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Balanced</span>
                    </div>
                    <Badge variant="default">{metrics.balancedWorkload}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium">Underutilized</span>
                    </div>
                    <Badge variant="outline">{metrics.underutilizedMembers}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Team Performance */}
          <Card className="mb-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                Detailed Team Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Team Member</th>
                      <th className="text-left p-3">Role</th>
                      <th className="text-left p-3">Tickets Assigned</th>
                      <th className="text-left p-3">In Progress</th>
                      <th className="text-left p-3">Pending</th>
                      <th className="text-left p-3">Resolved</th>
                      <th className="text-left p-3">Avg Resolution</th>
                      <th className="text-left p-3">Workload %</th>
                      <th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((member) => (
                      <tr key={member.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
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
                        <td className="p-3">
                          <Badge variant="outline" className="capitalize">
                            {member.role?.replace('_', ' ') || 'Unknown Role'}
                          </Badge>
                        </td>
                        <td className="p-3 font-medium">{member.ticketsAssigned}</td>
                        <td className="p-3">
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            {member.ticketsInProgress}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                            {member.ticketsPending}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            {member.ticketsResolved}
                          </Badge>
                        </td>
                        <td className="p-3">{formatTime(member.avgResolutionTime)}</td>
                        <td className="p-3">
                          <div className={`font-semibold ${getWorkloadColor(member.workloadPercentage)}`}>
                            {member.workloadPercentage.toFixed(1)}%
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge 
                            variant={member.workloadPercentage >= 80 ? "destructive" : 
                                   member.workloadPercentage >= 60 ? "default" : 
                                   member.workloadPercentage >= 40 ? "secondary" : "outline"}
                          >
                            {getWorkloadStatus(member.workloadPercentage)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Link href="/ticket-queue">
                  <Button variant="outline">
                    <BarChart3Icon className="w-4 h-4 mr-2" />
                    View Ticket Queue
                  </Button>
                </Link>
                <Link href="/reports">
                  <Button variant="outline">
                    <TrendingUpIcon className="w-4 h-4 mr-2" />
                    View Reports
                  </Button>
                </Link>
                <Button variant="outline" onClick={() => window.open('/api/users', '_blank')}>
                  <UsersIcon className="w-4 h-4 mr-2" />
                  Manage Team
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
