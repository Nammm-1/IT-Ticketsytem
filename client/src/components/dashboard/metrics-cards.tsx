import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { AnalyticsMetrics } from "@/types";
import { 
  TicketIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  AlertTriangleIcon 
} from "lucide-react";

export function MetricsCards() {
  const { user } = useAuth();

  const { data: metrics, isLoading } = useQuery<AnalyticsMetrics>({
    queryKey: ["/api/analytics/metrics"],
    enabled: Boolean(user?.role && ['it_staff', 'manager', 'admin'].includes(user.role)),
    retry: false,
  });

  // Helper function to format resolution time
  const formatResolutionTime = (hours: number) => {
    if (hours < 1) return "< 1h";
    if (hours < 24) return `${Math.round(hours)}h`;
    const days = Math.round(hours / 24);
    return `${days}d`;
  };

  // Only show metrics for IT staff, managers, and admins
  if (!user?.role || !['it_staff', 'manager', 'admin'].includes(user.role)) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
          <TicketIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? "..." : metrics?.openTickets || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Currently open tickets
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
          <ClockIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? "..." : formatResolutionTime(metrics?.avgResolutionTime || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Time to resolve tickets
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
          <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? "..." : `${metrics?.slaCompliance || 0}%`}
          </div>
          <p className="text-xs text-muted-foreground">
            Meeting service level agreements
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
          <AlertTriangleIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? "..." : metrics?.criticalIssues || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            High priority tickets
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
