import { NextResponse } from "next/server";

/**
 * API key auth middleware for public REST endpoints.
 *
 * Today: stub. Accepts any non-empty key starting with "rzn_". The key
 * format mimics what we'll issue at go-live (random opaque tokens, no JWT).
 *
 * At go-live: lookup key in `apiKeys` Firestore collection, check status,
 * scope (read/write), associated team member, rate limits.
 */
export type ApiKeyContext = {
  keyId: string;
  scope: ApiScope[];
  /** Optional projectId restriction — if set, only this project is accessible */
  scopedProjectId?: string;
};

export type ApiScope =
  | "read:projects"
  | "write:projects"
  | "read:pages"
  | "write:pages"
  | "read:forms"
  | "read:alerts";

export function authenticate(req: Request): ApiKeyContext | NextResponse {
  const authHeader = req.headers.get("authorization") ?? "";
  const bearer = authHeader.replace(/^Bearer\s+/i, "").trim();
  const key = bearer || req.headers.get("x-api-key") || "";

  if (!key) {
    return jsonError(401, "missing-api-key", "Header Authorization: Bearer rzn_…");
  }
  if (!key.startsWith("rzn_") || key.length < 16) {
    return jsonError(
      401,
      "invalid-api-key-format",
      "API keys must start with rzn_ and be ≥16 chars",
    );
  }

  // MOCK: derive permissions from the key suffix
  // - rzn_…_ro → read-only
  // - rzn_…_rw → read+write
  const isReadOnly = key.endsWith("_ro");
  return {
    keyId: key.slice(0, 12),
    scope: isReadOnly
      ? (["read:projects", "read:pages", "read:forms", "read:alerts"] as ApiScope[])
      : ([
          "read:projects",
          "write:projects",
          "read:pages",
          "write:pages",
          "read:forms",
          "read:alerts",
        ] as ApiScope[]),
  };
}

export function requireScope(
  ctx: ApiKeyContext,
  needed: ApiScope,
): NextResponse | null {
  if (!ctx.scope.includes(needed)) {
    return jsonError(403, "insufficient-scope", `Missing scope: ${needed}`);
  }
  return null;
}

export function jsonError(status: number, code: string, message: string) {
  return NextResponse.json(
    { error: { code, message } },
    {
      status,
      headers: {
        "x-rzn-api-version": "v1",
      },
    },
  );
}
