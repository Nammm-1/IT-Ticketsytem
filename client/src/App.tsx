import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import ForgotPassword from "@/pages/forgot-password";
import Dashboard from "@/pages/dashboard";
import Tickets from "@/pages/tickets";
import CreateTicket from "@/pages/create-ticket";
import KnowledgeBase from "@/pages/knowledge-base";
import TicketDetails from "@/pages/ticket-details";
import TicketQueue from "@/pages/ticket-queue";
import Reports from "@/pages/reports";
import TeamWorkload from "@/pages/team-workload";
import UserManagement from "@/pages/user-management";
import SystemSettings from "@/pages/system-settings";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  // Debug logging
  useEffect(() => {
    console.log('🔍 Router Debug:', { isAuthenticated, isLoading, user });
  }, [isAuthenticated, isLoading, user]);

  // Force console log on every render to see what's happening
  console.log('🔄 Router rendering with:', { isAuthenticated, isLoading, user });
  
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const es = new EventSource('/api/events');
      es.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg?.type === 'notification') {
            // lightweight strategy: refetch auth user endpoint triggers header polling soon
            fetch('/api/notifications?unread=true', { credentials: 'include' }).catch(() => {});
          }
        } catch {}
      };
      return () => { es.close(); };
    }
  }, [isLoading, isAuthenticated]);

  // Show loading state while checking authentication
  if (isLoading) {
    console.log('⏳ Showing loading state...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // Safety check: if we have user data but authentication is unclear, show dashboard
  if (user && !isAuthenticated) {
    console.log('⚠️ User exists but not authenticated, forcing dashboard...');
    return <Dashboard />;
  }

  console.log('🎯 About to render routes. isAuthenticated:', isAuthenticated, 'user:', user);
  
  if (isAuthenticated) {
    console.log('✅ Rendering authenticated routes (Dashboard)');
    return (
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/tickets" component={Tickets} />
        <Route path="/ticket/:id" component={TicketDetails} />
        <Route path="/create-ticket" component={CreateTicket} />
        <Route path="/knowledge-base" component={KnowledgeBase} />
        <Route path="/ticket-queue" component={TicketQueue} />
        <Route path="/reports" component={Reports} />
        <Route path="/team-workload" component={TeamWorkload} />
        <Route path="/user-management" component={UserManagement} />
        <Route path="/system-settings" component={SystemSettings} />
        {/* Fallback to Dashboard for any unmatched routes */}
        <Route component={Dashboard} />
      </Switch>
    );
  } else {
    console.log('❌ Rendering unauthenticated routes (Landing)');
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Ultimate fallback - if we somehow get here, show dashboard
  console.log('🚨 Ultimate fallback - showing Dashboard');
  return <Dashboard />;
}

function App() {
  console.log('🚀 App component rendering...');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
