import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react';

interface ResetPasswordForm {
  newPassword: string;
  confirmPassword: string;
}

interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export default function ResetPassword() {
  const [location, setLocation] = useLocation();
  const [formData, setFormData] = useState<ResetPasswordForm>({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string>('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [resetToken, setResetToken] = useState<string>('');
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    // Extract token from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
      setValidationError('No reset token provided. Please check your email for the complete reset link.');
      setIsValidating(false);
      return;
    }

    setResetToken(token);
    validateResetToken(token);
  }, []);

  const validateResetToken = async (token: string) => {
    try {
      const response = await fetch('/api/users/validate-reset-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserInfo(data.user);
        setIsValidating(false);
      } else {
        const errorData = await response.json();
        setValidationError(errorData.message || 'Invalid or expired reset token.');
        setIsValidating(false);
      }
    } catch (error) {
      console.error('Error validating reset token:', error);
      setValidationError('Failed to validate reset token. Please try again.');
      setIsValidating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    if (formData.newPassword.length < 8) {
      setValidationError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    setValidationError('');

    try {
      const response = await fetch('/api/users/complete-reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: resetToken,
          newPassword: formData.newPassword
        }),
      });

      if (response.ok) {
        setResetSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          setLocation('/login');
        }, 3000);
      } else {
        const errorData = await response.json();
        setValidationError(errorData.message || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setValidationError('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <img 
                src="/bsu-logo_yllw-flame-blak-text.png" 
                alt="Bowie State University" 
                className="h-16 w-auto"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Bowie State University
            </CardTitle>
            <CardDescription className="text-gray-600">
              IT Support Ticketing System
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Validating reset token...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (validationError && !userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <img 
                src="/bsu-logo_yllw-flame-blak-text.png" 
                alt="Bowie State University" 
                className="h-16 w-auto"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Bowie State University
            </CardTitle>
            <CardDescription className="text-gray-600">
              IT Support Ticketing System
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {validationError}
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => setLocation('/forgot-password')} 
              className="w-full"
            >
              Request New Reset Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <img 
                src="/bsu-logo_yllw-flame-blak-text.png" 
                alt="Bowie State University" 
                className="h-16 w-auto"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Bowie State University
            </CardTitle>
            <CardDescription className="text-gray-600">
              IT Support Ticketing System
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mx-auto mb-4 text-green-600">
              <CheckCircle className="h-16 w-16" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Password Reset Successful!
            </h3>
            <p className="text-gray-600 mb-4">
              Your password has been updated. You will be redirected to the login page shortly.
            </p>
            <Button 
              onClick={() => setLocation('/login')} 
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <img 
              src="/bsu-logo_yllw-flame-blak-text.png" 
              alt="Bowie State University" 
              className="h-16 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Bowie State University
          </CardTitle>
          <CardDescription className="text-gray-600">
            IT Support Ticketing System
          </CardDescription>
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Reset Your Password
            </h3>
            <p className="text-sm text-gray-600">
              Hello {userInfo?.firstName} {userInfo?.lastName}
            </p>
            <p className="text-sm text-gray-600">
              {userInfo?.email}
            </p>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {validationError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {validationError}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="Enter new password"
                  className="pr-10"
                  required
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Password must be at least 8 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm new password"
                  className="pr-10"
                  required
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Resetting Password...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Reset Password
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button 
              variant="link" 
              onClick={() => setLocation('/login')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
