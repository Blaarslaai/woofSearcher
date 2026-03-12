import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSession, login, logout, type LoginRequest } from "../lib/auth-api";

export function useAuth() {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ["session"],
    queryFn: getSession,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => login(data),
    onSuccess: async (session) => {
      queryClient.setQueryData(["session"], session);
      await queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await queryClient.setQueryData(["session"], null);
    },
  });

  return {
    user: sessionQuery.data ?? null,
    isLoading: sessionQuery.isLoading,
    isAuthenticated: !!sessionQuery.data,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    loginLoading: loginMutation.isPending,
    logoutLoading: logoutMutation.isPending,
    loginError: loginMutation.error,
  };
}
