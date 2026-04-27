"use client";

import "@measured/puck/dist/index.css";
import "@/lib/puck/editor-overrides.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Puck,
  usePuck,
  type Data as PuckDataType,
} from "@measured/puck";
import {
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Undo2,
  Redo2,
  Eye,
  Save,
  Sparkles,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { puckConfig } from "@/lib/puck/config";
import { usePagesStore } from "@/lib/stores/pages-store";
import { useEditorStore, type Device } from "@/lib/stores/editor-store";
import { useProjectsStore } from "@/lib/stores/projects-store";
import { useVersionsStore } from "@/lib/stores/versions-store";
import { cn } from "@/lib/utils";
import { AIPromptBar } from "./ai-prompt-bar";
import { SEOSheet } from "./seo-sheet";
import { ExportMenu } from "./export-menu";
import { EditorKeyboardShortcuts } from "./keyboard-shortcuts";
import { CanvasErrorBoundary } from "./canvas-error-boundary";
import type { Page } from "@/types";

const DEVICE_VIEWPORTS: Record<Device, { width: number; label: string }> = {
  desktop: { width: 1280, label: "Desktop" },
  tablet: { width: 820, label: "Tablet" },
  mobile: { width: 390, label: "Mobile" },
};

type Props = {
  projectId: string;
  pageId: string;
};

export function PuckEditor({ projectId, pageId }: Props) {
  const router = useRouter();
  const page = usePagesStore((s) => s.getById(pageId));
  const savePuckData = usePagesStore((s) => s.savePuckData);
  const updatePage = usePagesStore((s) => s.updatePage);

  const setPageIdInStore = useEditorStore((s) => s.setPage);
  const device = useEditorStore((s) => s.device);
  const setDevice = useEditorStore((s) => s.setDevice);
  const isDirty = useEditorStore((s) => s.isDirty);
  const setDirty = useEditorStore((s) => s.setDirty);

  const project = useProjectsStore((s) => s.getById(projectId));
  const projectName = project?.name ?? projectId;
  const [data, setData] = useState<PuckDataType | null>(null);
  const [seoOpen, setSeoOpen] = useState(false);
  const baselineRef = useRef<string | null>(null);
  const onChangeCountRef = useRef(0);

  // Sync store-driven page into local editor state on mount / pageId change.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!page) return;
    setPageIdInStore(page.id);
    setData(page.puckData as PuckDataType);
    baselineRef.current = null; // will be captured by first onChange (post-resolveData)
    onChangeCountRef.current = 0;
    setDirty(false);
  }, [page, setPageIdInStore, setDirty]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleChange = useCallback(
    (next: PuckDataType) => {
      setData(next);
      onChangeCountRef.current += 1;
      const nextSerialized = JSON.stringify(next);
      // capture normalized baseline on first onChange (Puck runs resolveData then fires once)
      if (baselineRef.current === null) {
        baselineRef.current = nextSerialized;
        setDirty(false);
        return;
      }
      setDirty(nextSerialized !== baselineRef.current);
    },
    [setDirty],
  );

  const handleSave = useCallback(() => {
    if (!data) return;
    savePuckData(pageId, data);
    baselineRef.current = JSON.stringify(data);
    setDirty(false);
    toast.success("Modifiche salvate");
  }, [data, pageId, savePuckData, setDirty]);

  const recordVersion = useVersionsStore((s) => s.record);
  const allPages = usePagesStore((s) => s.pages);

  const handlePublish = useCallback(() => {
    if (!data || !page) return;
    savePuckData(pageId, data);
    updatePage(pageId, { status: "published" });
    setDirty(false);
    baselineRef.current = JSON.stringify(data);

    const snapshot: Record<string, ReturnType<typeof JSON.parse>> = {};
    for (const p of allPages.filter((p) => p.projectId === projectId)) {
      snapshot[p.id] = p.id === pageId ? data : p.puckData;
    }
    recordVersion({
      projectId,
      description: `Publish ${page.title}`,
      changes: [`Modifiche a "${page.title}"`],
      snapshot,
    });
    toast.success("Pagina pubblicata · nuova versione creata");
  }, [data, page, pageId, projectId, allPages, savePuckData, updatePage, setDirty, recordVersion]);

  const viewport = DEVICE_VIEWPORTS[device];

  if (page === undefined) {
    // store not yet hydrated OR page actually missing; show skeleton briefly
    return <EditorSkeleton />;
  }
  if (!data) {
    return <EditorSkeleton />;
  }

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col bg-surface">
      <Puck
        config={puckConfig}
        data={data}
        onChange={handleChange}
        onPublish={handlePublish}
        iframe={{ enabled: false }}
        ui={{
          viewports: {
            current: { width: viewport.width, height: "auto" },
            controlsVisible: false,
            options: Object.entries(DEVICE_VIEWPORTS).map(([, v]) => ({
              width: v.width,
              height: "auto",
              label: v.label,
            })),
          },
        }}
      >
        <EditorShell
          page={page}
          projectId={projectId}
          projectName={projectName}
          device={device}
          setDevice={setDevice}
          isDirty={isDirty}
          onSave={handleSave}
          onPublish={handlePublish}
          onOpenSEO={() => setSeoOpen(true)}
          onBack={() => router.push(`/projects/${projectId}/pages`)}
        />
      </Puck>
      <SEOSheet
        open={seoOpen}
        onOpenChange={setSeoOpen}
        page={page}
        onSave={(seo) => {
          updatePage(pageId, { seo });
          toast.success("SEO aggiornato");
        }}
      />
    </div>
  );
}

