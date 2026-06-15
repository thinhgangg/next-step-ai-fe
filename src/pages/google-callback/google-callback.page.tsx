import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { setSessionTokens } from "@/shared/lib/storage";
import { apolloClient } from "@/shared/api/graphql/client";
import { CURRENT_USER_ROLE_QUERY } from "@/features/auth/query/current-user-role.query";

type MeResponse = {
  me: {
    role?: string | null;
  } | null;
};

function isAdminRole(role?: string | null) {
  return role?.toLowerCase() === "admin";
}

export function GoogleCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const completeLogin = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        if (isMounted) {
          navigate({ to: "/login" });
        }
        return;
      }

      try {
        setSessionTokens({ accessToken: token });
        const { data } = await apolloClient.query<MeResponse>({
          query: CURRENT_USER_ROLE_QUERY,
          fetchPolicy: "network-only",
        });
        if (isMounted) {
          navigate({ to: isAdminRole(data?.me?.role) ? "/admin" : "/dashboard" });
        }
      } catch {
        navigate({ to: "/login" });
      }
    };

    completeLogin();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground font-sans">
      <p className="text-base font-medium">Đang đăng nhập...</p>
    </div>
  );
}
