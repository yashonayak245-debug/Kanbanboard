// ─── Palette & Tokens ────────────────────────────────────────────────────────
export const COLORS = {
  navy: "#0747A6",
  blue: "#0052CC",
  blueMid: "#2684FF",
  blueLight: "#DEEBFF",
  purple: "#6554C0",
  purpleLight: "#EAE6FF",
  green: "#006644",
  greenLight: "#E3FCEF",
  greenMid: "#36B37E",
  red: "#BF2600",
  redLight: "#FFEBE6",
  redMid: "#FF5630",
  orange: "#FF8B00",
  orangeLight: "#FFFAE6",
  orangeMid: "#FFAB00",
  bg: "#F4F5F7",
  surface: "#FFFFFF",
  colBg: "#EBECF0",
  border: "#DFE1E6",
  text: "#172B4D",
  textMuted: "#5E6C84",
  textHint: "#97A0AF",
};

// ─── Priority Config ──────────────────────────────────────────────────────────
export const PRIORITY_CONFIG = {
  high:   { label: "High",   color: COLORS.redMid,    bg: COLORS.redLight,    icon: "↑↑" },
  medium: { label: "Medium", color: COLORS.orangeMid, bg: COLORS.orangeLight, icon: "↑"  },
  low:    { label: "Low",    color: COLORS.greenMid,  bg: COLORS.greenLight,  icon: "↓"  },
};

// ─── Issue Type Config ────────────────────────────────────────────────────────
export const TYPE_CONFIG = {
  story: { icon: "◈",  color: COLORS.green,  bg: COLORS.greenLight,  label: "Story" },
  task:  { icon: "✓",  color: COLORS.blue,   bg: COLORS.blueLight,   label: "Task"  },
  bug:   { icon: "⬟",  color: COLORS.redMid, bg: COLORS.redLight,    label: "Bug"   },
  epic:  { icon: "⚡", color: COLORS.purple, bg: COLORS.purpleLight, label: "Epic"  },
};

// ─── Team Members ─────────────────────────────────────────────────────────────
export const MEMBERS = [
  { id: "AJ", name: "Alex Johnson", color: "#FF991F" },
  { id: "SK", name: "Sara Kim",     color: "#6554C0" },
  { id: "RP", name: "Raj Patel",    color: "#36B37E" },
  { id: "MC", name: "Mia Chen",     color: "#0052CC" },
];

// ─── Columns ──────────────────────────────────────────────────────────────────
export const INITIAL_COLUMNS = [
  { id: "todo",       title: "To Do",       color: COLORS.textMuted },
  { id: "inprogress", title: "In Progress", color: COLORS.blue      },
  { id: "review",     title: "In Review",   color: COLORS.purple    },
  { id: "done",       title: "Done",        color: COLORS.greenMid  },
];

// ─── Initial Cards ────────────────────────────────────────────────────────────
export const INITIAL_CARDS = {
  todo: [
    { id: "TF-1",  title: "Set up CI/CD pipeline",           type: "task",  priority: "high",   assignee: "AJ", points: 5,  tags: ["DevOps"]           },
    { id: "TF-2",  title: "Design onboarding flow mockups",  type: "story", priority: "medium", assignee: "SK", points: 3,  tags: ["Design"]           },
    { id: "TF-3",  title: "Fix login redirect bug on Safari",type: "bug",   priority: "high",   assignee: "RP", points: 2,  tags: ["Auth"]             },
    { id: "TF-4",  title: "Write API documentation",         type: "task",  priority: "low",    assignee: "MC", points: 3,  tags: ["Docs"]             },
  ],
  inprogress: [
    { id: "TF-5",  title: "Implement dark mode toggle",      type: "story", priority: "medium", assignee: "SK", points: 5,  tags: ["UI"]               },
    { id: "TF-6",  title: "Optimize database queries",       type: "task",  priority: "high",   assignee: "RP", points: 8,  tags: ["Backend"]          },
    { id: "TF-7",  title: "Crash on file upload > 10MB",     type: "bug",   priority: "high",   assignee: "AJ", points: 3,  tags: ["Upload"]           },
  ],
  review: [
    { id: "TF-8",  title: "Notification preferences panel",  type: "story", priority: "medium", assignee: "MC", points: 5,  tags: ["UI", "Settings"]  },
    { id: "TF-9",  title: "Epic: Q3 Performance Sprint",     type: "epic",  priority: "high",   assignee: "AJ", points: 13, tags: ["Performance"]     },
  ],
  done: [
    { id: "TF-10", title: "Migrate to React 18",             type: "task",  priority: "medium", assignee: "RP", points: 8,  tags: ["Infra"]            },
    { id: "TF-11", title: "Add two-factor authentication",   type: "story", priority: "high",   assignee: "SK", points: 5,  tags: ["Auth", "Security"] },
    { id: "TF-12", title: "Fix tooltip z-index overlap",     type: "bug",   priority: "low",    assignee: "MC", points: 1,  tags: ["UI"]               },
  ],
};

// ─── Card ID Counter (mutable, shared) ───────────────────────────────────────
export let cardCounter = 13;
export const incrementCardCounter = () => ++cardCounter;
