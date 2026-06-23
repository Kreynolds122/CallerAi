import { useState, useMemo, useEffect, createContext, useContext, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  LayoutDashboard, Users, Phone, MessageSquare, MapPin,
  Settings, Search, Bell, ArrowLeft, Plus, Copy, Check,
  ChevronDown, Calendar, Clock, Activity, Globe, Key,
  Database, Zap, FileText, X, TrendingUp, ChevronRight,
  User, Mail, PhoneCall, LogOut, AlertCircle, Loader2,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { supabase, transformLead, transformCall, transformChat, transformLocation } from "../lib/supabase";
import type { Location, Lead, Call, Chat, LeadStatus, LeadSource, CallOutcome } from "../lib/types";

// ─── Static team members ──────────────────────────────────────────────────────

const TEAM_MEMBERS = [
  { id: "tm-1", name: "Dr. Sarah Chen", role: "Clinical Director", email: "sarah.chen@recoverygroup.com" },
  { id: "tm-2", name: "Marcus Johnson", role: "Front Desk Manager", email: "marcus.j@recoverygroup.com" },
  { id: "tm-3", name: "Emily Rodriguez", role: "Care Coordinator", email: "emily.r@recoverygroup.com" },
  { id: "tm-4", name: "David Kim", role: "Physical Therapist", email: "david.kim@recoverygroup.com" },
  { id: "tm-5", name: "Lisa Thompson", role: "Receptionist", email: "lisa.t@recoverygroup.com" },
];

const AILMENT_TYPES = ["Back/Spine","Neck","Shoulder","Knee","Hip","Foot/Ankle","Post-Surgical Rehab","Neurological","Other"] as const;

// ─── Data Context ──────────────────────────────────────────────────────────────

interface AppData {
  locations: Location[];
  leads: Lead[];
  calls: Call[];
  chats: Chat[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const DataCtx = createContext<AppData>({
  locations: [], leads: [], calls: [], chats: [],
  loading: true, error: null, refetch: () => {},
});

function useData() { return useContext(DataCtx); }

// ─── Utilities ────────────────────────────────────────────────────────────────

function fmt(dateStr: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(dateStr).toLocaleDateString("en-US", opts ?? { month: "short", day: "numeric", year: "numeric" });
}
function fmtDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
function isToday(dateStr: string) {
  return new Date(dateStr).toDateString() === new Date().toDateString();
}
function isThisWeek(dateStr: string) {
  const d = new Date(dateStr), now = new Date(), weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  return d >= weekAgo && d <= now;
}
export function fmtSeconds(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function bucketCallsByHour(calls: Call[]): { hour: string; calls: number }[] {
  const counts = new Array(24).fill(0) as number[];
  for (const call of calls) {
    if (call.dateTime) counts[new Date(call.dateTime).getHours()]++;
  }
  return counts.map((count, h) => ({
    hour: h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`,
    calls: count,
  }));
}

function memberName(id?: string) {
  if (!id) return "Unassigned";
  return TEAM_MEMBERS.find(m => m.id === id)?.name ?? "Staff Member";
}

// ─── Status Badges ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<LeadStatus, string> = {
  New: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  Contacted: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  Booked: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  Completed: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  Lost: "bg-red-50 text-red-600 ring-1 ring-red-200",
};
function StatusBadge({ status }: { status: LeadStatus }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${STATUS_STYLES[status]}`}>{status}</span>;
}
const OUTCOME_STYLES: Record<CallOutcome, string> = {
  "Completed": "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  "Voicemail": "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  "No Answer": "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  "Failed": "bg-red-50 text-red-600 ring-1 ring-red-200",
};
function OutcomeBadge({ outcome }: { outcome: CallOutcome }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${OUTCOME_STYLES[outcome] ?? "bg-slate-100 text-slate-600 ring-1 ring-slate-200"}`}>{outcome}</span>;
}
function SourceBadge({ source }: { source: LeadSource }) {
  return source === "Phone"
    ? <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-700"><PhoneCall className="w-3 h-3" />Phone</span>
    : <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700"><MessageSquare className="w-3 h-3" />Chat</span>;
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="p-1 rounded hover:bg-slate-100 transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
    </button>
  );
}

function MetricCard({ label, value, sub, icon: Icon, accent }: { label: string; value: string | number; sub?: string; icon: React.ElementType; accent?: string }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-border flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${accent ?? "bg-blue-50"}`}>
        <Icon className={`w-5 h-5 ${accent ? "text-white" : "text-accent"}`} />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {label && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-border">
          <span className="text-xs font-medium text-muted-foreground font-mono">{label}</span>
          <CopyButton text={code} />
        </div>
      )}
      <pre className="p-4 text-xs font-mono text-slate-700 bg-slate-50/50 overflow-x-auto whitespace-pre-wrap leading-relaxed">{code}</pre>
    </div>
  );
}

function TranscriptPanel({ text, open, onToggle }: { text: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="mt-3">
      <button onClick={onToggle} className="flex items-center gap-1.5 text-xs font-medium text-accent hover:underline">
        <FileText className="w-3.5 h-3.5" />
        {open ? "Hide" : "View"} full transcript
        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="mt-2 rounded-lg bg-slate-50 border border-border p-4 text-xs font-mono text-slate-700 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">{text}</div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3">
        <AlertCircle className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground max-w-xs">{message}</p>
    </div>
  );
}

// ─── Login Screen ──────────────────────────────────────────────────────────────

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-border w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-foreground leading-none">Recovery Group</p>
            <p className="text-xs text-muted-foreground mt-0.5">Lead Management</p>
          </div>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">Staff Sign In</h2>
        <p className="text-sm text-muted-foreground mb-6">Sign in with your clinic team account.</p>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@recoverygroup.com" className="w-full px-3 py-2.5 text-sm bg-input-background rounded-lg border border-border outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-muted-foreground" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2.5 text-sm bg-input-background rounded-lg border border-border outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-muted-foreground" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p className="mt-6 text-xs text-muted-foreground text-center">Need access? Ask your Clinical Director to add you in Supabase Authentication → Users.</p>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-sm text-muted-foreground">Loading dashboard…</p>
      </div>
    </div>
  );
}

// ─── Overview Screen ───────────────────────────────────────────────────────────

function OverviewScreen({ locId }: { locId: string }) {
  const { leads, calls, chats, locations } = useData();
  const filtered = useMemo(() => locId === "all" ? leads : leads.filter(l => l.locationId === locId), [leads, locId]);
  const filteredCalls = useMemo(() => locId === "all" ? calls : calls.filter(c => c.locationId === locId), [calls, locId]);
  const filteredChats = useMemo(() => locId === "all" ? chats : chats.filter(c => c.locationId === locId), [chats, locId]);

  const newToday = filtered.filter(l => isToday(l.createdAt)).length;
  const newThisWeek = filtered.filter(l => isThisWeek(l.createdAt)).length;
  const booked = filtered.filter(l => l.status === "Booked").length;
  const total = filtered.length;
  const convRate = total > 0 ? Math.round((filtered.filter(l => l.status === "Booked" || l.status === "Completed").length / total) * 100) : 0;

  const callsByHour = useMemo(() => bucketCallsByHour(filteredCalls), [filteredCalls]);

  const avgTalkTime = useMemo(() => {
    const secs = filteredCalls
      .map(c => (typeof c.talkSeconds === "number" && c.talkSeconds > 0) ? c.talkSeconds : (typeof c.duration === "number" && c.duration > 0) ? c.duration * 60 : null)
      .filter((s): s is number => s !== null);
    if (secs.length === 0) return "—";
    return fmtSeconds(Math.round(secs.reduce((a, b) => a + b, 0) / secs.length));
  }, [filteredCalls]);

  const leadsOverTime = useMemo(() => {
    const days: { date: string; leads: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), leads: filtered.filter(l => l.createdAt.startsWith(key)).length });
    }
    return days;
  }, [filtered]);

  const bySource = [
    { name: "Phone", value: filtered.filter(l => l.source === "Phone").length, fill: "#8B5CF6" },
    { name: "Website Chat", value: filtered.filter(l => l.source === "Website Chat").length, fill: "#14B8A6" },
  ].filter(s => s.value > 0);

  const byLocation = locations.map(loc => ({
    name: loc.name.split(" ")[0],
    leads: leads.filter(l => l.locationId === loc.id).length,
    booked: leads.filter(l => l.locationId === loc.id && (l.status === "Booked" || l.status === "Completed")).length,
  }));

  const recentActivity = useMemo(() => {
    type Item = { id: string; time: string; text: string; type: "lead" | "call" | "chat" };
    const items: Item[] = [
      ...filtered.slice(0, 6).map(l => ({ id: l.id, time: l.createdAt, text: `New lead: ${l.fullName} (${l.source})`, type: "lead" as const })),
      ...filteredCalls.slice(0, 4).map(c => { const lead = leads.find(l => l.id === c.leadId); return { id: c.id, time: c.dateTime, text: `Call ${c.outcome}: ${lead?.fullName ?? "Unknown"}`, type: "call" as const }; }),
      ...filteredChats.slice(0, 3).map(c => { const lead = leads.find(l => l.id === c.leadId); return { id: c.id, time: c.dateTime, text: `Chat: ${lead?.fullName ?? "Unknown"}`, type: "chat" as const }; }),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);
    return items;
  }, [filtered, filteredCalls, filteredChats, leads]);

  if (total === 0 && locations.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {["New Leads Today","New This Week","Consultations Booked","Booking Conversion","Calls","Avg Talk Time"].map(l => (
            <div key={l} className="bg-white rounded-xl p-5 shadow-sm border border-border h-24 animate-pulse"><div className="h-3 bg-slate-100 rounded w-24 mb-3" /><div className="h-7 bg-slate-100 rounded w-12" /></div>
          ))}
        </div>
        <div className="bg-white rounded-xl p-10 shadow-sm border border-border text-center">
          <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-foreground mb-1">Dashboard is ready</p>
          <p className="text-sm text-muted-foreground">Start by running the SQL schema in Supabase, then add your first location. Leads will appear here as Vapi calls and chats come in.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="New Leads Today" value={newToday} sub="as of right now" icon={TrendingUp} />
        <MetricCard label="New This Week" value={newThisWeek} sub="last 7 days" icon={Activity} />
        <MetricCard label="Consultations Booked" value={booked} sub="active bookings" icon={Calendar} />
        <MetricCard label="Booking Conversion" value={`${convRate}%`} sub="booked + completed / total" icon={Users} accent="bg-accent" />
        <MetricCard label="Calls" value={filteredCalls.length} sub="total calls" icon={Phone} />
        <MetricCard label="Avg Talk Time" value={avgTalkTime} sub="talk time per call" icon={Clock} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">Leads Over Time — Last 30 Days</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={leadsOverTime} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs><linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} /><stop offset="95%" stopColor="#2563EB" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94A3B8" }} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
              <Area type="monotone" dataKey="leads" stroke="#2563EB" strokeWidth={2} fill="url(#grad1)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">Leads by Source</h3>
          {bySource.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart><Pie data={bySource} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" paddingAngle={3}>{bySource.map(e => <Cell key={e.name} fill={e.fill} />)}</Pie><Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} /></PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">{bySource.map(s => (<div key={s.name} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: s.fill }} /><span className="text-muted-foreground">{s.name}</span></span><span className="font-semibold text-foreground">{s.value}</span></div>))}</div>
            </>
          ) : <EmptyState message="No leads yet" />}
        </div>
      </div>
      <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-4">Calls by Time of Day</h3>
        {filteredCalls.length === 0 ? (
          <EmptyState message="No calls in this range yet." />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={callsByHour} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs><linearGradient id="gradCalls" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.15} /><stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#94A3B8" }} tickLine={false} interval={1} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
              <Area type="monotone" dataKey="calls" stroke="#8B5CF6" strokeWidth={2} fill="url(#gradCalls)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">Performance by Location</h3>
          {byLocation.some(l => l.leads > 0) ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={byLocation} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Bar dataKey="leads" name="Total Leads" fill="#BFDBFE" radius={[4, 4, 0, 0]} />
                <Bar dataKey="booked" name="Booked/Completed" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No location data yet" />}
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h3>
          {recentActivity.length === 0 ? <EmptyState message="No activity yet" /> : (
            <div className="space-y-3">
              {recentActivity.map(item => (
                <div key={item.id} className="flex items-start gap-2.5">
                  <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${item.type === "lead" ? "bg-blue-50" : item.type === "call" ? "bg-violet-50" : "bg-teal-50"}`}>
                    {item.type === "lead" ? <Users className="w-3 h-3 text-blue-500" /> : item.type === "call" ? <Phone className="w-3 h-3 text-violet-500" /> : <MessageSquare className="w-3 h-3 text-teal-500" />}
                  </div>
                  <div className="min-w-0"><p className="text-xs text-foreground leading-snug truncate">{item.text}</p><p className="text-[11px] text-muted-foreground mt-0.5">{fmtDateTime(item.time)}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Leads Screen ──────────────────────────────────────────────────────────────

function LeadsScreen({ locId, onSelectLead, initialSearch = "" }: { locId: string; onSelectLead: (id: string) => void; initialSearch?: string }) {
  const { leads, locations } = useData();
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [search, setSearch] = useState(initialSearch);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => { setSearch(initialSearch); }, [initialSearch]);

  const filtered = useMemo(() => leads.filter(l => {
    if (locId !== "all" && l.locationId !== locId) return false;
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (sourceFilter !== "all" && l.source !== sourceFilter) return false;
    if (dateFrom && l.createdAt < dateFrom) return false;
    if (dateTo && l.createdAt > dateTo + "T23:59:59Z") return false;
    if (search) { const q = search.toLowerCase(); return l.fullName.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.phone.includes(q) || l.reason.toLowerCase().includes(q); }
    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [leads, locId, statusFilter, sourceFilter, search, dateFrom, dateTo]);

  const locName = (id: string) => locations.find(l => l.id === id)?.name?.split(" ")[0] ?? "—";
  const hasActiveFilters = statusFilter !== "all" || sourceFilter !== "all" || dateFrom || dateTo || search;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-border flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input className="w-full pl-9 pr-3 py-2 text-sm bg-input-background rounded-lg border-0 outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-muted-foreground" placeholder="Search name, email, phone, reason…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm bg-input-background rounded-lg border-0 outline-none focus:ring-2 focus:ring-accent/30 text-foreground">
          <option value="all">All Statuses</option>
          {(["New","Contacted","Booked","Completed","Lost"] as LeadStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="px-3 py-2 text-sm bg-input-background rounded-lg border-0 outline-none focus:ring-2 focus:ring-accent/30 text-foreground">
          <option value="all">All Sources</option>
          <option value="Phone">Phone</option>
          <option value="Website Chat">Website Chat</option>
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-2 py-2 text-sm bg-input-background rounded-lg border-0 outline-none focus:ring-2 focus:ring-accent/30 text-foreground" />
          <label className="text-xs text-muted-foreground">To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-2 py-2 text-sm bg-input-background rounded-lg border-0 outline-none focus:ring-2 focus:ring-accent/30 text-foreground" />
        </div>
        {hasActiveFilters && (
          <button onClick={() => { setStatusFilter("all"); setSourceFilter("all"); setDateFrom(""); setDateTo(""); setSearch(""); }} className="text-xs text-accent hover:underline whitespace-nowrap">Clear filters</button>
        )}
        <span className="text-sm text-muted-foreground ml-auto">{filtered.length} leads</span>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-slate-50/60">
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Reason</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Appointment</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.map(lead => (
                <tr key={lead.id} onClick={() => onSelectLead(lead.id)} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                  <td className="px-5 py-3.5"><p className="font-semibold text-foreground group-hover:text-accent transition-colors">{lead.fullName}</p><p className="text-xs text-muted-foreground mt-0.5">{lead.phone}</p></td>
                  <td className="px-4 py-3.5"><SourceBadge source={lead.source} /></td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">{locName(lead.locationId)}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={lead.status} /></td>
                  <td className="px-4 py-3.5 hidden lg:table-cell"><span className="text-xs text-muted-foreground line-clamp-1 max-w-48">{lead.reason}</span></td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">{fmt(lead.createdAt)}</td>
                  <td className="px-4 py-3.5 hidden xl:table-cell text-xs text-muted-foreground whitespace-nowrap">{lead.appointmentDateTime ? fmtDateTime(lead.appointmentDateTime) : <span className="text-slate-300">—</span>}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">{leads.length === 0 ? "No leads yet. Leads will appear here as Vapi calls and website chats come in via the webhook endpoints." : "No leads match your filters."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Lead Detail Screen ────────────────────────────────────────────────────────

function LeadDetailScreen({ leadId, onBack }: { leadId: string; onBack: () => void }) {
  const { leads, calls, chats, locations, refetch } = useData();
  const lead = leads.find(l => l.id === leadId);
  const [status, setStatus] = useState<LeadStatus>(lead?.status ?? "New");
  const [notes, setNotes] = useState(lead?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");
  const [openTranscripts, setOpenTranscripts] = useState<Set<string>>(new Set());

  useEffect(() => { if (lead) { setStatus(lead.status); setNotes(lead.notes); } }, [lead]);

  if (!lead) return <div className="p-8 text-sm text-muted-foreground">Lead not found.</div>;

  const leadCalls = calls.filter(c => c.leadId === leadId);
  const leadChats = chats.filter(c => c.leadId === leadId);
  const locName = locations.find(l => l.id === lead.locationId)?.name ?? "Unknown";

  const timeline = [
    ...leadCalls.map(c => ({ id: c.id, time: c.dateTime, type: "call" as const, data: c })),
    ...leadChats.map(c => ({ id: c.id, time: c.dateTime, type: "chat" as const, data: c })),
  ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  const toggleTranscript = (id: string) => setOpenTranscripts(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const saveStatus = async () => {
    setSaving(true);
    const { error } = await supabase.from("leads").update({ status }).eq("id", leadId);
    if (!error) { refetch(); setSaved("status"); setTimeout(() => setSaved(""), 2000); }
    setSaving(false);
  };

  const saveNotes = async () => {
    setSaving(true);
    const { error } = await supabase.from("leads").update({ notes }).eq("id", leadId);
    if (!error) { refetch(); setSaved("notes"); setTimeout(() => setSaved(""), 2000); }
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-4 h-4" />Back to Leads</button>
      <div className="flex items-start gap-3 flex-wrap">
        <div><h2 className="text-xl font-bold text-foreground">{lead.fullName}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap"><SourceBadge source={lead.source} /><span className="text-xs text-muted-foreground">{locName}</span><span className="text-xs text-muted-foreground">·</span><span className="text-xs text-muted-foreground">Created {fmt(lead.createdAt)}</span></div>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
            <h4 className="text-sm font-semibold text-foreground mb-4">Contact Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <FieldRow label="Phone" value={lead.phone} icon={PhoneCall} />
              <FieldRow label="Email" value={lead.email} icon={Mail} />
              <FieldRow label="Assigned To" value={memberName(lead.assignedTo)} icon={User} />
              <FieldRow label="Preferred Time" value={lead.preferredTime} icon={Clock} />
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
            <h4 className="text-sm font-semibold text-foreground mb-2">Reason for Contact</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{lead.reason || "Not provided"}</p>
          </div>
          {lead.appointmentDateTime && (
            <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
              <h4 className="text-sm font-semibold text-emerald-800 mb-1 flex items-center gap-2"><Calendar className="w-4 h-4" />Appointment Booked</h4>
              <p className="text-emerald-700 font-semibold">{fmtDateTime(lead.appointmentDateTime)}</p>
              <p className="text-xs text-emerald-600 mt-0.5">{locName}</p>
            </div>
          )}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
            <h4 className="text-sm font-semibold text-foreground mb-4">Conversation Timeline</h4>
            {timeline.length === 0 ? <EmptyState message="No calls or chats recorded yet for this lead." /> : (
              <div className="space-y-4">
                {timeline.map(item => (
                  <div key={item.id} className={`rounded-lg p-4 border ${item.type === "call" ? "bg-violet-50/50 border-violet-100" : "bg-teal-50/50 border-teal-100"}`}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {item.type === "call" ? <Phone className="w-3.5 h-3.5 text-violet-500" /> : <MessageSquare className="w-3.5 h-3.5 text-teal-500" />}
                        <span className="text-xs font-semibold text-foreground capitalize">{item.type}</span>
                        <span className="text-xs text-muted-foreground">{fmtDateTime(item.time)}</span>
                      </div>
                      {item.type === "call" && <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{(item.data as Call).duration} min</span><OutcomeBadge outcome={(item.data as Call).outcome} />{(item.data as Call).ailmentType && <span className="text-xs text-muted-foreground">{(item.data as Call).ailmentType}</span>}</div>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{item.type === "call" ? (item.data as Call).summary : (item.data as Chat).summary}</p>
                    <TranscriptPanel text={item.type === "call" ? (item.data as Call).transcript : (item.data as Chat).transcript} open={openTranscripts.has(item.id)} onToggle={() => toggleTranscript(item.id)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
            <h4 className="text-sm font-semibold text-foreground mb-3">Update Status</h4>
            <select value={status} onChange={e => setStatus(e.target.value as LeadStatus)} className="w-full px-3 py-2 text-sm bg-input-background rounded-lg border border-border outline-none focus:ring-2 focus:ring-accent/30">
              {(["New","Contacted","Booked","Completed","Lost"] as LeadStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={saveStatus} disabled={saving} className="mt-3 w-full py-2 px-4 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved === "status" ? <Check className="w-3.5 h-3.5" /> : null}
              {saved === "status" ? "Saved!" : "Save Status"}
            </button>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
            <h4 className="text-sm font-semibold text-foreground mb-3">Notes</h4>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={5} placeholder="Add notes about this lead…" className="w-full px-3 py-2 text-sm bg-input-background rounded-lg border border-border outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-muted-foreground resize-none" />
            <button onClick={saveNotes} disabled={saving} className="mt-2 w-full py-2 px-4 bg-secondary text-secondary-foreground text-sm font-semibold rounded-lg hover:bg-slate-200 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved === "notes" ? <Check className="w-3.5 h-3.5" /> : null}
              {saved === "notes" ? "Saved!" : "Save Notes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldRow({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return <div><p className="text-xs font-medium text-muted-foreground mb-0.5 flex items-center gap-1"><Icon className="w-3 h-3" />{label}</p><p className="text-sm text-foreground">{value || "—"}</p></div>;
}

// ─── Calls Screen ──────────────────────────────────────────────────────────────

function CallsScreen({ locId }: { locId: string }) {
  const { calls, leads } = useData();
  const [openTranscripts, setOpenTranscripts] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [ailmentFilter, setAilmentFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => calls.filter(c => {
    if (locId !== "all" && c.locationId !== locId) return false;
    if (outcomeFilter !== "all" && c.outcome !== outcomeFilter) return false;
    if (ailmentFilter !== "all" && c.ailmentType !== ailmentFilter) return false;
    if (sourceFilter !== "all") { const lead = leads.find(l => l.id === c.leadId); if (lead?.source !== sourceFilter) return false; }
    if (dateFrom && c.dateTime < dateFrom) return false;
    if (dateTo && c.dateTime > dateTo + "T23:59:59Z") return false;
    if (search) { const lead = leads.find(l => l.id === c.leadId); const q = search.toLowerCase(); return lead?.fullName.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q); }
    return true;
  }).sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()), [calls, leads, locId, outcomeFilter, ailmentFilter, sourceFilter, dateFrom, dateTo, search]);

  const hasActiveFilters = outcomeFilter !== "all" || ailmentFilter !== "all" || sourceFilter !== "all" || dateFrom || dateTo || search;
  const toggleTranscript = (id: string) => setOpenTranscripts(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-border flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input className="w-full pl-9 pr-3 py-2 text-sm bg-input-background rounded-lg border-0 outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-muted-foreground" placeholder="Search calls…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={outcomeFilter} onChange={e => setOutcomeFilter(e.target.value)} className="px-3 py-2 text-sm bg-input-background rounded-lg border-0 outline-none focus:ring-2 focus:ring-accent/30 text-foreground">
          <option value="all">All Outcomes</option>
          {(["Completed","Voicemail","No Answer","Failed"] as CallOutcome[]).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <select value={ailmentFilter} onChange={e => setAilmentFilter(e.target.value)} className="px-3 py-2 text-sm bg-input-background rounded-lg border-0 outline-none focus:ring-2 focus:ring-accent/30 text-foreground">
          <option value="all">All Ailments</option>
          {AILMENT_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="px-3 py-2 text-sm bg-input-background rounded-lg border-0 outline-none focus:ring-2 focus:ring-accent/30 text-foreground">
          <option value="all">All Sources</option>
          <option value="Phone">Phone</option>
          <option value="Website Chat">Website Chat</option>
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-2 py-2 text-sm bg-input-background rounded-lg border-0 outline-none focus:ring-2 focus:ring-accent/30 text-foreground" />
          <label className="text-xs text-muted-foreground">To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-2 py-2 text-sm bg-input-background rounded-lg border-0 outline-none focus:ring-2 focus:ring-accent/30 text-foreground" />
        </div>
        {hasActiveFilters && (
          <button onClick={() => { setOutcomeFilter("all"); setAilmentFilter("all"); setSourceFilter("all"); setDateFrom(""); setDateTo(""); setSearch(""); }} className="text-xs text-accent hover:underline whitespace-nowrap">Clear filters</button>
        )}
        <span className="text-sm text-muted-foreground ml-auto">{filtered.length} calls</span>
      </div>
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-border"><EmptyState message={calls.length === 0 ? "No calls yet. Calls appear here when Vapi posts to the inbound-call endpoint after each call." : "No calls match your filters."} /></div>
        ) : filtered.map(call => {
          const lead = leads.find(l => l.id === call.leadId);
          return (
            <div key={call.id} className="bg-white rounded-xl p-5 shadow-sm border border-border">
              <div className="flex items-center gap-2 flex-wrap"><Phone className="w-4 h-4 text-violet-500" /><span className="font-semibold text-foreground">{lead?.fullName ?? "Unknown caller"}</span><OutcomeBadge outcome={call.outcome} /><span className="text-xs text-muted-foreground ml-1">{call.dateTime ? fmtDateTime(call.dateTime) : "—"}</span><span className="text-xs text-muted-foreground">· {call.duration} min</span><span className="text-xs text-muted-foreground">· {call.ailmentType ?? "—"}</span></div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{call.summary}</p>
              <TranscriptPanel text={call.transcript} open={openTranscripts.has(call.id)} onToggle={() => toggleTranscript(call.id)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Chats Screen ──────────────────────────────────────────────────────────────

function ChatsScreen({ locId }: { locId: string }) {
  const { chats, leads } = useData();
  const [openTranscripts, setOpenTranscripts] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => chats.filter(c => {
    if (locId !== "all" && c.locationId !== locId) return false;
    if (search) { const lead = leads.find(l => l.id === c.leadId); const q = search.toLowerCase(); return lead?.fullName.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q); }
    return true;
  }).sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()), [chats, leads, locId, search]);

  const toggleTranscript = (id: string) => setOpenTranscripts(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-border flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input className="w-full pl-9 pr-3 py-2 text-sm bg-input-background rounded-lg border-0 outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-muted-foreground" placeholder="Search chats…" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <span className="text-sm text-muted-foreground ml-auto">{filtered.length} chats</span>
      </div>
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-border"><EmptyState message={chats.length === 0 ? "No chats yet. Chats appear here when your website bot posts to the inbound-chat endpoint." : "No chats match your filters."} /></div>
        ) : filtered.map(chat => {
          const lead = leads.find(l => l.id === chat.leadId);
          return (
            <div key={chat.id} className="bg-white rounded-xl p-5 shadow-sm border border-border">
              <div className="flex items-center gap-2 flex-wrap"><MessageSquare className="w-4 h-4 text-teal-500" /><span className="font-semibold text-foreground">{lead?.fullName ?? "Website visitor"}</span><span className="text-xs text-muted-foreground">· {chat.dateTime ? fmtDateTime(chat.dateTime) : "—"}</span></div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{chat.summary}</p>
              <TranscriptPanel text={chat.transcript} open={openTranscripts.has(chat.id)} onToggle={() => toggleTranscript(chat.id)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Locations Screen ──────────────────────────────────────────────────────────

function LocationsScreen() {
  const { locations, leads, refetch } = useData();
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", phone: "", businessHours: "", calendarId: "", mondayBoardId: "" });

  const addLocation = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await supabase.from("locations").insert({ name: form.name, address: form.address || null, phone: form.phone || null, business_hours: form.businessHours || null, calendar_id: form.calendarId || null, monday_board_id: form.mondayBoardId || null, status: "Active" });
    refetch();
    setForm({ name: "", address: "", phone: "", businessHours: "", calendarId: "", mondayBoardId: "" });
    setShowAdd(false);
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{locations.length} locations</p>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"><Plus className="w-4 h-4" />Add Location</button>
      </div>
      {showAdd && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-accent/30">
          <div className="flex items-center justify-between mb-5"><h3 className="font-semibold text-foreground">New Location</h3><button onClick={() => setShowAdd(false)}><X className="w-4 h-4 text-muted-foreground" /></button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {([["name","Location Name","e.g. Pacific Heights PT"],["address","Address","Street, City, State, ZIP"],["phone","Phone Number","(415) 555-0000"],["businessHours","Business Hours","Mon–Fri 8am–6pm"],["calendarId","Google Calendar ID","location@group.calendar.google.com"],["mondayBoardId","monday.com Board ID","from your board URL"]] as const).map(([key, label, placeholder]) => (
              <div key={key}><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label><input value={form[key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="w-full px-3 py-2 text-sm bg-input-background rounded-lg border border-border outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-muted-foreground" /></div>
            ))}
          </div>
          <div className="mt-5 p-3 bg-blue-50 rounded-lg border border-blue-100"><p className="text-xs text-blue-700 font-medium">After saving, this location is live in Supabase immediately. Webhook routing works via <code className="font-mono">location_id</code> — no code changes required.</p></div>
          <div className="mt-4 flex gap-3">
            <button onClick={addLocation} disabled={saving || !form.name.trim()} className="px-5 py-2 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center gap-2">{saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Save Location</button>
            <button onClick={() => setShowAdd(false)} className="px-5 py-2 bg-secondary text-secondary-foreground text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
          </div>
        </div>
      )}
      {locations.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-border"><EmptyState message="No locations yet. Add your first location above. Each location gets its own Google Calendar and monday.com board." /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {locations.map(loc => {
            const locLeads = leads.filter(l => l.locationId === loc.id);
            const locBooked = locLeads.filter(l => l.status === "Booked" || l.status === "Completed").length;
            const rate = locLeads.length > 0 ? Math.round((locBooked / locLeads.length) * 100) : 0;
            return (
              <div key={loc.id} className="bg-white rounded-xl p-5 shadow-sm border border-border">
                <div className="flex items-start justify-between mb-3">
                  <div><h3 className="font-semibold text-foreground text-sm">{loc.name}</h3><p className="text-xs text-muted-foreground mt-0.5">{loc.address}</p></div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${loc.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{loc.status}</span>
                </div>
                {loc.phone && <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><PhoneCall className="w-3 h-3" />{loc.phone}</div>}
                {loc.businessHours && <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Clock className="w-3 h-3" />{loc.businessHours}</div>}
                {loc.calendarId && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar className="w-3 h-3" /><span className="truncate font-mono text-[11px]">{loc.calendarId}</span></div>}
                <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-lg font-bold text-foreground">{locLeads.length}</p><p className="text-[11px] text-muted-foreground">Total</p></div>
                  <div><p className="text-lg font-bold text-foreground">{locBooked}</p><p className="text-[11px] text-muted-foreground">Booked</p></div>
                  <div><p className="text-lg font-bold text-accent">{rate}%</p><p className="text-[11px] text-muted-foreground">Conversion</p></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Settings Screen ───────────────────────────────────────────────────────────

const PROJECT_REF = "nggeejxwxdoirjfmwwxk";
const BASE_URL = `https://${PROJECT_REF}.supabase.co/functions/v1`;

const LEAD_CONTRACT = JSON.stringify({ location_id: "uuid-from-locations-table", source: "Phone | Website Chat", full_name: "Jane Doe", phone: "+14155550100", email: "jane@example.com", reason: "Lower back pain after surgery", preferred_time: "Weekday mornings", webhook_secret: "your-shared-secret" }, null, 2);
const CALL_CONTRACT = JSON.stringify({ lead_id: "uuid (omit to auto-create lead)", location_id: "uuid-from-locations-table", vapi_call_id: "vapi-generated-uuid", date_time: "2026-06-22T10:00:00Z", duration_minutes: 5, talk_seconds: 142, outcome: "Completed | Voicemail | No Answer | Failed", transcript: "Full call transcript…", summary: "AI summary…", webhook_secret: "your-shared-secret" }, null, 2);
const CHAT_CONTRACT = JSON.stringify({ lead_id: "uuid (omit to auto-create lead)", location_id: "uuid-from-locations-table", visitor_name: "Jane Doe", visitor_phone: "+14155550100", visitor_email: "jane@example.com", reason: "Need PT for knee", date_time: "2026-06-22T10:00:00Z", transcript: "Visitor: Hi…\nAssistant: Hello…", summary: "Visitor inquired about…", webhook_secret: "your-shared-secret" }, null, 2);

const SQL_SCHEMA = `-- Run in: Supabase SQL Editor → New Query → Run

CREATE TABLE IF NOT EXISTS locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, address TEXT, phone TEXT, business_hours TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active','Pilot')),
  calendar_id TEXT, monday_board_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL, phone TEXT, email TEXT,
  source TEXT CHECK (source IN ('Phone','Website Chat')),
  status TEXT DEFAULT 'New' CHECK (status IN ('New','Contacted','Booked','Completed','Lost')),
  reason TEXT, preferred_time TEXT, appointment_datetime TIMESTAMPTZ,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  date_time TIMESTAMPTZ, duration_minutes INTEGER,
  talk_seconds INTEGER, vapi_call_id TEXT UNIQUE,
  outcome TEXT CHECK (outcome IN ('Completed','Voicemail','No Answer','Failed')),
  transcript TEXT, summary TEXT, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  date_time TIMESTAMPTZ, transcript TEXT, summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_read_locations" ON locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_leads" ON leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_update_leads" ON leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_read_calls" ON calls FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_chats" ON chats FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_insert_leads" ON leads FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "service_update_leads" ON leads FOR UPDATE TO service_role USING (true);
CREATE POLICY "service_insert_calls" ON calls FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "service_insert_chats" ON chats FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "service_insert_locations" ON locations FOR INSERT TO service_role WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE calls;
ALTER PUBLICATION supabase_realtime ADD TABLE chats;`;

function SettingsScreen({ session }: { session: Session | null }) {
  const { locations } = useData();
  const [tab, setTab] = useState<"team" | "integrations" | "schema">("team");

  return (
    <div className="space-y-5">
      <div className="flex gap-1 bg-white p-1 rounded-xl border border-border shadow-sm w-fit">
        {([["team","Team"],["integrations","Integrations"],["schema","Schema & Edge Functions"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${tab === id ? "bg-accent text-white" : "text-muted-foreground hover:text-foreground"}`}>{label}</button>
        ))}
      </div>

      {tab === "team" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Staff Accounts</h3>
              <a href={`https://supabase.com/dashboard/project/${PROJECT_REF}/auth/users`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"><Plus className="w-3.5 h-3.5" />Add in Supabase Auth</a>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-slate-50/60"><th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th><th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th><th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th></tr></thead>
              <tbody className="divide-y divide-border">
                {TEAM_MEMBERS.map(m => (
                  <tr key={m.id} className={`hover:bg-slate-50 transition-colors ${session?.user?.email === m.email ? "bg-blue-50/40" : ""}`}>
                    <td className="px-6 py-3.5"><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-primary">{m.name.split(" ").map(n => n[0]).join("")}</div><span className="font-medium text-foreground">{m.name}</span></div></td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground">{m.role}</td>
                    <td className="px-4 py-3.5 text-xs font-mono text-muted-foreground">{m.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
            <h3 className="font-semibold text-foreground mb-1">Signed In As</h3>
            <p className="text-sm text-muted-foreground mb-4">{session?.user?.email}</p>
            <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"><LogOut className="w-4 h-4" />Sign Out</button>
          </div>
        </div>
      )}

      {tab === "integrations" && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
            <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2"><Globe className="w-4 h-4 text-accent" />Live Webhook Endpoints</h3>
            <p className="text-xs text-muted-foreground mb-4">Your deployed Supabase Edge Function URLs. Point Vapi post-call webhook and n8n HTTP Request nodes at these.</p>
            <div className="space-y-3">
              {[["New Lead", `${BASE_URL}/inbound-lead`],["Completed Call", `${BASE_URL}/inbound-call`],["Website Chat", `${BASE_URL}/inbound-chat`]].map(([label, url]) => (
                <div key={label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-border">
                  <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">POST</span>
                  <span className="text-xs font-medium text-muted-foreground w-28 shrink-0">{label}</span>
                  <code className="text-xs font-mono text-foreground flex-1 truncate">{url}</code>
                  <CopyButton text={url} />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
            <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2"><Key className="w-4 h-4 text-accent" />Supabase Secrets</h3>
            <p className="text-xs text-muted-foreground mb-3">Set at: <a href={`https://supabase.com/dashboard/project/${PROJECT_REF}/settings/functions`} target="_blank" rel="noreferrer" className="text-accent underline">Supabase → Settings → Edge Functions → Secrets</a></p>
            <div className="space-y-2">
              {[["WEBHOOK_SECRET","Random string — run: openssl rand -base64 32. Must match what Vapi/n8n sends in the webhook_secret field."],["MONDAY_API_TOKEN","monday.com → avatar → Developers → My API tokens → Generate."],["GOOGLE_SERVICE_ACCOUNT_JSON","Google Cloud Console → Service Accounts → create with Calendar API → JSON key → paste entire file."]].map(([key, desc]) => (
                <div key={key} className="p-3 rounded-lg bg-slate-50 border border-border"><div className="flex items-center gap-2"><code className="text-xs font-mono font-semibold text-foreground">{key}</code><CopyButton text={key} /></div><p className="text-xs text-muted-foreground mt-0.5">{desc}</p></div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-accent" />Google Calendar — Per Location</h3>
            {locations.length === 0 ? <EmptyState message="Add locations first — each gets its own Google Calendar ID." /> : (
              <div className="space-y-2">
                {locations.map(loc => (
                  <div key={loc.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-border">
                    <span className="text-xs font-medium text-foreground w-40 shrink-0">{loc.name}</span>
                    <code className="text-xs font-mono text-muted-foreground flex-1 truncate">{loc.calendarId || "not set"}</code>
                    {loc.calendarId && <CopyButton text={loc.calendarId} />}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
            <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2"><FileText className="w-4 h-4 text-accent" />JSON Contracts</h3>
            <p className="text-xs text-muted-foreground mb-4">Exact payloads Vapi/n8n must POST. Include <code className="font-mono">webhook_secret</code> in every request body.</p>
            <div className="space-y-4">
              <div><p className="text-xs font-semibold text-foreground mb-2">New Lead — POST /inbound-lead</p><CodeBlock code={LEAD_CONTRACT} label="application/json" /></div>
              <div><p className="text-xs font-semibold text-foreground mb-2">Completed Call — POST /inbound-call</p><CodeBlock code={CALL_CONTRACT} label="application/json" /></div>
              <div><p className="text-xs font-semibold text-foreground mb-2">Website Chat — POST /inbound-chat</p><CodeBlock code={CHAT_CONTRACT} label="application/json" /></div>
            </div>
          </div>
          <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
            <h4 className="text-sm font-semibold text-amber-800 mb-2">Vapi — done in your Vapi dashboard</h4>
            <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside">
              <li>Open your assistant → Post-Call Webhook</li>
              <li>Set URL to: <code className="font-mono bg-amber-100 px-1 rounded">{BASE_URL}/inbound-call</code></li>
              <li>Vapi will POST the transcript and summary automatically after each call ends</li>
              <li>Include <code className="font-mono bg-amber-100 px-1 rounded">location_id</code> and <code className="font-mono bg-amber-100 px-1 rounded">webhook_secret</code> in the payload</li>
            </ol>
            <h4 className="text-sm font-semibold text-amber-800 mb-2 mt-4">n8n — done in your n8n workspace</h4>
            <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside">
              <li>Add a Webhook node to receive Vapi post-call events</li>
              <li>Add an HTTP Request node → POST to the inbound-call URL</li>
              <li>Map Vapi fields to the JSON contract above</li>
              <li>Store <code className="font-mono bg-amber-100 px-1 rounded">webhook_secret</code> as an n8n credential — never hardcode it</li>
            </ol>
          </div>
        </div>
      )}

      {tab === "schema" && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
            <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2"><Database className="w-4 h-4 text-accent" />SQL Schema</h3>
            <p className="text-xs text-muted-foreground mb-4">Run in: <a href={`https://supabase.com/dashboard/project/${PROJECT_REF}/sql`} target="_blank" rel="noreferrer" className="text-accent underline">Supabase SQL Editor</a> → New Query → paste → Run</p>
            <CodeBlock code={SQL_SCHEMA} label="001_initial_schema.sql" />
          </div>
          <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Add Staff Logins — done in Supabase Dashboard</h4>
            <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
              <li>Go to <a href={`https://supabase.com/dashboard/project/${PROJECT_REF}/auth/users`} target="_blank" rel="noreferrer" className="underline">Supabase → Authentication → Users</a></li>
              <li>Click Add user → Create new user</li>
              <li>Enter the staff email and a temporary password</li>
              <li>Staff sign in at this dashboard with those credentials</li>
            </ol>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
            <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2"><Zap className="w-4 h-4 text-accent" />Edge Functions — deployed</h3>
            <div className="space-y-2 mt-3">
              {[`${BASE_URL}/inbound-lead`, `${BASE_URL}/inbound-call`, `${BASE_URL}/inbound-chat`].map(url => (
                <div key={url} className="flex items-center gap-3 p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <code className="text-xs font-mono text-emerald-800 flex-1 truncate">{url}</code>
                  <CopyButton text={url} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────

type Screen = "overview" | "leads" | "calls" | "chats" | "locations" | "settings";
const NAV = [
  { id: "overview" as Screen, label: "Overview", icon: LayoutDashboard },
  { id: "leads" as Screen, label: "Leads", icon: Users },
  { id: "calls" as Screen, label: "Calls", icon: Phone },
  { id: "chats" as Screen, label: "Chats", icon: MessageSquare },
  { id: "locations" as Screen, label: "Locations", icon: MapPin },
  { id: "settings" as Screen, label: "Settings", icon: Settings },
];

function Sidebar({ current, onNav, userEmail }: { current: Screen; onNav: (s: Screen) => void; userEmail?: string }) {
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "RG";
  return (
    <aside className="w-56 shrink-0 bg-sidebar flex flex-col h-screen overflow-hidden">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center"><Activity className="w-4 h-4 text-white" /></div>
          <div><p className="text-xs font-bold text-white leading-none">Recovery Group</p><p className="text-[10px] text-sidebar-foreground mt-0.5">Lead Management</p></div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => onNav(id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${current === id ? "bg-sidebar-primary text-white" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"}`}>
            <Icon className="w-4 h-4 shrink-0" />{label}
          </button>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-white">{initials}</div>
          <p className="text-[10px] text-sidebar-foreground truncate">{userEmail ?? "Staff"}</p>
        </div>
      </div>
    </aside>
  );
}

// ─── Top Bar ───────────────────────────────────────────────────────────────────

const SCREEN_LABELS: Record<Screen, string> = { overview: "Overview", leads: "Leads", calls: "Calls", chats: "Website Chats", locations: "Locations", settings: "Settings" };

function TopBar({ screen, locId, onLocChange, locations, hasNew, globalSearch, onGlobalSearch }: { screen: Screen; locId: string; onLocChange: (id: string) => void; locations: Location[]; hasNew: boolean; globalSearch: string; onGlobalSearch: (q: string) => void }) {
  return (
    <header className="h-14 bg-white border-b border-border flex items-center px-6 gap-3 shrink-0">
      <h1 className="text-base font-bold text-foreground w-32 shrink-0">{SCREEN_LABELS[screen]}</h1>
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          value={globalSearch}
          onChange={e => onGlobalSearch(e.target.value)}
          placeholder="Search leads…"
          className="w-full pl-8 pr-3 py-1.5 text-sm bg-input-background rounded-lg border border-border outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-muted-foreground"
        />
      </div>
      <div className="relative ml-auto">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <select value={locId} onChange={e => onLocChange(e.target.value)} className="pl-8 pr-7 py-1.5 text-sm font-medium bg-input-background rounded-lg border border-border outline-none focus:ring-2 focus:ring-accent/30 appearance-none cursor-pointer text-foreground">
          <option value="all">All Locations</option>
          {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      </div>
      <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
        <Bell className="w-4 h-4 text-muted-foreground" />
        {hasNew && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
      </button>
    </header>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>("overview");
  const [locId, setLocId] = useState("all");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [hasNew, setHasNew] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  const handleGlobalSearch = (q: string) => {
    setGlobalSearch(q);
    if (q) { setScreen("leads"); setSelectedLeadId(null); }
  };

  const fetchData = useCallback(async () => {
    setDataLoading(true);
    setDataError(null);
    try {
      const [locsRes, leadsRes, callsRes, chatsRes] = await Promise.all([
        supabase.from("locations").select("*").order("name"),
        supabase.from("leads").select("*").order("created_at", { ascending: false }),
        supabase.from("calls").select("*").order("date_time", { ascending: false }),
        supabase.from("chats").select("*").order("date_time", { ascending: false }),
      ]);
      if (locsRes.error) throw new Error(locsRes.error.message);
      if (leadsRes.error) throw new Error(leadsRes.error.message);
      if (callsRes.error) throw new Error(callsRes.error.message);
      if (chatsRes.error) throw new Error(chatsRes.error.message);
      setLocations((locsRes.data ?? []).map(transformLocation));
      setLeads((leadsRes.data ?? []).map(transformLead));
      setCalls((callsRes.data ?? []).map(transformCall));
      setChats((chatsRes.data ?? []).map(transformChat));
    } catch (err: unknown) {
      setDataError(err instanceof Error ? err.message : "Failed to load data. Make sure the SQL schema has been run in Supabase (Settings → Schema & Edge Functions).");
    }
    setDataLoading(false);
  }, []);

  // Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch data when logged in
  useEffect(() => { if (session) fetchData(); }, [session, fetchData]);

  // Supabase Realtime — live updates without refresh
  useEffect(() => {
    if (!session) return;
    const channel = supabase.channel("db-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        fetchData();
        setHasNew(true);
        setTimeout(() => setHasNew(false), 5000);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "calls" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "chats" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "locations" }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, fetchData]);

  if (authLoading) return <LoadingScreen />;
  if (!session) return <LoginScreen />;
  if (dataLoading && leads.length === 0 && !dataError) return <LoadingScreen />;

  const effectiveScreen = selectedLeadId ? "leads" : screen;

  return (
    <DataCtx.Provider value={{ locations, leads, calls, chats, loading: dataLoading, error: dataError, refetch: fetchData }}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar current={effectiveScreen} onNav={s => { setScreen(s); setSelectedLeadId(null); }} userEmail={session.user.email} />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <TopBar screen={effectiveScreen} locId={locId} onLocChange={setLocId} locations={locations} hasNew={hasNew} globalSearch={globalSearch} onGlobalSearch={handleGlobalSearch} />
          {dataError && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-700">{dataError}</p>
              <button onClick={fetchData} className="ml-auto text-xs text-red-600 font-medium underline shrink-0">Retry</button>
            </div>
          )}
          <main className="flex-1 overflow-y-auto p-6">
            {selectedLeadId ? (
              <LeadDetailScreen leadId={selectedLeadId} onBack={() => setSelectedLeadId(null)} />
            ) : screen === "overview" ? (
              <OverviewScreen locId={locId} />
            ) : screen === "leads" ? (
              <LeadsScreen locId={locId} onSelectLead={setSelectedLeadId} initialSearch={globalSearch} />
            ) : screen === "calls" ? (
              <CallsScreen locId={locId} />
            ) : screen === "chats" ? (
              <ChatsScreen locId={locId} />
            ) : screen === "locations" ? (
              <LocationsScreen />
            ) : (
              <SettingsScreen session={session} />
            )}
          </main>
        </div>
      </div>
    </DataCtx.Provider>
  );
}
