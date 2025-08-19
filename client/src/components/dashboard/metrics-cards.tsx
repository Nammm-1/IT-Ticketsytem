import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { TicketIcon, ClockIcon, TrendingUpIcon, AlertTriangleIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function MetricsCards() {
  const { user } = useAuth();
  
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/analytics/metrics"],
    enabled: user?.role && ['it_staff', 'manager', 'admin'].includes(user.role),
    retry: false,
  });

  if (!user?.role || !['it_staff', 'manager', 'admin'].includes(user.role)) {
    return null;
  }

  const formatResolutionTime = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${hours.toFixed(1)}h`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Tickets</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="metric-open-tickets">
                {isLoading ? "..." : metrics?.openTickets || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <TicketIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">↓ 12%</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">from last week</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Resolution Time</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="metric-resolution-time">
                {isLoading ? "..." : formatResolutionTime(metrics?.avgResolutionTime || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">↓ 0.3h</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">improvement</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">SLA Compliance</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="metric-sla-compliance">
                {isLoading ? "..." : `${metrics?.slaCompliance || 0}%`}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              <TrendingUpIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">↑ 2%</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">vs target 90%</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical Issues</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="metric-critical-issues">
                {isLoading ? "..." : metrics?.criticalIssues || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
              <AlertTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-red-600 dark:text-red-400 font-medium">+1</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">needs attention</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
