import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";

export default function TeamStatus() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: teamStatus, isLoading, error } = useQuery({
    queryKey: ["/api/analytics/team-status"],
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

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getStatusColor = (status: string) => {
    return status === 'available' 
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  };

  const getStatusDisplay = (status: string) => {
    return status === 'available' ? 'Available' : 'Busy';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Status</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : teamStatus && teamStatus.length > 0 ? (
          <div className="space-y-4">
            {teamStatus.map((member: any) => (
              <div key={member.id} className="flex items-center justify-between" data-testid={`team-member-${member.id}`}>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {getInitials(member.name)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {member.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {member.activeTickets} active tickets
                    </p>
                  </div>
                </div>
                <Badge className={getStatusColor(member.status)} data-testid={`status-${member.id}`}>
                  {getStatusDisplay(member.status)}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No team members found
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
