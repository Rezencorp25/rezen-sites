import { NextResponse } from "next/server";
import { renderPuckToHtml } from "@/lib/export/render-html";
import { exportReactComponent } from "@/lib/export/react-component";
import { buildNextJsZip } from "@/lib/export/nextjs-zip";
import type { Page, Project } from "@/types";
import type {
  LocalBusinessSettings,
  LocaleAlternate,
  ProjectSettings,
} from "@/lib/stores/settings-store";

export const runtime = "nodejs";

type Body = {
  page?: Page;
  pages?: Page[];
  project?: Project;
  projectName?: string;
  localBusiness?: LocalBusinessSettings;
  locale?: string;
  alternates?: LocaleAlternate[];
  consent?: ProjectSettings["consent"];
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ format: string }> },
) {
  const { format } = await params;
  const body = (await req.json()) as Body;

  try {
    if (format === "html") {
      if (!body.page) return bad("page richiesta");
      const html = renderPuckToHtml(body.page.puckData, {
        title: body.page.title,
        page: body.page,
        project: body.project,
        localBusiness: body.localBusiness,
        locale: body.locale,
        alternates: body.alternates,
        consent: body.consent,
      });
      return new NextResponse(html, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "content-disposition": `attachment; filename="${slug(body.page.title)}.html"`,
        },
      });
    }

    if (format === "react") {
      if (!body.page) return bad("page richiesta");
      const tsx = exportReactComponent(body.page.puckData, {
        componentName: body.page.title,
      });
      return new NextResponse(tsx, {
        headers: {
          "content-type": "text/typescript; charset=utf-8",
          "content-disposition": `attachment; filename="${slug(body.page.title)}.tsx"`,
        },
      });
    }

    if (format === "nextjs") {
      if (!body.pages?.length) return bad("pages richieste");
      const zip = await buildNextJsZip({
        projectName: body.projectName ?? "rezen-site",
        pages: body.pages,
        project: body.project,
        localBusiness: body.localBusiness,
        locale: body.locale,
        alternates: body.alternates,
        consent: body.consent,
      });
      return new NextResponse(new Uint8Array(zip), {
        headers: {
          "content-type": "application/zip",
          "content-disposition": `attachment; filename="${slug(body.projectName ?? "rezen-site")}.zip"`,
        },
      });
    }

    return bad(`formato non supportato: ${format}`);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "export failed" },
      { status: 500 },
    );
  }
}

function bad(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

function slug(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "export"
  );
}
