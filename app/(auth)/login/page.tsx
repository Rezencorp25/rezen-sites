"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Flame, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GradientButton } from "@/components/luminous/gradient-button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(
    process.env.NEXT_PUBLIC_REZEN_DEMO_USER_EMAIL ?? "demo@rezen.dev",
  );
  const [password, setPassword] = useState(
    process.env.NEXT_PUBLIC_REZEN_DEMO_USER_PASSWORD ?? "rezen2026",
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // Localhost prototype: skip Firebase entirely, set cookie client-side.
      // When integrating real auth, re-enable the Firebase path via env flag.
      const token = `local-${Date.now()}`;
      document.cookie = `rezen_session=${token}; path=/; max-age=${60 * 60 * 8}; samesite=lax`;
      toast.success("Accesso effettuato");
      router.push("/projects");
    } catch (err) {
      console.error(err);
      toast.error("Login fallito");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-dim px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl"
            style={{
              background: "linear-gradient(135deg,#ffb599,#f56117)",
            }}
          >
            <Flame className="h-7 w-7 text-on-molten" />
          </div>
          <div>
            <h1 className="text-headline-sm font-bold text-on-surface">
              REZEN Sites
            </h1>
            <p className="text-label-md uppercase tracking-widest text-text-muted">
              powered by VerumFlow
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 rounded-2xl bg-surface-container-high p-7"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-label-md text-secondary-text">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-surface-container-low border-none h-11 text-body-md"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-label-md text-secondary-text">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-surface-container-low border-none h-11 text-body-md"
              required
            />
          </div>

          <GradientButton size="lg" disabled={loading} type="submit">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Accesso...
              </>
            ) : (
              "Accedi"
            )}
          </GradientButton>

          <p className="text-center text-label-md text-text-muted">
            Localhost prototype · qualsiasi credenziale va bene
          </p>
        </form>
      </div>
    </div>
  );
}