function EditorShell({
  page,
  projectId,
  projectName,
  device,
  setDevice,
  isDirty,
  onSave,
  onPublish,
  onOpenSEO,
  onBack,
}: {
  page: Page;
  projectId: string;
  projectName: string;
  device: Device;
  setDevice: (d: Device) => void;
  isDirty: boolean;
  onSave: () => void;
  onPublish: () => void;
  onOpenSEO: () => void;
  onBack: () => void;
}) {
  const { dispatch, history, selectedItem } = usePuck();
  const canUndo = history.hasPast;
  const canRedo = history.hasFuture;

  const setSelected = useEditorStore((s) => s.setSelected);
  useEffect(() => {
    const id = (selectedItem?.props as { id?: string } | undefined)?.id ?? null;
    setSelected(id);
  }, [selectedItem, setSelected]);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-outline-variant/20 bg-surface-container-low px-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-body-sm text-text-muted hover:text-on-surface"
          >
            <ArrowLeft className="h-4 w-4" />
            Pages
          </button>
          <span className="text-text-muted">/</span>
          <Link
            href={`/projects/${projectId}/dashboard`}
            className="truncate text-body-sm text-text-muted hover:text-on-surface"
          >
            {projectId}
          </Link>
          <span className="text-text-muted">/</span>
          <span className="truncate text-body-sm font-semibold text-on-surface">{page.title}</span>
          {isDirty && (
            <span className="ml-2 rounded-md bg-warning-container px-2 py-0.5 text-label-sm text-warning">
              Non salvato
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DeviceToggle value={device} onChange={setDevice} />

          <div className="mx-2 h-6 w-px bg-outline-variant/30" />

          <IconBtn
            label="Undo"
            disabled={!canUndo}
            onClick={() => history.back()}
          >
            <Undo2 className="h-4 w-4" />
          </IconBtn>
          <IconBtn
            label="Redo"
            disabled={!canRedo}
            onClick={() => history.forward()}
          >
            <Redo2 className="h-4 w-4" />
          </IconBtn>

          <div className="mx-2 h-6 w-px bg-outline-variant/30" />

          <IconBtn
            label="SEO"
            onClick={onOpenSEO}
          >
            <Search className="h-4 w-4" />
          </IconBtn>
          <IconBtn
            label="Preview"
            onClick={() =>
              dispatch({
                type: "setUi",
                ui: (prev) => ({
                  previewMode: prev.previewMode === "edit" ? "interactive" : "edit",
                }),
              })
            }
          >
            <Eye className="h-4 w-4" />
          </IconBtn>
          <ExportMenu page={page} projectId={projectId} projectName={projectName} />

          <button
            type="button"
            onClick={onSave}
            disabled={!isDirty}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-body-sm font-medium transition-colors",
              isDirty
                ? "bg-surface-container-highest text-on-surface hover:bg-surface-container"
                : "bg-surface-container-low text-text-muted cursor-not-allowed",
            )}
          >
            <Save className="h-3.5 w-3.5" />
            Salva
          </button>
          <button
            type="button"
            onClick={onPublish}
            className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-body-sm font-semibold text-on-molten"
            style={{ background: "linear-gradient(135deg,#ffb599,#f56117)" }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Publish
          </button>
        </div>
      </header>

      {/* Main grid */}
      <div className="flex min-h-0 flex-1">
        {/* Left: components palette */}
        <aside className="w-[280px] shrink-0 border-r border-outline-variant/20 bg-surface-container-low">
          <div className="flex items-center gap-2 border-b border-outline-variant/20 px-4 py-3">
            <p className="text-label-md uppercase tracking-widest text-text-muted">Componenti</p>
          </div>
          <div className="puck-palette overflow-y-auto p-3" style={{ height: "calc(100% - 45px)" }}>
            <Puck.Components />
          </div>
        </aside>

        {/* Center: canvas */}
        <main className="flex min-w-0 flex-1 flex-col bg-surface">
          <div className="flex-1 overflow-auto">
            <CanvasErrorBoundary
              onReset={() => {
                dispatch({
                  type: "setData",
                  data: page.puckData,
                  recordHistory: false,
                });
              }}
            >
              <div
                className="mx-auto my-6 overflow-hidden rounded-xl bg-surface-container-lowest shadow-2xl transition-all duration-200"
                style={{ width: DEVICE_VIEWPORTS[device].width, maxWidth: "100%" }}
              >
                <Puck.Preview />
              </div>
            </CanvasErrorBoundary>
          </div>
          <AIPromptBar />
          <EditorKeyboardShortcuts onSave={onSave} />
        </main>

        {/* Right: inspector */}
        <aside className="flex w-[320px] shrink-0 flex-col border-l border-outline/20 bg-surface-container-low">
          <div className="flex items-center justify-between gap-2 border-b border-outline/20 px-4 py-2.5">
            <p className="text-label-md uppercase tracking-widest text-text-muted">
              {selectedItem ? (selectedItem as { type?: string }).type ?? "Proprietà" : "Pagina"}
            </p>
            {selectedItem && (
              <span className="text-label-sm text-text-muted/60">ID: {((selectedItem.props as { id?: string } | undefined)?.id ?? "").slice(-6)}</span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <Puck.Fields />
            {!selectedItem && <InspectorHint />}
          </div>
        </aside>
      </div>
    </div>
  );
}

function InspectorHint() {
  return (
    <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed border-outline/30 bg-surface-container-lowest p-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-high">
        <Sparkles className="h-4 w-4 text-molten-primary" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-body-sm font-medium text-on-surface">
          Nessun blocco selezionato
        </p>
        <p className="text-label-md text-text-muted leading-relaxed">
          Clicca un componente sul canvas per modificarne le proprietà, oppure trascinane uno dalla palette a sinistra.
        </p>
      </div>
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen animate-pulse flex-col bg-surface">
      <div className="h-14 border-b border-outline-variant/20 bg-surface-container-low" />
      <div className="flex flex-1">
        <div className="w-[280px] shrink-0 border-r border-outline-variant/20 bg-surface-container-low" />
        <div className="flex-1 p-6">
          <div className="mx-auto h-[60vh] max-w-4xl rounded-xl bg-surface-container-lowest" />
        </div>
        <div className="w-[320px] shrink-0 border-l border-outline-variant/20 bg-surface-container-low" />
      </div>
    </div>
  );
}

function DeviceToggle({
  value,
  onChange,
}: {
  value: Device;
  onChange: (d: Device) => void;
}) {
  const options: Array<{ key: Device; Icon: typeof Monitor }> = useMemo(
    () => [
      { key: "desktop", Icon: Monitor },
      { key: "tablet", Icon: Tablet },
      { key: "mobile", Icon: Smartphone },
    ],
    [],
  );
  return (
    <div className="flex gap-0.5 rounded-lg bg-surface-container-high p-0.5">
      {options.map(({ key, Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
            value === key
              ? "bg-surface-container-highest text-on-surface"
              : "text-text-muted hover:text-on-surface",
          )}
          aria-label={key}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
        disabled
          ? "text-text-muted/40 cursor-not-allowed"
          : "text-text-muted hover:bg-surface-container-high hover:text-on-surface",
      )}
    >
      {children}
    </button>
  );
}
