import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { SLAPerformance } from "@/types";
import { AlertTriangleIcon, CheckCircleIcon, ClockIcon } from "lucide-react";

export function SLAStatus() {
  const { user } = useAuth();

  const { data: slaPerformance, isLoading } = useQuery<SLAPerformance>({
    queryKey: ["/api/analytics/sla-performance"],
    enabled: Boolean(user?.role && ['it_staff', 'manager', 'admin'].includes(user.role)),
    retry: false,
  });

  // Only show SLA status for IT staff, managers, and admins
  if (!user?.role || !['it_staff', 'manager', 'admin'].includes(user.role)) {
    return null;
  }

  const getSLAIcon = (percentage: number) => {
    if (percentage >= 90) return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    if (percentage >= 75) return <ClockIcon className="w-5 h-5 text-yellow-500" />;
    return <AlertTriangleIcon className="w-5 h-5 text-red-500" />;
  };

  const getSLAColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SLA Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!slaPerformance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SLA Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No SLA data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>SLA Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(slaPerformance).map(([priority, data]) => {
            const percentage = data?.percentage || 0;
            return (
              <div key={priority} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getSLAIcon(percentage)}
                    <span className="font-medium capitalize">{priority}</span>
                  </div>
                  <span className={`font-semibold ${getSLAColor(percentage)}`}>
                    {percentage}%
                  </span>
                </div>
                <Progress 
                  value={percentage} 
                  className="h-2"
                  style={{
                    '--progress-background': getProgressColor(percentage)
                  } as React.CSSProperties}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
