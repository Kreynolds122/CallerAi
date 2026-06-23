Good call on Supabase. One honest thing to set expectations: Figma Make builds the app side, the dashboard, the Supabase backend, and the endpoints that receive data. It cannot log into your Vapi or n8n accounts and configure them. So the prompt's job is to make Make build everything on its side correctly, define the exact contract the external services plug into, and tell you precisely what to set up in Vapi and n8n and what values it needs from you. I've written it to do all of that, and to ask before assuming.
Build a multi-location lead management dashboard for a physical therapy clinic group, with a Supabase backend. Leads come from two channels: an AI phone receptionist (Vapi) and a website chat assistant, orchestrated by an n8n automation layer. Before you start building, ask me clarifying questions about anything ambiguous rather than guessing. As you build, scaffold ALL the backend code, database schema, and integration endpoints this system needs, and tell me exactly what I have to configure in the external services and what values you need from me.

STACK (use exactly this, and set up the code for each part)
- Frontend: this Figma Make app, the dashboard the clinic team uses.
- Backend and database: Supabase. Create the full schema (tables, relationships, row-level security), use Supabase Auth for staff login, and use Supabase Realtime so new leads appear live without refresh.
- Inbound data: create Supabase Edge Functions (HTTP webhook endpoints) that external automation can POST to. These receive new leads, completed phone calls (with transcript and summary), and website chats, and write them into the database.
- Voice: Vapi handles the actual phone calls. I will configure the Vapi assistant myself. You do not build the voice agent, but you DO build the endpoint Vapi/n8n will call and post results to, and you tell me the exact URL and payload to point it at.
- Automation: n8n connects Vapi, the calendar, and this app. Same as above: build the endpoints and the data contract, and give me the setup steps for n8n.
- Treat all external keys as environment variables / Supabase secrets (Vapi key, n8n shared secret, monday.com token). Create placeholders, document each one, and never hardcode them.

WHAT I NEED YOU TO PRODUCE
- A documented JSON contract for every inbound webhook: new lead, completed call, chat. Include location_id, source, caller name/phone/email, reason, preferred time, appointment, transcript, and summary. This contract is the agreement n8n and Vapi will send to, so make it explicit and stable.
- The Supabase schema as actual SQL or migrations.
- The Edge Function code for each inbound endpoint, with a shared-secret check so only my automation can post.
- A short setup guide: how to connect a Vapi assistant and an n8n workflow to these endpoints, which env variables to set, and what to paste where.
- A way to sync or export leads to monday.com, with the token as a configured secret.
- If any of this needs a decision from me (auth method, monday.com board structure, calendar provider), ask me before building it.

DATA MODEL
- Lead: full name, phone, email, source (Phone or Website Chat), location, status (New, Contacted, Booked, Completed, Lost), reason for contact, preferred time, appointment date/time if booked, assigned team member, created date, last updated, notes.
- Call: linked to a lead. Date/time, duration, outcome (Booked, Not booked, Voicemail), full transcript, AI summary.
- Chat: linked to a lead. Full transcript, summary.
- Location: name, address, phone number, business hours, status (Active or Pilot), calendar ID, monday.com board/group identifiers.

SCREENS
1. Overview: metrics (new leads today, this week, by source, consults booked, booking conversion rate, by location), a recent-activity feed, and charts of leads over time and by source and location.
2. Leads: filterable, sortable table (name, source, location, status, reason, created, appointment) with filters for source, status, location, date range. Row opens the lead detail.
3. Lead detail: full record, editable status, a conversation timeline showing the call transcript and/or chat in order, appointment details, notes, reassign action.
4. Calls: list of all calls with date, location, duration, outcome, and transcript/summary view.
5. Chats: same pattern for website chats.
6. Locations: list with per-location performance (leads, bookings, conversion) and an Add Location form, since onboarding new locations must be simple.
7. Settings: team members, and an Integrations section showing the live webhook URLs, the shared secret, the monday.com sync field, and the calendar connection.

MULTI-LOCATION (critical, build this in from the start)
- Every lead, call, and chat belongs to a location. A global location selector on every screen, with an All Locations view. All metrics, tables, and charts respect it.
- Adding a location must require no code change: a new row in the Locations table, and the same endpoints handle it via location_id.

SAMPLE DATA
- Seed realistic data: several locations, a mix of phone and chat leads across every status, example transcripts and summaries, and booked appointments, so the dashboard is fully demonstrable on first load.

DESIGN
- Clean, modern, professional SaaS dashboard for a healthcare business. Calm and trustworthy, generous whitespace, clear typography, readable tables, subtle status color coding. Left sidebar navigation, top bar with the location selector and search. Responsive for desktop and tablet.

Start by confirming the stack and asking me any questions you need answered before you scaffold the Supabase schema and endpoints.