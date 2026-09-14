import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { appName } from "@/config/navigation";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Navigate } from "@tanstack/react-router";
import { Loader2, Sprout } from "lucide-react";
import { useState } from "react";

export function LoginPage() {
  const { isAuthenticated, login, isLoggingIn } = useInternetIdentity();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Nature background */}
      <img
        src="/assets/generated/login-nature.dim_1920x1080.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/40 to-primary/80" />

      {/* Branding overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-2 px-6 pt-10 text-center">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-sm">
            <Sprout className="size-7" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-white">
            {appName}
          </span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/90">
          For Sustainable Development
        </p>
      </div>

      {/* Login modal */}
      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-elevated">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-elevated">
              <Sprout className="size-8" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                Welcome back
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in to access your agricultural management dashboard.
              </p>
            </div>
          </div>

          <form
            className="mt-6 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void login();
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="login-username">Username</Label>
              <Input
                id="login-username"
                data-ocid="login.username_input"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">Password</Label>
                <Button
                  type="button"
                  data-ocid="login.forgot_link"
                  variant="link"
                  className="h-auto p-0 text-xs font-medium"
                >
                  Forgot Password?
                </Button>
              </div>
              <Input
                id="login-password"
                data-ocid="login.password_input"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              data-ocid="login.submit_button"
              className="mt-2 w-full"
              size="lg"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Log In"
              )}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Button
              type="button"
              data-ocid="login.create_link"
              variant="link"
              className="h-auto p-0 text-sm font-medium"
            >
              Create Account
            </Button>
          </p>

          <div className="mt-6 border-t border-border pt-5">
            <Button
              type="button"
              data-ocid="login.signin_button"
              variant="outline"
              className="w-full"
              size="lg"
              disabled={isLoggingIn}
              onClick={() => login()}
            >
              Sign in with Internet Identity
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Secure sign-in is provided by Internet Identity. Arthur is the
              Super Admin.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/90">
          © {new Date().getFullYear()} {appName} - For Sustainable Development
        </p>
      </div>
    </div>
  );
}
