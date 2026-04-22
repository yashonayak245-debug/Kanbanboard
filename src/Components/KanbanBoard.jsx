import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  COLORS,
  PRIORITY_CONFIG,
  TYPE_CONFIG,
  MEMBERS,
  INITIAL_COLUMNS,
  INITIAL_CARDS,
  incrementCardCounter,
} from "./data";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const Avatar = ({ id, size = 26 }) => {
  const member = MEMBERS.find((m) => m.id === id) || { id, color: "#888" };
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: member.color, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
      fontFamily: "'DM Sans', sans-serif",
    }}>{id}</div>
  );
};

const Badge = ({ children, color, bg, small }) => (
  <span style={{
    background: bg, color, borderRadius: 3,
    padding: small ? "1px 6px" : "2px 8px",
    fontSize: small ? 10 : 11, fontWeight: 700,
    whiteSpace: "nowrap", letterSpacing: 0.2,
  }}>{children}</span>
);

// ─── Card Component ───────────────────────────────────────────────────────────
// FIX: Added onDelete prop and delete button with hover reveal
const KanbanCard = ({ card, isDragging, overlay, onDelete }) => {
  const [hovered, setHovered] = useState(false);
  const type = TYPE_CONFIG[card.type] || TYPE_CONFIG.task;
  const prio = PRIORITY_CONFIG[card.priority] || PRIORITY_CONFIG.medium;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: COLORS.surface,
        borderRadius: 6,
        padding: "10px 12px",
        border: `1px solid ${isDragging ? COLORS.blueMid : COLORS.border}`,
        boxShadow: overlay
          ? "0 12px 32px rgba(9,30,66,0.25)"
          : isDragging
            ? "none"
            : "0 1px 2px rgba(9,30,66,0.08)",
        opacity: isDragging && !overlay ? 0.4 : 1,
        cursor: overlay ? "grabbing" : "grab",
        transition: "box-shadow 0.15s, border-color 0.15s",
        userSelect: "none",
        position: "relative",
      }}>

      {/* Delete button — shown on hover, hidden during drag/overlay */}
      {!overlay && !isDragging && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(card.id);
          }}
          title="Delete card"
          style={{
            position: "absolute", top: 7, right: 7,
            width: 20, height: 20,
            border: "none",
            borderRadius: 4,
            background: hovered ? COLORS.redLight : "transparent",
            color: hovered ? COLORS.redMid : "transparent",
            cursor: "pointer",
            fontSize: 12, lineHeight: 1,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
            padding: 0,
            zIndex: 2,
          }}
        >✕</button>
      )}

      {/* Tags row */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8, paddingRight: 22 }}>
        <Badge color={type.color} bg={type.bg} small>
          {type.icon} {type.label}
        </Badge>
        {card.tags.map((t) => (
          <Badge key={t} color={COLORS.textMuted} bg={COLORS.colBg} small>{t}</Badge>
        ))}
      </div>

      {/* Title */}
      <p style={{
        fontSize: 13, color: COLORS.text, lineHeight: 1.45,
        marginBottom: 10, wordBreak: "break-word",
        fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
      }}>{card.title}</p>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: COLORS.textHint, fontFamily: "monospace" }}>{card.id}</span>
          <span style={{
            background: prio.bg, color: prio.color,
            borderRadius: 3, padding: "1px 6px",
            fontSize: 10, fontWeight: 700,
          }}>{prio.icon} {prio.label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            fontSize: 11, color: COLORS.textMuted,
            background: COLORS.colBg, borderRadius: 3,
            padding: "1px 6px", fontWeight: 600,
          }}>{card.points} pts</span>
          <Avatar id={card.assignee} size={22} />
        </div>
      </div>
    </div>
  );
};

// ─── Sortable Card Wrapper ────────────────────────────────────────────────────
// FIX: Pass onDelete down through SortableCard
const SortableCard = ({ card, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, marginBottom: 8 }}
      {...attributes}
      {...listeners}
    >
      <KanbanCard card={card} isDragging={isDragging} onDelete={onDelete} />
    </div>
  );
};

