import React, { useState, useEffect, useCallback } from "react";

/* ─── Individual Toast Card ─────────────────────────────── */
function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => dismiss(), toast.duration ?? 3500);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onRemove(toast.id), 380);
  }, [toast.id, onRemove]);

  // Theme-consistent accent colors (subtle, not loud)
  const config = {
    success: {
      accent: "#22c55e",
      icon: (
        <svg viewBox="0 0 18 18" fill="none" width="16" height="16">
          <circle cx="9" cy="9" r="8" stroke="#22c55e" strokeWidth="1.5" />
          <path d="M5.5 9.5l2.5 2L12.5 7" stroke="#22c55e" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    error: {
      accent: "#ef4444",
      icon: (
        <svg viewBox="0 0 18 18" fill="none" width="16" height="16">
          <circle cx="9" cy="9" r="8" stroke="#ef4444" strokeWidth="1.5" />
          <path d="M6 6l6 6M12 6l-6 6" stroke="#ef4444" strokeWidth="1.6"
            strokeLinecap="round" />
        </svg>
      ),
    },
    info: {
      accent: "#2563eb",
      icon: (
        <svg viewBox="0 0 18 18" fill="none" width="16" height="16">
          <circle cx="9" cy="9" r="8" stroke="#2563eb" strokeWidth="1.5" />
          <path d="M9 8v5" stroke="#2563eb" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="9" cy="5.5" r="0.8" fill="#2563eb" />
        </svg>
      ),
    },
  };

  const c = config[toast.type] || config.info;

  // Slide in from right
  const translateX = visible && !leaving ? "translateX(0)" : "translateX(110%)";
  const opacity    = visible && !leaving ? 1 : 0;

  return (
    <div
      onClick={dismiss}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        // App-consistent theme: white glass, subtle slate border
        background: "rgba(255,255,255,0.92)",
        border: "1px solid rgba(148,163,184,0.22)",
        borderRadius: "16px",
        padding: "13px 16px 15px",
        minWidth: "280px",
        maxWidth: "340px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
        backdropFilter: "blur(14px)",
        cursor: "pointer",
        overflow: "hidden",
        position: "relative",
        transform: translateX,
        opacity,
        transition: "transform 0.38s cubic-bezier(.22,1,.36,1), opacity 0.32s ease",
      }}
    >
      {/* Left accent bar — only color element, theme-consistent */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: "3px",
        background: c.accent,
        borderRadius: "16px 0 0 16px",
        opacity: 0.8,
      }} />

      {/* Icon */}
      <div style={{ flexShrink: 0, marginTop: "1px", marginLeft: "5px" }}>
        {c.icon}
      </div>

      {/* Text — uses app's charcoal/slate palette */}
      <div style={{ flex: 1 }}>
        <p style={{
          margin: 0,
          fontSize: "13.5px",
          fontWeight: 600,
          color: "#0F172A",          // charcoal — same as app
          fontFamily: "Inter, sans-serif",
          letterSpacing: "-0.1px",
        }}>
          {toast.title}
        </p>
        {toast.message && (
          <p style={{
            margin: "2px 0 0",
            fontSize: "12px",
            color: "#64748b",        // slate — same as app's slateBody
            fontFamily: "Inter, sans-serif",
            lineHeight: 1.45,
          }}>
            {toast.message}
          </p>
        )}
      </div>

      {/* Progress bar — matches grid line subtle style */}
      <ProgressBar color={c.accent} duration={toast.duration ?? 3500} />
    </div>
  );
}

/* ─── Progress bar ───────────────────────────────────────── */
function ProgressBar({ color, duration }) {
  const [width, setWidth] = useState(100);
  useEffect(() => {
    const t = setTimeout(() => setWidth(0), 30);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0, height: "2px",
      background: "rgba(148,163,184,0.15)",
    }}>
      <div style={{
        height: "100%",
        background: color,
        width: `${width}%`,
        opacity: 0.35,
        transition: `width ${duration}ms linear`,
      }} />
    </div>
  );
}

/* ─── Toast Container — BOTTOM RIGHT ────────────────────── */
export function ToastContainer({ toasts, removeToast }) {
  return (
    <div style={{
      position: "fixed",
      bottom: "24px",    // ← bottom
      right: "24px",     // ← right
      zIndex: 9999,
      display: "flex",
      flexDirection: "column-reverse", // newest on top
      gap: "10px",
      pointerEvents: "none",
    }}>
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: "auto" }}>
          <ToastItem toast={t} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );
}

/* ─── useToast Hook ──────────────────────────────────────── */
let _id = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = "info", title, message, duration }) => {
    const id = ++_id;
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (title, message, duration) => addToast({ type: "success", title, message, duration }),
    error:   (title, message, duration) => addToast({ type: "error",   title, message, duration }),
    info:    (title, message, duration) => addToast({ type: "info",    title, message, duration }),
  };

  return { toasts, removeToast, toast };
}
