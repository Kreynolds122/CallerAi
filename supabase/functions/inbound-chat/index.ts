// Edge Function: inbound-chat
// Receives a completed website chat session payload and writes it to Supabase.
// Called directly by the website chat bot, or via n8n after chat ends.
//
// Deploy:  supabase functions deploy inbound-chat
// URL:     https://<project>.supabase.co/functions/v1/inbound-chat

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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Auto-create lead if lead_id not provided ───────────────────────────────
    // The website chat bot collects name/contact during the conversation.
    // Pass those fields and we create the lead automatically.
    let leadId: string | null = body.lead_id ?? null;

    // Always create a lead when we have a location, even if the chat bot did not
    // capture a name. full_name is NOT NULL in the schema, so fall back to a floor.
    if (!leadId && body.location_id) {
      const visitorName = body.visitor_name
        ?? (body.visitor_phone ? `Visitor ${body.visitor_phone}` : "Unknown Visitor");
      const { data: newLead } = await supabase
        .from("leads")
        .insert({
          location_id: body.location_id,
          source:      "Website Chat",
          full_name:   visitorName,
          phone:       body.visitor_phone ?? null,
          email:       body.visitor_email ?? null,
          reason:      body.reason ?? null,
          preferred_time: body.preferred_time ?? null,
          status:      "New",
          notes:       "",
        })
        .select("id")
        .single();
      leadId = newLead?.id ?? null;
    }

    // ── Insert chat record ────────────────────────────────────────────────────
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .insert({
        lead_id:     leadId,
        location_id: body.location_id ?? null,
        date_time:   body.date_time ?? new Date().toISOString(),
        transcript:  body.transcript ?? null,
        summary:     body.summary ?? null,
      })
      .select()
      .single();

    if (chatError) {
      console.error("Chat insert error:", chatError);
      return new Response(
        JSON.stringify({ error: chatError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Sync new lead to monday.com (optional) ────────────────────────────────
    const mondayToken = Deno.env.get("MONDAY_API_TOKEN");
    if (mondayToken && leadId && !body.lead_id) {
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
              item_name: "${body.visitor_name ?? "Chat Lead"}",
              column_values: "${JSON.stringify({
                status:   { label: "New" },
                text:     body.visitor_phone ?? "",
                email:    { email: body.visitor_email ?? "", text: body.visitor_email ?? "" },
                dropdown: { ids: [2] },
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
      JSON.stringify({ success: true, chat_id: chat?.id, lead_id: leadId }),
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