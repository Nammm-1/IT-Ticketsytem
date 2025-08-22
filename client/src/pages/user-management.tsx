import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "@/types";
import { 
  SearchIcon, 
  FilterIcon, 
  RefreshCwIcon,
  UsersIcon,
  MailIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  XCircleIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  PlusIcon,
  SortAscIcon,
  SortDescIcon,
  SaveIcon,
  XIcon,
  KeyIcon,
  CalendarIcon
} from "lucide-react";
import { Link } from "wouter";

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  roleDistribution: { [key: string]: number };
  recentRegistrations: number;
}

interface EditUserForm {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface EditFormErrors {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function UserManagement() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  
  // Inject CSS to fix transparent dropdowns and other UI elements
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Force opaque backgrounds for all UI components */
      .select-content, .select-item, .select-trigger,
      [data-radix-popper-content-wrapper],
      .bg-red-50, .bg-blue-50, .bg-yellow-50, .bg-green-50,
      .dark .bg-red-900\\/20, .dark .bg-blue-900\\/20, .dark .bg-yellow-900\\/20, .dark .bg-green-900\\/20,
      .bg-white, .dark .bg-gray-800,
      .bg-gray-50, .dark .bg-gray-900,
      .bg-primary, .bg-secondary,
      .bg-destructive, .bg-muted,
      .bg-popover, .bg-card,
      .bg-accent, .bg-accent-foreground {
        background-color: var(--background) !important;
        background: var(--background) !important;
        opacity: 1 !important;
      }
      
      /* Force opaque borders */
      .border, .border-red-200, .border-blue-200, .border-yellow-200, .border-green-200,
      .dark .border-red-800, .dark .border-blue-800, .dark .border-yellow-800, .dark .border-green-800,
      .border-gray-300, .dark .border-gray-600 {
        border-color: var(--border) !important;
        opacity: 1 !important;
      }
      
      /* Force opaque text */
      .text-red-500, .text-blue-600, .text-yellow-600, .text-green-600,
      .dark .text-red-400, .dark .text-blue-400, .dark .text-yellow-400, .dark .text-green-400 {
        color: var(--foreground) !important;
        opacity: 1 !important;
      }
      
      /* Ensure modals and overlays are opaque */
      .fixed.inset-0.bg-black.bg-opacity-50,
      .bg-white, .dark .bg-gray-800,
      .bg-gray-50, .dark .bg-gray-900 {
        background-color: var(--background) !important;
        background: var(--background) !important;
        opacity: 1 !important;
      }
      
      /* Fix any remaining transparent elements */
      .bg-opacity-50, .bg-opacity-20, .bg-opacity-10 {
        opacity: 1 !important;
      }
      
      /* Ensure form elements have proper backgrounds */
      input, select, textarea, button {
        background-color: var(--background) !important;
        background: var(--background) !important;
        opacity: 1 !important;
      }
      
