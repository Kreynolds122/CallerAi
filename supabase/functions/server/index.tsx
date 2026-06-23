import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ─── Supabase admin client (service role) ────────────────────
const admin = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

function checkSecret(body: Record<string, unknown>): boolean {
  const secret = Deno.env.get("WEBHOOK_SECRET") ?? "";
  return secret !== "" && body?.webhook_secret === secret;
}

// ─── Health ──────────────────────────────────────────────────
app.get("/make-server-bd1935f4/health", (c) => c.json({ status: "ok" }));

// ─── WEBHOOK: New Lead ───────────────────────────────────────
// POST /make-server-bd1935f4/webhook/lead
// Called by n8n when Vapi captures a new inbound caller.
app.post("/make-server-bd1935f4/webhook/lead", async (c) => {
  const body = await c.req.json();
  if (!checkSecret(body)) return c.json({ error: "Unauthorized" }, 401);

  const supabase = admin();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      location_id: body.location_id,
      full_name: body.full_name,
      phone: body.phone ?? null,
      email: body.email ?? null,
      source: body.source ?? "Phone",
      reason: body.reason ?? null,
      preferred_time: body.preferred_time ?? null,
      status: "New",
      notes: "",
    })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ success: true, lead_id: data.id });
});

// ─── WEBHOOK: Completed Call ──────────────────────────────────
// POST /make-server-bd1935f4/webhook/call
// Called by n8n after a Vapi call ends with transcript + summary.
// If lead_id is omitted, a new lead is created from caller data.
app.post("/make-server-bd1935f4/webhook/call", async (c) => {
  const body = await c.req.json();
  if (!checkSecret(body)) return c.json({ error: "Unauthorized" }, 401);

  const supabase = admin();
  let leadId: string | null = body.lead_id ?? null;

  // Create lead if not provided
  if (!leadId && body.full_name) {
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .insert({
        location_id: body.location_id,
        full_name: body.full_name,
        phone: body.phone ?? null,
        email: body.email ?? null,
        source: "Phone",
        reason: body.reason ?? null,
        preferred_time: body.preferred_time ?? null,
        status: body.outcome === "Booked" ? "Booked" : "Contacted",
        notes: "",
      })
      .select()
      .single();
    if (leadErr) return c.json({ error: leadErr.message }, 400);
    leadId = lead.id;
  }

  // Insert call record
  const { error: callErr } = await supabase.from("calls").insert({
    lead_id: leadId,
    location_id: body.location_id,
    date_time: body.date_time ?? new Date().toISOString(),
    duration_minutes: body.duration_minutes ?? 0,
    outcome: body.outcome,
    transcript: body.transcript ?? "",
    summary: body.summary ?? "",
  });
  if (callErr) return c.json({ error: callErr.message }, 400);

  // Update lead status + appointment if booked
  if (leadId && body.outcome === "Booked") {
    await supabase
      .from("leads")
      .update({
        status: "Booked",
        ...(body.appointment_datetime ? { appointment_datetime: body.appointment_datetime } : {}),
      })
      .eq("id", leadId);
  }

  return c.json({ success: true, lead_id: leadId });
});

// ─── WEBHOOK: Website Chat ────────────────────────────────────
// POST /make-server-bd1935f4/webhook/chat
// Called by n8n when a website chat session ends.
app.post("/make-server-bd1935f4/webhook/chat", async (c) => {
  const body = await c.req.json();
  if (!checkSecret(body)) return c.json({ error: "Unauthorized" }, 401);

  const supabase = admin();
  let leadId: string | null = body.lead_id ?? null;

  if (!leadId && body.full_name) {
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .insert({
        location_id: body.location_id,
        full_name: body.full_name,
        phone: body.phone ?? null,
        email: body.email ?? null,
        source: "Website Chat",
        reason: body.reason ?? null,
        preferred_time: body.preferred_time ?? null,
        status: "New",
        notes: "",
      })
      .select()
      .single();
    if (leadErr) return c.json({ error: leadErr.message }, 400);
    leadId = lead.id;
  }

  const { error } = await supabase.from("chats").insert({
    lead_id: leadId,
    location_id: body.location_id,
    date_time: body.date_time ?? new Date().toISOString(),
    transcript: body.transcript ?? "",
    summary: body.summary ?? "",
  });
  if (error) return c.json({ error: error.message }, 400);

  return c.json({ success: true, lead_id: leadId });
});

// ─── API: Read data (for frontend) ───────────────────────────
app.get("/make-server-bd1935f4/api/leads", async (c) => {
  const supabase = admin();
  const locId = c.req.query("location_id");
  let q = supabase.from("leads").select("*").order("created_at", { ascending: false });
  if (locId && locId !== "all") q = q.eq("location_id", locId);
  const { data, error } = await q;
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data ?? []);
});

app.get("/make-server-bd1935f4/api/locations", async (c) => {
  const supabase = admin();
  const { data, error } = await supabase.from("locations").select("*").order("name");
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data ?? []);
});

app.get("/make-server-bd1935f4/api/calls", async (c) => {
  const supabase = admin();
  const locId = c.req.query("location_id");
  let q = supabase.from("calls").select("*").order("date_time", { ascending: false });
  if (locId && locId !== "all") q = q.eq("location_id", locId);
  const { data, error } = await q;
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data ?? []);
});

app.get("/make-server-bd1935f4/api/chats", async (c) => {
  const supabase = admin();
  const locId = c.req.query("location_id");
  let q = supabase.from("chats").select("*").order("date_time", { ascending: false });
  if (locId && locId !== "all") q = q.eq("location_id", locId);
  const { data, error } = await q;
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data ?? []);
});

// ─── API: Update lead ─────────────────────────────────────────
app.patch("/make-server-bd1935f4/api/leads/:id", async (c) => {
  const supabase = admin();
  const id = c.req.param("id");
  const body = await c.req.json();
  const { data, error } = await supabase
    .from("leads")
    .update(body)
    .eq("id", id)
    .select()
    .single();
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});

// ─── API: Add location ────────────────────────────────────────
app.post("/make-server-bd1935f4/api/locations", async (c) => {
  const supabase = admin();
  const body = await c.req.json();
  const { data, error } = await supabase
    .from("locations")
    .insert(body)
    .select()
    .single();
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});

// ─── monday.com sync ─────────────────────────────────────────
// POST /make-server-bd1935f4/api/sync-monday/:lead_id
app.post("/make-server-bd1935f4/api/sync-monday/:leadId", async (c) => {
  const supabase = admin();
  const leadId = c.req.param("leadId");
  const mondayToken = Deno.env.get("MONDAY_API_TOKEN");
  if (!mondayToken) return c.json({ error: "MONDAY_API_TOKEN not configured" }, 500);

  const { data: lead, error: leadErr } = await supabase.from("leads").select("*, locations(monday_board_id)").eq("id", leadId).single();
  if (leadErr || !lead) return c.json({ error: "Lead not found" }, 404);

  const boardId = (lead.locations as { monday_board_id: string })?.monday_board_id;
  if (!boardId) return c.json({ error: "Location has no monday_board_id configured" }, 400);

  const mutation = `mutation { create_item (board_id: ${boardId}, item_name: "${lead.full_name}", column_values: "{\\"status\\":{\\"label\\":\\"${lead.status}\\"},\\"text\\":\\"${lead.reason ?? ""}\\"}" ) { id } }`;
  const resp = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: mondayToken },
    body: JSON.stringify({ query: mutation }),
  });
  const result = await resp.json();
  return c.json({ success: true, monday: result });
});

Deno.serve(app.fetch);
