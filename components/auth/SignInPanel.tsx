"use client";

import { signIn } from "next-auth/react";
import { KeyRound, LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type Mode = "login" | "register";

function safeCallbackUrl(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }
  return value;
}

export function SignInPanel({ callbackUrl }: { callbackUrl?: string }) {
  const router = useRouter();
  const destination = useMemo(() => safeCallbackUrl(callbackUrl), [callbackUrl]);
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      if (mode === "register") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name, email, password })
        });
        const result = (await response.json().catch(() => null)) as { error?: string } | null;

        if (!response.ok) {
          throw new Error(result?.error ?? "Unable to create account.");
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: destination
      });

      if (result?.error) {
        throw new Error("Invalid email or password.");
      }

      router.push(destination);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top_left,rgb(20_184_166_/_0.18),transparent_32%),linear-gradient(180deg,#ffffff,#f5f8fb)] px-4 py-8">
      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-5xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-md bg-primary text-primary-foreground">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <span className="text-lg font-semibold">WayPoint</span>
            </div>
            <h1 className="mt-8 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
              Share live location only with people holding your active key.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
              Create revocable share keys, hide instantly with ghost mode, and keep browser tracking honest with
              foreground updates, app resume sync, and offline recovery.
            </p>
            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
              {["Revocable keys", "Local account", "Polling only"].map((item) => (
                <div key={item} className="rounded-md border border-border bg-white/80 px-4 py-3 text-sm font-medium">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-border bg-white p-6 shadow-panel">
            <div className="flex items-center gap-3">
              <KeyRound className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">{mode === "login" ? "Log in" : "Create account"}</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Use an email and password. Passwords are stored as scrypt hashes in the database.
            </p>

            <div className="mt-5 grid grid-cols-2 rounded-md border border-border bg-muted p-1">
              <button
                type="button"
                className={`min-h-10 rounded-md text-sm font-medium ${mode === "login" ? "bg-white shadow-sm" : ""}`}
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
              >
                Log in
              </button>
              <button
                type="button"
                className={`min-h-10 rounded-md text-sm font-medium ${mode === "register" ? "bg-white shadow-sm" : ""}`}
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
              >
                Create
              </button>
            </div>

            <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
              {mode === "register" ? (
                <label className="grid gap-1 text-sm font-medium">
                  Name
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    maxLength={100}
                    className="min-h-11 rounded-md border border-input px-3 outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
              ) : null}

              <label className="grid gap-1 text-sm font-medium">
                Email
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  required
                  autoComplete="email"
                  className="min-h-11 rounded-md border border-input px-3 outline-none focus:ring-2 focus:ring-ring"
                />
              </label>

              <label className="grid gap-1 text-sm font-medium">
                Password
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  required
                  minLength={mode === "register" ? 8 : 1}
                  maxLength={128}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  className="min-h-11 rounded-md border border-input px-3 outline-none focus:ring-2 focus:ring-ring"
                />
              </label>

              {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}

              <Button type="submit" disabled={pending}>
                {mode === "login" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {pending ? "Working" : mode === "login" ? "Log in" : "Create account"}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