// ─── Column ───────────────────────────────────────────────────────────────────
// FIX: Moved useDroppable ref to the cards list div (the actual drop zone)
const Column = ({ col, cards, onAddCard, onDeleteCard }) => {
  // FIX: ref must be on the scrollable cards container, not the outer wrapper
  const { setNodeRef, isOver } = useDroppable({ id: col.id });

  const countColor = {
    todo: COLORS.textMuted, inprogress: COLORS.blue,
    review: COLORS.purple, done: COLORS.greenMid,
  }[col.id] || COLORS.textMuted;

  return (
    <div style={{
      width: 268, minWidth: 268,
      background: COLORS.colBg,
      borderRadius: 8, display: "flex",
      flexDirection: "column", maxHeight: "calc(100vh - 158px)",
      border: isOver ? `2px solid ${COLORS.blueMid}` : "2px solid transparent",
      transition: "border-color 0.15s",
    }}>
      {/* Column header */}
      <div style={{ padding: "10px 12px 8px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: countColor, flexShrink: 0 }} />
        <span style={{
          fontSize: 11, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: 0.8, color: COLORS.textMuted,
          fontFamily: "'DM Sans', sans-serif", flex: 1,
        }}>{col.title}</span>
        <span style={{
          background: COLORS.border, color: COLORS.textMuted,
          borderRadius: 12, padding: "1px 8px", fontSize: 11, fontWeight: 700,
        }}>{cards.length}</span>
      </div>

      {/* Cards list — this is the droppable zone */}
      <div ref={setNodeRef} style={{
        padding: "0 8px", overflowY: "auto", flex: 1,
        minHeight: 60,
        background: isOver ? "rgba(38,132,255,0.04)" : "transparent",
        borderRadius: 6, transition: "background 0.15s",
      }}>
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <SortableCard key={card.id} card={card} onDelete={onDeleteCard} />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <div style={{
            border: `2px dashed ${COLORS.border}`, borderRadius: 6,
            padding: "20px 0", textAlign: "center",
            color: COLORS.textHint, fontSize: 12,
            margin: "4px 0",
          }}>Drop cards here</div>
        )}
      </div>

      {/* Add card button */}
      <button onClick={() => onAddCard(col.id)} style={{
        margin: "6px 8px 10px",
        padding: "7px 10px",
        border: `1px dashed ${COLORS.border}`,
        borderRadius: 5, background: "none",
        cursor: "pointer", fontSize: 12,
        color: COLORS.textMuted,
        display: "flex", alignItems: "center", gap: 6,
        fontFamily: "'DM Sans', sans-serif",
        transition: "all 0.12s",
      }}
        onMouseEnter={e => { e.currentTarget.style.background = COLORS.blueLight; e.currentTarget.style.borderColor = COLORS.blueMid; e.currentTarget.style.color = COLORS.blue; }}
        onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.textMuted; }}>
        <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Create issue
      </button>
    </div>
  );
};

