"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  LogOut,
  Save,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Eye,
  Pencil,
  FileText,
  ArrowLeft,
  X,
} from "lucide-react";
import { marked } from "marked";

/* ────────────── types ────────────── */

interface TimelineEntry {
  date: string;
  age: string;
  title: string;
  emoji: string;
  description: string;
}

interface GalleryEntry {
  src: string;
  caption: string;
  date: string;
  category: string;
}

interface DrawingEntry {
  src: string;
  title: string;
  date: string;
  nanuAge: number;
}

interface LetterEntry {
  targetAge: number;
  title: string;
  content: string;
  writtenDate: string;
}

interface ProfileData {
  name: string;
  tagline: string;
  about: string;
  birthday: string;
  createdBy: string;
  socials: { github: string };
  favorites: { emoji: string; label: string }[];
}

interface AskNanuData {
  questions: string[];
  answers: Record<string, { age: number; responses: string[] }>;
}

interface BlogPostEntry {
  slug: string;
  sha: string;
  frontmatter: Record<string, string>;
  body: string;
}

type TabId = "timeline" | "gallery" | "drawings" | "asknanu" | "letters" | "profile" | "blog";

const TABS: { id: TabId; label: string; emoji: string; file: string }[] = [
  { id: "timeline", label: "Timeline", emoji: "🌱", file: "timeline.json" },
  { id: "gallery", label: "Gallery", emoji: "📸", file: "gallery.json" },
  { id: "drawings", label: "Drawings", emoji: "🎨", file: "drawings.json" },
  { id: "asknanu", label: "Ask Nanu", emoji: "🗣️", file: "ask-nanu.json" },
  { id: "letters", label: "Letters", emoji: "✉️", file: "letters.json" },
  { id: "profile", label: "Profile", emoji: "👤", file: "profile.json" },
  { id: "blog", label: "Blog", emoji: "📝", file: "" },
];

/* ────────────── API helpers ────────────── */

async function fetchContent(file: string, password: string) {
  const res = await fetch(`/api/admin/content?file=${file}`, {
    headers: { Authorization: `Bearer ${password}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  return res.json();
}

async function saveContent(
  file: string,
  content: unknown,
  sha: string,
  password: string,
  commitMessage: string
) {
  const res = await fetch("/api/admin/content", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${password}`,
    },
    body: JSON.stringify({ file, content, sha, commitMessage }),
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || `Failed to save: ${res.status}`);
  }
  return res.json();
}

