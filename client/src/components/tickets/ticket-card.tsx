import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClockIcon, UserIcon, CalendarIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TicketCardProps {
  ticket: {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    createdAt: string;
    assignedTo?: {
      firstName?: string;
      lastName?: string;
      email?: string;
    } | null;
    createdBy: {
      firstName?: string;
      lastName?: string;
      email?: string;
    };
  };
  showDetails?: boolean;
}

export default function TicketCard({ ticket, showDetails = false }: TicketCardProps) {
  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      pending: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      closed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    };
    return colors[status as keyof typeof colors] || colors.new;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      hardware: "💻",
      software: "📱",
      network: "🌐",
      access: "🔐",
      other: "❓",
    };
    return icons[category as keyof typeof icons] || icons.other;
  };

  const getStatusDisplay = (status: string) => {
    const displays = {
      new: "New",
      in_progress: "In Progress",
      pending: "Pending",
      resolved: "Resolved",
      closed: "Closed",
    };
    return displays[status as keyof typeof displays] || status;
  };

  const getUserName = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.email) {
      return user.email;
    }
    return "Unknown User";
  };

  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`card-ticket-${ticket.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <Badge className={getPriorityColor(ticket.priority)}>
              {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
            </Badge>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                {ticket.title}
              </h3>
              <Badge className={getStatusColor(ticket.status)}>
                {getStatusDisplay(ticket.status)}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
              {ticket.description}
            </p>
            
            <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <span>{getCategoryIcon(ticket.category)}</span>
                <span className="capitalize">{ticket.category}</span>
              </div>
              
              {ticket.assignedTo && (
                <div className="flex items-center space-x-1">
                  <UserIcon className="w-3 h-3" />
                  <span>Assigned to: {getUserName(ticket.assignedTo)}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-1">
                <CalendarIcon className="w-3 h-3" />
                <span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
              </div>
            </div>

            {showDetails && (
              <div className="mt-3 flex items-center space-x-2">
                <Button size="sm" variant="outline" data-testid={`button-view-ticket-${ticket.id}`}>
                  View Details
                </Button>
                {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                  <Button size="sm" variant="ghost" data-testid={`button-update-ticket-${ticket.id}`}>
                    Update Status
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
