"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Flame, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GradientButton } from "@/components/luminous/gradient-button";

const V_DEPTH_LAYERS = 6;
const V_DEPTH_STEP_PX = 6;

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

      <aside
        aria-hidden
        className="relative hidden overflow-hidden bg-black lg:block"
        style={{ perspective: "1400px" }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="verumflow-v-spin relative h-[68%] w-[68%] max-h-[640px] max-w-[640px]">
            {Array.from({ length: V_DEPTH_LAYERS }).map((_, i) => {
              const offset = (i - (V_DEPTH_LAYERS - 1) / 2) * V_DEPTH_STEP_PX;
              const isFront = i === V_DEPTH_LAYERS - 1;
              const isBack = i === 0;
              const opacity = isFront ? 1 : isBack ? 0.6 : 0.35;
              return (
                <div
                  key={i}
                  className="absolute inset-0 bg-center bg-no-repeat bg-contain"
                  style={{
                    backgroundImage: "url('/login-hero-v.png')",
                    transform: `translateZ(${offset}px)`,
                    opacity,
                    filter: isFront ? undefined : "blur(0.4px)",
                  }}
                />
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}
