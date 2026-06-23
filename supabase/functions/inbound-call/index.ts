import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret, x-location-id",
};

// Treat "nul"/"null"/""/"N/A" etc. as real null.
function clean(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (s === "") return null;
  if (["nul", "null", "n/a", "na", "none", "undefined", "unknown"].includes(s.toLowerCase())) return null;
  return s;
}

// Only return a value Postgres accepts as a timestamp.
function validAppointment(v: unknown): string | null {
  const s = clean(v);
  if (!s) return null;
  return Number.isNaN(Date.parse(s)) ? null : s;
}

function extractField(structured: Record<string, unknown>, fieldName: string): string | null {
  const direct = structured[fieldName];
  if (direct !== undefined && direct !== null && direct !== "") return typeof direct === "string" ? direct : String(direct);
  const snake = fieldName.replace(/([A-Z])/g, "_$1").toLowerCase();
  const directSnake = structured[snake];
  if (directSnake !== undefined && directSnake !== null && directSnake !== "") return typeof directSnake === "string" ? directSnake : String(directSnake);
  for (const val of Object.values(structured)) {
    if (val && typeof val === "object") {
      const entry = val as Record<string, unknown>;
      const entryName = (entry.name as string ?? "").toLowerCase();
      if (entryName === fieldName.toLowerCase() || entryName === snake || entryName === fieldName.replace(/([A-Z])/g, " $1").toLowerCase().trim()) {
        const result = entry.result;
        if (result !== undefined && result !== null && result !== "") return typeof result === "string" ? result : String(result);
      }
    }
  }
  return null;
}

function normaliseOutcome(raw: unknown): "Booked" | "Not Booked" | "Voicemail" {
  if (!raw) return "Not Booked";
  const str = (typeof raw === "string" ? raw : JSON.stringify(raw)).toLowerCase();
  if (str.includes("voicemail")) return "Voicemail";
  if (str.includes("booked") && !str.includes("not booked") && !str.includes("did not book")) return "Booked";
  return "Not Booked";
}

