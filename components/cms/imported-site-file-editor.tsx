"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { GradientButton } from "@/components/luminous/gradient-button";
import { cn } from "@/lib/utils";
import {
  FileCode,
  FileText,
  Folder,
  FolderOpen,
  RefreshCw,
  Save,
  Loader2,
  ChevronRight,
  ChevronDown,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-surface-container-low">
      <Loader2 className="h-5 w-5 animate-spin text-molten-primary" />
    </div>
  ),
});

type FileNode = {
  name: string;
  path: string;
  size: number;
  ext: string;
  editable: boolean;
};

type TreeNode = {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
  file?: FileNode;
};

function buildTree(files: FileNode[]): TreeNode {
  const root: TreeNode = { name: "", path: "", isDir: true, children: [] };
  for (const f of files) {
    const parts = f.path.split("/");
    let cursor = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const accPath = parts.slice(0, i + 1).join("/");
      let next = cursor.children.find((c) => c.name === part);
      if (!next) {
        next = {
          name: part,
          path: accPath,
          isDir: !isLast,
          children: [],
          file: isLast ? f : undefined,
        };
        cursor.children.push(next);
      }
      cursor = next;
    }
  }
  const sortDirs = (n: TreeNode) => {
    n.children.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    n.children.forEach(sortDirs);
  };
  sortDirs(root);
  return root;
}

function languageFromExt(ext: string): string {
  switch (ext) {
    case ".html":
    case ".htm":
      return "html";
    case ".css":
      return "css";
    case ".js":
    case ".mjs":
    case ".jsx":
      return "javascript";
    case ".ts":
    case ".tsx":
      return "typescript";
    case ".json":
      return "json";
    case ".xml":
    case ".svg":
      return "xml";
    case ".md":
      return "markdown";
    default:
      return "plaintext";
  }
}

function fileIconFor(ext: string) {
  if ([".html", ".htm", ".css", ".js", ".mjs", ".jsx", ".tsx", ".ts", ".json", ".xml", ".svg"].includes(ext)) {
    return FileCode;
  }
  return FileText;
}

