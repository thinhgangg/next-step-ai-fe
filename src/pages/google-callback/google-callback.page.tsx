import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { setSessionTokens } from "@/shared/lib/storage";

export function GoogleCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      setSessionTokens({ accessToken: token });
      navigate({ to: "/dashboard" });
      return;
    }

    navigate({ to: "/login" });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground font-sans">
      <p className="text-base font-medium">Đang đăng nhập...</p>
    </div>
  );
}
