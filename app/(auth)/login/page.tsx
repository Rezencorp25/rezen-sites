"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
        style={{ perspective: "1200px" }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="verumflow-v-spin relative h-[68%] w-[68%] max-h-[640px] max-w-[640px]">
            <Image
              src="/login-hero-v.png"
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 55vw, 0px"
              className="object-contain select-none pointer-events-none"
            />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-10 flex flex-col items-center gap-1 text-center">
          <p className="text-label-md uppercase tracking-[0.4em] text-white/60">
            VerumFlow
          </p>
          <p className="text-label-sm uppercase tracking-[0.3em] text-white/30">
            powered by REZEN
          </p>
        </div>
      </aside>
    </div>
  );
}
