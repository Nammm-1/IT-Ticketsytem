import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { User } from "@/types";

export function useAuth() {
  const { data: user, isLoading, refetch, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes - refresh more often
    refetchOnWindowFocus: true, // Refresh when window gains focus
    // Add a small delay to prevent rapid state changes
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Debug logging
  useEffect(() => {
    console.log('🔍 useAuth Debug:', { user, isLoading, error, isAuthenticated: !!user });
  }, [user, isLoading, error]);

  // Force console log on every render
  console.log('🔄 useAuth rendering with:', { user, isLoading, error, isAuthenticated: !!user });

  // Ensure we don't show unauthenticated state while loading
  const isAuthenticated = !isLoading && !!user;

  return {
    user,
    isLoading,
    isAuthenticated,
    refetch,
  };
}
