-- ============================================================
-- Recovery Group Lead Management — Initial Schema
-- Run in: Supabase SQL Editor → New Query → Run
-- ============================================================

-- 1. LOCATIONS
-- Each location is a row here. Adding a new clinic requires no code change —
-- just insert a row. All leads, calls, and chats reference location_id.
CREATE TABLE IF NOT EXISTS locations (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT        NOT NULL,
  address       TEXT,
  phone         TEXT,
  business_hours TEXT,
  status        TEXT        NOT NULL DEFAULT 'Active'
                            CHECK (status IN ('Active', 'Pilot')),
  calendar_id   TEXT,
  monday_board_id TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. LEADS
CREATE TABLE IF NOT EXISTS leads (
  id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id          UUID        REFERENCES locations(id) ON DELETE SET NULL,
  full_name            TEXT        NOT NULL,
  phone                TEXT,
  email                TEXT,
  source               TEXT        CHECK (source IN ('Phone', 'Website Chat')),
  status               TEXT        NOT NULL DEFAULT 'New'
                                   CHECK (status IN ('New', 'Contacted', 'Booked', 'Completed', 'Lost')),
  reason               TEXT,
  preferred_time       TEXT,
  appointment_datetime TIMESTAMPTZ,
  assigned_to          UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  notes                TEXT        NOT NULL DEFAULT '',
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. CALLS
CREATE TABLE IF NOT EXISTS calls (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id          UUID        REFERENCES leads(id) ON DELETE CASCADE,
  location_id      UUID        REFERENCES locations(id) ON DELETE SET NULL,
  date_time        TIMESTAMPTZ,
  duration_minutes INTEGER,
  outcome          TEXT        CHECK (outcome IN ('Booked', 'Not Booked', 'Voicemail')),
  transcript       TEXT,
  summary          TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- 4. CHATS
CREATE TABLE IF NOT EXISTS chats (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id     UUID        REFERENCES leads(id) ON DELETE CASCADE,
  location_id UUID        REFERENCES locations(id) ON DELETE SET NULL,
  date_time   TIMESTAMPTZ,
  transcript  TEXT,
  summary     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads     ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls     ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats     ENABLE ROW LEVEL SECURITY;

-- Authenticated staff can read everything
CREATE POLICY "authenticated_select_locations" ON locations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_select_leads" ON leads
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_update_leads" ON leads
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "authenticated_select_calls" ON calls
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_select_chats" ON chats
  FOR SELECT TO authenticated USING (true);

-- Service role (used by Edge Functions) can insert and update all tables
CREATE POLICY "service_insert_leads" ON leads
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "service_update_leads" ON leads
  FOR UPDATE TO service_role USING (true);

CREATE POLICY "service_insert_calls" ON calls
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "service_insert_chats" ON chats
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "service_insert_locations" ON locations
  FOR INSERT TO service_role WITH CHECK (true);

-- ============================================================
-- REALTIME
-- Enables live updates in the dashboard without page refresh.
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE calls;
ALTER PUBLICATION supabase_realtime ADD TABLE chats;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_leads_location_id  ON leads(location_id);
CREATE INDEX IF NOT EXISTS idx_leads_status        ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source        ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at    ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_lead_id       ON calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_calls_location_id   ON calls(location_id);
CREATE INDEX IF NOT EXISTS idx_chats_lead_id       ON chats(lead_id);
CREATE INDEX IF NOT EXISTS idx_chats_location_id   ON chats(location_id);
