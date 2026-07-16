import React, { useState, useCallback, useRef, useEffect } from "react";
import axios from "axios";
import { useToast, ToastContainer } from "./Toast";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

// ─── Scribe Logo SVG ────────────────────────────────────────────────────────
function ScribeLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#2563EB" />
      {/* "A" shape — stands for writing/text */}
      <path d="M10 22 L16 9 L22 22" stroke="white" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5 18 L19.5 18" stroke="white" strokeWidth="1.8"
        strokeLinecap="round" />
    </svg>
  );
}

// ─── Interactive Grid Background ────────────────────────────────────────────
const CELL_SIZE = 40;

function GridBackground() {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [fadingCells, setFadingCells] = useState({});
  const fadeTimers = useRef({});

  const handleMouseEnter = useCallback((key) => {
    if (fadeTimers.current[key]) {
      clearTimeout(fadeTimers.current[key]);
      delete fadeTimers.current[key];
    }
    setHoveredCell(key);
    setFadingCells((prev) => ({ ...prev, [key]: 1 }));
  }, []);

  const handleMouseLeave = useCallback((key) => {
    setHoveredCell(null);
    const steps = [0.6, 0.3, 0];
    steps.forEach((opacity, i) => {
      fadeTimers.current[`${key}-${i}`] = setTimeout(() => {
        setFadingCells((prev) => ({ ...prev, [key]: opacity }));
        if (opacity === 0) {
          setFadingCells((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
        }
      }, (i + 1) * 180);
    });
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
      backgroundImage: `
        linear-gradient(to right, rgba(148,163,184,0.18) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(148,163,184,0.18) 1px, transparent 1px)
      `,
      backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
    }}>
      <div
        style={{ position: "absolute", inset: 0, pointerEvents: "auto" }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const col = Math.floor((e.clientX - rect.left) / CELL_SIZE);
          const row = Math.floor((e.clientY - rect.top) / CELL_SIZE);
          const key = `${col}-${row}`;
          if (key !== hoveredCell) {
            if (hoveredCell) handleMouseLeave(hoveredCell);
            handleMouseEnter(key);
          }
        }}
        onMouseLeave={() => { if (hoveredCell) handleMouseLeave(hoveredCell); }}
      >
        {Object.entries(fadingCells).map(([key, opacity]) => {
          const [col, row] = key.split("-").map(Number);
          return (
            <div key={key} style={{
              position: "absolute",
              left: col * CELL_SIZE, top: row * CELL_SIZE,
              width: CELL_SIZE, height: CELL_SIZE,
              background: `rgba(37,99,235,${opacity * 0.09})`,
              boxShadow: opacity > 0.5
                ? `inset 0 0 0 1px rgba(37,99,235,${opacity * 0.35})`
                : "none",
              borderRadius: 4,
              transition: "background 0.18s ease, box-shadow 0.18s ease",
              pointerEvents: "none",
            }} />
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function TextManager() {
  const [text, setText] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inserting, setInserting] = useState(false);
  const [isListLoaded, setIsListLoaded] = useState(false); // Track if user has loaded list

  const { toasts, removeToast, toast } = useToast();

  // ── Insert ──
  const handleInsert = async () => {
    if (!text.trim()) {
      toast.error("Empty text", "Please write something before inserting.");
      return;
    }
    setInserting(true);
    try {
      const res = await axios.post(`${API_BASE}/insert-text/`, { content: text });
      setText("");
      // Only append to the visible list if user has already loaded it
      if (isListLoaded) {
        setEntries((prev) => [res.data, ...prev]);
      }
      toast.success("Saved!", "Your note has been stored successfully.");
    } catch (err) {
      console.error("Insert failed:", err);
      toast.error("Insert failed", "Could not connect to the server.");
    } finally {
      setInserting(false);
    }
  };

  // ── List ──
  const handleList = async () => {
    setLoading(true);
    toast.info("Fetching notes…", "Loading your saved entries.");
    try {
      const res = await axios.get(`${API_BASE}/list-text/`);
      setEntries(res.data);
      setIsListLoaded(true); // Mark list as loaded
      if (res.data.length === 0) {
        toast.info("No entries yet", "Start by inserting your first note!");
      } else {
        toast.success(
          `${res.data.length} note${res.data.length > 1 ? "s" : ""} loaded`,
          "All your saved entries are ready."
        );
      }
    } catch (err) {
      console.error("Fetch failed:", err);
      toast.error("Fetch failed", "Could not load notes from the server.");
    } finally {
      setLoading(false);
    }
  };

  // ── Delete ──
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/delete-text/${id}/`);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
      toast.success("Deleted", "Your note has been deleted.");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Delete failed", "Could not delete this note.");
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Interactive Grid Background */}
      <GridBackground />

      {/* Radial vignette */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none",
        background: "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(255,255,255,0.82) 0%, transparent 100%)",
      }} />

      {/* ── Page content ── */}
      <div className="relative" style={{ zIndex: 10 }}>

        {/* ── Navbar / Header ── */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 40px",
          borderBottom: "1px solid rgba(148,163,184,0.15)",
          backdropFilter: "blur(12px)",
          background: "rgba(255,255,255,0.75)",
          position: "sticky", top: 0, zIndex: 20,
        }}>
          {/* Logo + Name */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ScribeLogo size={32} />
            <span style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "20px",
              fontWeight: 700,
              color: "#0F172A",
              letterSpacing: "-0.3px",
            }}>
              Scribe
            </span>
          </div>

          {/* Nav badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "rgba(37,99,235,0.07)",
            border: "1px solid rgba(37,99,235,0.15)",
            borderRadius: "99px",
            padding: "5px 14px",
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#22c55e",
              boxShadow: "0 0 0 2px rgba(34,197,94,0.25)",
              display: "inline-block",
            }} />
            <span style={{
              fontSize: "12px", fontWeight: 500, color: "#2563eb",
              fontFamily: "Inter, sans-serif",
            }}>
              Live
            </span>
          </div>
        </header>

        {/* ── Hero Section ── */}
        <section className="max-w-5xl mx-auto pt-20 pb-14 px-6 text-center">
          <p className="text-xs uppercase tracking-widest text-slateBody font-semibold mb-4">
            Simple · Fast · Reliable
          </p>
          <h1 className="font-serif text-5xl md:text-6xl tracking-tight leading-tight text-charcoal mb-4">
            Store your thoughts,<br /> instantly.
          </h1>
          <p className="text-slateBody text-lg max-w-xl mx-auto">
            A minimal note-taking experience — write something, save it, and pull it back whenever you need.
          </p>
        </section>

        {/* ── Bento Grid ── */}
        <section className="max-w-4xl mx-auto px-6 pb-32 grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Card 1: Insert */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-slate-100
            shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8">
            <p className="text-xs uppercase tracking-widest text-slateBody font-semibold mb-3">
              Add Entry
            </p>
            <h2 className="font-serif text-2xl text-charcoal mb-6 tracking-tight">
              Write something new
            </h2>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your text here..."
              rows={4}
              className="w-full rounded-2xl border border-slate-200/70 bg-white/90 p-4
                text-charcoal placeholder-slate-400 focus:outline-none
                focus:ring-2 focus:ring-accent/40 transition-all duration-300"
            />

            <button
              onClick={handleInsert}
              disabled={inserting}
              className="mt-5 w-full bg-accent text-white font-medium py-3
                rounded-full hover:bg-blue-700 transition-all duration-300
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {inserting ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Spinner /> Saving…
                </span>
              ) : "Insert Text"}
            </button>
          </div>

          {/* Card 2: List */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-slate-100
            shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8 flex flex-col">
            <p className="text-xs uppercase tracking-widest text-slateBody font-semibold mb-3">
              Saved Entries
            </p>
            <h2 className="font-serif text-2xl text-charcoal mb-6 tracking-tight">
              View your notes
            </h2>

            <button
              onClick={handleList}
              disabled={loading}
              className="mb-5 bg-white border border-slate-200 text-charcoal font-medium
                py-3 rounded-full hover:bg-slate-50 transition-all duration-300
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Spinner color="#475569" /> Fetching…
                </span>
              ) : "List Text"}
            </button>

            <div className="h-[210px] overflow-y-auto space-y-3 pr-1">
              {!isListLoaded ? (
                <p className="text-slate-400 text-sm">
                  No entries loaded yet — click "List Text" to view notes.
                </p>
              ) : entries.length === 0 ? (
                <p className="text-slate-400 text-sm">
                  No entries found. Start by writing some new notes!
                </p>
              ) : (
                entries.map((entry) => (
                  <div key={entry.id}
                    className="bg-white/90 rounded-2xl border border-slate-100 p-4 text-sm flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-charcoal break-words">{entry.content}</p>
                      <p className="text-slate-400 text-xs mt-1">
                        {new Date(entry.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 flex-shrink-0"
                      title="Delete note"
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          textAlign: "center", paddingBottom: "32px",
          fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#94a3b8",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <ScribeLogo size={14} />
          <span>Scribe © {new Date().getFullYear()} — Built with care.</span>
        </footer>
      </div>
    </div>
  );
}

// ─── Inline Spinner ──────────────────────────────────────────────────────────
function Spinner({ color = "white" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
      style={{ animation: "spin 0.8s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="2"
        strokeOpacity="0.25" />
      <path d="M8 2 A6 6 0 0 1 14 8" stroke={color} strokeWidth="2"
        strokeLinecap="round" />
    </svg>
  );
}