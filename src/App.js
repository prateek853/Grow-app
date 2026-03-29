import React, { useState, useRef, useEffect } from "react";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const today = new Date();
const todayKey = today.toISOString().split("T")[0];

const quotes = [
  "Small steps every day lead to big change.",
  "Reflect. Grow. Repeat.",
  "Your journal is your mirror.",
  "Consistency is the seed of transformation.",
  "Every entry is a step forward.",
];

const defaultHabits = [
  { id: 1, name: "Morning pages", icon: "✍️", color: "#FF6B6B" },
  { id: 2, name: "Exercise", icon: "🏃", color: "#FF9F43" },
  { id: 3, name: "Read 20 mins", icon: "📖", color: "#54A0FF" },
  { id: 4, name: "Meditate", icon: "🌿", color: "#5F27CD" },
];

const VISION_CATEGORIES = [
  { id: "health", label: "Health", icon: "🌿", color: "#00D2D3" },
  { id: "career", label: "Career", icon: "🚀", color: "#54A0FF" },
  { id: "relationships", label: "Relationships", icon: "❤️", color: "#FF6B6B" },
  { id: "mindset", label: "Mindset", icon: "🧠", color: "#5F27CD" },
  { id: "creativity", label: "Creativity", icon: "✨", color: "#FF9F43" },
  { id: "finance", label: "Finance", icon: "🌱", color: "#1DD1A1" },
];

const VC_TAGS = ["All", "Funding", "Startups", "AI", "Markets", "Founders"];

const TAG_COLORS = {
  Funding: "#54A0FF",
  Startups: "#1DD1A1",
  AI: "#5F27CD",
  Markets: "#FF9F43",
  Founders: "#FF6B6B",
};

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
}

// 🔑 PASTE YOUR ANTHROPIC API KEY BELOW (replace the text inside the quotes)
const ANTHROPIC_API_KEY = "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";

const API_HEADERS = {
  "Content-Type": "application/json",
  "x-api-key": ANTHROPIC_API_KEY,
  "anthropic-version": "2023-06-01",
  "anthropic-dangerous-direct-browser-access": "true",
};

async function callClaude(messages, systemPrompt, tools) {
  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: systemPrompt,
    messages,
  };
  if (tools) body.tools = tools;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: API_HEADERS,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data.content?.find((b) => b.type === "text")?.text || "";
}

async function fetchVCArticles() {
  // Curated VC & startup articles — refreshed regularly
  const feeds = [
    { url: "https://api.rss2json.com/v1/api.json?rss_url=https://techcrunch.com/feed/", source: "TechCrunch" },
    { url: "https://api.rss2json.com/v1/api.json?rss_url=https://venturebeat.com/feed/", source: "VentureBeat" },
  ];

  const tagMap = (title) => {
    const t = title.toLowerCase();
    if (t.includes("fund") || t.includes("raise") || t.includes("million") || t.includes("billion")) return "Funding";
    if (t.includes("ai") || t.includes("artificial intelligence") || t.includes("gpt") || t.includes("model")) return "AI";
    if (t.includes("founder") || t.includes("ceo") || t.includes("startup story")) return "Founders";
    if (t.includes("market") || t.includes("ipo") || t.includes("valuation") || t.includes("stock")) return "Markets";
    return "Startups";
  };

  try {
    const results = await Promise.all(
      feeds.map((f) => fetch(f.url).then((r) => r.json()).then((d) => ({ ...d, source: f.source })).catch(() => null))
    );
    const articles = [];
    for (const feed of results) {
      if (!feed?.items) continue;
      for (const item of feed.items.slice(0, 4)) {
        articles.push({
          title: item.title,
          source: feed.source,
          tag: tagMap(item.title),
          summary: item.description?.replace(/<[^>]+>/g, "").slice(0, 180).trim() + "…" || "Read the full article for details.",
          url: item.link,
          readTime: `${Math.ceil((item.description?.split(" ").length || 200) / 200)} min read`,
        });
      }
    }
    return articles.slice(0, 6);
  } catch { return null; }
}

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0F0F1A; }
  ::-webkit-scrollbar { display: none; }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.12); }
    100% { transform: scale(1); }
  }
  .habit-card { transition: transform 0.15s ease, box-shadow 0.15s ease; }
  .habit-card:active { transform: scale(0.97); }
  .tab-btn { transition: all 0.22s cubic-bezier(0.34,1.56,0.64,1); }
  .article-card { transition: transform 0.18s ease, box-shadow 0.18s ease; }
  .article-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.35); }
  .goal-card { transition: opacity 0.2s, transform 0.15s; }
  .goal-card:active { transform: scale(0.98); }
  .ai-btn { transition: all 0.18s ease; }
  .ai-btn:hover { transform: translateY(-1px); }
  .fade-up { animation: fadeUp 0.4s ease forwards; }
  .fade-up-2 { animation: fadeUp 0.4s ease 0.08s forwards; opacity: 0; }
  .fade-up-3 { animation: fadeUp 0.4s ease 0.16s forwards; opacity: 0; }
