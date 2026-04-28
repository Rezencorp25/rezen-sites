import { NextResponse } from "next/server";

export const runtime = "nodejs";

type SubmitBody = {
  projectId: string;
  formName: string;
  page?: string;
  fields: Record<string, string>;
  utm?: { source?: string; medium?: string; campaign?: string };
  gclid?: string;
  honeypotValue?: string;
  webhookUrl?: string;
  crm?: "none" | "hubspot" | "pipedrive" | "salesforce" | "mailchimp";
};

/**
 * Form submission endpoint.
 *
 * Today: validates input, runs honeypot check, fans out to webhook URL if
 * configured. CRM connectors are stubbed (would require API keys in env).
 *
 * At go-live: persist submission to Firestore, trigger native CRM API call
 * with project-scoped credentials.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SubmitBody;

    // Honeypot bot trap
    if (body.honeypotValue && body.honeypotValue.trim().length > 0) {
      // Silently accept (don't tell bot it failed)
      return NextResponse.json({ ok: true });
    }

    if (!body.projectId || !body.fields) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const submission = {
      receivedAt: new Date().toISOString(),
      ...body,
    };

    // Forward to webhook (Zapier/Make/Slack/custom)
    if (body.webhookUrl) {
      try {
        await fetch(body.webhookUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(submission),
        });
      } catch {
        // Don't fail the user submission on webhook error
      }
    }

    // CRM stub
    if (body.crm && body.crm !== "none") {
      // TODO[real]: per-CRM API call
      // - hubspot: POST https://api.hubapi.com/crm/v3/objects/contacts (Bearer)
      // - pipedrive: POST https://api.pipedrive.com/v1/persons?api_token=
      // - salesforce: OAuth2 + REST API
      // - mailchimp: POST /lists/{id}/members + tags
    }

    return NextResponse.json({ ok: true, id: `sub-${Date.now()}` });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "submit failed" },
      { status: 500 },
    );
  }
}
