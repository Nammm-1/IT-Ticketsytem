import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { User } from "@/types";

export function useAuth() {
  const { data: user, isLoading, refetch, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes - refresh more often
    refetchOnWindowFocus: true, // Refresh when window gains focus
  });

  // Debug logging
  useEffect(() => {
    console.log('🔍 useAuth Debug:', { user, isLoading, error, isAuthenticated: !!user });
  }, [user, isLoading, error]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    refetch,
  };
}
