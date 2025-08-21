import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { invalidateUserCache } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  UserIcon,
  MailIcon,
  ShieldIcon,
  SaveIcon,
  CameraIcon,
  KeyIcon,
  BellIcon,
  GlobeIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XIcon
} from "lucide-react";

interface AccountSettings {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  timezone: string;
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    compactMode: boolean;
    showWelcomeMessage: boolean;
  };
  security: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    showPasswords: boolean;
  };
}

export default function AccountSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const [account, setAccount] = useState<AccountSettings>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    timezone: "UTC",
    language: "en",
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    preferences: {
      theme: 'auto',
      compactMode: false,
      showWelcomeMessage: true,
    },
    security: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      showPasswords: false,
    }
  });

  useEffect(() => {
    if (user) {
      loadAccount();
    }
  }, [user]);

  const loadAccount = async () => {
    if (!user) return;
    
    try {
      console.log('Loading account for user:', user.id);
      
      // Try to get user data from the basic user endpoint first
      let userData;
      
      try {
        // Try the basic user endpoint first (more reliable)
        const userResponse = await fetch(`/api/users/${user.id}`, {
          credentials: 'include'
        });
        
        if (userResponse.ok) {
          userData = await userResponse.json();
          console.log('Basic user endpoint worked, got data:', userData);
        } else {
          console.log('Basic user endpoint failed, trying settings endpoint');
          // Fallback to settings endpoint
          const settingsResponse = await fetch(`/api/users/${user.id}/settings`, {
            credentials: 'include'
          });
          
          if (settingsResponse.ok) {
            userData = await settingsResponse.json();
            console.log('Settings endpoint worked, got data:', userData);
          } else {
            throw new Error(`Both endpoints failed: user=${userResponse.status}, settings=${settingsResponse.status}`);
          }
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }
      
      console.log('User data received:', userData);
      
      // Map database fields to frontend state
      setAccount({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        phone: userData.phone || "",
        timezone: userData.timezone || "UTC",
        language: userData.language || "en",
        notifications: {
          email: Boolean(userData.emailNotifications),
          push: Boolean(userData.pushNotifications),
          sms: Boolean(userData.smsNotifications),
        },
        preferences: {
          theme: userData.theme || 'auto',
          compactMode: Boolean(userData.compactMode),
          showWelcomeMessage: true,
        },
        security: {
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
          showPasswords: false,
        }
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading account:', error);
      
      // Fallback to user data from auth context if API fails
      console.log('Falling back to user data from auth context');
      setAccount({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        phone: "",
        timezone: "UTC",
        language: "en",
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
        preferences: {
          theme: 'auto',
          compactMode: false,
          showWelcomeMessage: true,
        },
        security: {
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
          showPasswords: false,
        }
      });
      setIsLoading(false);
      
      toast({
        title: "Warning",
        description: "Using cached user data. Some settings may not be up to date.",
        variant: "default",
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Prepare data for API
      const updateData = {
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        phone: account.phone,
        timezone: account.timezone,
        language: account.language,
        theme: account.preferences.theme,
        compactMode: account.preferences.compactMode,
        emailNotifications: account.notifications.email,
        pushNotifications: account.notifications.push,
        smsNotifications: account.notifications.sms,
      };
      
      const response = await fetch(`/api/users/${user.id}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      console.log('💾 Settings saved successfully, invalidating cache...');
      
      // Invalidate user cache to refresh sidebar and other components
      invalidateUserCache();
      
      console.log('🔄 Cache invalidation completed');
      
      // Force a small delay to ensure cache invalidation completes
      setTimeout(() => {
        console.log('⏰ Delayed refresh triggered');
        // Trigger a window focus event to force refresh
        window.dispatchEvent(new Event('focus'));
        
        // Also dispatch a custom event that the sidebar can listen to
        window.dispatchEvent(new CustomEvent('userProfileUpdated', {
          detail: { userId: user?.id }
        }));
      }, 100);
      
      toast({
        title: "Account Updated",
        description: "Your account settings have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save account settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    
    if (account.security.newPassword !== account.security.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirm password do not match.",
        variant: "destructive",
      });
      return;
    }

    if (account.security.newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch(`/api/users/${user.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: account.security.currentPassword,
          newPassword: account.security.newPassword
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }
      
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
      
      // Invalidate user cache to refresh sidebar and other components
      invalidateUserCache();
      
      // Reset password fields
      setAccount(prev => ({
        ...prev,
        security: {
          ...prev.security,
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        }
      }));
      
      setShowPasswordModal(false);
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const updateAccount = (key: string, value: any) => {
    setAccount(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateNotifications = (key: string, value: boolean) => {
    setAccount(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const updatePreferences = (key: string, value: any) => {
    setAccount(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }));
  };

  const updateSecurity = (key: string, value: any) => {
    setAccount(prev => ({
      ...prev,
      security: {
        ...prev.security,
        [key]: value
      }
    }));
  };

  const togglePasswordVisibility = () => {
    updateSecurity("showPasswords", !account.security.showPasswords);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading account settings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-64 relative z-20">
        <Header 
          title="Account Settings" 
          subtitle="Manage your account information and preferences"
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Account Header */}
            <div className="flex items-center gap-6 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {user.firstName ? user.firstName.charAt(0) : user.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                <Badge variant="secondary" className="mt-2">
                  {user.role === 'admin' ? 'Administrator' : 
                   user.role === 'manager' ? 'Manager' : 
                   user.role === 'it_staff' ? 'IT Staff' : 'End User'}
                </Badge>
              </div>
              <Button variant="outline" size="sm">
                <CameraIcon className="w-4 h-4 mr-2" />
                Change Photo
              </Button>
            </div>

            {/* Personal Information */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-blue-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={account.firstName}
                      onChange={(e) => updateAccount("firstName", e.target.value)}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={account.lastName}
                      onChange={(e) => updateAccount("lastName", e.target.value)}
                      placeholder="Enter your last name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={account.email}
                      onChange={(e) => updateAccount("email", e.target.value)}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={account.phone}
                      onChange={(e) => updateAccount("phone", e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Preferences */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GlobeIcon className="w-5 h-5 text-green-600" />
                  Account Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <select
                      id="timezone"
                      value={account.timezone}
                      onChange={(e) => updateAccount("timezone", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <select
                      id="language"
                      value={account.language}
                      onChange={(e) => updateAccount("language", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <select
                      id="theme"
                      value={account.preferences.theme}
                      onChange={(e) => updatePreferences("theme", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="auto">Auto (System)</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="compactMode">Compact Mode</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        id="compactMode"
                        type="checkbox"
                        checked={account.preferences.compactMode}
                        onChange={(e) => updatePreferences("compactMode", e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {account.preferences.compactMode ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BellIcon className="w-5 h-5 text-purple-600" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <Label htmlFor="emailNotif" className="text-base font-medium">Email Notifications</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications via email</p>
                  </div>
                  <input
                    id="emailNotif"
                    type="checkbox"
                    checked={account.notifications.email}
                    onChange={(e) => updateNotifications("email", e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <Label htmlFor="pushNotif" className="text-base font-medium">Push Notifications</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Receive in-app notifications</p>
                  </div>
                  <input
                    id="pushNotif"
                    type="checkbox"
                    checked={account.notifications.push}
                    onChange={(e) => updateNotifications("push", e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <Label htmlFor="smsNotif" className="text-base font-medium">SMS Notifications</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications via SMS</p>
                  </div>
                  <input
                    id="smsNotif"
                    type="checkbox"
                    checked={account.notifications.sms}
                    onChange={(e) => updateNotifications("sms", e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldIcon className="w-5 h-5 text-red-600" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Password</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Change your account password</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPasswordModal(true)}
                    className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                  >
                    <KeyIcon className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                </div>
                
                <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <Label className="text-base font-medium">Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Add an extra layer of security</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <LockIcon className="w-4 h-4 mr-2" />
                    Enable 2FA
                  </Button>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <Label className="text-base font-medium">Login Sessions</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Manage active login sessions</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <EyeIcon className="w-4 h-4 mr-2" />
                    View Sessions
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangleIcon className="w-5 h-5 text-orange-600" />
                  Account Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Export Data</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Download your account data</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Download
                  </Button>
                </div>
                
                <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <Label className="text-base font-medium text-red-600">Delete Account</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Permanently delete your account</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-100 dark:hover:bg-red-800">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-black hover:bg-gray-800 text-white px-8 py-3"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                ) : (
                  <>
                    <SaveIcon className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </main>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Change Password</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Update your account password</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPasswordModal(false)}
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={account.security.showPasswords ? "text" : "password"}
                    value={account.security.currentPassword}
                    onChange={(e) => updateSecurity("currentPassword", e.target.value)}
                    placeholder="Enter current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={togglePasswordVisibility}
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  >
                    {account.security.showPasswords ? (
                      <EyeOffIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={account.security.showPasswords ? "text" : "password"}
                    value={account.security.newPassword}
                    onChange={(e) => updateSecurity("newPassword", e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={account.security.showPasswords ? "text" : "password"}
                    value={account.security.confirmPassword}
                    onChange={(e) => updateSecurity("confirmPassword", e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !account.security.currentPassword || !account.security.newPassword || !account.security.confirmPassword}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isChangingPassword ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
