"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Flame, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GradientButton } from "@/components/luminous/gradient-button";
import Cubes from "@/components/reactbits/cubes";

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
    <div className="grid min-h-screen w-full bg-surface-dim lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="flex items-center justify-center px-6 py-12 lg:px-12">
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
              <Label
                htmlFor="email"
                className="text-label-md text-secondary-text"
              >
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
              <Label
                htmlFor="password"
                className="text-label-md text-secondary-text"
              >
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
      </section>

      <aside className="relative hidden overflow-hidden bg-black lg:block">
        <div className="absolute inset-0 flex items-center justify-center [&_.default-animation]:!w-[88%]">
          <Cubes
            gridSize={9}
            maxAngle={55}
            radius={4}
            borderStyle="1px solid rgba(255,133,51,0.35)"
            faceColor="#0a0a0a"
            rippleColor="#ff8533"
            rippleSpeed={1.6}
            autoAnimate
            rippleOnClick
          />
        </div>

        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-12"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 45%, transparent 70%)",
          }}
        >
          <div className="max-w-2xl text-center">
            <p className="mb-4 text-label-md uppercase tracking-[0.45em] text-white/50">
              VerumFlow · REZEN
            </p>
            <h2 className="text-balance text-4xl font-bold leading-[1.05] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)] xl:text-5xl 2xl:text-6xl">
              The way you make websites is about to change forever
            </h2>
          </div>
        </div>
      </aside>
    </div>
  );
}
