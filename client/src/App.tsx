import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Tickets from "@/pages/tickets";
import CreateTicket from "@/pages/create-ticket";
import KnowledgeBase from "@/pages/knowledge-base";
import TicketDetails from "@/pages/ticket-details";
import TicketQueue from "@/pages/ticket-queue";
import Reports from "@/pages/reports";
import TeamWorkload from "@/pages/team-workload";
import UserManagement from "@/pages/user-management";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
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

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/tickets" component={Tickets} />
          <Route path="/ticket/:id" component={TicketDetails} />
          <Route path="/create-ticket" component={CreateTicket} />
          <Route path="/knowledge-base" component={KnowledgeBase} />
          <Route path="/ticket-queue" component={TicketQueue} />
          <Route path="/reports" component={Reports} />
          <Route path="/team-workload" component={TeamWorkload} />
          <Route path="/user-management" component={UserManagement} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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
