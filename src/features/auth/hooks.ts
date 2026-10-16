"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { queryKeys } from "@/lib/query-keys";
import { useCrmMutation } from "@/lib/mutations";
import { authService } from "@/services/auth";

const SESSION_KEY = queryKeys.session.scoped("me");

/** The signed-in user, role and module access. */
export function useSession() {
  return useQuery({ queryKey: SESSION_KEY, queryFn: authService.me, staleTime: 5 * 60_000, retry: false });
}

/** Only call where the user must be signed in (inside the dashboard layout). */
export function useSessionUser() {
  return useSession().data?.user ?? null;
}

/** Only allows redirects back into the app, never to another site. */
export function safeNext(next: string | null | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login") ? next : "/";
}

export function useLogin(next: string | null) {
  const qc = useQueryClient();
  const router = useRouter();
  return useCrmMutation({
    mutationFn: authService.login,
    toastErrors: false,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: SESSION_KEY });
      router.replace(safeNext(next));
      router.refresh();
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const router = useRouter();
  return useCrmMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      qc.clear(); // nothing from the previous user stays cached
      router.replace("/login?signedout=1");
      router.refresh();
    },
  });
}

export function useForgotPassword() {
  return useCrmMutation({ mutationFn: (email: string) => authService.forgotPassword(email), toastErrors: false });
}

export function useResetPassword() {
  return useCrmMutation({ mutationFn: (v: { token: string; password: string }) => authService.resetPassword(v.token, v.password), toastErrors: false });
}
