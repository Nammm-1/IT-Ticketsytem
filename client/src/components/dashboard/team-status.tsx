import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { TeamMember } from "@/types";
import { UsersIcon, ClockIcon, CheckCircleIcon } from "lucide-react";

export function TeamStatus() {
  const { user } = useAuth();

  const { data: teamStatus, isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/analytics/team-status"],
    enabled: Boolean(user?.role && ['it_staff', 'manager', 'admin'].includes(user.role)),
    retry: false,
  });

  // Only show team status for IT staff, managers, and admins
  if (!user?.role || !['it_staff', 'manager', 'admin'].includes(user.role)) {
    return null;
  }

  const getWorkloadColor = (percentage: number) => {
    if (percentage >= 80) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    if (percentage >= 60) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    if (percentage >= 40) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  };

  const getWorkloadStatus = (percentage: number) => {
    if (percentage >= 80) return "Overloaded";
    if (percentage >= 60) return "High";
    if (percentage >= 40) return "Moderate";
    return "Low";
  };

  const formatTime = (hours: number) => {
    if (hours < 1) return "< 1h";
    if (hours < 24) return `${Math.round(hours)}h`;
    const days = Math.round(hours / 24);
    return `${days}d`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!teamStatus || teamStatus.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No team data available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teamStatus.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
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
                <Badge className={getWorkloadColor(member.workloadPercentage)}>
                  {getWorkloadStatus(member.workloadPercentage)}
                </Badge>
                <div className="text-xs text-muted-foreground mt-1">
                  {member.ticketsAssigned} tickets
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <ClockIcon className="w-3 h-3" />
                  {formatTime(member.avgResolutionTime)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
