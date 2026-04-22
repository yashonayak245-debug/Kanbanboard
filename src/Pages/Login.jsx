import { useState } from "react"; // fixed

const COLORS = {
  blue: "#0052CC",
  navy: "#0747A6",
  blueLight: "#DEEBFF",
  border: "#DFE1E6",
  text: "#172B4D",
  textMuted: "#5E6C84",
  textHint: "#97A0AF",
  bg: "#F4F5F7",
  surface: "#FFFFFF",
  greenLight: "#E3FCEF",
  green: "#006644",
  redMid: "#FF5630",
};

export default function Login({ onLogin }) {
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
    setTimeout(() => {
      if (onLogin) {
        // Extract name from email e.g. "yasho@gmail.com" → "Yasho"
        const namePart = form.email.split("@")[0];
        const name = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        // Initials: first 2 chars uppercased e.g. "ya" → "YA"
        const initials = namePart.slice(0, 2).toUpperCase();
        onLogin({ name, initials, email: form.email });
      }
    }, 1000);
  };

  const inputBase = {
    width: "100%", padding: "9px 12px",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6, fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    color: COLORS.text, outline: "none",
    boxSizing: "border-box", background: "#fff",
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap" rel="stylesheet" />
      <div style={{
        minHeight: "100vh", background: COLORS.bg,
        display: "flex", alignItems: "center",
        justifyContent: "center", padding: 16,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{
          background: COLORS.surface, borderRadius: 12,
          border: `1px solid ${COLORS.border}`,
          padding: 32, width: "100%", maxWidth: 400,
          boxShadow: "0 4px 24px rgba(9,30,66,0.10)",
        }}>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 24 }}>
            <div style={{
              background: COLORS.blue, borderRadius: 8,
              width: 36, height: 36,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 800, fontSize: 18,
            }}>⊞</div>
            <span style={{ fontWeight: 700, fontSize: 20, color: COLORS.text }}>KanbanBoard</span>
          </div>

          {/* Heading */}
          <div style={{ textAlign: "center", marginBottom: 22 }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: COLORS.text, marginBottom: 4 }}>
              Log in to your account
            </div>
            <div style={{ fontSize: 13, color: COLORS.textMuted }}>
              Welcome back! Enter your details below.
            </div>
          </div>

          {/* Success alert */}
          {success && (
            <div style={{
              background: COLORS.greenLight, color: COLORS.green,
              borderRadius: 6, padding: "10px 14px",
              marginBottom: 16, fontSize: 13, fontWeight: 600,
            }}>
              ✓ Logged in successfully! Redirecting...
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 5 }}>
              Email address
            </label>
            <input
              style={{ ...inputBase, borderColor: errors.email ? COLORS.redMid : COLORS.border }}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: "" }); }}
              onFocus={e => e.target.style.borderColor = COLORS.blue}
              onBlur={e => e.target.style.borderColor = errors.email ? COLORS.redMid : COLORS.border}
            />
            {errors.email && (
              <div style={{ fontSize: 11, color: COLORS.redMid, marginTop: 4 }}>{errors.email}</div>
            )}
          </div>

          {/* Password */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 5 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...inputBase, paddingRight: 42, borderColor: errors.password ? COLORS.redMid : COLORS.border }}
                type={showPw ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: "" }); }}
                onFocus={e => e.target.style.borderColor = COLORS.blue}
                onBlur={e => e.target.style.borderColor = errors.password ? COLORS.redMid : COLORS.border}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <button
                onClick={() => setShowPw(s => !s)}
                style={{
                  position: "absolute", right: 10, top: "50%",
                  transform: "translateY(-50%)",
                  border: "none", background: "none",
                  cursor: "pointer", color: COLORS.textMuted,
                  fontSize: 15, padding: 2,
                }}
              >{showPw ? "🙈" : "👁"}</button>
            </div>
            {errors.password && (
              <div style={{ fontSize: 11, color: COLORS.redMid, marginTop: 4 }}>{errors.password}</div>
            )}
          </div>

          {/* Remember me + Forgot password */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", color: COLORS.text }}>
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(e) => setForm({ ...form, remember: e.target.checked })}
              />
              Remember me for 30 days
            </label>
            <span style={{ fontSize: 12, color: COLORS.blue, cursor: "pointer", fontWeight: 600 }}>
              Forgot password?
            </span>
          </div>

          {/* Login button */}
          <button
            onClick={handleLogin}
            style={{
              width: "100%", padding: "10px",
              background: COLORS.blue, color: "#fff",
              border: "none", borderRadius: 6,
              fontSize: 14, fontWeight: 700,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = COLORS.navy}
            onMouseLeave={e => e.currentTarget.style.background = COLORS.blue}
          >
            Log in
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
            <div style={{ flex: 1, height: 1, background: COLORS.border }} />
            <span style={{ fontSize: 12, color: COLORS.textMuted }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: COLORS.border }} />
          </div>

          {/* Google button */}
          <button style={{
            width: "100%", padding: "9px",
            background: "#fff", border: `1px solid ${COLORS.border}`,
            borderRadius: 6, fontSize: 14,
            cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8,
            color: COLORS.text,
          }}>
            <img src="https://www.google.com/favicon.ico" width={16} height={16} alt="G" />
            Continue with Google
          </button>

          {/* Sign up link */}
          <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: COLORS.textMuted }}>
            Don't have an account?{" "}
            <span style={{ color: COLORS.blue, cursor: "pointer", fontWeight: 600 }}>
              Sign up for free
            </span>
          </div>

        </div>
      </div>
    </>
  );
}