`;

function StyleTag() {
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);
  return null;
}

function Ring({ pct }) {
  const r = 24, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 64, height: 64 }}>
      <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
        <circle cx="32" cy="32" r={r} fill="none"
          stroke="url(#ringGrad)" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * circ} ${circ}`}
          style={{ transition: "stroke-dasharray 0.7s cubic-bezier(0.4,0,0.2,1)" }} />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF6B6B" />
            <stop offset="100%" stopColor="#FF9F43" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Sora" }}>{pct}%</span>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("today");
  const [habits, setHabits] = useState(defaultHabits);
  const [completions, setCompletions] = useState({});
  const [journals, setJournals] = useState({});
  const [journalDraft, setJournalDraft] = useState("");
  const [newHabit, setNewHabit] = useState("");
  const [addingHabit, setAddingHabit] = useState(false);
  const [goalText, setGoalText] = useState("");
  const [goals, setGoals] = useState([]);
  const [quoteIdx] = useState(() => Math.floor(Math.random() * quotes.length));
  const [savedToday, setSavedToday] = useState(false);
  const [coachMessages, setCoachMessages] = useState([]);
  const [coachInput, setCoachInput] = useState("");
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const chatEndRef = useRef(null);
  const [weeklyReport, setWeeklyReport] = useState("");
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weeklyGenerated, setWeeklyGenerated] = useState(false);
  const [visions, setVisions] = useState({});
  const [editingVision, setEditingVision] = useState(null);
  const [visionDraft, setVisionDraft] = useState("");
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteTitleDraft, setNoteTitleDraft] = useState("");
  const [noteLoading, setNoteLoading] = useState(null);
  const [noteAiResult, setNoteAiResult] = useState("");
  const [noteAiType, setNoteAiType] = useState("");
  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [articlesError, setArticlesError] = useState(false);
  const [articlesFetchedDate, setArticlesFetchedDate] = useState(null);
  const [activeTag, setActiveTag] = useState("All");
  const [expandedArticle, setExpandedArticle] = useState(null);

  const last7 = getLast7Days();

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [coachMessages]);
  useEffect(() => { if (tab === "read" && articlesFetchedDate !== todayKey && !articlesLoading) loadArticles(); }, [tab]);

  const loadArticles = async () => {
    setArticlesLoading(true); setArticlesError(false);
    try {
      const data = await fetchVCArticles();
      if (data?.length > 0) { setArticles(data); setArticlesFetchedDate(todayKey); }
      else setArticlesError(true);
    } catch { setArticlesError(true); }
    setArticlesLoading(false);
  };

  const filteredArticles = activeTag === "All" ? articles : articles.filter((a) => a.tag === activeTag);
  const toggleHabit = (habitId) => setCompletions((prev) => { const k = `${todayKey}:${habitId}`; return { ...prev, [k]: !prev[k] }; });
  const isComplete = (hid, date = todayKey) => !!completions[`${date}:${hid}`];
  const streakCount = (hid) => {
    let count = 0;
    for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const dk = d.toISOString().split("T")[0]; if (completions[`${dk}:${hid}`]) count++; else count = 0; }
    return count;
  };
  const todayCompletion = habits.length === 0 ? 0 : Math.round((habits.filter((h) => isComplete(h.id)).length / habits.length) * 100);
  const saveJournal = () => { if (!journalDraft.trim()) return; setJournals((prev) => ({ ...prev, [todayKey]: journalDraft })); setSavedToday(true); setTimeout(() => setSavedToday(false), 2000); };
  const addHabit = () => {
    if (!newHabit.trim()) return;
    const cols = ["#FF6B6B", "#FF9F43", "#54A0FF", "#5F27CD", "#1DD1A1"];
    const icons = ["⭐", "💪", "🎯", "🔥", "✨"];
    const id = Date.now();
    setHabits((prev) => [...prev, { id, name: newHabit.trim(), icon: icons[id % icons.length], color: cols[id % cols.length] }]);
    setNewHabit(""); setAddingHabit(false);
  };
  const addGoal = () => { if (!goalText.trim()) return; setGoals((prev) => [{ id: Date.now(), text: goalText.trim(), done: false }, ...prev]); setGoalText(""); };
  const toggleGoal = (id) => setGoals((prev) => prev.map((g) => g.id === id ? { ...g, done: !g.done } : g));
  const sendCoachMessage = async () => {
    if (!coachInput.trim() || coachLoading) return;
    const msg = { role: "user", content: coachInput.trim() };
    const updated = [...coachMessages, msg];
    setCoachMessages(updated); setCoachInput(""); setCoachLoading(true);
    const ctx = Object.entries(journals).sort(([a], [b]) => b.localeCompare(a)).slice(0, 3).map(([d, t]) => `${d}: ${t}`).join("\n\n");
    const sys = `You are a warm, insightful personal growth coach. Recent journals:\n${ctx || "None yet."}\nBe concise, encouraging, ask one follow-up.`;
    try { const reply = await callClaude(updated, sys); setCoachMessages((p) => [...p, { role: "assistant", content: reply }]); }
    catch { setCoachMessages((p) => [...p, { role: "assistant", content: "Trouble connecting. Try again." }]); }
    setCoachLoading(false);
  };
  const generateWeeklyReport = async () => {
    setWeeklyLoading(true); setWeeklyGenerated(false);
    const hd = habits.map((h) => { const d = last7.filter((dk) => completions[`${dk}:${h.id}`]).length; return `${h.name}: ${d}/7`; }).join(", ");
    const js = Object.entries(journals).filter(([k]) => last7.includes(k)).map(([d, t]) => `${d}: ${t.slice(0, 150)}`).join("\n");
    const gd = goals.map((g) => `${g.done ? "done" : "pending"}: ${g.text}`).join(", ");
    const sys = `Personal growth analyst. Write a warm weekly report, plain text, no markdown. Celebratory opener, habit highlights, journal themes, one challenge. Under 150 words.`;
    try { const r = await callClaude([{ role: "user", content: `Habits: ${hd || "none"}\nJournal: ${js || "none"}\nGoals: ${gd || "none"}\nWrite my weekly reflection.` }], sys); setWeeklyReport(r); setWeeklyGenerated(true); }
    catch { setWeeklyReport("Couldn't generate right now."); setWeeklyGenerated(true); }
    setWeeklyLoading(false);
  };
  const saveVision = (cid) => { if (!visionDraft.trim()) return; setVisions((p) => ({ ...p, [cid]: visionDraft.trim() })); setEditingVision(null); setVisionDraft(""); };
  const createNote = () => { const id = Date.now(); setNotes((p) => [{ id, title: "", body: "", createdAt: new Date().toISOString() }, ...p]); setActiveNote(id); setNoteTitleDraft(""); setNoteDraft(""); setNoteAiResult(""); setNoteAiType(""); };
  const saveNote = () => { if (!noteDraft.trim() && !noteTitleDraft.trim()) return; setNotes((p) => p.map((n) => n.id === activeNote ? { ...n, title: noteTitleDraft || "Untitled", body: noteDraft } : n)); };
  const deleteNote = (id) => { setNotes((p) => p.filter((n) => n.id !== id)); if (activeNote === id) setActiveNote(null); };
  const runAI = async (type) => {
    if (!noteDraft.trim()) return;
    saveNote(); setNoteLoading(type); setNoteAiResult(""); setNoteAiType(type);
    const map = {
      summarise: { sys: "Summarise key points in 2-4 dash bullet points. Brief.", user: `Summarise:\n\n${noteDraft}` },
      expand: { sys: "Expand this note with depth and examples. Under 200 words.", user: `Expand:\n\n${noteDraft}` },
      actions: { sys: "Extract 3-5 concrete action items as dash list.", user: `Action items:\n\n${noteDraft}` },
    };
    try { const r = await callClaude([{ role: "user", content: map[type].user }], map[type].sys); setNoteAiResult(r); }
    catch { setNoteAiResult("Couldn't process. Try again."); }
    setNoteLoading(null);
  };
  const openNote = (n) => { setActiveNote(n.id); setNoteTitleDraft(n.title === "Untitled" ? "" : n.title); setNoteDraft(n.body); setNoteAiResult(""); setNoteAiType(""); };
  const greeting = () => { const h = today.getHours(); if (h < 12) return "Good morning, Prateek"; if (h < 17) return "Good afternoon, Prateek"; return "Good evening, Prateek"; };
  const dateLabel = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const TABS = [
    { key: "today", label: "Habits", icon: "⚡" },
    { key: "journal", label: "Journal", icon: "📓" },
    { key: "goals", label: "Goals", icon: "🎯" },
    { key: "notes", label: "Notes", icon: "📝" },
    { key: "read", label: "Read", icon: "📡" },
    { key: "vision", label: "Vision", icon: "🌟" },
    { key: "insights", label: "Insights", icon: "📊" },
  ];

  const tabGradients = {
    today: "linear-gradient(135deg, #FF6B6B 0%, #FF9F43 100%)",
    journal: "linear-gradient(135deg, #54A0FF 0%, #5F27CD 100%)",
    goals: "linear-gradient(135deg, #1DD1A1 0%, #54A0FF 100%)",
    notes: "linear-gradient(135deg, #FF9F43 0%, #FF6B6B 100%)",
    read: "linear-gradient(135deg, #5F27CD 0%, #54A0FF 100%)",
    vision: "linear-gradient(135deg, #FF6B6B 0%, #5F27CD 100%)",
    insights: "linear-gradient(135deg, #1DD1A1 0%, #00D2D3 100%)",
  };

  return (
    <>
      <StyleTag />
      <div style={s.root}>
        <div style={{ ...s.hero, background: tabGradients[tab] }}>
          <div style={s.heroNoise} />
          <div style={s.heroContent}>
            <div style={s.heroLeft}>
              <div style={s.greetingText}>{greeting()} 👋</div>
              <div style={s.dateText}>{dateLabel}</div>
              <div style={s.quotePill}>"{quotes[quoteIdx]}"</div>
            </div>
            <Ring pct={todayCompletion} />
          </div>
        </div>

        <div style={s.navBar}>
          {TABS.map(({ key, icon, label }) => (
            <button key={key} className="tab-btn" onClick={() => setTab(key)}
              style={{ ...s.navBtn, ...(tab === key ? { ...s.navBtnActive, background: tabGradients[key] } : {}) }}>
              <span style={{ fontSize: tab === key ? 20 : 18 }}>{icon}</span>
              <span style={{ ...s.navLabel, color: tab === key ? "#fff" : "#666" }}>{label}</span>
            </button>
          ))}
        </div>

        <div style={s.content} key={tab}>
          {tab === "today" && (
            <div className="fade-up">
              <div style={s.weekStrip}>
                {last7.map((dk) => {
                  const d = new Date(dk + "T00:00:00");
                  const isToday = dk === todayKey;
                  const allDone = habits.length > 0 && habits.every((h) => completions[`${dk}:${h.id}`]);
                  return (
                    <div key={dk} style={s.weekCol}>
                      <span style={s.weekDay}>{DAYS[d.getDay()]}</span>
                      <div style={{ ...s.weekDot, background: allDone ? "linear-gradient(135deg,#FF6B6B,#FF9F43)" : isToday ? "rgba(255,107,107,0.2)" : "rgba(255,255,255,0.06)", border: isToday && !allDone ? "2px solid #FF6B6B" : "2px solid transparent", boxShadow: allDone ? "0 0 12px rgba(255,107,107,0.5)" : "none" }} />
                    </div>
                  );
                })}
              </div>
              <div style={s.sectionTitle}>Today's Habits</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
                {habits.map((h, i) => {
                  const done = isComplete(h.id); const streak = streakCount(h.id);
                  return (
                    <div key={h.id} className="habit-card fade-up" onClick={() => toggleHabit(h.id)}
                      style={{ ...s.habitCard, animationDelay: `${i * 0.06}s`, background: done ? `linear-gradient(135deg, ${h.color}22, ${h.color}11)` : "rgba(255,255,255,0.04)", border: `1.5px solid ${done ? h.color + "66" : "rgba(255,255,255,0.08)"}` }}>
                      <div style={{ ...s.habitIconWrap, background: done ? h.color : "rgba(255,255,255,0.08)" }}>
                        <span style={{ fontSize: 20 }}>{h.icon}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ ...s.habitName, color: done ? "#aaa" : "#fff", textDecoration: done ? "line-through" : "none" }}>{h.name}</div>
                        {streak > 1 && <div style={s.streakBadge}>🔥 {streak}-day streak</div>}
                      </div>
                      <div style={{ ...s.checkCircle, background: done ? h.color : "transparent", borderColor: done ? h.color : "rgba(255,255,255,0.2)" }}>
                        {done && <span style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              {addingHabit ? (
                <div style={{ ...s.row, marginTop: 14 }}>
                  <input style={s.darkInput} placeholder="Name your habit…" value={newHabit} onChange={(e) => setNewHabit(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addHabit()} autoFocus />
                  <button onClick={addHabit} style={s.btnVibrant}>Add</button>
                  <button onClick={() => setAddingHabit(false)} style={s.btnGhost}>✕</button>
                </div>
              ) : (
                <button onClick={() => setAddingHabit(true)} style={s.addHabitBtn}>+ Add a habit</button>
              )}
            </div>
          )}

          {tab === "journal" && (
            <div className="fade-up">
              <div style={s.promptCard}>
                <div style={s.promptLabel}>✦ Today's Prompt</div>
                <div style={s.promptText}>What's one thing you're proud of today, and what would you do differently?</div>
              </div>
              <textarea style={s.darkTextarea} placeholder="Start writing, Prateek…" value={journalDraft || journals[todayKey] || ""} onChange={(e) => setJournalDraft(e.target.value)} rows={7} />
              <div style={s.row}>
                <button onClick={saveJournal} style={{ ...s.btnVibrant, flex: 1, background: savedToday ? "linear-gradient(135deg,#1DD1A1,#00D2D3)" : "linear-gradient(135deg,#54A0FF,#5F27CD)" }}>{savedToday ? "✓ Saved!" : "Save Entry"}</button>
                <button onClick={() => setCoachOpen(true)} style={{ ...s.btnOutline, flex: 1 }}>🤖 Ask Coach</button>
              </div>
              {Object.keys(journals).filter((k) => k !== todayKey).length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <div style={s.sectionTitle}>Past Entries</div>
                  {Object.entries(journals).filter(([k]) => k !== todayKey).sort(([a], [b]) => b.localeCompare(a)).slice(0, 5).map(([date, text]) => (
                    <div key={date} style={s.pastCard}>
                      <div style={s.pastDate}>{new Date(date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                      <div style={s.pastSnippet}>{text.slice(0, 90)}{text.length > 90 ? "…" : ""}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "goals" && (
            <div className="fade-up">
              <div style={s.row}>
                <input style={s.darkInput} placeholder="What's your next goal?" value={goalText} onChange={(e) => setGoalText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addGoal()} />
                <button onClick={addGoal} style={s.btnVibrant}>Add</button>
              </div>
              {goals.length === 0 && <div style={s.emptyState}><div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div><div style={{ color: "#666", fontSize: 15 }}>Set your first goal above!</div></div>}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                {goals.map((g, i) => (
                  <div key={g.id} className="goal-card fade-up" onClick={() => toggleGoal(g.id)} style={{ ...s.goalCard, animationDelay: `${i * 0.05}s`, opacity: g.done ? 0.5 : 1 }}>
                    <div style={{ ...s.goalCheck, background: g.done ? "linear-gradient(135deg,#1DD1A1,#54A0FF)" : "transparent", borderColor: g.done ? "transparent" : "rgba(255,255,255,0.2)" }}>
                      {g.done && <span style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>✓</span>}
                    </div>
                    <div style={{ ...s.goalText, textDecoration: g.done ? "line-through" : "none", color: g.done ? "#555" : "#eee" }}>{g.text}</div>
                  </div>
                ))}
              </div>
              {goals.some((g) => g.done) && <div style={s.completedBadge}><span style={{ background: "linear-gradient(135deg,#1DD1A1,#54A0FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{goals.filter((g) => g.done).length}/{goals.length} goals crushed 🌱</span></div>}
            </div>
          )}

          {tab === "notes" && (
            <div className="fade-up">
              {activeNote === null ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div style={s.sectionTitle}>Your Notes</div>
                    <button onClick={createNote} style={{ ...s.btnVibrant, background: "linear-gradient(135deg,#FF9F43,#FF6B6B)", fontSize: 13, padding: "8px 16px" }}>+ New Note</button>
                  </div>
                  {notes.length === 0 && <div style={s.emptyState}><div style={{ fontSize: 48, marginBottom: 12 }}>📝</div><div style={{ color: "#666" }}>No notes yet. Tap New Note!</div></div>}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {notes.map((note, i) => (
                      <div key={note.id} style={{ ...s.noteCard, animationDelay: `${i * 0.05}s` }}>
                        <div onClick={() => openNote(note)} style={{ flex: 1, cursor: "pointer" }}>
                          <div style={s.noteTitle}>{note.title || "Untitled"}</div>
                          <div style={s.noteSnippet}>{note.body ? note.body.slice(0, 70) + (note.body.length > 70 ? "…" : "") : <span style={{ color: "#444" }}>Empty note</span>}</div>
                          <div style={s.noteMeta}>{new Date(note.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                        </div>
                        <button onClick={() => deleteNote(note.id)} style={s.deleteBtn}>🗑</button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <button onClick={() => { saveNote(); setActiveNote(null); setNoteAiResult(""); }} style={s.backBtn}>← Back</button>
                    <input style={{ ...s.darkInput, flex: 1, fontWeight: 700, fontSize: 16 }} placeholder="Note title…" value={noteTitleDraft} onChange={(e) => setNoteTitleDraft(e.target.value)} />
                  </div>
                  <textarea style={{ ...s.darkTextarea, minHeight: 160 }} placeholder="Capture your thoughts…" value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} rows={7} />
                  <button onClick={saveNote} style={{ ...s.btnVibrant, width: "100%", marginTop: 10, marginBottom: 20, background: "linear-gradient(135deg,#FF9F43,#FF6B6B)" }}>Save Note</button>
                  <div style={s.sectionTitle}>AI Tools</div>
                  <div style={{ display: "flex", gap: 10, marginTop: 12, marginBottom: 16 }}>
                    {[{ type: "summarise", icon: "📋", label: "Summarise" }, { type: "expand", icon: "🌱", label: "Expand" }, { type: "actions", icon: "🎯", label: "Actions" }].map(({ type, icon, label }) => (
                      <button key={type} className="ai-btn" onClick={() => runAI(type)} disabled={!!noteLoading}
                        style={{ ...s.aiToolBtn, background: noteAiType === type ? "linear-gradient(135deg,#FF9F43,#FF6B6B)" : "rgba(255,255,255,0.05)", border: noteAiType === type ? "none" : "1.5px solid rgba(255,255,255,0.1)", opacity: noteLoading && noteLoading !== type ? 0.4 : 1 }}>
                        <span style={{ fontSize: 22 }}>{icon}</span>
                        <span style={{ fontSize: 11, color: noteAiType === type ? "#fff" : "#aaa", marginTop: 4 }}>{noteLoading === type ? "…" : label}</span>
                      </button>
                    ))}
                  </div>
                  {noteAiResult && (
                    <div style={s.aiResultCard}>
                      <div style={s.aiResultLabel}>{noteAiType === "summarise" ? "📋 Summary" : noteAiType === "expand" ? "🌱 Expanded" : "🎯 Action Items"}</div>
                      <div style={s.aiResultText}>{noteAiResult}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {tab === "read" && (
            <div className="fade-up">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={s.sectionTitle}>VC & Startup Reads</div>
                  <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>Fresh from the web, daily</div>
                </div>
                <button onClick={loadArticles} disabled={articlesLoading} style={s.refreshBtn}>{articlesLoading ? "⟳" : "↻ Refresh"}</button>
              </div>
              <div style={s.tagRow}>
                {VC_TAGS.map((tag) => (
                  <button key={tag} onClick={() => setActiveTag(tag)}
                    style={{ ...s.tagChip, background: activeTag === tag ? (TAG_COLORS[tag] || "#fff") : "rgba(255,255,255,0.05)", color: activeTag === tag ? "#fff" : "#666", border: activeTag === tag ? "none" : "1.5px solid rgba(255,255,255,0.08)", boxShadow: activeTag === tag ? `0 4px 16px ${(TAG_COLORS[tag] || "#fff")}44` : "none" }}>
                    {tag}
                  </button>
                ))}
              </div>
              {articlesLoading && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[1, 2, 3].map((i) => (<div key={i} style={s.skeletonCard}><div style={{ ...s.skeletonLine, width: "35%", height: 10, marginBottom: 12 }} /><div style={{ ...s.skeletonLine, width: "92%", height: 16, marginBottom: 10 }} /><div style={{ ...s.skeletonLine, width: "68%", height: 12 }} /></div>))}
                  <div style={{ textAlign: "center", fontSize: 12, color: "#444", marginTop: 8 }}>Searching the web…</div>
                </div>
              )}
              {!articlesLoading && articlesError && <div style={s.emptyState}><div style={{ fontSize: 40, marginBottom: 12 }}>📡</div><div style={{ color: "#666", marginBottom: 16 }}>Couldn't load articles.</div><button onClick={loadArticles} style={s.btnVibrant}>Try Again</button></div>}
              {!articlesLoading && !articlesError && filteredArticles.map((a, i) => (
                <div key={i} className="article-card fade-up" style={{ ...s.articleCard, animationDelay: `${i * 0.07}s` }} onClick={() => setExpandedArticle(expandedArticle === i ? null : i)}>
                  <div style={s.articleMeta}>
                    <span style={{ ...s.tagPill, background: (TAG_COLORS[a.tag] || "#666") + "33", color: TAG_COLORS[a.tag] || "#aaa" }}>{a.tag}</span>
                    <span style={s.articleSource}>{a.source}</span>
                    <span style={s.articleReadTime}>{a.readTime}</span>
                  </div>
                  <div style={s.articleTitle}>{a.title}</div>
                  {expandedArticle === i && (
                    <div style={s.articleBody}>
                      <div style={s.articleSummary}>{a.summary}</div>
                      {a.url && a.url !== "#" && <a href={a.url} target="_blank" rel="noopener noreferrer" style={s.articleLink} onClick={(e) => e.stopPropagation()}>Read full article →</a>}
                    </div>
                  )}
                  <div style={{ ...s.chevron, color: expandedArticle === i ? "#54A0FF" : "#333" }}>{expandedArticle === i ? "▲" : "▼"}</div>
                </div>
              ))}
              {!articlesLoading && !articlesError && articles.length > 0 && <div style={{ textAlign: "center", fontSize: 11, color: "#333", marginTop: 16 }}>Last refreshed {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</div>}
            </div>
          )}

          {tab === "vision" && (
            <div className="fade-up">
              <div style={s.sectionTitle}>Your Vision Board</div>
              <div style={{ fontSize: 13, color: "#555", marginBottom: 20, marginTop: 6 }}>Tap each area to write your ideal future.</div>
              <div style={s.visionGrid}>
                {VISION_CATEGORIES.map((cat) => {
                  const isEditing = editingVision === cat.id; const has = !!visions[cat.id];
                  return (
                    <div key={cat.id} style={{ ...s.visionCard, background: has ? `linear-gradient(135deg, ${cat.color}22, ${cat.color}11)` : "rgba(255,255,255,0.04)", border: `1.5px solid ${has ? cat.color + "55" : "rgba(255,255,255,0.07)"}`, boxShadow: has ? `0 4px 20px ${cat.color}22` : "none" }}>
                      <div style={s.visionTop}>
                        <div style={{ ...s.visionIcon, background: cat.color + "33" }}>{cat.icon}</div>
                        <span style={{ ...s.visionLabel, color: has ? cat.color : "#666" }}>{cat.label}</span>
                      </div>
                      {isEditing ? (
                        <>
                          <textarea style={s.visionTextarea} placeholder={`My vision for ${cat.label.toLowerCase()}…`} value={visionDraft} onChange={(e) => setVisionDraft(e.target.value)} rows={3} autoFocus />
                          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                            <button onClick={() => saveVision(cat.id)} style={{ ...s.btnVibrant, fontSize: 12, padding: "6px 14px", background: `linear-gradient(135deg, ${cat.color}, ${cat.color}bb)` }}>Save</button>
                            <button onClick={() => { setEditingVision(null); setVisionDraft(""); }} style={{ ...s.btnGhost, fontSize: 12, padding: "6px 10px" }}>✕</button>
                          </div>
                        </>
                      ) : (
                        <div onClick={() => { setEditingVision(cat.id); setVisionDraft(visions[cat.id] || ""); }} style={s.visionText}>
                          {visions[cat.id] || <span style={{ color: "#333", fontStyle: "italic", fontSize: 12 }}>Tap to write…</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "insights" && (
            <div className="fade-up">
              <div style={s.sectionTitle}>Weekly Progress</div>
              <div style={{ display: "flex", gap: 10, marginTop: 16, marginBottom: 24 }}>
                {[{ n: Object.keys(journals).filter((k) => last7.includes(k)).length, label: "Journal entries", color: "#54A0FF" }, { n: goals.filter((g) => g.done).length, label: "Goals done", color: "#1DD1A1" }, { n: notes.length, label: "Notes taken", color: "#FF9F43" }].map(({ n, label, color }, i) => (
                  <div key={i} style={{ ...s.statCard, border: `1.5px solid ${color}33` }}>
                    <div style={{ ...s.statNum, background: `linear-gradient(135deg, ${color}, ${color}99)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{n}</div>
                    <div style={s.statLabel}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={s.sectionTitle}>Habit Performance</div>
              <div style={{ marginTop: 14, marginBottom: 24 }}>
                {habits.map((h) => { const done = last7.filter((dk) => completions[`${dk}:${h.id}`]).length; const pct = Math.round((done / 7) * 100); return (
                  <div key={h.id} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: "#ccc" }}>{h.icon} {h.name}</span>
                      <span style={{ fontSize: 12, color: "#555" }}>{done}/7</span>
                    </div>
                    <div style={s.barTrack}><div style={{ ...s.barFill, width: `${pct}%`, background: `linear-gradient(90deg, ${h.color}, ${h.color}99)`, boxShadow: `0 0 8px ${h.color}66` }} /></div>
                  </div>
                ); })}
              </div>
              {!weeklyGenerated ? (
                <button onClick={generateWeeklyReport} disabled={weeklyLoading} style={{ ...s.btnVibrant, width: "100%", background: weeklyLoading ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#1DD1A1,#00D2D3)", opacity: weeklyLoading ? 0.8 : 1, padding: "14px" }}>
                  {weeklyLoading ? "✨ Generating your report…" : "✨ Generate AI Weekly Report"}
                </button>
              ) : (
                <div style={s.reportCard}>
                  <div style={{ fontSize: 11, color: "#1DD1A1", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>✦ Your Weekly Reflection</div>
                  <div style={s.reportText}>{weeklyReport}</div>
                  <button onClick={() => { setWeeklyGenerated(false); setWeeklyReport(""); }} style={{ ...s.btnGhost, fontSize: 12, marginTop: 14 }}>Regenerate</button>
                </div>
              )}
            </div>
          )}
        </div>

        {coachOpen && (
          <div style={s.overlay} onClick={() => setCoachOpen(false)}>
            <div style={s.coachSheet} onClick={(e) => e.stopPropagation()}>
              <div style={s.sheetHandle} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontFamily: "Sora", fontSize: 17, fontWeight: 700, color: "#fff" }}>🤖 AI Growth Coach</div>
                <button onClick={() => setCoachOpen(false)} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer" }}>✕</button>
              </div>
              <div style={{ fontSize: 12, color: "#444", marginBottom: 16, fontStyle: "italic" }}>I've read your journal. Ask me anything, Prateek.</div>
              <div style={s.chatArea}>
                {coachMessages.length === 0 && <div style={s.coachWelcome}>Hi Prateek! I'm your personal growth coach. I can reflect on your journal entries, help you spot patterns, or just be a sounding board. What's on your mind?</div>}
                {coachMessages.map((m, i) => (<div key={i} style={{ ...s.bubble, ...(m.role === "user" ? s.bubbleUser : s.bubbleBot) }}>{m.content}</div>))}
                {coachLoading && <div style={{ ...s.bubble, ...s.bubbleBot, color: "#444", fontStyle: "italic", animation: "pulse 1.5s infinite" }}>thinking…</div>}
                <div ref={chatEndRef} />
              </div>
              <div style={s.chatInputRow}>
                <input style={s.chatInput} placeholder="Type a message…" value={coachInput} onChange={(e) => setCoachInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendCoachMessage()} />
                <button onClick={sendCoachMessage} disabled={coachLoading} style={{ ...s.sendBtn, background: "linear-gradient(135deg,#54A0FF,#5F27CD)" }}>→</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const s = {
  root: { minHeight: "100vh", background: "#0F0F1A", fontFamily: "DM Sans, sans-serif", color: "#eee", paddingBottom: 100 },
  hero: { padding: "48px 24px 32px", position: "relative", overflow: "hidden" },
  heroNoise: { position: "absolute", inset: 0, pointerEvents: "none" },
  heroContent: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1 },
  heroLeft: { flex: 1, paddingRight: 16 },
  greetingText: { fontFamily: "Sora", fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" },
  dateText: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 },
  quotePill: { marginTop: 14, background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "8px 12px", fontSize: 12, color: "rgba(255,255,255,0.8)", fontStyle: "italic", lineHeight: 1.5, backdropFilter: "blur(8px)" },
  navBar: { position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(15,15,26,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", padding: "8px 4px 12px", zIndex: 50, gap: 2 },
  navBtn: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 4px 4px", border: "none", borderRadius: 12, background: "transparent", cursor: "pointer" },
  navBtnActive: { boxShadow: "0 4px 16px rgba(0,0,0,0.4)" },
  navLabel: { fontSize: 9.5, fontFamily: "DM Sans", fontWeight: 500, letterSpacing: 0.2 },
  content: { padding: "24px 20px 0", maxWidth: 480, margin: "0 auto", minHeight: "calc(100vh - 280px)" },
  weekStrip: { display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: "14px 12px", marginBottom: 24, border: "1px solid rgba(255,255,255,0.05)" },
  weekCol: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  weekDay: { fontSize: 10, color: "#444", fontFamily: "DM Sans", fontWeight: 600, letterSpacing: 0.5 },
  weekDot: { width: 28, height: 28, borderRadius: "50%", transition: "all 0.3s" },
  sectionTitle: { fontFamily: "Sora", fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" },
  habitCard: { display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 18, cursor: "pointer" },
  habitIconWrap: { width: 44, height: 44, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" },
  habitName: { fontSize: 15, fontWeight: 600, fontFamily: "Sora", transition: "all 0.2s" },
  streakBadge: { fontSize: 11, color: "#FF9F43", marginTop: 3, fontWeight: 500 },
  checkCircle: { width: 26, height: 26, borderRadius: "50%", border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" },
  addHabitBtn: { marginTop: 16, width: "100%", padding: "13px", background: "rgba(255,255,255,0.03)", border: "1.5px dashed rgba(255,255,255,0.12)", borderRadius: 16, color: "#444", fontSize: 14, cursor: "pointer", fontFamily: "DM Sans", transition: "all 0.2s" },
  row: { display: "flex", gap: 10, marginBottom: 14, alignItems: "center" },
  darkInput: { flex: 1, padding: "12px 16px", borderRadius: 14, border: "1.5px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 14, fontFamily: "DM Sans", outline: "none", transition: "border-color 0.2s" },
  darkTextarea: { width: "100%", borderRadius: 16, border: "1.5px solid rgba(255,255,255,0.08)", padding: "16px", fontSize: 14, fontFamily: "DM Sans", resize: "vertical", background: "rgba(255,255,255,0.04)", color: "#eee", outline: "none", lineHeight: 1.7, boxSizing: "border-box", marginBottom: 12 },
  btnVibrant: { padding: "12px 20px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#FF6B6B,#FF9F43)", color: "#fff", fontSize: 14, cursor: "pointer", fontFamily: "Sora", fontWeight: 700, transition: "opacity 0.2s, transform 0.15s", boxShadow: "0 4px 16px rgba(255,107,107,0.3)" },
  btnOutline: { padding: "12px 20px", borderRadius: 14, border: "1.5px solid rgba(255,255,255,0.12)", background: "transparent", color: "#ccc", fontSize: 14, cursor: "pointer", fontFamily: "DM Sans" },
  btnGhost: { padding: "10px 14px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.1)", background: "transparent", color: "#555", fontSize: 13, cursor: "pointer", fontFamily: "DM Sans" },
  promptCard: { background: "rgba(84,160,255,0.08)", borderRadius: 16, padding: "14px 16px", marginBottom: 14, border: "1px solid rgba(84,160,255,0.2)" },
  promptLabel: { fontSize: 10, color: "#54A0FF", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Sans", fontWeight: 600 },
  promptText: { fontSize: 14, color: "#aaa", lineHeight: 1.6, fontStyle: "italic" },
  pastCard: { background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: "12px 16px", marginBottom: 8, border: "1px solid rgba(255,255,255,0.05)" },
  pastDate: { fontSize: 11, color: "#444", fontFamily: "DM Sans", marginBottom: 4 },
  pastSnippet: { fontSize: 13, color: "#666", lineHeight: 1.5, fontStyle: "italic" },
  goalCard: { display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: "14px 16px", cursor: "pointer", border: "1px solid rgba(255,255,255,0.06)" },
  goalCheck: { width: 24, height: 24, borderRadius: "50%", border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" },
  goalText: { fontSize: 14.5, lineHeight: 1.4, fontFamily: "DM Sans", transition: "all 0.2s" },
  completedBadge: { textAlign: "center", fontSize: 14, fontWeight: 700, marginTop: 16, fontFamily: "Sora" },
  emptyState: { textAlign: "center", padding: "50px 0" },
  noteCard: { background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: "16px", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10, animation: "fadeUp 0.35s ease forwards", opacity: 0 },
  noteTitle: { fontSize: 15, fontWeight: 700, color: "#eee", marginBottom: 5, fontFamily: "Sora" },
  noteSnippet: { fontSize: 13, color: "#555", lineHeight: 1.5, marginBottom: 6 },
  noteMeta: { fontSize: 11, color: "#333", fontFamily: "DM Sans" },
  deleteBtn: { background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "#2a2a2a", padding: "4px", flexShrink: 0 },
  backBtn: { background: "none", border: "none", fontSize: 14, color: "#54A0FF", cursor: "pointer", fontFamily: "Sora", fontWeight: 600, padding: 0, flexShrink: 0 },
  aiToolBtn: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "14px 6px", borderRadius: 16, cursor: "pointer", fontFamily: "DM Sans" },
  aiResultCard: { background: "rgba(255,159,67,0.08)", borderRadius: 16, padding: "16px", border: "1px solid rgba(255,159,67,0.2)" },
  aiResultLabel: { fontSize: 11, color: "#FF9F43", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10, fontFamily: "DM Sans", fontWeight: 600 },
  aiResultText: { fontSize: 14, color: "#aaa", lineHeight: 1.8, whiteSpace: "pre-wrap" },
  tagRow: { display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" },
  tagChip: { padding: "6px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer", fontFamily: "DM Sans", fontWeight: 600, transition: "all 0.2s" },
  refreshBtn: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 14px", fontSize: 12, cursor: "pointer", color: "#666", fontFamily: "DM Sans", flexShrink: 0, transition: "all 0.2s" },
  articleCard: { background: "rgba(255,255,255,0.04)", borderRadius: 18, padding: "18px", marginBottom: 10, border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", position: "relative", animation: "fadeUp 0.35s ease forwards", opacity: 0 },
  articleMeta: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
  tagPill: { fontSize: 10, padding: "3px 10px", borderRadius: 10, fontFamily: "DM Sans", fontWeight: 700, letterSpacing: 0.5 },
  articleSource: { fontSize: 11, color: "#444", fontFamily: "DM Sans" },
  articleReadTime: { fontSize: 11, color: "#333", fontFamily: "DM Sans", marginLeft: "auto" },
  articleTitle: { fontSize: 15, fontWeight: 700, color: "#ddd", lineHeight: 1.4, fontFamily: "Sora", paddingRight: 20 },
  articleBody: { marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" },
  articleSummary: { fontSize: 13.5, color: "#666", lineHeight: 1.7, fontStyle: "italic", marginBottom: 12 },
  articleLink: { fontSize: 13, color: "#54A0FF", textDecoration: "none", fontWeight: 700 },
  chevron: { position: "absolute", top: 18, right: 18, fontSize: 10, transition: "color 0.2s" },
  skeletonCard: { background: "rgba(255,255,255,0.04)", borderRadius: 18, padding: "18px", marginBottom: 10 },
  skeletonLine: { background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%", borderRadius: 6, animation: "shimmer 1.8s infinite" },
  visionGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  visionCard: { borderRadius: 18, padding: "16px", transition: "all 0.25s" },
  visionTop: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12 },
  visionIcon: { width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
  visionLabel: { fontSize: 12, fontWeight: 700, fontFamily: "Sora" },
  visionText: { fontSize: 13, color: "#888", lineHeight: 1.5, cursor: "pointer", minHeight: 44 },
  visionTextarea: { width: "100%", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", padding: "8px 10px", fontSize: 12, fontFamily: "DM Sans", resize: "none", background: "rgba(0,0,0,0.3)", color: "#eee", outline: "none", lineHeight: 1.6, boxSizing: "border-box" },
  statCard: { flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: "16px 10px", textAlign: "center" },
  statNum: { fontSize: 28, fontWeight: 800, fontFamily: "Sora" },
  statLabel: { fontSize: 10, color: "#444", marginTop: 4, fontFamily: "DM Sans", letterSpacing: 0.3 },
  barTrack: { height: 6, borderRadius: 6, background: "rgba(255,255,255,0.05)", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 6, transition: "width 0.7s cubic-bezier(0.4,0,0.2,1)" },
  reportCard: { background: "rgba(29,209,161,0.07)", borderRadius: 18, padding: "20px", border: "1px solid rgba(29,209,161,0.2)" },
  reportText: { fontSize: 14.5, color: "#888", lineHeight: 1.85, fontStyle: "italic" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "flex-end", backdropFilter: "blur(4px)" },
  coachSheet: { width: "100%", maxWidth: 500, margin: "0 auto", background: "#141421", borderRadius: "24px 24px 0 0", padding: "14px 20px 32px", maxHeight: "85vh", display: "flex", flexDirection: "column", border: "1px solid rgba(255,255,255,0.07)", borderBottom: "none" },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, background: "#2a2a3a", margin: "0 auto 18px" },
  chatArea: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingBottom: 8 },
  coachWelcome: { background: "rgba(84,160,255,0.1)", borderRadius: 16, padding: "14px 16px", fontSize: 14, color: "#aaa", lineHeight: 1.65, border: "1px solid rgba(84,160,255,0.15)" },
  bubble: { borderRadius: 16, padding: "12px 16px", fontSize: 14, lineHeight: 1.65, maxWidth: "88%" },
  bubbleUser: { background: "linear-gradient(135deg,#54A0FF,#5F27CD)", color: "#fff", alignSelf: "flex-end", borderRadius: "16px 16px 4px 16px", boxShadow: "0 4px 16px rgba(84,160,255,0.3)" },
  bubbleBot: { background: "rgba(255,255,255,0.05)", color: "#ccc", alignSelf: "flex-start", borderRadius: "16px 16px 16px 4px", border: "1px solid rgba(255,255,255,0.07)" },
  chatInputRow: { display: "flex", gap: 10, marginTop: 14 },
  chatInput: { flex: 1, padding: "13px 16px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 14, fontFamily: "DM Sans", outline: "none" },
  sendBtn: { width: 48, height: 48, borderRadius: 14, border: "none", color: "#fff", fontSize: 20, cursor: "pointer", flexShrink: 0, boxShadow: "0 4px 16px rgba(84,160,255,0.35)" },
};