/* ────────────── main component ────────────── */

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("timeline");
  const [data, setData] = useState<unknown>(null);
  const [sha, setSha] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Check session
  useEffect(() => {
    const stored = sessionStorage.getItem("admin_pw");
    if (stored) {
      setPassword(stored);
      setAuthenticated(true);
    }
  }, []);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadTab = useCallback(
    async (tabId: TabId) => {
      // Blog tab manages its own data loading
      if (tabId === "blog") {
        setData(null);
        setLoading(false);
        return;
      }
      const tab = TABS.find((t) => t.id === tabId)!;
      setLoading(true);
      setData(null);
      try {
        const res = await fetchContent(tab.file, password);
        setData(res.content);
        setSha(res.sha);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        if (msg === "Unauthorized") {
          setAuthenticated(false);
          sessionStorage.removeItem("admin_pw");
        }
        showToast("error", msg);
      } finally {
        setLoading(false);
      }
    },
    [password, showToast]
  );

  // Load data when tab changes
  useEffect(() => {
    if (authenticated) loadTab(activeTab);
  }, [activeTab, authenticated, loadTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      await fetchContent("profile.json", password);
      sessionStorage.setItem("admin_pw", password);
      setAuthenticated(true);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "Unauthorized") {
        setAuthError("Wrong password. Try again.");
      } else {
        setAuthError("GitHub Error: GITHUB_TOKEN is missing or invalid in Vercel.");
      }
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_pw");
    setAuthenticated(false);
    setPassword("");
    setData(null);
  };

  const handleSave = async () => {
    const tab = TABS.find((t) => t.id === activeTab)!;
    setSaving(true);
    try {
      const res = await saveContent(
        tab.file,
        data,
        sha,
        password,
        `Update ${tab.label.toLowerCase()} via admin dashboard`
      );
      setSha(res.newSha);
      showToast("success", `${tab.label} saved! Vercel will redeploy shortly.`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Save failed";
      showToast("error", msg);
    } finally {
      setSaving(false);
    }
  };

  /* ────────────── password gate ────────────── */

  if (!authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <Card className="w-full max-w-sm border-purple-200 shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-purple-800">Admin Access</CardTitle>
            <p className="text-purple-500 text-sm mt-1">Enter your password to manage content</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-purple-200 focus-visible:ring-purple-400"
              />
              {authError && (
                <p className="text-red-500 text-sm flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  {authError}
                </p>
              )}
              <Button
                type="submit"
                className="w-full text-white cursor-pointer"
                style={{ background: "linear-gradient(135deg, #7C3AED, #9333ea)" }}
              >
                <Lock className="w-4 h-4 mr-2" /> Unlock
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  /* ────────────── main dashboard ────────────── */

  return (
    <main className="min-h-screen px-4 sm:px-6 py-8 md:py-12">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-purple-800 flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-yellow-500" />
              Admin Dashboard
            </h1>
            <p className="text-purple-500 text-sm mt-1">
              Edit content → commits to GitHub → auto-deploys on Vercel
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-purple-600 border-purple-200 hover:bg-purple-50 cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-1.5" /> Logout
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white border-purple-600 shadow-md"
                  : "bg-white text-purple-600 border-purple-200 hover:bg-purple-50"
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        {/* Content area */}
        {/* Blog tab has its own card/layout */}
        {activeTab === "blog" ? (
          <BlogEditor password={password} showToast={showToast} />
        ) : (
          <Card className="border-purple-200 shadow-sm min-h-[400px]">
            <CardContent className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                </div>
              ) : data !== null ? (
                <div className="space-y-6">
                  {activeTab === "timeline" && (
                    <TimelineEditor
                      data={data as TimelineEntry[]}
                      onChange={(d) => setData(d)}
                    />
                  )}
                  {activeTab === "gallery" && (
                    <GalleryEditor
                      data={data as GalleryEntry[]}
                      onChange={(d) => setData(d)}
                    />
                  )}
                  {activeTab === "drawings" && (
                    <DrawingsEditor
                      data={data as DrawingEntry[]}
                      onChange={(d) => setData(d)}
                    />
                  )}
                  {activeTab === "asknanu" && (
                    <AskNanuEditor
                      data={data as AskNanuData}
                      onChange={(d) => setData(d)}
                    />
                  )}
                  {activeTab === "letters" && (
                    <LettersEditor
                      data={data as LetterEntry[]}
                      onChange={(d) => setData(d)}
                    />
                  )}
                  {activeTab === "profile" && (
                    <ProfileEditor
                      data={data as ProfileData}
                      onChange={(d) => setData(d)}
                    />
                  )}

                  {/* Save button */}
                  <div className="flex justify-end pt-4 border-t border-purple-100">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="text-white cursor-pointer px-6"
                      style={{ background: "linear-gradient(135deg, #7C3AED, #9333ea)" }}
                    >
                      {saving ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
                      ) : (
                        <><Save className="w-4 h-4 mr-2" /> Save & Deploy</>
                      )}
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        {/* Toast */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium z-50 ${
              toast.type === "success"
                ? "bg-emerald-500 text-white"
                : "bg-red-500 text-white"
            }`}
            style={{ animation: "slideUp 0.3s ease-out" }}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {toast.message}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TAB EDITORS
   ══════════════════════════════════════════════════════════════════ */

function FormRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">{children}</div>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-purple-600 mb-1">{children}</label>;
}

function EntryCard({
  children,
  onDelete,
  title,
}: {
  children: React.ReactNode;
  onDelete: () => void;
  title: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 space-y-3 relative group">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-purple-800 text-sm">{title}</p>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="w-7 h-7 text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
      {children}
    </div>
  );
}

/* ──── Timeline ──── */

function TimelineEditor({
  data,
  onChange,
}: {
  data: TimelineEntry[];
  onChange: (d: TimelineEntry[]) => void;
}) {
  const addEntry = () => {
    onChange([
      ...data,
      { date: new Date().toISOString().split("T")[0], age: "", title: "", emoji: "🎉", description: "" },
    ]);
  };

  const update = (i: number, field: keyof TimelineEntry, value: string) => {
    const copy = [...data];
    copy[i] = { ...copy[i], [field]: value };
    onChange(copy);
  };

  const remove = (i: number) => onChange(data.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-purple-800">
          🌱 Timeline Events ({data.length})
        </h3>
        <Button variant="outline" size="sm" onClick={addEntry} className="text-purple-600 border-purple-200 cursor-pointer">
          <Plus className="w-4 h-4 mr-1" /> Add Event
        </Button>
      </div>

      {data.map((entry, i) => (
        <EntryCard key={i} title={entry.title || "New Event"} onDelete={() => remove(i)}>
          <FormRow>
            <div>
              <FieldLabel>Date</FieldLabel>
              <Input type="date" value={entry.date} onChange={(e) => update(i, "date", e.target.value)} className="border-purple-200 text-sm" />
            </div>
            <div>
              <FieldLabel>Age</FieldLabel>
              <Input placeholder="e.g. 2 years" value={entry.age} onChange={(e) => update(i, "age", e.target.value)} className="border-purple-200 text-sm" />
            </div>
            <div>
              <FieldLabel>Emoji</FieldLabel>
              <Input placeholder="🎉" value={entry.emoji} onChange={(e) => update(i, "emoji", e.target.value)} className="border-purple-200 text-sm" />
            </div>
          </FormRow>
          <div>
            <FieldLabel>Title</FieldLabel>
            <Input value={entry.title} onChange={(e) => update(i, "title", e.target.value)} className="border-purple-200 text-sm" />
          </div>
          <div>
            <FieldLabel>Description</FieldLabel>
            <textarea
              value={entry.description}
              onChange={(e) => update(i, "description", e.target.value)}
              rows={2}
              className="w-full rounded-md border border-purple-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
            />
          </div>
        </EntryCard>
      ))}
    </div>
  );
}

/* ──── Gallery ──── */

function GalleryEditor({
  data,
  onChange,
}: {
  data: GalleryEntry[];
  onChange: (d: GalleryEntry[]) => void;
}) {
  const addEntry = () => {
    onChange([...data, { src: "", caption: "", date: new Date().toISOString().split("T")[0], category: "" }]);
  };

  const update = (i: number, field: keyof GalleryEntry, value: string) => {
    const copy = [...data];
    copy[i] = { ...copy[i], [field]: value };
    onChange(copy);
  };

  const remove = (i: number) => onChange(data.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-purple-800">📸 Gallery Photos ({data.length})</h3>
        <Button variant="outline" size="sm" onClick={addEntry} className="text-purple-600 border-purple-200 cursor-pointer">
          <Plus className="w-4 h-4 mr-1" /> Add Photo
        </Button>
      </div>

      {data.map((entry, i) => (
        <EntryCard key={i} title={entry.caption || "New Photo"} onDelete={() => remove(i)}>
          <FormRow>
            <div className="sm:col-span-2">
              <FieldLabel>Image URL</FieldLabel>
              <Input placeholder="/gallery/photo.jpg" value={entry.src} onChange={(e) => update(i, "src", e.target.value)} className="border-purple-200 text-sm" />
            </div>
            <div>
              <FieldLabel>Date</FieldLabel>
              <Input type="date" value={entry.date} onChange={(e) => update(i, "date", e.target.value)} className="border-purple-200 text-sm" />
            </div>
          </FormRow>
          <FormRow>
            <div className="sm:col-span-2">
              <FieldLabel>Caption</FieldLabel>
              <Input value={entry.caption} onChange={(e) => update(i, "caption", e.target.value)} className="border-purple-200 text-sm" />
            </div>
            <div>
              <FieldLabel>Category</FieldLabel>
              <Input placeholder="adventure, family..." value={entry.category} onChange={(e) => update(i, "category", e.target.value)} className="border-purple-200 text-sm" />
            </div>
          </FormRow>
          {entry.src && (
            <div className="mt-2">
              <img src={entry.src} alt={entry.caption} className="w-24 h-24 object-cover rounded-lg border border-purple-100" />
            </div>
          )}
        </EntryCard>
      ))}

      {data.length === 0 && (
        <p className="text-purple-400 text-center py-8 text-sm">No photos yet. Click &quot;Add Photo&quot; to get started!</p>
      )}
    </div>
  );
}

/* ──── Drawings ──── */

function DrawingsEditor({
  data,
  onChange,
}: {
  data: DrawingEntry[];
  onChange: (d: DrawingEntry[]) => void;
}) {
  const addEntry = () => {
    onChange([...data, { src: "", title: "", date: new Date().toISOString().split("T")[0], nanuAge: 6 }]);
  };

  const update = (i: number, field: keyof DrawingEntry, value: string | number) => {
    const copy = [...data];
    copy[i] = { ...copy[i], [field]: value };
    onChange(copy);
  };

  const remove = (i: number) => onChange(data.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-purple-800">🎨 Drawings ({data.length})</h3>
        <Button variant="outline" size="sm" onClick={addEntry} className="text-purple-600 border-purple-200 cursor-pointer">
          <Plus className="w-4 h-4 mr-1" /> Add Drawing
        </Button>
      </div>

      {data.map((entry, i) => (
        <EntryCard key={i} title={entry.title || "New Drawing"} onDelete={() => remove(i)}>
          <FormRow>
            <div className="sm:col-span-2">
              <FieldLabel>Image URL</FieldLabel>
              <Input placeholder="/drawings/art.jpg" value={entry.src} onChange={(e) => update(i, "src", e.target.value)} className="border-purple-200 text-sm" />
            </div>
            <div>
              <FieldLabel>Nanu&apos;s Age</FieldLabel>
              <Input type="number" value={entry.nanuAge} onChange={(e) => update(i, "nanuAge", parseInt(e.target.value) || 0)} className="border-purple-200 text-sm" />
            </div>
          </FormRow>
          <FormRow>
            <div className="sm:col-span-2">
              <FieldLabel>Title</FieldLabel>
              <Input value={entry.title} onChange={(e) => update(i, "title", e.target.value)} className="border-purple-200 text-sm" />
            </div>
            <div>
              <FieldLabel>Date</FieldLabel>
              <Input type="date" value={entry.date} onChange={(e) => update(i, "date", e.target.value)} className="border-purple-200 text-sm" />
            </div>
          </FormRow>
        </EntryCard>
      ))}

      {data.length === 0 && (
        <p className="text-purple-400 text-center py-8 text-sm">No drawings yet. Click &quot;Add Drawing&quot; to start!</p>
      )}
    </div>
  );
}

/* ──── Ask Nanu ──── */

function AskNanuEditor({
  data,
  onChange,
}: {
  data: AskNanuData;
  onChange: (d: AskNanuData) => void;
}) {
  const [newYear, setNewYear] = useState("");
  const [newAge, setNewAge] = useState("");

  const questions = data?.questions || [];
  const answers = data?.answers || {};

  const addYear = () => {
    if (!newYear) {
      alert("Please enter a year!");
      return;
    }
    if (answers[newYear]) {
      alert(`The year ${newYear} already exists!`);
      return;
    }
    const updated = {
      ...data,
      questions,
      answers: {
        ...answers,
        [newYear]: {
          age: parseInt(newAge) || 0,
          responses: questions.map(() => ""),
        },
      },
    };
    onChange(updated);
    setNewYear("");
    setNewAge("");
  };

  const updateResponse = (year: string, qIndex: number, value: string) => {
    const updated = { ...data, questions, answers: { ...answers } };
    if (!updated.answers[year]) return;
    updated.answers[year] = {
      ...updated.answers[year],
      responses: [...(updated.answers[year].responses || [])],
    };
    updated.answers[year].responses[qIndex] = value;
    onChange(updated);
  };

  const removeYear = (year: string) => {
    const updated = { ...data, questions, answers: { ...answers } };
    delete updated.answers[year];
    onChange(updated);
  };

  const years = Object.keys(answers).sort();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-purple-800">🗣️ Ask Nanu Q&amp;A</h3>
      </div>

      {/* Questions list */}
      <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100">
        <p className="font-semibold text-purple-700 text-sm mb-2">Questions (same every year):</p>
        <ol className="list-decimal list-inside space-y-1 text-sm text-purple-600">
          {questions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
          {questions.length === 0 && <p>No questions yet.</p>}
        </ol>
      </div>

      {/* Add year */}
      <div className="flex gap-2 items-end">
        <div>
          <FieldLabel>Year</FieldLabel>
          <Input placeholder="2027" value={newYear} onChange={(e) => setNewYear(e.target.value)} className="border-purple-200 text-sm w-24" />
        </div>
        <div>
          <FieldLabel>Age</FieldLabel>
          <Input placeholder="7" value={newAge} onChange={(e) => setNewAge(e.target.value)} className="border-purple-200 text-sm w-20" />
        </div>
        <Button variant="outline" size="sm" onClick={addYear} className="text-purple-600 border-purple-200 cursor-pointer">
          <Plus className="w-4 h-4 mr-1" /> Add Year
        </Button>
      </div>

      {/* Year entries */}
      {years.map((year) => (
        <EntryCard
          key={year}
          title={`${year} — Age ${answers[year]?.age || 0}`}
          onDelete={() => removeYear(year)}
        >
          <div className="space-y-3">
            {questions.map((q, qi) => (
              <div key={qi}>
                <FieldLabel>Q: {q}</FieldLabel>
                <Input
                  value={answers[year]?.responses?.[qi] || ""}
                  onChange={(e) => updateResponse(year, qi, e.target.value)}
                  placeholder="Nanu's answer..."
                  className="border-purple-200 text-sm"
                />
              </div>
            ))}
          </div>
        </EntryCard>
      ))}
    </div>
  );
}

/* ──── Letters ──── */

function LettersEditor({
  data,
  onChange,
}: {
  data: LetterEntry[];
  onChange: (d: LetterEntry[]) => void;
}) {
  const addEntry = () => {
    onChange([
      ...data,
      { targetAge: 25, title: "", content: "", writtenDate: new Date().toISOString().split("T")[0] },
    ]);
  };

  const update = (i: number, field: keyof LetterEntry, value: string | number) => {
    const copy = [...data];
    copy[i] = { ...copy[i], [field]: value };
    onChange(copy);
  };

  const remove = (i: number) => onChange(data.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-purple-800">✉️ Time-Capsule Letters ({data.length})</h3>
        <Button variant="outline" size="sm" onClick={addEntry} className="text-purple-600 border-purple-200 cursor-pointer">
          <Plus className="w-4 h-4 mr-1" /> Add Letter
        </Button>
      </div>

      {data.map((entry, i) => (
        <EntryCard key={i} title={entry.title || "New Letter"} onDelete={() => remove(i)}>
          <FormRow>
            <div>
              <FieldLabel>Target Age</FieldLabel>
              <Input type="number" value={entry.targetAge} onChange={(e) => update(i, "targetAge", parseInt(e.target.value) || 0)} className="border-purple-200 text-sm" />
            </div>
            <div>
              <FieldLabel>Written Date</FieldLabel>
              <Input type="date" value={entry.writtenDate} onChange={(e) => update(i, "writtenDate", e.target.value)} className="border-purple-200 text-sm" />
            </div>
            <div className="sm:col-span-1">
              <FieldLabel>Title</FieldLabel>
              <Input value={entry.title} onChange={(e) => update(i, "title", e.target.value)} className="border-purple-200 text-sm" />
            </div>
          </FormRow>
          <div>
            <FieldLabel>Letter Content</FieldLabel>
            <textarea
              value={entry.content}
              onChange={(e) => update(i, "content", e.target.value)}
              rows={4}
              className="w-full rounded-md border border-purple-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
            />
          </div>
        </EntryCard>
      ))}
    </div>
  );
}

/* ──── Profile ──── */

function ProfileEditor({
  data,
  onChange,
}: {
  data: ProfileData;
  onChange: (d: ProfileData) => void;
}) {
  const favorites = data?.favorites || [];
  const socials = data?.socials || { github: "" };

  const updateField = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const addFavorite = () => {
    onChange({ ...data, favorites: [...favorites, { emoji: "⭐", label: "" }] });
  };

  const updateFavorite = (i: number, field: "emoji" | "label", value: string) => {
    const faves = [...favorites];
    faves[i] = { ...faves[i], [field]: value };
    onChange({ ...data, favorites: faves });
  };

  const removeFavorite = (i: number) => {
    onChange({ ...data, favorites: favorites.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-purple-800">👤 Profile</h3>

      <FormRow>
        <div>
          <FieldLabel>Name</FieldLabel>
          <Input value={data?.name || ""} onChange={(e) => updateField("name", e.target.value)} className="border-purple-200 text-sm" />
        </div>
        <div>
          <FieldLabel>Birthday</FieldLabel>
          <Input type="date" value={data?.birthday || ""} onChange={(e) => updateField("birthday", e.target.value)} className="border-purple-200 text-sm" />
        </div>
        <div>
          <FieldLabel>Created By</FieldLabel>
          <Input value={data?.createdBy || ""} onChange={(e) => updateField("createdBy", e.target.value)} className="border-purple-200 text-sm" />
        </div>
      </FormRow>

      <div>
        <FieldLabel>Tagline</FieldLabel>
        <Input value={data?.tagline || ""} onChange={(e) => updateField("tagline", e.target.value)} className="border-purple-200 text-sm" />
      </div>

      <div>
        <FieldLabel>About</FieldLabel>
        <textarea
          value={data?.about || ""}
          onChange={(e) => updateField("about", e.target.value)}
          rows={3}
          className="w-full rounded-md border border-purple-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
        />
      </div>

      <div>
        <FieldLabel>GitHub URL</FieldLabel>
        <Input
          value={socials.github || ""}
          onChange={(e) => onChange({ ...data, socials: { ...socials, github: e.target.value } })}
          className="border-purple-200 text-sm"
        />
      </div>

      {/* Favorites */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <FieldLabel>Favorites</FieldLabel>
          <Button variant="outline" size="sm" onClick={addFavorite} className="text-purple-600 border-purple-200 cursor-pointer">
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {favorites.map((fav, i) => (
            <div key={i} className="flex items-center gap-1.5 p-2 rounded-lg border border-purple-100 bg-purple-50/40 group">
              <Input
                value={fav.emoji || ""}
                onChange={(e) => updateFavorite(i, "emoji", e.target.value)}
                className="w-12 text-center border-purple-200 text-sm p-1"
              />
              <Input
                value={fav.label || ""}
                onChange={(e) => updateFavorite(i, "label", e.target.value)}
                className="flex-1 border-purple-200 text-sm"
                placeholder="Label"
              />
              <button
                onClick={() => removeFavorite(i)}
                className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {favorites.length === 0 && <p className="text-sm text-purple-400 col-span-2">No favorites added yet.</p>}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   BLOG EDITOR
   ══════════════════════════════════════════════════════════════════ */

function BlogEditor({
  password,
  showToast,
}: {
  password: string;
  showToast: (type: "success" | "error", message: string) => void;
}) {
  const [posts, setPosts] = useState<BlogPostEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<{
    slug: string;
    sha: string;
    title: string;
    date: string;
    excerpt: string;
    category: string;
    nanuAge: string;
    aiModel: string;
    tags: string;
    body: string;
    isNew: boolean;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const authHeaders = { Authorization: `Bearer ${password}` };

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blogs", { headers: authHeaders });
      if (!res.ok) throw new Error("Failed to load blog posts");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (e: unknown) {
      showToast("error", e instanceof Error ? e.message : "Failed to load blogs");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const openNewPost = () => {
    setEditingPost({
      slug: "",
      sha: "",
      title: "",
      date: new Date().toISOString().split("T")[0],
      excerpt: "",
      category: "",
      nanuAge: "",
      aiModel: "",
      tags: "",
      body: "\n# Your Blog Post\n\nStart writing here...\n",
      isNew: true,
    });
    setPreviewMode(false);
  };

  const openEditPost = async (post: BlogPostEntry) => {
    // Fetch the full raw content for editing
    try {
      const res = await fetch(`/api/admin/blogs?slug=${post.slug}`, {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("Failed to fetch post");
      const data = await res.json();

      // Parse the raw markdown to extract frontmatter and body
      const raw = data.content as string;
      const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

      let fm: Record<string, string> = {};
      let body = raw;

      if (fmMatch) {
        body = fmMatch[2];
        fmMatch[1].split("\n").forEach((line: string) => {
          const colonIdx = line.indexOf(":");
          if (colonIdx > 0) {
            const key = line.slice(0, colonIdx).trim();
            let val = line.slice(colonIdx + 1).trim();
            if (
              (val.startsWith('"') && val.endsWith('"')) ||
              (val.startsWith("'") && val.endsWith("'"))
            ) {
              val = val.slice(1, -1);
            }
            fm[key] = val;
          }
        });
      }

      setEditingPost({
        slug: post.slug,
        sha: data.sha,
        title: fm.title || "",
        date: fm.date ? fm.date.split("T")[0] : "",
        excerpt: fm.excerpt || "",
        category: fm.category || "",
        nanuAge: fm.nanuAge || "",
        aiModel: fm.aiModel || fm.ai_model || "",
        tags: fm.tags || "",
        body,
        isNew: false,
      });
      setPreviewMode(false);
    } catch (e: unknown) {
      showToast("error", e instanceof Error ? e.message : "Failed to load post");
    }
  };

  const buildMarkdown = () => {
    if (!editingPost) return "";
    const lines = ["---"];
    if (editingPost.title) lines.push(`title: "${editingPost.title}"`);
    if (editingPost.date) lines.push(`date: "${editingPost.date}T10:00:00Z"`);
    if (editingPost.excerpt) lines.push(`excerpt: "${editingPost.excerpt}"`);
    if (editingPost.category) lines.push(`category: "${editingPost.category}"`);
    if (editingPost.nanuAge) lines.push(`nanuAge: ${editingPost.nanuAge}`);
    if (editingPost.aiModel) lines.push(`aiModel: "${editingPost.aiModel}"`);
    if (editingPost.tags) lines.push(`tags: ${editingPost.tags}`);
    lines.push("---");
    lines.push(editingPost.body);
    return lines.join("\n");
  };

  const handleSavePost = async () => {
    if (!editingPost) return;

    const slug = editingPost.isNew
      ? editingPost.slug || editingPost.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      : editingPost.slug;

    if (!slug) {
      showToast("error", "Please enter a title to generate a slug.");
      return;
    }

    setSaving(true);
    try {
      const content = buildMarkdown();
      const body: Record<string, string> = { slug, content };
      if (editingPost.sha) body.sha = editingPost.sha;

      const res = await fetch("/api/admin/blogs", {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      const result = await res.json();
      showToast("success", `Blog post "${slug}" saved! Vercel will redeploy.`);
      setEditingPost((prev) =>
        prev ? { ...prev, sha: result.newSha, slug, isNew: false } : null
      );
      loadPosts();
    } catch (e: unknown) {
      showToast("error", e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async (post: BlogPostEntry) => {
    if (!confirm(`Delete "${post.slug}"? This commits a deletion to GitHub.`)) return;

    setDeleting(post.slug);
    try {
      const res = await fetch("/api/admin/blogs", {
        method: "DELETE",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ slug: post.slug, sha: post.sha }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }

      showToast("success", `Deleted "${post.slug}".`);
      loadPosts();
    } catch (e: unknown) {
      showToast("error", e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const updateField = (field: string, value: string) => {
    setEditingPost((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  // Render the preview HTML
  const getPreviewHtml = () => {
    if (!editingPost) return "";
    try {
      return marked.parse(editingPost.body) as string;
    } catch {
      return "<p>Error rendering preview</p>";
    }
  };

  /* ──── Editing view ──── */
  if (editingPost) {
    return (
      <div className="space-y-4">
        {/* Editor header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingPost(null)}
            className="text-purple-600 hover:bg-purple-50 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to list
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
              className="text-purple-600 border-purple-200 cursor-pointer"
            >
              {previewMode ? (
                <><Pencil className="w-4 h-4 mr-1" /> Edit</>
              ) : (
                <><Eye className="w-4 h-4 mr-1" /> Preview</>
              )}
            </Button>
            <Button
              size="sm"
              onClick={handleSavePost}
              disabled={saving}
              className="text-white cursor-pointer"
              style={{ background: "linear-gradient(135deg, #7C3AED, #9333ea)" }}
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving…</>
              ) : (
                <><Save className="w-4 h-4 mr-1" /> Save Post</>
              )}
            </Button>
          </div>
        </div>

        {/* Frontmatter fields */}
        <Card className="border-purple-200 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-bold text-purple-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> Post Metadata
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <FieldLabel>Title</FieldLabel>
                <Input
                  value={editingPost.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="My Amazing Blog Post"
                  className="border-purple-200 text-sm"
                />
              </div>
              <div>
                <FieldLabel>Date</FieldLabel>
                <Input
                  type="date"
                  value={editingPost.date}
                  onChange={(e) => updateField("date", e.target.value)}
                  className="border-purple-200 text-sm"
                />
              </div>
            </div>
            <div>
              <FieldLabel>Excerpt</FieldLabel>
              <Input
                value={editingPost.excerpt}
                onChange={(e) => updateField("excerpt", e.target.value)}
                placeholder="A short description of the post..."
                className="border-purple-200 text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <FieldLabel>Category</FieldLabel>
                <Input
                  value={editingPost.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  placeholder="adventure"
                  className="border-purple-200 text-sm"
                />
              </div>
              <div>
                <FieldLabel>Nanu&apos;s Age</FieldLabel>
                <Input
                  value={editingPost.nanuAge}
                  onChange={(e) => updateField("nanuAge", e.target.value)}
                  placeholder="7"
                  className="border-purple-200 text-sm"
                />
              </div>
              <div>
                <FieldLabel>AI Model</FieldLabel>
                <Input
                  value={editingPost.aiModel}
                  onChange={(e) => updateField("aiModel", e.target.value)}
                  placeholder="Gemini 2.5"
                  className="border-purple-200 text-sm"
                />
              </div>
            </div>
            {editingPost.isNew && (
              <div>
                <FieldLabel>Slug (auto-generated from title, or set manually)</FieldLabel>
                <Input
                  value={editingPost.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  placeholder={editingPost.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "my-blog-post"}
                  className="border-purple-200 text-sm font-mono"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Editor / Preview */}
        <Card className="border-purple-200 shadow-sm">
          <CardContent className="p-0">
            {previewMode ? (
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-purple-100">
                  <Eye className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-semibold text-purple-700">Preview</span>
                </div>
                <div
                  className="prose prose-purple max-w-none prose-headings:text-purple-800 prose-p:text-purple-900 prose-li:text-purple-900 prose-strong:text-purple-700 prose-a:text-purple-600"
                  dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                />
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 px-4 py-3 border-b border-purple-100 bg-purple-50/50">
                  <Pencil className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-semibold text-purple-700">Markdown Editor</span>
                  <Badge variant="outline" className="text-[10px] border-purple-200 text-purple-400 ml-auto">
                    Markdown
                  </Badge>
                </div>
                <textarea
                  value={editingPost.body}
                  onChange={(e) => updateField("body", e.target.value)}
                  rows={24}
                  className="w-full px-4 py-3 text-sm font-mono text-purple-900 bg-white focus:outline-none resize-y min-h-[400px] border-0"
                  placeholder="Write your markdown content here..."
                  spellCheck={false}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ──── Post list view ──── */
  return (
    <Card className="border-purple-200 shadow-sm min-h-[400px]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-purple-800">📝 Blog Posts ({posts.length})</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={openNewPost}
            className="text-purple-600 border-purple-200 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1" /> New Post
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <FileText className="w-12 h-12 text-purple-200 mx-auto" />
            <p className="text-purple-400 text-sm">No blog posts yet.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={openNewPost}
              className="text-purple-600 border-purple-200 cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1" /> Create your first post
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.slug}
                className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 flex items-center justify-between group hover:border-purple-200 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-purple-800 text-sm truncate">
                      {post.frontmatter.title || post.slug}
                    </p>
                    {post.frontmatter.category && (
                      <Badge variant="outline" className="text-[10px] border-purple-200 text-purple-500 shrink-0">
                        {post.frontmatter.category}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-purple-400">
                    <span className="font-mono">{post.slug}.md</span>
                    {post.frontmatter.date && (
                      <span>{new Date(post.frontmatter.date).toLocaleDateString()}</span>
                    )}
                    {post.frontmatter.excerpt && (
                      <span className="truncate max-w-[300px] hidden sm:inline">{post.frontmatter.excerpt}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0 ml-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditPost(post)}
                    className="w-8 h-8 text-purple-500 hover:text-purple-700 hover:bg-purple-100 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePost(post)}
                    disabled={deleting === post.slug}
                    className="w-8 h-8 text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    {deleting === post.slug ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
