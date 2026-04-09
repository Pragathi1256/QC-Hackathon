import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import ParticleBackground from "@/components/ParticleBackground";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    // Entrance animation
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please enter both username and password");
      triggerShake();
      return;
    }
    setLoading(true);
    setError("");
    // Simulate async check
    await new Promise((r) => setTimeout(r, 800));
    const result = login(username, password);
    if (!result.success) {
      setError(result.error || "Login failed");
      triggerShake();
    }
    setLoading(false);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0d1117]">
      <ParticleBackground />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-quantum/10 rounded-full blur-3xl pointer-events-none" />

      {/* Login card */}
      <div
        className={`relative z-10 w-full max-w-md mx-4 transition-all duration-700 ease-out ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        } ${shake ? "animate-shake" : ""}`}
      >
        {/* Logo / header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 glow-primary"
            style={{
              background: "linear-gradient(135deg, hsl(170 80% 50% / 0.2), hsl(260 60% 60% / 0.2))",
              border: "1px solid hsl(170 80% 50% / 0.4)",
            }}
          >
            <span className="text-3xl">⚛️</span>
          </div>
          <h1 className="text-3xl font-bold gradient-text text-glow">Quantum AD</h1>
          <p className="text-muted-foreground text-sm mt-1">IoT Anomaly Detection Platform</p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-8 space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Welcome back</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Sign in to access the dashboard
            </p>
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Enter username"
              className="w-full px-4 py-2.5 rounded-lg text-sm text-foreground placeholder-muted-foreground outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/50"
              style={{
                background: "hsl(220 15% 20%)",
                border: "1px solid hsl(220 15% 28%)",
              }}
              autoComplete="username"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Enter password"
              className="w-full px-4 py-2.5 rounded-lg text-sm text-foreground placeholder-muted-foreground outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/50"
              style={{
                background: "hsl(220 15% 20%)",
                border: "1px solid hsl(220 15% 28%)",
              }}
              autoComplete="current-password"
            />
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-lg px-4 py-2.5 text-sm animate-fade-in-up"
              style={{ background: "hsl(0 72% 55% / 0.1)", border: "1px solid hsl(0 72% 55% / 0.3)", color: "hsl(0 72% 70%)" }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200 relative overflow-hidden disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, hsl(170 80% 45%), hsl(170 80% 38%))",
              color: "hsl(220 20% 10%)",
              boxShadow: "0 0 20px hsl(170 80% 50% / 0.25)",
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              "Sign In →"
            )}
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4 opacity-50">
          Quantum Anomaly Detection v1.0
        </p>
      </div>
    </div>
  );
}
