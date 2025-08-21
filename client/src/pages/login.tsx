import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { invalidateUserCache } from "@/lib/queryClient";

interface LoginFormData {
  email: string;
  password: string;
}

interface PasswordChangeFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function Login() {
  const [, setLocation] = useLocation();
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  
  const [passwordChangeForm, setPasswordChangeForm] = useState<PasswordChangeFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Check if user needs to change password (e.g., after reset)
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);

  useEffect(() => {
    // Check if user was redirected here after password reset
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'success') {
      alert("Password Reset Successful! Please log in with your temporary password, then you'll be prompted to change it.");
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordChangeForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.redirected) {
        // Handle redirect response (successful login)
        const isTemporaryPassword = formData.password.length <= 8 || 
                                  formData.password === 'temp123' || 
                                  formData.password === 'password123' ||
                                  formData.password === 'reset123' ||
                                  formData.password === 'dev123';
        
        if (isTemporaryPassword) {
          setNeedsPasswordChange(true);
          setShowPasswordChangeModal(true);
          alert("Temporary Password Detected! Please change your password to continue.");
        } else {
          // Normal login flow - redirect to dashboard
          alert("Login Successful! Redirecting to dashboard...");
          // Invalidate user cache to ensure fresh auth state
          invalidateUserCache();
          setTimeout(() => {
            setLocation("/");
          }, 2000);
        }
      } else {
        // Handle JSON response (error or special case)
        try {
          const data = await response.json();
          
          if (response.ok) {
            // Success response
            alert(data.message || 'Login successful!');
            alert("Login Successful! Redirecting to dashboard...");
            // Invalidate user cache to ensure fresh auth state
            invalidateUserCache();
            setTimeout(() => {
              setLocation("/");
            }, 2000);
          } else {
            // Error response
            alert(`Login Failed: ${data.message || "Invalid credentials"}`);
          }
        } catch (jsonError) {
          // Non-JSON response
          alert("Login failed. Please try again.");
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      alert("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordChangeForm.newPassword !== passwordChangeForm.confirmPassword) {
      alert("Password Mismatch: New password and confirm password do not match");
      return;
    }

    if (passwordChangeForm.newPassword.length < 8) {
      alert("Password Too Short: New password must be at least 8 characters long");
      return;
    }

    setIsChangingPassword(true);

    try {
      // Get the current user ID from session or auth context
      const response = await fetch('/api/auth/user', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to get user information');
      }
      
      const user = await response.json();
      
      // Call the password update API
      const updateResponse = await fetch(`/api/users/${user.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordChangeForm.currentPassword,
          newPassword: passwordChangeForm.newPassword
        })
      });
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.message || 'Failed to update password');
      }
      
      // Show success message
      alert("Password Changed Successfully! Your password has been updated. You can now log in normally.");
      
      // Invalidate user cache to refresh any cached user data
      invalidateUserCache();
      
      setShowPasswordChangeModal(false);
      setNeedsPasswordChange(false);
      
      // Clear the form
      setPasswordChangeForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      // Redirect to root path and reload to refresh authentication state
      setTimeout(() => {
        setLocation("/");
        // Reload the page to refresh authentication state
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Password change error:', error);
      alert(`An error occurred while changing password: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSkipPasswordChange = () => {
    // Allow user to continue with temporary password (not recommended for production)
    setShowPasswordChangeModal(false);
    setNeedsPasswordChange(false);
    
    alert("Warning: You're using a temporary password. Please change it soon for security.");
    
    setTimeout(() => {
      setLocation("/");
      // Reload the page to refresh authentication state
      window.location.reload();
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className={`w-full max-w-md shadow-lg ${showPasswordChangeModal ? 'pointer-events-none blur-md' : ''}`}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
            <img src="/bsu-logo_yllw-flame-blk-text.png" alt="Bowie State University" className="h-20 w-24" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Bowie State University
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            IT Support Ticketing System
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
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-black hover:bg-gray-700 text-white transition-all duration-200 ease-in-out hover:transform hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Button
              variant="link"
              className="text-primary hover:text-primary/80 dark:text-primary dark:hover:text-primary/80 transition-all duration-200 ease-in-out hover:underline"
              onClick={() => setLocation("/forgot-password")}
            >
              Forgot your password?
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Modal */}
      {showPasswordChangeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md shadow-xl relative z-50">
            <CardHeader>
              <div className="text-center mb-4">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center">
                  <img src="/bsu-logo_yllw-flame-blk-text.png" alt="Bowie State University" className="h-16 w-16" />
                </div>
                <CardTitle className="text-lg font-bold text-white">
                  Bowie State University
                </CardTitle>
                <CardDescription className="text-white text-sm">
                  Change Your Password
                </CardDescription>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-white">
                    Change Your Password
                  </CardTitle>
                  <CardDescription className="text-white">
                    You're using a temporary password. Please set a new secure password to continue.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-gray-300 hover:bg-white/10 p-2"
                  onClick={() => setShowPasswordChangeModal(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-sm font-medium text-white">
                    Current Password
                  </Label>
                  <div className="relative" style={{ color: 'white' }}>
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type={showPasswordChange ? "text" : "password"}
                      placeholder="Enter current password"
                      value={passwordChangeForm.currentPassword}
                      onChange={handlePasswordChangeInput}
                      className="pr-10"
                      autoComplete="current-password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPasswordChange(!showPasswordChange)}
                    >
                      {showPasswordChange ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium text-white">
                    New Password
                  </Label>
                  <div className="relative" style={{ color: 'white' }}>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password (min 8 characters)"
                      value={passwordChangeForm.newPassword}
                      onChange={handlePasswordChangeInput}
                      className="pr-10"
                      autoComplete="new-password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-white">
                    Confirm New Password
                  </Label>
                  <div className="relative" style={{ color: 'white' }}>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={passwordChangeForm.confirmPassword}
                      onChange={handlePasswordChangeInput}
                      className="pr-10"
                      autoComplete="new-password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    className="flex-1 bg-black hover:bg-gray-900 text-white transition-all duration-200 ease-in-out hover:transform hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? "Changing..." : "Change Password"}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 transition-all duration-200 ease-in-out hover:transform hover:scale-105 hover:shadow-md text-white"
                    onClick={handleSkipPasswordChange}
                  >
                    Skip for Now
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
