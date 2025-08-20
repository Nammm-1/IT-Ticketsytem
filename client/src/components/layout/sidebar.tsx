import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  TicketIcon, 
  HomeIcon, 
  PlusCircleIcon, 
  ListIcon, 
  BookOpenIcon, 
  BarChart3Icon,
  InboxIcon,
  UsersIcon,
  SettingsIcon,
  LogOutIcon
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const getInitials = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const getUserName = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.email) {
      return user.email;
    }
    return "User";
  };

  const getRoleDisplay = (role: string) => {
    const roleMap = {
      end_user: "End User",
      it_staff: "IT Support Staff",
      manager: "Manager",
      admin: "Administrator",
    };
    return roleMap[role as keyof typeof roleMap] || "User";
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-800 shadow-lg fixed h-full z-10 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <TicketIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">IT Support</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ticketing System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-4">
        <div className="space-y-2">
          <Link href="/">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start",
                isActive("/") && "bg-blue-50 dark:bg-blue-900/20 text-primary border-r-2 border-primary"
              )}
              data-testid="nav-dashboard"
            >
              <HomeIcon className="w-5 h-5 mr-3" />
              Dashboard
            </Button>
          </Link>
          
          {/* Only show Create Ticket for non-admin users */}
          {user?.role && user.role !== 'admin' && (
            <Link href="/create-ticket">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  isActive("/create-ticket") && "bg-blue-50 dark:bg-blue-900/20 text-primary"
                )}
                data-testid="nav-create-ticket"
              >
                <PlusCircleIcon className="w-5 h-5 mr-3" />
                Create Ticket
              </Button>
            </Link>
          )}
          

          
          <Link href="/tickets">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start",
                isActive("/tickets") && "bg-blue-50 dark:bg-blue-900/20 text-primary"
              )}
              data-testid="nav-my-tickets"
            >
              <ListIcon className="w-5 h-5 mr-3" />
              {user?.role === 'end_user' ? 'My Tickets' : 'All Tickets'}
            </Button>
          </Link>
          
          <Link href="/knowledge-base">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start",
                isActive("/knowledge-base") && "bg-blue-50 dark:bg-blue-900/20 text-primary"
              )}
              data-testid="nav-knowledge-base"
            >
              <BookOpenIcon className="w-5 h-5 mr-3" />
              Knowledge Base
            </Button>
          </Link>

          {user?.role && ['it_staff', 'manager', 'admin'].includes(user.role) && (
            <Link href="/reports">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  isActive("/reports") && "bg-blue-50 dark:bg-blue-900/20 text-primary"
                )}
                data-testid="nav-reports"
              >
                <BarChart3Icon className="w-5 h-5 mr-3" />
                Reports
              </Button>
            </Link>
          )}
        </div>

        {/* IT Staff Tools */}
        {user?.role && ['it_staff', 'manager', 'admin'].includes(user.role) && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              IT Staff Tools
            </h3>
            <div className="space-y-2">
              <Link href="/ticket-queue">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    isActive("/ticket-queue") && "bg-blue-50 dark:bg-blue-900/20 text-primary"
                  )}
                  data-testid="nav-ticket-queue"
                >
                  <InboxIcon className="w-5 h-5 mr-3" />
                  Ticket Queue
                </Button>
              </Link>
              
              <Link href="/team-workload">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    isActive("/team-workload") && "bg-blue-50 dark:bg-blue-900/20 text-primary"
                  )}
                  data-testid="nav-team-workload"
                >
                  <UsersIcon className="w-5 h-5 mr-3" />
                  Team Workload
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Admin Tools */}
        {user?.role === 'admin' && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Admin Tools
            </h3>
            <div className="space-y-2">
                             <Link href="/user-management">
                 <Button
                   variant="ghost"
                   className={cn(
                     "w-full justify-start",
                     isActive("/user-management") && "bg-blue-50 dark:bg-blue-900/20 text-primary"
                   )}
                   data-testid="nav-user-management"
                 >
                   <UsersIcon className="w-5 h-5 mr-3" />
                   View All Users
                 </Button>
               </Link>
              
              <Button
                variant="ghost"
                className="w-full justify-start"
                data-testid="nav-system-settings"
              >
                <SettingsIcon className="w-5 h-5 mr-3" />
                System Settings
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* User Profile Section */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-foreground text-sm font-medium">
              {getInitials(user)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {getUserName(user)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.role ? getRoleDisplay(user.role) : "User"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="p-1"
            onClick={() => window.location.href = '/api/logout'}
            data-testid="button-logout"
          >
            <LogOutIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </Button>
        </div>
      </div>
    </div>
  );
}
