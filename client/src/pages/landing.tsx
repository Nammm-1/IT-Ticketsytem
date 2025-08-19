import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TicketIcon, Users, BarChart3, Book } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
              <TicketIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            IT Support Ticketing System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Streamline your IT support process with our comprehensive ticketing system. 
            Manage requests, track issues, and improve team productivity.
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-3"
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-login"
          >
            Get Started
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <TicketIcon className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>Ticket Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Create, track, and resolve IT tickets efficiently with our intuitive interface.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>Role-Based Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Different access levels for end users, IT staff, managers, and administrators.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BarChart3 className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>Analytics & Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Track performance metrics, SLA compliance, and team productivity.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Book className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>Knowledge Base</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Self-service solutions and documentation for common issues.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Join thousands of organizations already using our ticketing system.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-login-cta"
          >
            Sign In to Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