      /* Fix modal backgrounds */
      .modal, .dialog, .popover, .tooltip {
        background-color: var(--background) !important;
        background: var(--background) !important;
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // State for user management
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("firstName");
  const [sortOrder, setSortOrder] = useState("asc");
  
  // State for modals
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // State for edit form
  const [editForm, setEditForm] = useState<EditUserForm>({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    is_active: true
  });
  const [editErrors, setEditErrors] = useState<EditFormErrors>({
    firstName: "",
    lastName: "",
    email: "",
    role: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for create form
  const [createForm, setCreateForm] = useState<EditUserForm>({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    is_active: true
  });
  const [createErrors, setCreateErrors] = useState<{ [key: string]: string }>({});
  const [isCreating, setIsCreating] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access user management.",
        variant: "destructive",
      });
      window.location.href = "/api/login";
    }
  }, [isLoading, isAuthenticated, toast]);

  // Check if user has admin access
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role !== 'admin') {
        toast({
          title: "Access Denied",
          description: "Only administrators can access user management.",
          variant: "destructive",
        });
        window.location.href = "/";
      }
    }
  }, [isLoading, isAuthenticated, user, toast]);

  // Fetch users
  const { data: users, isLoading: usersLoading, error: usersError } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch(`/api/users`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    },
    enabled: isAuthenticated && user?.role === 'admin',
    retry: false,
  });

  // Fetch tickets for user statistics
  const { data: tickets } = useQuery({
    queryKey: ["/api/tickets"],
    queryFn: async () => {
      const response = await fetch(`/api/tickets`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }
      return response.json();
    },
    enabled: isAuthenticated && user?.role === 'admin',
    retry: false,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (usersError && isUnauthorizedError(usersError as Error)) {
      toast({
        title: "Authentication Required",
        description: "Please log in again to continue.",
        variant: "destructive",
      });
      window.location.href = "/api/login";
    }
  }, [usersError, toast]);

  // Edit user mutation
  const editUserMutation = useMutation({
    mutationFn: async ({ userId, userData }: { userId: string; userData: EditUserForm }) => {
      const response = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setShowEditModal(false);
      setSelectedUser(null);
      setEditForm({
        firstName: "",
        lastName: "",
        email: "",
        role: "",
        is_active: true
      });
      setEditErrors({
        firstName: "",
        lastName: "",
        email: "",
        role: ""
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: EditUserForm) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      // Show success message with email details
      if (data.emailResult?.success) {
        if (data.emailResult.tempPassword) {
          toast({
            title: "✅ User Created Successfully!",
            description: (
              <div className="space-y-2">
                <p>{data.emailResult.message}</p>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    📧 Email Notification Sent
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    A welcome email with login credentials has been sent to <strong>{data.email}</strong>
                  </p>
                </div>
              </div>
            ),
            duration: 8000,
          });
        } else {
          toast({
            title: "✅ User Created Successfully!",
            description: data.emailResult.message,
            duration: 5000,
          });
        }
      } else {
        // Email failed but user was created
        toast({
          title: "⚠️ User Created, Email Failed",
          description: (
            <div className="space-y-2">
              <p>User was created successfully, but email notification failed.</p>
              {data.emailResult?.tempPassword && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    🔑 Temporary Password (Share Manually)
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    <strong>Password:</strong> <code className="bg-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded">{data.emailResult.tempPassword}</code>
                  </p>
                </div>
              )}
            </div>
          ),
          duration: 10000,
        });
      }
      
      setShowCreateModal(false);
      setCreateForm({
        firstName: "",
        lastName: "",
        email: "",
        role: "",
        is_active: true
      });
      setCreateErrors({});
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Find the user to get their email
      const user = users?.find(u => u.id === userId);
      if (!user?.email) {
        throw new Error('User email not found');
      }
      
      const response = await fetch(`/api/users/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email: user.email }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }
      
      return response.json();
    },
    onSuccess: (data, userId) => {
      // Find the user to show their name in the success message
      const user = users?.find(u => u.id === userId);
      
      if (data.success) {
        toast({
          title: "✅ Password Reset Complete!",
          description: (
            <div className="space-y-2">
              <p>{data.message}</p>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                  🔑 Temporary Password Generated
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Password reset completed for <strong>{user?.email}</strong>
                </p>
                {data.tempPassword && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-2">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      📧 Temporary Password Sent
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      A new temporary password has been sent to the user's email.
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      The user can change this password after logging in.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ),
          duration: 8000,
        });
      } else {
        toast({
          title: "⚠️ Password Reset Failed",
          description: data.message || "Failed to reset password",
          variant: "destructive",
          duration: 5000,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  // Simple toggle function that actually works
  const simpleToggleStatus = async (userId: string) => {
    try {
      console.log(`🔧 SIMPLE TOGGLE: Starting for user ${userId}`);
      
      const targetUser = users?.find(u => u.id === userId);
      if (!targetUser) {
        console.log(`🔧 SIMPLE TOGGLE: User not found`);
        return;
      }
      
      const currentStatus = isUserActive(targetUser);
      const newStatus = !currentStatus;
      
      console.log(`🔧 SIMPLE TOGGLE: Current status: ${currentStatus}, New status: ${newStatus}`);
      console.log(`🔧 SIMPLE TOGGLE: User data:`, targetUser);
      
      // Use the new dedicated toggle endpoint
      const response = await fetch(`/api/users/${encodeURIComponent(userId)}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      console.log(`🔧 SIMPLE TOGGLE: Response status:`, response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log(`🔧 SIMPLE TOGGLE: Error:`, errorData);
        throw new Error(errorData.message || 'Failed to update user status');
      }
      
      const result = await response.json();
      console.log(`🔧 SIMPLE TOGGLE: Success! Result:`, result);
      
      // Update local state immediately
      if (users) {
        const updatedUsers = users.map(user => 
          user.id === userId 
            ? { ...user, is_active: result.newStatus }
            : user
        );
        queryClient.setQueryData(["/api/users"], updatedUsers);
      }
      
      // Show success message
      const statusText = result.newStatus ? 'active' : 'inactive';
      toast({
        title: "Status Updated",
        description: `User ${targetUser.email} is now ${statusText}. ${
          !result.newStatus 
            ? '⚠️ This user can no longer log in and must contact an administrator to reactivate their account.' 
            : '✅ This user can now log in normally.'
        }`,
        duration: 8000,
      });
      
    } catch (error) {
      console.error(`🔧 SIMPLE TOGGLE: Error:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  // Delete (completely remove) user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete user');
      }
      return response.json();
    },
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      const targetUser = users?.find(u => u.id === userId);
      toast({
        title: "User Deleted",
        description: `User ${targetUser?.email || userId} has been completely removed from the system.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Calculate user statistics
  const calculateUserStats = (): UserStats => {
    if (!users) {
      return {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        roleDistribution: { end_user: 0, it_staff: 0, manager: 0, admin: 0 },
        recentRegistrations: 0
      };
    }

    const totalUsers = users.length;
    const activeUsers = users.filter((u: User) => isUserActive(u)).length;
    const inactiveUsers = totalUsers - activeUsers;
    
    const roleDistribution = users.reduce((acc: any, u: User) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, { end_user: 0, it_staff: 0, manager: 0, admin: 0 });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRegistrations = users.filter((u: User) => 
      u.createdAt && new Date(u.createdAt) > thirtyDaysAgo
    ).length;

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      roleDistribution,
      recentRegistrations
    };
  };

  // Helper function to check if user is active
  const isUserActive = (user: User): boolean => {
    return user.is_active !== false && user.is_active !== 0;
  };

  // Filter and sort users
  const getFilteredAndSortedUsers = (): User[] => {
    if (!users) return [];

    let filteredUsers = users.filter((u: User) => {
      const matchesSearch = searchTerm === "" || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.firstName && u.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.lastName && u.lastName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && isUserActive(u)) ||
        (statusFilter === "inactive" && !isUserActive(u));
      
      return matchesSearch && matchesRole && matchesStatus;
    });

    // Sort users
    filteredUsers.sort((a: User, b: User) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case "name":
          aValue = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase();
          bValue = `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase();
          break;
        case "email":
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case "role":
          aValue = a.role;
          bValue = b.role;
          break;
        case "created":
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        case "last_login":
          aValue = new Date(a.last_login || 0);
          bValue = new Date(b.last_login || 0);
          break;
        default:
          aValue = a.firstName || "";
          bValue = b.firstName || "";
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filteredUsers;
  };

  const filteredUsers = getFilteredAndSortedUsers();
  const userStats = calculateUserStats();

  const handleRefreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
    toast({
      title: "Refreshing",
      description: "Updating user data...",
    });
  };

  // Handle user actions
  const handleUserAction = (action: string, userId: string) => {
    console.log(`🎯 handleUserAction called with action: "${action}" for user: ${userId}`);
    console.log(`🎯 Current time: ${new Date().toISOString()}`);
    console.log(`🎯 Stack trace:`, new Error().stack);
    
    // Prevent multiple actions from running simultaneously
    if (editUserMutation.isPending || deleteUserMutation.isPending) {
      console.log(`🎯 Another action is already in progress, ignoring ${action}`);
      console.log(`🎯 Current mutations state:`, {
        edit: editUserMutation.isPending,
        delete: deleteUserMutation.isPending
      });
      return;
    }
    
    if (action === "Edit") {
      console.log(`Frontend: Processing Edit action for user: ${userId}`);
      const userToEdit = users?.find(u => u.id === userId);
      if (userToEdit) {
        setSelectedUser(userToEdit);
        setEditForm({
          firstName: userToEdit.firstName || "",
          lastName: userToEdit.lastName || "",
          email: userToEdit.email,
          role: userToEdit.role,
          is_active: isUserActive(userToEdit)
        });
        setEditErrors({
          firstName: "",
          lastName: "",
          email: "",
          role: ""
        });
        setShowEditModal(true);
      }
    } else if (action === "Create User") {
      console.log(`Frontend: Processing Create User action`);
      setCreateForm({
        firstName: "",
        lastName: "",
        email: "",
        role: "",
        is_active: true
      });
      setCreateErrors({});
      setShowCreateModal(true);
    } else if (action === "Delete") {
      console.log(`Frontend: Processing Delete action for user: ${userId}`);
      const targetUser = users?.find(u => u.id === userId);
      if (!targetUser) return;
      if (user && targetUser.id === user.id) {
        toast({
          title: "Cannot Delete Yourself",
          description: "You cannot delete your own account. Use the logout function instead.",
          variant: "destructive",
        });
        return;
      }
      const confirmed = window.confirm(`⚠️ PERMANENT DELETE: Are you sure you want to completely remove user ${targetUser.email}? This action cannot be undone and will permanently delete all their data.`);
      if (!confirmed) return;
      deleteUserMutation.mutate(userId);
    } else if (action === "Reset Password") {
      console.log(`Frontend: Processing Reset Password action for user: ${userId}`);
      resetPasswordMutation.mutate(userId);
    } else if (action === "Toggle Status") {
      console.log(`🎯 TOGGLE STATUS BUTTON CLICKED for user: ${userId}`);
      console.log(`🎯 Action parameter: "${action}"`);
      console.log(`🎯 User ID: ${userId}`);
      
      // Use the simple toggle function instead of the broken mutation
      console.log(`🎯 Calling simpleToggleStatus(${userId})`);
      simpleToggleStatus(userId);
      console.log(`🎯 simpleToggleStatus(${userId}) called`);
    } else {
      console.log(`Frontend: Unknown action: "${action}"`);
    }
  };

  // Validate edit form
  const validateEditForm = (): boolean => {
    const errors: EditFormErrors = {
      firstName: "",
      lastName: "",
      email: "",
      role: ""
    };

    if (!editForm.firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!editForm.lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    if (!editForm.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!editForm.role) {
      errors.role = "Role is required";
    }

    setEditErrors(errors);
    return Object.keys(errors).filter(key => errors[key as keyof EditFormErrors]).length === 0;
  };

  // Handle edit form submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`📝 EDIT FORM SUBMITTED - This should NOT happen when clicking toggle!`);
    console.log(`📝 Edit form data:`, editForm);
    console.log(`📝 Selected user:`, selectedUser);
    
    // Validate form
    const errors: EditFormErrors = {
      firstName: "",
      lastName: "",
      email: "",
      role: ""
    };
    if (!editForm.firstName.trim()) errors.firstName = "First name is required";
    if (!editForm.lastName.trim()) errors.lastName = "Last name is required";
    if (!editForm.email.trim()) errors.email = "Email is required";
    if (!editForm.role) errors.role = "Role is required";
    
    if (Object.keys(errors).filter(key => errors[key as keyof EditFormErrors]).length > 0) {
      setEditErrors(errors);
      return;
    }
    
    if (!selectedUser) return;
    
    console.log(`📝 Calling editUserMutation for user: ${selectedUser.id}`);
    editUserMutation.mutate({ userId: selectedUser.id, userData: editForm });
  };

  // Handle edit form changes
  const handleEditFormChange = (field: keyof EditUserForm, value: string | boolean) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (editErrors[field as keyof EditFormErrors]) {
      setEditErrors(prev => ({
        ...prev,
        [field as keyof EditFormErrors]: ""
      }));
    }
  };

  // Validate create form
  const validateCreateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!createForm.firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!createForm.lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    if (!createForm.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!createForm.role) {
      errors.role = "Role is required";
    }

    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle create form submission
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCreateForm()) {
      return;
    }

    setIsCreating(true);
    
    try {
      await createUserMutation.mutateAsync(createForm);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle create form changes
  const handleCreateFormChange = (field: keyof EditUserForm, value: string | boolean) => {
    setCreateForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (createErrors[field]) {
      setCreateErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'manager': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'it_staff': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'end_user': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (isActive: boolean | undefined) => {
    if (isActive === false) {
      return <XCircleIcon className="w-4 h-4 text-red-500" />;
    }
    return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">Only administrators can access user management.</p>
          <Button className="mt-4" onClick={() => window.location.href = "/"}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-64 relative z-20">
        <Header 
          title="User Management" 
          subtitle="Manage and monitor all system users"
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Controls */}
          <div className="mb-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              {/* Search */}
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              {/* Role Filter */}
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="select-trigger w-40 !bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 !text-gray-900 dark:!text-white shadow-sm">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent className="select-content !bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 shadow-xl z-50">
                  <SelectItem value="all" className="select-item !bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">All Roles</SelectItem>
                  <SelectItem value="admin" className="select-item !bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Admin</SelectItem>
                  <SelectItem value="manager" className="select-item !bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Manager</SelectItem>
                  <SelectItem value="it_staff" className="select-item !bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">IT Staff</SelectItem>
                  <SelectItem value="end_user" className="select-item !bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">End User</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 !bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 !text-gray-900 dark:!text-white shadow-sm">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="!bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 shadow-xl z-50">
                  <SelectItem value="all" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">All Status</SelectItem>
                  <SelectItem value="active" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Active</SelectItem>
                  <SelectItem value="inactive" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Inactive</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Options */}
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 !bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 !text-gray-900 dark:!text-white shadow-sm">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent className="!bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 shadow-xl z-50">
                    <SelectItem value="name" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Name</SelectItem>
                    <SelectItem value="email" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Email</SelectItem>
                    <SelectItem value="role" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Role</SelectItem>
                    <SelectItem value="created" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Created Date</SelectItem>
                    <SelectItem value="last_login" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Last Login</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                >
                  {sortOrder === "asc" ? <SortAscIcon className="w-4 h-4" /> : <SortDescIcon className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="flex gap-2 w-full lg:w-auto">
              <Button
                variant="outline"
                onClick={handleRefreshData}
                disabled={usersLoading}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <RefreshCwIcon className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              
              <Button
                onClick={() => handleUserAction("Create User", "")}
                className="bg-primary hover:bg-primary/90"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {usersLoading && (
            <div className="mb-8 text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading user data...</p>
            </div>
          )}

          {/* Error State */}
          {usersError && (
            <div className="mb-8 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-100">
                <AlertTriangleIcon className="w-5 h-5" />
                <span className="font-medium">Error loading users</span>
              </div>
              <p className="text-red-700 dark:text-red-200 text-sm mt-1">
                {usersError instanceof Error ? usersError.message : 'Failed to load user data'}
              </p>
            </div>
          )}

          {/* Debug Info */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Debug Info:</strong> 
              Total Users: {users?.length || 0} | 
              Active Users: {users?.filter(u => isUserActive(u)).length || 0} | 
              Inactive Users: {users?.filter(u => !isUserActive(u)).length || 0} | 
              Filtered Users: {filteredUsers.length} | 
              Current Filter: {statusFilter} | 
              Role Filter: {roleFilter}
            </div>
          </div>

          {/* User Table */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Users ({filteredUsers.length})</span>
                <div className="text-sm font-normal text-muted-foreground">
                  Showing {filteredUsers.length} of {userStats.totalUsers} users
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">User</th>
                      <th className="text-left p-3">Role</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Created</th>
                      <th className="text-left p-3">Last Login</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-foreground text-sm font-medium">
                                {user.firstName?.[0]}{user.lastName?.[0] || user.email[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">
                                {user.firstName && user.lastName 
                                  ? `${user.firstName} ${user.lastName}`
                                  : "No Name Set"
                                }
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <MailIcon className="w-3 h-3" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="capitalize">
                            {user.role?.replace('_', ' ') || 'Unknown Role'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(isUserActive(user))}
                            <span className={isUserActive(user) ? "text-green-600" : "text-red-600"}>
                              {isUserActive(user) ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {formatDateTime(user.last_login)}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserDetails(true);
                              }}
                              className="hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 hover:text-blue-700"
                              title="View user details"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUserAction("Edit", user.id)}
                              className="hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 hover:text-green-700"
                              title="Edit user"
                            >
                              <EditIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUserAction("Delete", user.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Permanently delete user account"
                            >
                              <TrashIcon className="w-4 h-4" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                      ? "No users match your current filters."
                      : "No users found in the system."
                    }
                  </p>
                  {(searchTerm || roleFilter !== "all" || statusFilter !== "all") && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setRoleFilter("all");
                        setStatusFilter("all");
                      }}
                      className="mt-2"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Details Modal */}
          {showUserDetails && selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Details</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">View and manage user information</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUserDetails(false)}
                    className="h-10 w-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  >
                    <XIcon className="w-5 h-5" />
                  </Button>
                </div>
                
                {/* User Profile Section */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 mb-8 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-2xl font-bold">
                        {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0] || selectedUser.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {selectedUser.firstName && selectedUser.lastName 
                          ? `${selectedUser.firstName} ${selectedUser.lastName}`
                          : "No Name Set"
                        }
                      </h3>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <MailIcon className="w-4 h-4" />
                        <span className="text-lg">{selectedUser.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Role Card */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                        <UsersIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</span>
                    </div>
                    <Badge className={`text-sm px-3 py-1 ${getRoleColor(selectedUser.role)}`}>
                      {selectedUser.role?.replace('_', ' ') || 'Unknown Role'}
                    </Badge>
                  </div>

                  {/* Status Card */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                        {getStatusIcon(isUserActive(selectedUser))}
                      </div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</span>
                    </div>
                    <span className={`text-sm font-medium ${
                      isUserActive(selectedUser) ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}>
                      {isUserActive(selectedUser) ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Created Date Card */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDateTime(selectedUser.createdAt)}
                    </span>
                  </div>

                  {/* Last Login Card */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                        <KeyIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Login</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDateTime(selectedUser.last_login)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleUserAction("Edit", selectedUser.id)}
                      className="flex-1 h-12 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600"
                    >
                      <EditIcon className="w-4 h-4 mr-2" />
                      Edit User
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleUserAction("Reset Password", selectedUser.id)}
                      disabled={resetPasswordMutation.isPending}
                      className="flex-1 h-12 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600"
                    >
                      {resetPasswordMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mx-auto"></div>
                      ) : (
                        <KeyIcon className="w-4 h-4 mr-2" />
                      )}
                      Reset Password
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleUserAction("Toggle Status", selectedUser.id)}
                      className={`flex-1 h-12 ${
                        isUserActive(selectedUser) 
                          ? "border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 bg-orange-50 dark:bg-orange-900/20" 
                          : "border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 bg-green-50 dark:bg-green-900/20"
                      }`}
                    >
                      {isUserActive(selectedUser) ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit User Modal */}
          {showEditModal && selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit User</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Update user information and settings</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                      setEditForm({
                        firstName: "",
                        lastName: "",
                        email: "",
                        role: "",
                        is_active: true
                      });
                      setEditErrors({
                        firstName: "",
                        lastName: "",
                        email: "",
                        role: ""
                      });
                    }}
                    className="h-10 w-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  >
                    <XIcon className="w-5 h-5" />
                  </Button>
                </div>

                {/* User Profile Preview */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 mb-8 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-xl font-bold">
                        {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0] || selectedUser.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {selectedUser.firstName && selectedUser.lastName 
                          ? `${selectedUser.firstName} ${selectedUser.lastName}`
                          : "No Name Set"
                        }
                      </h3>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <MailIcon className="w-4 h-4" />
                        <span className="text-base">{selectedUser.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <form onSubmit={handleEditSubmit} className="space-y-6">
                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* First Name */}
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <UsersIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        value={editForm.firstName}
                        onChange={(e) => handleEditFormChange("firstName", e.target.value)}
                        className={`h-12 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${editErrors.firstName ? 'border-red-500 ring-red-200' : ''}`}
                        placeholder="Enter first name"
                      />
                      {editErrors.firstName && (
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                          <AlertTriangleIcon className="w-4 h-4" />
                          <span>{editErrors.firstName}</span>
                        </div>
                      )}
                    </div>

                    {/* Last Name */}
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <UsersIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        value={editForm.lastName}
                        onChange={(e) => handleEditFormChange("lastName", e.target.value)}
                        className={`h-12 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${editErrors.lastName ? 'border-red-500 ring-red-200' : ''}`}
                        placeholder="Enter last name"
                      />
                      {editErrors.lastName && (
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                          <AlertTriangleIcon className="w-4 h-4" />
                          <span>{editErrors.lastName}</span>
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <MailIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => handleEditFormChange("email", e.target.value)}
                        className={`h-12 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 ${editErrors.email ? 'border-red-500 ring-red-200' : ''}`}
                        placeholder="Enter email address"
                      />
                      {editErrors.email && (
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                          <AlertTriangleIcon className="w-4 h-4" />
                          <span>{editErrors.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Role */}
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <UsersIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        User Role
                      </Label>
                      <Select value={editForm.role} onValueChange={(value) => handleEditFormChange("role", value)}>
                        <SelectTrigger className="h-12 !bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 !text-gray-900 dark:!text-white shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200">
                          <SelectValue placeholder="Select user role" />
                        </SelectTrigger>
                        <SelectContent className="!bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 shadow-xl z-50">
                          <SelectItem value="admin" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Admin</SelectItem>
                          <SelectItem value="manager" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Manager</SelectItem>
                          <SelectItem value="it_staff" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">IT Staff</SelectItem>
                          <SelectItem value="end_user" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">End User</SelectItem>
                        </SelectContent>
                      </Select>
                      {editErrors.role && (
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                          <AlertTriangleIcon className="w-4 h-4" />
                          <span>{editErrors.role}</span>
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <Label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        {isUserActive(selectedUser) ? (
                          <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                        )}
                        Account Status
                      </Label>
                      <Select value={selectedUser ? (isUserActive(selectedUser) ? "active" : "inactive") : "active"} onValueChange={(value) => handleEditFormChange("is_active", value === "active")}>
                        <SelectTrigger className="h-12 !bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 !text-gray-900 dark:!text-white shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200">
                          <SelectValue placeholder="Select account status" />
                        </SelectTrigger>
                        <SelectContent className="!bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 shadow-xl z-50">
                          <SelectItem value="active" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Active</SelectItem>
                          <SelectItem value="inactive" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="outline"
                      onClick={() => setShowEditModal(false)}
                      disabled={isSubmitting}
                      className="flex-1 h-12 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 h-12 bg-black hover:bg-gray-800 text-black shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {isSubmitting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                      ) : (
                        <>
                          <SaveIcon className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Create User Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Create New User</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateModal(false)}
                  >
                    <XIcon className="w-5 h-5" />
                  </Button>
                </div>
                
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="createFirstName" className="text-sm font-medium text-muted-foreground">First Name</Label>
                      <Input
                        id="createFirstName"
                        value={createForm.firstName}
                        onChange={(e) => handleCreateFormChange("firstName", e.target.value)}
                        className={`mt-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${createErrors.firstName ? 'border-red-500' : ''}`}
                        placeholder="Enter first name"
                      />
                      {createErrors.firstName && <p className="text-red-600 text-xs mt-1 bg-red-100 dark:bg-red-900 px-2 py-1 rounded border border-red-300 dark:border-red-700">{createErrors.firstName}</p>}
                    </div>
                    <div>
                      <Label htmlFor="createLastName" className="text-sm font-medium text-muted-foreground">Last Name</Label>
                      <Input
                        id="createLastName"
                        value={createForm.lastName}
                        onChange={(e) => handleCreateFormChange("lastName", e.target.value)}
                        className={`mt-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${createErrors.lastName ? 'border-red-500' : ''}`}
                        placeholder="Enter last name"
                      />
                      {createErrors.lastName && <p className="text-red-600 text-xs mt-1 bg-red-100 dark:bg-red-900 px-2 py-1 rounded border border-red-300 dark:border-red-700">{createErrors.lastName}</p>}
                    </div>
                    <div>
                      <Label htmlFor="createEmail" className="text-sm font-medium text-muted-foreground">Email</Label>
                      <Input
                        id="createEmail"
                        type="email"
                        value={createForm.email}
                        onChange={(e) => handleCreateFormChange("email", e.target.value)}
                        className={`mt-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${createErrors.email ? 'border-red-500' : ''}`}
                        placeholder="Enter email address"
                      />
                      {createErrors.email && <p className="text-red-600 text-xs mt-1 bg-red-100 dark:bg-red-900 px-2 py-1 rounded border border-red-300 dark:border-red-700">{createErrors.email}</p>}
                    </div>
                    <div>
                      <Label htmlFor="createRole" className="text-sm font-medium text-muted-foreground">Role</Label>
                      <Select value={createForm.role} onValueChange={(value) => handleCreateFormChange("role", value)}>
                        <SelectTrigger className="mt-1 !bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 !text-gray-900 dark:!text-white shadow-sm">
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent className="!bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 shadow-xl z-50">
                          <SelectItem value="admin" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Admin</SelectItem>
                          <SelectItem value="manager" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Manager</SelectItem>
                          <SelectItem value="it_staff" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">IT Staff</SelectItem>
                          <SelectItem value="end_user" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">End User</SelectItem>
                        </SelectContent>
                      </Select>
                      {createErrors.role && <p className="text-red-600 text-xs mt-1 bg-red-100 dark:bg-red-900 px-2 py-1 rounded border border-red-300 dark:border-red-700">{createErrors.role}</p>}
                    </div>
                    <div>
                      <Label htmlFor="createStatus" className="text-sm font-medium text-muted-foreground">Status</Label>
                      <Select value={createForm.is_active ? "active" : "inactive"} onValueChange={(value) => handleCreateFormChange("is_active", value === "active")}>
                        <SelectTrigger className="mt-1 !bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 !text-gray-900 dark:!text-white shadow-sm">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent className="!bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 shadow-xl z-50">
                          <SelectItem value="active" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Active</SelectItem>
                          <SelectItem value="inactive" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-medium mb-1">Important Note:</p>
                        <p>New users will be created with a temporary password. They will need to reset their password on first login.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateModal(false)}
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                      ) : (
                        <PlusIcon className="w-4 h-4 mr-2" />
                      )}
                      Create User
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}