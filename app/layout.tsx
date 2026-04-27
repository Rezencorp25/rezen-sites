import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "REZEN Sites · powered by VerumFlow",
  description:
    "Gestionale interno REZEN per generare, modificare e orchestrare siti web con AI multi-agente.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${inter.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-surface-dim text-on-surface">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#292935",
              color: "#e8e8f0",
              border: "1px solid rgba(106,106,122,0.15)",
            },
          }}
        />
      </body>
    </html>
  );
}
