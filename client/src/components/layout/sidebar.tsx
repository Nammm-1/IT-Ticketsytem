import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
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
  LogOutIcon,
  UserIcon,
  RefreshCwIcon
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, isLoading, refetch } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleRefreshProfile = () => {
    console.log('🔄 Manual refresh triggered');
    setRefreshKey((prev: number) => prev + 1);
    refetch();
  };
  
  // Refresh user data when sidebar mounts to ensure we have the latest info
  useEffect(() => {
    if (user) {
      console.log('🔄 Refreshing user data for:', user.email);
      console.log('👤 Current user data:', { firstName: user.firstName, lastName: user.lastName, email: user.email });
      refetch();
    }
  }, [user?.id]); // Refresh when user ID changes
  
  // Listen for user profile updates
  useEffect(() => {
    const handleUserProfileUpdate = (event: CustomEvent) => {
      console.log('📡 User profile update event received:', event.detail);
      if (event.detail.userId === user?.id) {
        console.log('🔄 Triggering refresh due to profile update');
        setRefreshKey(prev => prev + 1);
        refetch();
      }
    };
    
    window.addEventListener('userProfileUpdated', handleUserProfileUpdate as EventListener);
    
    return () => {
      window.removeEventListener('userProfileUpdated', handleUserProfileUpdate as EventListener);
    };
  }, [user?.id, refetch]);

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const getInitials = (user: any) => {
    if (!user) return "U";
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.email && typeof user.email === 'string') {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const getUserName = (user: any) => {
    if (!user) return "User";
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.email && typeof user.email === 'string') {
      return user.email;
    }
    return "User";
  };

  const getRoleDisplay = (role: string) => {
    if (!role) return "User";
    const roleMap = {
      end_user: "End User",
      it_staff: "IT Support Staff",
      manager: "Manager",
      admin: "Administrator",
    };
    return roleMap[role as keyof typeof roleMap] || "User";
  };

  const navigationItems = [
    { href: "/", label: "Dashboard", icon: HomeIcon },
    { href: "/create-ticket", label: "Create Ticket", icon: PlusCircleIcon },
    { href: "/tickets", label: user && user.role === 'end_user' ? 'My Tickets' : 'All Tickets', icon: ListIcon },
    { href: "/knowledge-base", label: "Knowledge Base", icon: BookOpenIcon },
    { href: "/reports", label: "Reports", icon: BarChart3Icon },
  ];

  // Don't render sidebar until user data is loaded
  if (isLoading || !user) {
    return (
      <div className="w-64 bg-white dark:bg-gray-800 shadow-lg fixed h-full z-10 border-r border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
          <div className="w-18 h-14 flex items-center justify-center">
            <img src="/bsu-logo_yllw-flame-blk-text.png" alt="Bowie State University" className="w-18 h-14" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Bowie State University</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">IT Support</p>
          </div>
        </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      key={`sidebar-${user?.id}-${user?.firstName}-${user?.lastName}-${refreshKey}`} 
      className="w-64 bg-white dark:bg-gray-800 shadow-lg fixed h-full z-10 border-r border-gray-200 dark:border-gray-700"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-16 h-16 flex items-center justify-center">
            <img src="/bsu-logo_yllw-flame-blk-text.png" alt="Bowie State University" className="w-18 h-16" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Bowie State University</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">IT Support</p>
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
                "w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out hover:transform hover:scale-105 hover:shadow-md",
                isActive("/") && "bg-primary/10 dark:bg-primary/20 text-primary border-l-4 border-primary"
              )}
              data-testid="nav-dashboard"
            >
              <HomeIcon className="w-5 h-5 mr-3" />
              Dashboard
            </Button>
          </Link>
          
          {/* Only show Create Ticket for end users (not IT staff, managers, or admins) */}
          {user?.role === 'end_user' && (
            <Link href="/create-ticket">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out hover:transform hover:scale-105 hover:shadow-md",
                  isActive("/create-ticket") && "bg-primary/10 dark:bg-primary/20 text-primary border-l-4 border-primary"
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
                "w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out hover:transform hover:scale-105 hover:shadow-md",
                isActive("/tickets") && "bg-primary/10 dark:bg-primary/20 text-primary border-l-4 border-primary"
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
                "w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out hover:transform hover:scale-105 hover:shadow-md",
                isActive("/knowledge-base") && "bg-primary/10 dark:bg-primary/20 text-primary border-l-4 border-primary"
              )}
              data-testid="nav-knowledge-base"
            >
              <BookOpenIcon className="w-5 h-5 mr-3" />
              Knowledge Base
            </Button>
          </Link>

          {user?.role && ['manager', 'admin'].includes(user.role) && (
            <Link href="/reports">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out hover:transform hover:scale-105 hover:shadow-md",
                  isActive("/reports") && "bg-primary/10 dark:bg-primary/20 text-primary border-l-4 border-primary"
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
                    "w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out hover:transform hover:scale-105 hover:shadow-md",
                    isActive("/ticket-queue") && "bg-primary/10 dark:bg-primary/20 text-primary border-l-4 border-primary"
                  )}
                  data-testid="nav-ticket-queue"
                >
                  <InboxIcon className="w-5 h-5 mr-3" />
                  Ticket Queue
                </Button>
              </Link>
              

            </div>
          </div>
        )}

        {/* Management Tools - Only for managers and admins */}
        {user?.role && ['manager', 'admin'].includes(user.role) && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Management Tools
            </h3>
            <div className="space-y-2">
              <Link href="/team-workload">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out hover:transform hover:scale-105 hover:shadow-md",
                    isActive("/team-workload") && "bg-primary/10 dark:bg-primary/20 text-primary border-l-4 border-primary"
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
                    "w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out hover:transform hover:scale-105 hover:shadow-md",
                    isActive("/user-management") && "bg-primary/10 dark:bg-primary/20 text-primary border-l-4 border-primary"
                  )}
                  data-testid="nav-user-management"
                >
                  <UsersIcon className="w-5 h-5 mr-3" />
                  View All Users
                </Button>
              </Link>
              
              <Link href="/system-settings">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out hover:transform hover:scale-105 hover:shadow-md",
                    isActive("/system-settings") && "bg-primary/10 dark:bg-primary/20 text-primary border-l-4 border-primary"
                  )}
                  data-testid="nav-account-settings"
                >
                  <UserIcon className="w-5 h-5 mr-3" />
                  Account Settings
                </Button>
              </Link>
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
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="p-1"
              onClick={handleRefreshProfile}
              title="Refresh Profile"
              data-testid="button-refresh-profile"
            >
              <RefreshCwIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </Button>
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
    </div>
  );
}
