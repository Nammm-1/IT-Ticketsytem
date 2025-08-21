import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Lock } from "lucide-react";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/users/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        const tempPassword = data.emailResult?.tempPassword || 'reset123';
        alert(`Password reset successful! Your new temporary password is: ${tempPassword}\n\nPlease save this password and use it to log in.`);
      } else {
        alert(`Password reset failed: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      alert("An error occurred while processing your request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setLocation("/login");
  };

  const handleLoginWithNewPassword = () => {
    setLocation("/login?reset=success");
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
              <img src="/bsu-logo_yllw-flame-blk-text.png" alt="Bowie State University" className="h-20 w-20" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Bowie State University
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Password Reset Successful! Check your email for the new temporary password.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <p>If you didn't receive an email, the temporary password was displayed above.</p>
              <p className="mt-2">Please save this password and use it to log in.</p>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={handleLoginWithNewPassword}
                className="flex-1 bg-primary hover:bg-primary/90 text-white transition-all duration-200 ease-in-out hover:transform hover:scale-105 hover:shadow-md"
              >
                Log In Now
              </Button>
              
              <Button
                variant="outline"
                onClick={handleBackToLogin}
                className="flex-1 transition-all duration-200 ease-in-out hover:transform hover:scale-105 hover:shadow-md"
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
            <img src="/bsu-logo_yllw-flame-blk-text.png" alt="Bowie State University" className="h-20 w-20" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Bowie State University
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Forgot Your Password? Enter your email address and we'll send you a new temporary password
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-black hover:bg-gray-700 text-white transition-all duration-200 ease-in-out hover:transform hover:scale-105 hover:shadow-md"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Button
              variant="link"
              className="text-primary hover:text-primary/80 dark:text-primary dark:hover:text-primary/80 transition-all duration-200 ease-in-out hover:underline"
              onClick={handleBackToLogin}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
