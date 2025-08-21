import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  PlusIcon, 
  ClockIcon, 
  UserIcon, 
  ArrowRightIcon,
  CalendarIcon,
  AlertTriangleIcon,
  TicketIcon,
  Users,
  BarChart3,
  BookOpen,
  Wifi,
  WifiOff
} from "lucide-react";

interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  averageResolutionTime: number;
  satisfactionScore: number;
}

interface RecentTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  createdBy: string;
  assignedTo: string;
  createdAt: string;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<DashboardStats>({
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    averageResolutionTime: 0,
    satisfactionScore: 0
  });
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Real-time state
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    fetchDashboardData();
    setupRealTimeConnection();
    
    // Set up periodic refresh as fallback (every 30 seconds)
    const intervalId = setInterval(() => {
      if (!isConnected) {
        console.log('🔄 Periodic refresh triggered (fallback)');
        fetchDashboardData();
      }
    }, 30000);
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      clearInterval(intervalId);
    };
  }, [isConnected]);

  const setupRealTimeConnection = () => {
    try {
      const eventSource = new EventSource('/api/events');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('🔌 Real-time connection established');
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealTimeEvent(data);
        } catch (error) {
          console.error('Error parsing real-time event:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ Real-time connection error:', error);
        setIsConnected(false);
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (eventSourceRef.current) {
            console.log('🔄 Attempting to reconnect...');
            eventSourceRef.current.close();
            setupRealTimeConnection();
          }
        }, 5000);
      };

      eventSource.addEventListener('ticket_created', () => {
        console.log('🎫 New ticket created - refreshing data');
        refreshDashboardData();
      });

      eventSource.addEventListener('ticket_updated', () => {
        console.log('📝 Ticket updated - refreshing data');
        refreshDashboardData();
      });

      eventSource.addEventListener('ticket_assigned', () => {
        console.log('👤 Ticket assigned - refreshing data');
        refreshDashboardData();
      });

      eventSource.addEventListener('ticket_commented', () => {
        console.log('💬 Ticket commented - refreshing data');
        refreshDashboardData();
      });

    } catch (error) {
      console.error('Failed to setup real-time connection:', error);
      setIsConnected(false);
    }
  };

  const handleRealTimeEvent = (event: any) => {
    console.log('📡 Real-time event received:', event);
    
    switch (event.type) {
      case 'connected':
        setIsConnected(true);
        break;
      case 'ticket_created':
      case 'ticket_updated':
      case 'ticket_assigned':
      case 'ticket_commented':
        refreshDashboardData();
        break;
      default:
        // Handle other event types if needed
        break;
    }
  };

  const refreshDashboardData = async () => {
    console.log('🔄 Refreshing dashboard data...');
    setUpdateCount(prev => prev + 1);
    setLastUpdate(new Date());
    
    // Show toast notification for real-time updates
    if (updateCount > 0) {
      // You can integrate with your toast system here
      console.log('📢 Dashboard updated in real-time!');
    }
    
    await fetchDashboardData();
  };

  const fetchDashboardData = async () => {
    try {
      console.log('🔄 Fetching dashboard data...');
      
      // Fetch ticket metrics (this is the correct endpoint)
      const metricsResponse = await fetch('/api/analytics/metrics');
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        console.log('📊 Metrics data received:', metricsData);
        // Transform the data to match our dashboard stats structure
        setStats({
          totalTickets: 0, // We'll calculate this from tickets
          openTickets: metricsData.openTickets || 0,
          resolvedTickets: 0, // We'll calculate this from tickets
          averageResolutionTime: metricsData.avgResolutionTime || 0,
          satisfactionScore: metricsData.slaCompliance || 0
        });
      } else {
        console.error('❌ Failed to fetch metrics:', metricsResponse.status, metricsResponse.statusText);
        // Fallback: we'll calculate basic stats from tickets data
        console.log('🔄 Using fallback stats calculation from tickets data');
      }

      // Fetch recent tickets
      const ticketsResponse = await fetch('/api/tickets?limit=5');
      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json();
        console.log('🎫 Recent tickets data received:', ticketsData);
        setRecentTickets(ticketsData);
        
        // Calculate total and resolved tickets from the tickets data
        if (ticketsData.length > 0) {
          const totalTickets = ticketsData.length; // This is just the recent ones, we need all
          const resolvedTickets = ticketsData.filter((ticket: any) => 
            ticket.status === 'resolved' || ticket.status === 'closed'
          ).length;
          
          // Update stats with calculated values
          setStats(prev => ({
            ...prev,
            totalTickets: totalTickets,
            resolvedTickets: resolvedTickets
          }));
        }
      } else {
        console.error('❌ Failed to fetch recent tickets:', ticketsResponse.status, ticketsResponse.statusText);
      }

      // Fetch all tickets to get accurate counts
      const allTicketsResponse = await fetch('/api/tickets');
      if (allTicketsResponse.ok) {
        const allTicketsData = await allTicketsResponse.json();
        console.log('📋 All tickets data received:', allTicketsData);
        
        // If metrics endpoint failed, calculate stats from tickets data
        if (metricsResponse.status !== 200) {
          const calculatedStats = calculateStatsFromTickets(allTicketsData);
          console.log('📊 Calculated stats from tickets:', calculatedStats);
          setStats(calculatedStats);
        } else {
          // Update stats with accurate counts from tickets
          const totalTickets = allTicketsData.length;
          const resolvedTickets = allTicketsData.filter((ticket: any) => 
            ticket.status === 'resolved' || ticket.status === 'closed'
          ).length;
          
          setStats(prev => ({
            ...prev,
            totalTickets: totalTickets,
            resolvedTickets: resolvedTickets
          }));
        }
        
        console.log('✅ Final dashboard stats:', stats);
      } else {
        console.error('❌ Failed to fetch all tickets:', allTicketsResponse.status, allTicketsResponse.statusText);
      }

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStatsFromTickets = (tickets: any[]) => {
    const totalTickets = tickets.length;
    const openTickets = tickets.filter((ticket: any) => 
      ['new', 'in_progress', 'pending'].includes(ticket.status)
    ).length;
    const resolvedTickets = tickets.filter((ticket: any) => 
      ['resolved', 'closed'].includes(ticket.status)
    ).length;
    
    // Calculate average resolution time for resolved tickets
    let avgResolutionTime = 0;
    const resolvedTicketsWithTime = tickets.filter((ticket: any) => 
      ticket.status === 'resolved' && ticket.createdAt && ticket.resolvedAt
    );
    
    if (resolvedTicketsWithTime.length > 0) {
      const totalTime = resolvedTicketsWithTime.reduce((total: number, ticket: any) => {
        const created = new Date(ticket.createdAt);
        const resolved = new Date(ticket.resolvedAt);
        return total + (resolved.getTime() - created.getTime());
      }, 0);
      avgResolutionTime = Math.round((totalTime / resolvedTicketsWithTime.length) / (1000 * 60 * 60) * 10) / 10; // Convert to hours
    }
    
    return {
      totalTickets,
      openTickets,
      resolvedTickets,
      averageResolutionTime: avgResolutionTime,
      satisfactionScore: 85 // Default satisfaction score
    };
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
          title="Dashboard" 
          subtitle="Welcome back! Here's what's happening with your help desk system."
        />
        
        {/* Real-time Status Bar */}
        <div className="px-6 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className={isConnected ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                  {isConnected ? "Live" : "Offline"}
                </span>
              </div>
              
              {lastUpdate && (
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <span>Last update:</span>
                  <span className="font-mono text-xs">
                    {lastUpdate.toLocaleTimeString()}
                  </span>
                </div>
              )}
              
              {updateCount > 0 && (
                <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                  <span className="text-xs font-medium">
                    {updateCount} live updates
                  </span>
                </div>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshDashboardData}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:scale-105 transition-all duration-200 ease-in-out">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Tickets
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <TicketIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  {updateCount > 0 && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isLoading ? (
                    <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-16 rounded"></div>
                  ) : (
                    stats.totalTickets
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:scale-105 transition-all duration-200 ease-in-out">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Open Tickets
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                    <ClockIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  {updateCount > 0 && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isLoading ? (
                    <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-16 rounded"></div>
                  ) : (
                    stats.openTickets
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:scale-105 transition-all duration-200 ease-in-out">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Resolved
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <TicketIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  {updateCount > 0 && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isLoading ? (
                    <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-16 rounded"></div>
                  ) : (
                    stats.resolvedTickets
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:scale-105 transition-all duration-200 ease-in-out">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Resolution
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  {updateCount > 0 && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isLoading ? (
                    <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-16 rounded"></div>
                  ) : (
                    `${stats.averageResolutionTime}h`
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Tickets */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                      Recent Tickets
                    </CardTitle>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Latest support requests and their current status
                    </p>
                  </div>
                  {updateCount > 0 && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Live</span>
                    </div>
                  )}
                </div>
                <Button 
                  variant="outline"
                  onClick={() => setLocation("/tickets")}
                  className="transition-all duration-200 ease-in-out hover:transform hover:scale-105 hover:shadow-md"
                >
                  View All
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTickets.map((ticket) => (
                  <div 
                    key={ticket.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    onClick={() => setLocation(`/ticket/${ticket.id}`)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        {getStatusIcon(ticket.status)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{ticket.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Created by {getUserDisplayName(ticket.createdBy)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getStatusColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:scale-105 transition-all duration-200 ease-in-out">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Team Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Manage team members, roles, and permissions
                </p>
                <Button 
                  variant="outline"
                  onClick={() => setLocation("/user-management")}
                  className="transition-all duration-200 ease-in-out hover:transform hover:scale-105 hover:shadow-md"
                >
                  Manage Team
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:scale-105 transition-all duration-200 ease-in-out">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                  Knowledge Base
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Access and manage support documentation
                </p>
                <Button 
                  variant="outline"
                  onClick={() => setLocation("/knowledge-base")}
                  className="transition-all duration-200 ease-in-out hover:transform hover:scale-105 hover:shadow-md"
                >
                  View Articles
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Customer Satisfaction
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {stats.satisfactionScore}%
                    </span>
                  </div>
                  <Progress value={stats.satisfactionScore} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
