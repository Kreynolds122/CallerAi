// Edge Function: inbound-call
// Handles Vapi native end-of-call-report AND n8n/custom contract
// Deploy: supabase functions deploy inbound-call

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret, x-location-id",
};

// Extracts a field from Vapi structuredData regardless of format:
// Format A: { callerName: "Bobby Bob" }          — field name as key
// Format B: { "uuid": { name: "callerName", result: "Bobby Bob" } } — UUID as key
function extractField(structured: Record<string, unknown>, fieldName: string): string | null {
  // Format A
  const direct = structured[fieldName];
  if (direct !== undefined && direct !== null && direct !== "") {
    return typeof direct === "string" ? direct : String(direct);
  }
  // Try common snake_case variant
  const snake = fieldName.replace(/([A-Z])/g, "_$1").toLowerCase();
  const directSnake = structured[snake];
  if (directSnake !== undefined && directSnake !== null && directSnake !== "") {
    return typeof directSnake === "string" ? directSnake : String(directSnake);
  }
  // Format B — UUID-keyed objects
  for (const val of Object.values(structured)) {
    if (val && typeof val === "object") {
      const entry = val as Record<string, unknown>;
      const entryName = (entry.name as string ?? "").toLowerCase();
      const target = fieldName.toLowerCase();
      if (entryName === target || entryName === snake) {
        const result = entry.result;
        if (result !== undefined && result !== null && result !== "") {
          return typeof result === "string" ? result : String(result);
        }
      }
    }
  }
  return null;
}

// Normalises outcome to one of our three values
function normaliseOutcome(raw: unknown): "Booked" | "Not Booked" | "Voicemail" {
  if (!raw) return "Not Booked";
  const str = (typeof raw === "string" ? raw : JSON.stringify(raw)).toLowerCase();
  if (str.includes("voicemail")) return "Voicemail";
  if (str.includes("booked") && !str.includes("not booked") && !str.includes("did not book")) return "Booked";
  return "Not Booked";
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // ── Auth ──────────────────────────────────────────────────────────────────
    const secret = Deno.env.get("WEBHOOK_SECRET");
    const providedSecret = body.webhook_secret ?? req.headers.get("x-webhook-secret");
    if (secret && providedSecret !== secret) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Vapi native format ────────────────────────────────────────────────────
    const isVapiNative = body.message && typeof body.message.type === "string";

    if (isVapiNative) {
      // Acknowledge all non-end-of-call events immediately
      if (body.message.type !== "end-of-call-report") {
        return new Response(
          JSON.stringify({ received: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const msg = body.message;
      const customer = msg.call?.customer ?? {};
      const structured: Record<string, unknown> = msg.analysis?.structuredData ?? {};

      console.log("Vapi structuredData:", JSON.stringify(structured));

      const locationId  = req.headers.get("x-location-id") ?? null;
      const callerName  = extractField(structured, "callerName") ?? extractField(structured, "Caller Name") ?? customer.name ?? null;
      const callerPhone = extractField(structured, "callerPhone") ?? customer.number ?? null;
      const callerEmail = extractField(structured, "callerEmail") ?? null;
      const reason      = extractField(structured, "reason") ?? null;
      const preferredTime = extractField(structured, "preferredTime") ?? null;
      const transcript  = msg.transcript ?? null;
      const summary     = msg.summary ?? msg.analysis?.summary ?? null;
      const durationMin = msg.durationSeconds ? Math.round(msg.durationSeconds / 60) : null;
      const appointmentDt = extractField(structured, "appointmentDatetime") ?? null;
      const outcome     = normaliseOutcome(structured.outcome ?? extractField(structured, "outcome"));

      console.log("Parsed:", { callerName, callerPhone, reason, outcome, locationId });

      // Create lead — use phone number as fallback name if no name extracted
      let leadId: string | null = null;
      const leadName = callerName ?? (callerPhone ? `Caller ${callerPhone}` : null);

      if (locationId && leadName) {
        const { data: newLead, error: leadErr } = await supabase
          .from("leads")
          .insert({
            location_id:    locationId,
            source:         "Phone",
            full_name:      leadName,
            phone:          callerPhone,
            email:          callerEmail,
            reason:         reason,
            preferred_time: preferredTime,
            status:         outcome === "Booked" ? "Booked" : "New",
            notes:          "",
          })
          .select("id")
          .single();

        if (leadErr) {
          console.error("Lead insert error:", leadErr.message);
        } else {
          leadId = newLead?.id ?? null;
          console.log("Lead created:", leadId);
        }
      } else {
        console.log("Skipping lead creation — locationId:", locationId, "leadName:", leadName);
      }

      const { error: callErr } = await supabase.from("calls").insert({
        lead_id:          leadId,
        location_id:      locationId,
        date_time:        new Date().toISOString(),
        duration_minutes: durationMin,
        outcome,
        transcript,
        summary,
      });

      if (callErr) {
        console.error("Call insert error:", callErr.message);
        return new Response(
          JSON.stringify({ error: callErr.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (outcome === "Booked" && leadId && appointmentDt) {
        await supabase.from("leads")
          .update({ status: "Booked", appointment_datetime: appointmentDt })
          .eq("id", leadId);
      }

      return new Response(
        JSON.stringify({ success: true, lead_id: leadId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── n8n / custom format ───────────────────────────────────────────────────
    const locationId = body.location_id ?? req.headers.get("x-location-id") ?? null;
    let leadId: string | null = body.lead_id ?? null;

    if (!leadId && locationId && body.caller_name) {
      const { data: newLead } = await supabase.from("leads").insert({
        location_id:    locationId,
        source:         "Phone",
        full_name:      body.caller_name,
        phone:          body.caller_phone ?? null,
        email:          body.caller_email ?? null,
        reason:         body.reason ?? null,
        preferred_time: body.preferred_time ?? null,
        status:         body.outcome === "Booked" ? "Booked" : "New",
        notes:          "",
      }).select("id").single();
      leadId = newLead?.id ?? null;
    }

    const { data: callRecord, error: callError } = await supabase.from("calls").insert({
      lead_id:          leadId,
      location_id:      locationId,
      date_time:        body.date_time ?? new Date().toISOString(),
      duration_minutes: body.duration_minutes ?? null,
      outcome:          body.outcome ?? "Not Booked",
      transcript:       body.transcript ?? null,
      summary:          body.summary ?? null,
    }).select().single();

    if (callError) {
      return new Response(
        JSON.stringify({ error: callError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.outcome === "Booked" && leadId) {
      const update: Record<string, unknown> = { status: "Booked" };
      if (body.appointment_datetime) update.appointment_datetime = body.appointment_datetime;
      await supabase.from("leads").update(update).eq("id", leadId);
    }

    return new Response(
      JSON.stringify({ success: true, call_id: callRecord?.id, lead_id: leadId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
