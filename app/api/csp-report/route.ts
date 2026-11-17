import { trace } from "@opentelemetry/api";
import { z } from "zod";

// Browsers POST Content-Security-Policy violations here (report-uri format).
// Each report becomes attributes on the request span, so violations can be
// queried in Honeycomb.
const reportSchema = z.object({
  "csp-report": z.object({
    "document-uri": z.string().optional(),
    "effective-directive": z.string().optional(),
    "violated-directive": z.string().optional(),
    "blocked-uri": z.string().optional(),
    "source-file": z.string().optional(),
    "line-number": z.number().optional(),
    "script-sample": z.string().optional(),
    disposition: z.string().optional(),
  }),
});

export async function POST(request: Request) {
  const parsed = reportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });

  const report = parsed.data["csp-report"];
  trace.getActiveSpan()?.setAttributes({
    "csp.document_uri": report["document-uri"],
    "csp.effective_directive": report["effective-directive"],
    "csp.violated_directive": report["violated-directive"],
    "csp.blocked_uri": report["blocked-uri"],
    "csp.source_file": report["source-file"],
    "csp.line_number": report["line-number"],
    "csp.script_sample": report["script-sample"],
    "csp.disposition": report.disposition,
  });
  return new Response(null, { status: 204 });
}
