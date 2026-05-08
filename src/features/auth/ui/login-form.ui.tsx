import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useLogin } from "../model/login.model";
import { Link } from "@tanstack/react-router";
import { Eye, EyeOff, Star, Linkedin } from "lucide-react";
import { useState } from "react";
import { BRAND } from "@/shared/config/brand";
import { getUserFacingErrorMessage } from "@/shared/api/graphql/error-message";

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export function LoginForm() {
  const { login, error, loading } = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState(() => {
    const hasExpiredSession =
      localStorage.getItem("nextstep.sessionExpired") === "true";
    if (hasExpiredSession) {
      localStorage.removeItem("nextstep.sessionExpired");
    }

    return hasExpiredSession
      ? "Your session has expired. Please log in again."
      : null;
  });

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },

    validators: {
      onSubmit: ({ value }) => {
        const result = loginSchema.safeParse(value);

        if (!result.success) {
          return result.error.flatten().fieldErrors;
        }
      },
    },

    onSubmit: async ({ value }) => {
      console.log("Submitting", value);
      setSessionExpiredMessage(null);
      await login(value);
    },
  });

  return (
    <main className="flex h-screen w-full bg-background [font-family:'Instrument_Sans',sans-serif] text-foreground">
      <section className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-foreground p-12 lg:flex">
        <div>
          <Link
            to="/"
            className="text-2xl font-bold tracking-tight text-background"
          >
            {BRAND.name}
          </Link>
        </div>

        <div className="max-w-md">
          <h1 className="mb-4 text-5xl font-bold leading-[1.1] tracking-tight text-background xl:text-6xl">
            Land your next job faster
          </h1>
          <p className="text-lg font-medium text-muted-foreground">
            The precision-engineered resume builder for modern professionals.
          </p>
        </div>

        <div className="max-w-sm">
          <div className="mb-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((item) => (
              <Star key={item} className="h-4 w-4 fill-current text-primary" />
            ))}
          </div>
          <p className="text-sm italic font-medium leading-relaxed text-background/90">
            {BRAND.name} transformed my application process. I secured three
            interviews within the first week of using their AI-optimized
            templates."
          </p>
          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Marcus Chen - Senior Product Designer
          </p>
        </div>

        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full border border-border/40" />
      </section>

      <section className="flex w-full flex-col items-center justify-center bg-card px-6 py-12 lg:w-1/2 lg:px-24">
        <div className="w-full max-w-[400px]">
          <header className="mb-10 text-center lg:text-left">
            <h2 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
              Welcome back
            </h2>
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-foreground underline-offset-4 hover:underline"
              >
                Sign up free
              </Link>
            </p>
          </header>

          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <form.Field name="email">
              {(field) => (
                <div className="space-y-2">
                  <label
                    htmlFor={field.name}
                    className="block text-xs font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    Email Address
                  </label>
                  <input
                    id={field.name}
                    type="email"
                    placeholder="name@company.com"
                    required
                    value={field.state.value}
                    onChange={(e) => field.setValue(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-4 py-3.5 text-sm transition-all placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
                  />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <div className="space-y-2">
                  <label
                    htmlFor={field.name}
                    className="block text-xs font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <input
                      id={field.name}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      value={field.state.value}
                      onChange={(e) => field.setValue(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card px-4 py-3.5 pr-12 text-sm transition-all placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold text-foreground hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {sessionExpiredMessage ? (
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
                {sessionExpiredMessage}
              </div>
            ) : null}

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {getUserFacingErrorMessage(
                  error,
                  "An error occurred during login",
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary py-4 text-sm font-bold tracking-wide text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
              <span className="bg-card px-4 text-muted-foreground">
                or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                const googleAuthUrl = import.meta.env.VITE_GOOGLE_AUTH_URL;
                if (googleAuthUrl) {
                  window.location.href = googleAuthUrl;
                }
              }}
              className="flex items-center justify-center gap-3 rounded-xl border border-border py-3 transition-all duration-150 hover:bg-muted hover:border-border active:scale-[0.98]"
            >
              <GoogleIcon />
              <span className="text-sm font-bold text-foreground">Google</span>
            </button>

            <button
              type="button"
              className="flex items-center justify-center gap-3 rounded-xl border border-border py-3 transition-all duration-150 hover:bg-muted hover:border-border active:scale-[0.98]"
            >
              <Linkedin className="h-5 w-5 text-[#0077b5] fill-[#0077b5]" />
              <span className="text-sm font-bold text-foreground">
                LinkedIn
              </span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