// Beat the race: parse the summary (always present at webhook time) ourselves,
// instead of waiting for Vapi's async structured-output pass. Fast + cheap model.
// Returns {} on any failure, so it can never block lead creation.
async function parseSummary(summary: string): Promise<Record<string, string | null>> {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return {};
  try {
    const prompt =
      "Extract these fields from the physical therapy call summary below. " +
      "Return ONLY strict JSON, no markdown, no commentary. " +
      "Keys: callerName, callerPhone, reason, preferredTime, outcome, appointmentDatetime. " +
      'outcome must be one of "Booked", "Not Booked", "Voicemail". ' +
      "appointmentDatetime must be ISO 8601 or null. Use null for anything not stated.\n\nSUMMARY:\n" +
      summary;
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 400, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await res.json();
    const text = (data?.content?.[0]?.text ?? "{}").replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(text);
    return {
      callerName: clean(parsed.callerName),
      callerPhone: clean(parsed.callerPhone),
      reason: clean(parsed.reason),
      preferredTime: clean(parsed.preferredTime),
      outcome: clean(parsed.outcome),
      appointmentDatetime: validAppointment(parsed.appointmentDatetime),
    };
  } catch (e) {
    console.error("parseSummary failed:", (e as Error).message);
    return {};
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    // ---- AUTH: unchanged from your working version. Do not touch. ----
    const secret = Deno.env.get("WEBHOOK_SECRET");
    const providedSecret = body.webhook_secret ?? req.headers.get("x-webhook-secret");
    if (secret && providedSecret !== secret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const isVapiNative = body.message && typeof body.message.type === "string";

    if (isVapiNative) {
      if (body.message.type !== "end-of-call-report") {
        return new Response(JSON.stringify({ received: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const msg = body.message;
      const customer = msg.call?.customer ?? {};
      const locationId = req.headers.get("x-location-id") ?? null;

      const structured: Record<string, unknown> =
        msg.analysis?.structuredData ?? msg.structuredData ?? body.structuredData ?? msg.analysis?.structured_data ?? {};

      const transcript = msg.transcript ?? null;
      const summary    = msg.summary ?? msg.analysis?.summary ?? null;
      const durationMin = msg.durationSeconds ? Math.round(msg.durationSeconds / 60) : null;

      // If Vapi's structured pass has not landed yet (the race), parse the summary ourselves.
      const structuredEmpty = Object.keys(structured).length === 0;
      const fromSummary = structuredEmpty && summary ? await parseSummary(summary) : {};

      const pick = (field: string) => extractField(structured, field) ?? fromSummary[field] ?? null;

      const callerName    = pick("callerName") ?? clean(customer.name);
      const callerPhone   = pick("callerPhone") ?? clean(customer.number);
      const callerEmail   = pick("callerEmail");
      const reason        = pick("reason");
      const preferredTime = pick("preferredTime");
      const appointmentDt = validAppointment(pick("appointmentDatetime"));
      const outcome       = normaliseOutcome(pick("outcome") ?? structured.outcome);

      console.log("SOURCE:", structuredEmpty ? "summary-parse" : "structured", "PARSED:", JSON.stringify({ callerName, callerPhone, reason, outcome, locationId }));

      // ALWAYS create a lead when we have a location. Never drop it.
      let leadId: string | null = null;
      const leadName = callerName ?? (callerPhone ? `Caller ${callerPhone}` : "Unknown Caller");

      if (locationId) {
        const { data: newLead, error: leadErr } = await supabase.from("leads").insert({
          location_id: locationId, source: "Phone", full_name: leadName,
          phone: callerPhone, email: callerEmail, reason, preferred_time: preferredTime,
          status: outcome === "Booked" ? "Booked" : "New", notes: "",
        }).select("id").single();
        if (leadErr) console.error("Lead error:", leadErr.message);
        else { leadId = newLead?.id ?? null; console.log("Lead created:", leadId, leadName); }
      } else {
        console.log("No lead created — missing locationId");
      }

      const { error: callErr } = await supabase.from("calls").insert({
        lead_id: leadId, location_id: locationId, date_time: new Date().toISOString(),
        duration_minutes: durationMin, outcome, transcript, summary,
      });
      if (callErr) { console.error("Call error:", callErr.message); return new Response(JSON.stringify({ error: callErr.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }

      if (outcome === "Booked" && leadId && appointmentDt) {
        await supabase.from("leads").update({ status: "Booked", appointment_datetime: appointmentDt }).eq("id", leadId);
      }

      return new Response(JSON.stringify({ success: true, lead_id: leadId }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // n8n / custom format
    const locationId = body.location_id ?? req.headers.get("x-location-id") ?? null;
    let leadId: string | null = body.lead_id ?? null;
    if (!leadId && locationId && body.caller_name) {
      const { data: newLead } = await supabase.from("leads").insert({
        location_id: locationId, source: "Phone", full_name: body.caller_name,
        phone: body.caller_phone ?? null, email: body.caller_email ?? null,
        reason: body.reason ?? null, preferred_time: body.preferred_time ?? null,
        status: body.outcome === "Booked" ? "Booked" : "New", notes: "",
      }).select("id").single();
      leadId = newLead?.id ?? null;
    }
    const { data: callRecord, error: callError } = await supabase.from("calls").insert({
      lead_id: leadId, location_id: locationId, date_time: body.date_time ?? new Date().toISOString(),
      duration_minutes: body.duration_minutes ?? null, outcome: body.outcome ?? "Not Booked",
      transcript: body.transcript ?? null, summary: body.summary ?? null,
    }).select().single();
    if (callError) return new Response(JSON.stringify({ error: callError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (body.outcome === "Booked" && leadId) {
      const update: Record<string, unknown> = { status: "Booked" };
      const dt = validAppointment(body.appointment_datetime ?? null);
      if (dt) update.appointment_datetime = dt;
      await supabase.from("leads").update(update).eq("id", leadId);
    }
    return new Response(JSON.stringify({ success: true, call_id: callRecord?.id, lead_id: leadId }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Unhandled:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});