export function ImportedSiteFileEditor({
  open,
  onOpenChange,
  projectId,
  importId,
  initialPath,
  iframeSrcRoot,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  importId: string;
  /** Optional file path to open by default (relative to import root) */
  initialPath?: string;
  /** URL prefix for "Apri pagina" preview, eg "/imports/{id}/static-real" */
  iframeSrcRoot?: string;
  /** Called after a successful save (parent can reload iframe) */
  onSaved?: (relPath: string) => void;
}) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loadingTree, setLoadingTree] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [originalContent, setOriginalContent] = useState<string>("");
  const [loadingFile, setLoadingFile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const dirty = content !== originalContent;
  const tree = useMemo(() => buildTree(files), [files]);

  const loadTree = useCallback(async () => {
    setLoadingTree(true);
    try {
      const res = await fetch(
        `/api/imports/${projectId}/${importId}/files`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { files: FileNode[] };
      setFiles(data.files);
    } catch (err) {
      toast.error(`Errore caricamento file: ${(err as Error).message}`);
    } finally {
      setLoadingTree(false);
    }
  }, [projectId, importId]);

  const loadFile = useCallback(
    async (relPath: string) => {
      setLoadingFile(true);
      try {
        const res = await fetch(
          `/api/imports/${projectId}/${importId}/file?path=${encodeURIComponent(relPath)}`,
          { cache: "no-store" },
        );
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as { content: string };
        setContent(data.content);
        setOriginalContent(data.content);
        setSelectedPath(relPath);
      } catch (err) {
        toast.error(`Errore lettura file: ${(err as Error).message}`);
      } finally {
        setLoadingFile(false);
      }
    },
    [projectId, importId],
  );

  const handleSave = useCallback(async () => {
    if (!selectedPath || !dirty) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/imports/${projectId}/${importId}/file?path=${encodeURIComponent(selectedPath)}`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content }),
        },
      );
      if (!res.ok) throw new Error(await res.text());
      setOriginalContent(content);
      toast.success(`Salvato ${selectedPath}`);
      onSaved?.(selectedPath);
    } catch (err) {
      toast.error(`Errore salvataggio: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  }, [content, dirty, importId, onSaved, projectId, selectedPath]);

  // Track open transitions in render: load tree on open, wipe state on close.
  // (Lint forbids setState-in-effect for non-subscription sync work.)
  const [autoLoadedPath, setAutoLoadedPath] = useState<string | null>(null);
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      loadTree();
    } else {
      setAutoLoadedPath(null);
      setSelectedPath(null);
      setContent("");
      setOriginalContent("");
    }
  }
  if (
    open &&
    initialPath &&
    autoLoadedPath !== initialPath &&
    selectedPath !== initialPath
  ) {
    setAutoLoadedPath(initialPath);
    loadFile(initialPath);
    const parts = initialPath.split("/").slice(0, -1);
    const acc: Record<string, boolean> = {};
    for (let i = 0; i < parts.length; i++) {
      acc[parts.slice(0, i + 1).join("/")] = true;
    }
    setExpanded((prev) => ({ ...prev, ...acc }));
  }

  // Cmd/Ctrl + S keyboard shortcut
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, handleSave]);

  const previewHref = selectedPath && iframeSrcRoot
    ? selectedPath.endsWith(".html") || selectedPath.endsWith(".htm")
      ? `${iframeSrcRoot.replace(/\/$/, "")}/${selectedPath}`
      : null
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[min(1280px,98vw)] !max-w-none border-none bg-surface-container-highest p-0"
      >
        <SheetHeader className="border-b border-outline/20 px-5 py-3">
          <SheetTitle className="flex items-center gap-2 text-title-md">
            <FileCode className="h-4 w-4 text-molten-primary" />
            Editor file — sito importato
          </SheetTitle>
          <SheetDescription className="text-body-sm text-secondary-text">
            Modifica HTML, CSS, JS/JSX del sito direttamente. Cmd+S per salvare. Le modifiche sono live sull&apos;iframe alla prossima ricarica.
          </SheetDescription>
        </SheetHeader>

        <div className="flex h-[calc(100vh-92px)] w-full">
          <aside className="flex w-72 shrink-0 flex-col border-r border-outline/20 bg-surface-container-low">
            <div className="flex items-center justify-between border-b border-outline/20 px-3 py-2 text-label-md uppercase tracking-widest text-text-muted">
              <span>File</span>
              <button
                type="button"
                onClick={loadTree}
                className="flex h-6 w-6 items-center justify-center rounded text-text-muted hover:bg-surface-container hover:text-on-surface"
                title="Ricarica albero file"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loadingTree && "animate-spin")} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-1.5">
              {loadingTree && files.length === 0 ? (
                <div className="flex items-center justify-center px-4 py-12">
                  <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
                </div>
              ) : (
                <TreeRender
                  node={tree}
                  expanded={expanded}
                  setExpanded={setExpanded}
                  selectedPath={selectedPath}
                  onSelect={(p) => loadFile(p)}
                  level={0}
                />
              )}
            </div>
            <div className="border-t border-outline/20 px-3 py-2 text-label-sm text-text-muted">
              {files.length} file · {files.filter((f) => f.editable).length} editabili
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-3 border-b border-outline/20 bg-surface-container px-4 py-2 text-body-sm">
              {selectedPath ? (
                <>
                  <span className="font-mono text-on-surface truncate">{selectedPath}</span>
                  {dirty && (
                    <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      Modificato
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    {previewHref && (
                      <a
                        href={previewHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-label-md text-text-muted hover:bg-surface-container-high hover:text-on-surface"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Anteprima
                      </a>
                    )}
                    <GradientButton
                      size="sm"
                      onClick={handleSave}
                      disabled={!dirty || saving}
                    >
                      {saving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      Salva
                    </GradientButton>
                  </div>
                </>
              ) : (
                <span className="text-text-muted">
                  Seleziona un file dall&apos;albero a sinistra per iniziare a modificare.
                </span>
              )}
            </div>
            <div className="flex-1 min-h-0">
              {!selectedPath ? (
                <div className="flex h-full items-center justify-center bg-surface-container-low text-body-sm text-text-muted">
                  Nessun file aperto
                </div>
              ) : loadingFile ? (
                <div className="flex h-full items-center justify-center bg-surface-container-low">
                  <Loader2 className="h-5 w-5 animate-spin text-molten-primary" />
                </div>
              ) : (
                <MonacoEditor
                  height="100%"
                  theme="vs-dark"
                  path={selectedPath}
                  language={languageFromExt(
                    selectedPath.slice(selectedPath.lastIndexOf(".")).toLowerCase(),
                  )}
                  value={content}
                  onChange={(v) => setContent(v ?? "")}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    tabSize: 2,
                    wordWrap: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TreeRender({
  node,
  expanded,
  setExpanded,
  selectedPath,
  onSelect,
  level,
}: {
  node: TreeNode;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  level: number;
}) {
  return (
    <ul className="flex flex-col">
      {node.children.map((child) => {
        if (child.isDir) {
          const isOpen = expanded[child.path] ?? level === 0;
          return (
            <li key={child.path}>
              <button
                type="button"
                onClick={() =>
                  setExpanded((p) => ({ ...p, [child.path]: !isOpen }))
                }
                className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-body-sm text-on-surface hover:bg-surface-container"
                style={{ paddingLeft: `${level * 12 + 8}px` }}
              >
                {isOpen ? (
                  <ChevronDown className="h-3 w-3 shrink-0 text-text-muted" />
                ) : (
                  <ChevronRight className="h-3 w-3 shrink-0 text-text-muted" />
                )}
                {isOpen ? (
                  <FolderOpen className="h-3.5 w-3.5 shrink-0 text-molten-primary" />
                ) : (
                  <Folder className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                )}
                <span className="truncate">{child.name}</span>
              </button>
              {isOpen && (
                <TreeRender
                  node={child}
                  expanded={expanded}
                  setExpanded={setExpanded}
                  selectedPath={selectedPath}
                  onSelect={onSelect}
                  level={level + 1}
                />
              )}
            </li>
          );
        }
        const file = child.file!;
        const Icon = fileIconFor(file.ext);
        const isSelected = selectedPath === file.path;
        return (
          <li key={child.path}>
            <button
              type="button"
              onClick={() => file.editable && onSelect(file.path)}
              disabled={!file.editable}
              className={cn(
                "flex w-full items-center gap-1.5 rounded py-1 pr-2 text-left text-body-sm transition-colors",
                isSelected
                  ? "bg-molten-primary/15 text-on-surface"
                  : file.editable
                    ? "text-secondary-text hover:bg-surface-container hover:text-on-surface"
                    : "cursor-not-allowed text-text-muted/60",
              )}
              style={{ paddingLeft: `${level * 12 + 24}px` }}
              title={file.editable ? file.path : `${file.path} · binario, non editabile`}
            >
              <Icon
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  isSelected ? "text-molten-primary" : "text-text-muted",
                )}
              />
              <span className="truncate">{child.name}</span>
              {!file.editable && (
                <span className="ml-auto text-[10px] uppercase tracking-wider text-text-muted/60">
                  bin
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