// ─── Create Card Modal ────────────────────────────────────────────────────────
const CreateCardModal = ({ open, defaultColumn, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    title: "", type: "task", priority: "medium",
    assignee: "AJ", points: 3, tags: "", column: defaultColumn || "todo",
  });

  // FIX: Sync column when defaultColumn changes
  useState(() => {
    if (defaultColumn) setForm(f => ({ ...f, column: defaultColumn }));
  }, [defaultColumn]);

  if (!open) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    onSubmit({ ...form, tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [] });
    setForm({ title: "", type: "task", priority: "medium", assignee: "AJ", points: 3, tags: "", column: defaultColumn || "todo" });
  };

  const inputStyle = {
    width: "100%", padding: "8px 10px",
    border: `2px solid ${COLORS.border}`,
    borderRadius: 5, fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    color: COLORS.text, outline: "none",
    boxSizing: "border-box",
    background: COLORS.surface,
  };
  const labelStyle = {
    display: "block", fontSize: 11, fontWeight: 700,
    color: COLORS.text, marginBottom: 5,
    fontFamily: "'DM Sans', sans-serif",
    textTransform: "uppercase", letterSpacing: 0.5,
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(9,30,66,0.54)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: COLORS.surface, borderRadius: 10,
        width: 500, maxHeight: "88vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(9,30,66,0.4)",
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 24px 14px",
          borderBottom: `1px solid ${COLORS.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.blue }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, fontFamily: "'DM Sans', sans-serif" }}>
              Create Issue
            </span>
          </div>
          <button onClick={onClose} style={{
            border: "none", background: "none", cursor: "pointer",
            fontSize: 18, color: COLORS.textMuted, padding: "2px 6px", borderRadius: 4,
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px" }}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Summary *</label>
            <input style={inputStyle} placeholder="What needs to be done?" value={form.title}
              onChange={(e) => set("title", e.target.value)}
              onFocus={e => e.target.style.borderColor = COLORS.blue}
              onBlur={e => e.target.style.borderColor = COLORS.border} />
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Issue Type</label>
              <select style={inputStyle} value={form.type} onChange={(e) => set("type", e.target.value)}>
                {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.column} onChange={(e) => set("column", e.target.value)}>
                {INITIAL_COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Priority</label>
              <select style={inputStyle} value={form.priority} onChange={(e) => set("priority", e.target.value)}>
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Assignee</label>
              <select style={inputStyle} value={form.assignee} onChange={(e) => set("assignee", e.target.value)}>
                {MEMBERS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Story Points</label>
              <input type="number" style={inputStyle} min={1} max={21} value={form.points}
                onChange={(e) => set("points", Number(e.target.value))} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Tags (comma separated)</label>
              <input style={inputStyle} placeholder="UI, Auth, Backend" value={form.tags}
                onChange={(e) => set("tags", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 24px",
          borderTop: `1px solid ${COLORS.border}`,
          display: "flex", justifyContent: "flex-end", gap: 8,
        }}>
          <button onClick={onClose} style={{
            padding: "8px 18px", border: `1px solid ${COLORS.border}`,
            borderRadius: 5, background: "none", fontSize: 13,
            cursor: "pointer", color: COLORS.text,
            fontFamily: "'DM Sans', sans-serif",
          }}>Cancel</button>
          <button onClick={handleSubmit} style={{
            padding: "8px 20px", background: COLORS.blue,
            color: "#fff", border: "none", borderRadius: 5,
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}>Create Issue</button>
        </div>
      </div>
    </div>
  );
};

// ─── Login Screen ─────────────────────────────────────────────────────────────
// FIX: Replaced MUI + react-router-dom with plain React (not available in artifact)
const Login = ({ onLogin }) => {
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email))
      errs.email = "Please enter a valid email address.";
    if (form.password.length < 6)
      errs.password = "Password must be at least 6 characters.";
    return errs;
  };

  const handleLogin = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSuccess(true);
    setTimeout(() => onLogin(), 1000);
  };

  const inputBase = {
    width: "100%", padding: "9px 12px",
    border: "1px solid #DFE1E6", borderRadius: 6,
    fontSize: 14, fontFamily: "'DM Sans', sans-serif",
    color: COLORS.text, outline: "none", boxSizing: "border-box",
    background: "#fff",
  };

  return (
    <div style={{
      minHeight: "100vh", background: COLORS.bg,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        background: "#fff", borderRadius: 12, border: "1px solid #DFE1E6",
        padding: 32, width: "100%", maxWidth: 400,
        boxShadow: "0 4px 24px rgba(9,30,66,0.08)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 24 }}>
          <div style={{
            background: COLORS.blue, borderRadius: 8, width: 36, height: 36,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 800, fontSize: 18,
          }}>⊞</div>
          <span style={{ fontWeight: 700, fontSize: 20, color: COLORS.text }}>KanbanBoard</span>
        </div>

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: COLORS.text, marginBottom: 4 }}>Log in to your account</div>
          <div style={{ fontSize: 13, color: COLORS.textMuted }}>Welcome back! Enter your details below.</div>
        </div>

        {success && (
          <div style={{
            background: COLORS.greenLight, color: COLORS.green,
            borderRadius: 6, padding: "10px 14px", marginBottom: 16,
            fontSize: 13, fontWeight: 600,
          }}>✓ Logged in successfully! Redirecting...</div>
        )}

        {/* Email */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 5 }}>
            Email address
          </label>
          <input
            style={{ ...inputBase, borderColor: errors.email ? COLORS.redMid : "#DFE1E6" }}
            type="email" placeholder="you@example.com"
            value={form.email}
            onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: "" }); }}
          />
          {errors.email && <div style={{ fontSize: 11, color: COLORS.redMid, marginTop: 4 }}>{errors.email}</div>}
        </div>

        {/* Password */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 5 }}>
            Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              style={{ ...inputBase, paddingRight: 40, borderColor: errors.password ? COLORS.redMid : "#DFE1E6" }}
              type={showPw ? "text" : "password"} placeholder="Enter your password"
              value={form.password}
              onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: "" }); }}
            />
            <button onClick={() => setShowPw(s => !s)} style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              border: "none", background: "none", cursor: "pointer",
              color: COLORS.textMuted, fontSize: 14, padding: 2,
            }}>{showPw ? "🙈" : "👁"}</button>
          </div>
          {errors.password && <div style={{ fontSize: 11, color: COLORS.redMid, marginTop: 4 }}>{errors.password}</div>}
        </div>

        {/* Remember + Forgot */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={form.remember}
              onChange={(e) => setForm({ ...form, remember: e.target.checked })} />
            Remember me for 30 days
          </label>
          <span style={{ fontSize: 12, color: COLORS.blue, cursor: "pointer" }}>Forgot password?</span>
        </div>

        <button onClick={handleLogin} style={{
          width: "100%", padding: "10px", background: COLORS.blue,
          color: "#fff", border: "none", borderRadius: 6,
          fontSize: 14, fontWeight: 700, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
        }}>Log in</button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
          <div style={{ flex: 1, height: 1, background: COLORS.border }} />
          <span style={{ fontSize: 12, color: COLORS.textMuted }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: COLORS.border }} />
        </div>

        <button style={{
          width: "100%", padding: "9px", background: "#fff",
          border: `1px solid ${COLORS.border}`, borderRadius: 6,
          fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <img src="https://www.google.com/favicon.ico" width={16} height={16} alt="G" />
          Continue with Google
        </button>

        <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: COLORS.textMuted }}>
          Don't have an account?{" "}
          <span style={{ color: COLORS.blue, cursor: "pointer", fontWeight: 600 }}>Sign up for free</span>
        </div>
      </div>
    </div>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = ({ collapsed }) => {
  const [active, setActive] = useState("board");
  const projects = [
    { id: "mkt", label: "Marketing Site", short: "MKT", color: COLORS.purple, type: "Kanban" },
    { id: "api", label: "Backend API", short: "API", color: COLORS.greenMid, type: "Scrum" },
    { id: "ds", label: "Design System", short: "DS", color: COLORS.redMid, type: "Kanban" },
  ];

  const navItems = [
    { id: "board", icon: "⊞", label: "Board" },
    { id: "backlog", icon: "☰", label: "Backlog" },
    { id: "roadmap", icon: "◫", label: "Roadmap" },
    { id: "reports", icon: "◻", label: "Reports" },
  ];

  if (collapsed) return null;

  return (
    <aside style={{
      width: 220, background: COLORS.surface,
      borderRight: `1px solid ${COLORS.border}`,
      display: "flex", flexDirection: "column",
      overflowY: "auto", flexShrink: 0,
    }}>
      <div style={{ padding: "14px 12px 8px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
        <div style={{
          width: 30, height: 30, borderRadius: 5,
          background: COLORS.blue, display: "flex",
          alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 800, fontSize: 12,
          fontFamily: "'DM Sans', sans-serif",
        }}>TF</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, fontFamily: "'DM Sans', sans-serif" }}>TaskFlow Web</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: "'DM Sans', sans-serif" }}>Scrum board</div>
        </div>
      </div>

      <div style={{ height: 1, background: COLORS.border, margin: "4px 12px" }} />

      <div style={{ padding: "6px 0" }}>
        <div style={{ padding: "6px 16px 4px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: COLORS.textHint, fontFamily: "'DM Sans', sans-serif" }}>
          Planning
        </div>
        {navItems.map((item) => (
          <div key={item.id} onClick={() => setActive(item.id)} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "7px 14px", cursor: "pointer", borderRadius: 4,
            margin: "1px 6px",
            background: active === item.id ? COLORS.blueLight : "none",
            color: active === item.id ? COLORS.blue : COLORS.text,
            fontFamily: "'DM Sans', sans-serif", fontSize: 13,
            fontWeight: active === item.id ? 700 : 400,
            transition: "background 0.1s",
          }}>
            <span style={{ fontSize: 14 }}>{item.icon}</span> {item.label}
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: COLORS.border, margin: "4px 12px" }} />

      <div style={{ padding: "6px 0" }}>
        <div style={{ padding: "6px 16px 4px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: COLORS.textHint, fontFamily: "'DM Sans', sans-serif" }}>
          Other Projects
        </div>
        {projects.map((p) => (
          <div key={p.id} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "7px 14px", cursor: "pointer",
            margin: "1px 6px", borderRadius: 4,
            transition: "background 0.1s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = COLORS.bg}
            onMouseLeave={e => e.currentTarget.style.background = "none"}>
            <div style={{
              width: 26, height: 26, borderRadius: 4,
              background: p.color, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 800, flexShrink: 0,
              fontFamily: "'DM Sans', sans-serif",
            }}>{p.short}</div>
            <div>
              <div style={{ fontSize: 13, color: COLORS.text, fontFamily: "'DM Sans', sans-serif" }}>{p.label}</div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: "'DM Sans', sans-serif" }}>{p.type}</div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

// ─── User Avatar Dropdown ─────────────────────────────────────────────────────
const UserMenu = ({ onLogout, user }) => {
  const [open, setOpen] = useState(false);
  // Fallback if user not passed
  const displayUser = user || { id: "U", name: "User", email: "user@taskflow.io", color: "#0052CC" };
  const avatarColor = displayUser.color || "#0052CC";
  return (
    <div style={{ position: "relative" }}>
      <div onClick={() => setOpen(o => !o)} title={displayUser.name} style={{
        width: 34, height: 34, borderRadius: "50%",
        background: avatarColor,
        border: open ? "2px solid #fff" : "2px solid rgba(255,255,255,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, color: "#fff",
        cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
        transition: "border 0.15s", userSelect: "none",
      }}>{displayUser.initials || displayUser.id}</div>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 199 }} />
          <div style={{
            position: "absolute", top: 42, right: 0,
            background: COLORS.surface, borderRadius: 8, width: 220,
            boxShadow: "0 8px 32px rgba(9,30,66,0.22)",
            border: `1px solid ${COLORS.border}`,
            zIndex: 200, overflow: "hidden",
          }}>
            {/* User info header */}
            <div style={{
              padding: "14px 16px 12px",
              borderBottom: `1px solid ${COLORS.border}`,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: "50%",
                background: avatarColor, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, flexShrink: 0,
              }}>{displayUser.initials || displayUser.id}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, fontFamily: "'DM Sans', sans-serif" }}>{displayUser.name}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: "'DM Sans', sans-serif" }}>{displayUser.email}</div>
              </div>
            </div>

            {/* Menu items */}
            {[
              { icon: "👤", label: "My Profile" },
              { icon: "⚙️", label: "Account Settings" },
              { icon: "🔔", label: "Notifications" },
              { icon: "🎨", label: "Appearance" },
            ].map(item => (
              <div key={item.label} style={{
                padding: "9px 16px", fontSize: 13, color: COLORS.text,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                fontFamily: "'DM Sans', sans-serif", transition: "background 0.1s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.bg}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              ><span>{item.icon}</span>{item.label}</div>
            ))}

            <div style={{ height: 1, background: COLORS.border }} />
            <div onClick={() => { setOpen(false); onLogout(); }} style={{
              padding: "10px 16px", fontSize: 13, color: COLORS.redMid,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
              fontFamily: "'DM Sans', sans-serif", fontWeight: 600, transition: "background 0.1s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = COLORS.redLight}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            ><span>🚪</span>Log out</div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = ({ onCreateClick, sidebarOpen, setSidebarOpen, onLogout, user }) => (
  <nav style={{
    height: 48, background: COLORS.blue,
    display: "flex", alignItems: "center",
    padding: "0 16px", gap: 12, flexShrink: 0, zIndex: 100,
  }}>
    <button onClick={() => setSidebarOpen(s => !s)} style={{
      border: "none", background: "rgba(255,255,255,0.15)",
      borderRadius: 4, padding: "4px 8px", cursor: "pointer",
      color: "#fff", fontSize: 16,
    }}>☰</button>

    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 26, height: 26, borderRadius: 4,
        background: "rgba(255,255,255,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, color: "#fff", fontSize: 13,
      }}>T</div>
      <span style={{ color: "#fff", fontWeight: 800, fontSize: 15, fontFamily: "'DM Sans', sans-serif" }}>
        TaskFlow
      </span>
    </div>

    <div style={{ flex: 1 }} />

    <input placeholder="🔍 Search issues…" style={{
      background: "rgba(255,255,255,0.15)", border: "none",
      borderRadius: 4, padding: "6px 12px", color: "#fff",
      fontSize: 13, width: 200, outline: "none",
      fontFamily: "'DM Sans', sans-serif",
    }} />

    <button onClick={onCreateClick} style={{
      background: "#fff", border: "none",
      borderRadius: 4, padding: "6px 16px",
      color: COLORS.blue, fontSize: 13,
      fontWeight: 700, cursor: "pointer",
      fontFamily: "'DM Sans', sans-serif",
      display: "flex", alignItems: "center", gap: 5,
    }}>+ Create</button>

    <div style={{ display: "flex" }}>
      {MEMBERS.slice(0, 3).map((m) => (
        <div key={m.id} style={{
          width: 28, height: 28, borderRadius: "50%",
          background: m.color, border: "2px solid " + COLORS.blue,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 700, color: "#fff",
          marginLeft: -4, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
        }} title={m.name}>{m.id}</div>
      ))}
    </div>

    <UserMenu onLogout={onLogout} user={user} />
  </nav>
);

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function KanbanApp({ user, onLogout }) {
  // App.jsx controls login, KanbanApp always renders when shown
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cards, setCards] = useState(INITIAL_CARDS);
  const [activeCard, setActiveCard] = useState(null);
  const [modal, setModal] = useState({ open: false, column: "todo" });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const findColumn = useCallback((cardId) => {
    return Object.keys(cards).find((col) => cards[col].some((c) => c.id === cardId));
  }, [cards]);

  const handleDragStart = ({ active }) => {
    const colId = findColumn(active.id);
    if (colId) {
      const card = cards[colId].find((c) => c.id === active.id);
      setActiveCard(card);
    }
  };

  const handleDragOver = ({ active, over }) => {
    if (!over) return;
    const fromCol = findColumn(active.id);
    const toCol = Object.keys(cards).includes(over.id) ? over.id : findColumn(over.id);
    if (!fromCol || !toCol || fromCol === toCol) return;

    setCards((prev) => {
      const card = prev[fromCol].find((c) => c.id === active.id);
      return {
        ...prev,
        [fromCol]: prev[fromCol].filter((c) => c.id !== active.id),
        [toCol]: [...prev[toCol], card],
      };
    });
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveCard(null);
    if (!over) return;
    const fromCol = findColumn(active.id);
    const toCol = Object.keys(cards).includes(over.id) ? over.id : findColumn(over.id);
    if (!fromCol || !toCol) return;
    if (fromCol === toCol) {
      const oldIdx = cards[fromCol].findIndex((c) => c.id === active.id);
      const newIdx = cards[toCol].findIndex((c) => c.id === over.id);
      if (oldIdx !== newIdx) {
        setCards((prev) => ({
          ...prev,
          [fromCol]: arrayMove(prev[fromCol], oldIdx, newIdx),
        }));
      }
    }
  };

  // NEW: Delete card handler — removes card from whichever column it's in
  const handleDeleteCard = useCallback((cardId) => {
    setCards((prev) => {
      const updated = {};
      for (const col of Object.keys(prev)) {
        updated[col] = prev[col].filter((c) => c.id !== cardId);
      }
      return updated;
    });
  }, []);

  const handleCreateCard = (form) => {
    const newCard = {
      id: `TF-${incrementCardCounter()}`,
      title: form.title,
      type: form.type,
      priority: form.priority,
      assignee: form.assignee,
      points: form.points,
      tags: form.tags,
    };
    setCards((prev) => ({
      ...prev,
      [form.column]: [...prev[form.column], newCard],
    }));
    setModal({ open: false, column: "todo" });
  };

  

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "'DM Sans', sans-serif", background: COLORS.bg }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap" rel="stylesheet" />

      <Navbar
        onCreateClick={() => setModal({ open: true, column: "todo" })}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={onLogout}
        user={user}
      />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar collapsed={!sidebarOpen} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Board header */}
          <div style={{
            padding: "14px 20px 10px",
            background: COLORS.surface,
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: COLORS.text, fontFamily: "'DM Sans', sans-serif" }}>
              Sprint 12 Board
            </h1>
            <span style={{
              fontSize: 11, fontWeight: 700, color: COLORS.green,
              background: COLORS.greenLight, borderRadius: 12, padding: "2px 10px",
            }}>● Active</span>
            <div style={{ flex: 1 }} />
            <button onClick={() => setModal({ open: true, column: "todo" })} style={{
              padding: "7px 16px", background: COLORS.blue,
              color: "#fff", border: "none", borderRadius: 5,
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}>+ Create Issue</button>
          </div>

          {/* Filter bar */}
          <div style={{
            padding: "8px 20px", background: COLORS.surface,
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            {["All", "My Issues", "Bugs", "Features"].map((f, i) => (
              <button key={f} style={{
                padding: "4px 12px", borderRadius: 4,
                border: `1px solid ${i === 0 ? COLORS.blue : COLORS.border}`,
                background: i === 0 ? COLORS.blueLight : "none",
                color: i === 0 ? COLORS.blue : COLORS.textMuted,
                fontSize: 12, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: i === 0 ? 700 : 400,
              }}>{f}</button>
            ))}
            <div style={{ display: "flex", marginLeft: 8 }}>
              {MEMBERS.map((m, i) => (
                <div key={m.id} style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: m.color, border: `2px solid ${COLORS.surface}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 700, color: "#fff",
                  marginLeft: i > 0 ? -6 : 0, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }} title={m.name}>{m.id}</div>
              ))}
            </div>
            <span style={{ marginLeft: "auto", fontSize: 12, color: COLORS.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
              Aug 1 – Aug 14, 2025
            </span>
          </div>

          {/* DnD Board */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div style={{
              display: "flex", gap: 12,
              padding: "16px 20px",
              overflowX: "auto", flex: 1,
              alignItems: "flex-start",
            }}>
              {INITIAL_COLUMNS.map((col) => (
                <Column
                  key={col.id}
                  col={col}
                  cards={cards[col.id] || []}
                  onAddCard={(colId) => setModal({ open: true, column: colId })}
                  onDeleteCard={handleDeleteCard}
                />
              ))}
            </div>
            <DragOverlay>
              {activeCard ? <KanbanCard card={activeCard} overlay /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      <CreateCardModal
        open={modal.open}
        defaultColumn={modal.column}
        onClose={() => setModal({ open: false, column: "todo" })}
        onSubmit={handleCreateCard}
      />
    </div>
  );
}
