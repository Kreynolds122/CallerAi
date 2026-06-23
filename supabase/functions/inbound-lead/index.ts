// Edge Function: inbound-lead
// Receives a new lead from Vapi, n8n, or the website chat bot and writes it to Supabase.
//
// Deploy:  supabase functions deploy inbound-lead
// URL:     https://<project>.supabase.co/functions/v1/inbound-lead
//
// Required Supabase secrets (Settings → Edge Functions → Secrets):
//   WEBHOOK_SECRET       — shared secret validated on every request
//   SUPABASE_URL         — automatically injected by Supabase
//   SUPABASE_SERVICE_ROLE_KEY — automatically injected by Supabase
//
// Optional secrets:
//   MONDAY_API_TOKEN     — if monday.com sync is enabled

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // ── Authenticate ──────────────────────────────────────────────────────────
    const secret = Deno.env.get("WEBHOOK_SECRET");
    if (!secret || body.webhook_secret !== secret) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Validate required fields ──────────────────────────────────────────────
    const required = ["location_id", "source", "full_name"];
    for (const field of required) {
      if (!body[field]) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const validSources = ["Phone", "Website Chat"];
    if (!validSources.includes(body.source)) {
      return new Response(
        JSON.stringify({ error: `source must be one of: ${validSources.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Write to Supabase ─────────────────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        location_id:    body.location_id,
        source:         body.source,
        full_name:      body.full_name,
        phone:          body.phone ?? null,
        email:          body.email ?? null,
        reason:         body.reason ?? null,
        preferred_time: body.preferred_time ?? null,
        status:         "New",
        notes:          "",
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Sync to monday.com (optional) ─────────────────────────────────────────
    const mondayToken = Deno.env.get("MONDAY_API_TOKEN");
    if (mondayToken && lead) {
      // Fetch the location's monday board ID
      const { data: location } = await supabase
        .from("locations")
        .select("monday_board_id, name")
        .eq("id", body.location_id)
        .single();

      if (location?.monday_board_id) {
        const mutation = `
          mutation {
            create_item (
              board_id: ${location.monday_board_id},
              item_name: "${lead.full_name}",
              column_values: "${JSON.stringify({
                status:    { label: "New" },
                text:      lead.phone ?? "",
                email:     { email: lead.email ?? "", text: lead.email ?? "" },
                dropdown:  { ids: [body.source === "Phone" ? 1 : 2] },
              }).replace(/"/g, '\\"')}"
            ) { id }
          }
        `;
        await fetch("https://api.monday.com/v2", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${mondayToken}` },
          body: JSON.stringify({ query: mutation }),
        }).catch(err => console.error("monday.com sync error:", err));
      }
    }

    return new Response(
      JSON.stringify({ success: true, lead_id: lead?.id }),
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
