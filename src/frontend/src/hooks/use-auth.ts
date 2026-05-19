import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import type { UserProfile } from "../types";
import { useBackend } from "./use-backend";

export function useAuth() {
  const { loginStatus, identity, login, clear } = useInternetIdentity();
  const isAuthenticated = loginStatus === "success" || loginStatus === "idle";
  const isLoading =
    loginStatus === "initializing" || loginStatus === "logging-in";
  const principal = identity?.getPrincipal().toText() ?? null;

  return {
    isAuthenticated,
    isLoading,
    principal,
    identity,
    login,
    logout: clear,
    loginStatus,
  };
}

export function useProfile() {
  const { actor, isFetching } = useBackend();
  return useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.get_my_profile();
    },
    enabled: !!actor && !isFetching,
    retry: 1,
  });
}
