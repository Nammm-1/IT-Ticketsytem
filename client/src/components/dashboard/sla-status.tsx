import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";

export default function SLAStatus() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: slaPerformance, isLoading, error } = useQuery({
    queryKey: ["/api/analytics/sla-performance"],
    enabled: user?.role && ['it_staff', 'manager', 'admin'].includes(user.role),
    retry: false,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  if (!user?.role || !['it_staff', 'manager', 'admin'].includes(user.role)) {
    return null;
  }

  const getSLAColor = (percentage: number) => {
    if (percentage >= 95) return "text-success";
    if (percentage >= 85) return "text-warning";
    return "text-error";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 95) return "bg-success";
    if (percentage >= 85) return "bg-warning";
    return "bg-error";
  };

  const slaTargets = [
    { label: "Critical (4h)", key: "critical", target: 100 },
    { label: "High (8h)", key: "high", target: 90 },
    { label: "Medium (24h)", key: "medium", target: 85 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>SLA Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {slaTargets.map((target, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        ) : slaPerformance ? (
          <div className="space-y-4">
            {slaTargets.map((target) => {
              const performance = slaPerformance[target.key as keyof typeof slaPerformance];
              const percentage = performance?.percentage || 0;
              
              return (
                <div key={target.key} data-testid={`sla-${target.key}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {target.label}
                    </span>
                    <span className={`text-sm font-medium ${getSLAColor(percentage)}`}>
                      {percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(percentage)}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                      data-testid={`progress-${target.key}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No SLA data available
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
