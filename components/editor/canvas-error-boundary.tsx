"use client";

import React from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { GradientButton } from "@/components/luminous/gradient-button";

type Props = { children: React.ReactNode; onReset: () => void };
type State = { hasError: boolean; error: Error | null };

export class CanvasErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[CanvasErrorBoundary]", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-surface-container-low p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-error-container">
          <AlertTriangle className="h-6 w-6 text-error" />
        </div>
        <h3 className="text-title-md font-semibold text-on-surface">
          Canvas in errore
        </h3>
        <p className="max-w-md text-body-sm text-secondary-text">
          Il puckData della pagina è risultato corrotto o incompatibile.
          Puoi ricaricare con lo stato salvato in memoria.
        </p>
        <pre className="max-w-xl overflow-auto rounded bg-surface-container-lowest p-3 text-label-sm text-text-muted">
          {this.state.error?.message ?? ""}
        </pre>
        <GradientButton
          size="md"
          onClick={() => {
            this.setState({ hasError: false, error: null });
            this.props.onReset();
          }}
        >
          <RotateCw className="h-4 w-4" />
          Ripristina pagina
        </GradientButton>
      </div>
    );
  }
}
