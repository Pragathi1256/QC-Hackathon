import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  loadDataset, getNextRows, resetPlayback, exportToCSV,
  ALL_SENSORS, SENSOR_LABELS, SENSOR_UNITS,
} from "@/lib/sensorEngine";
import type { DashboardRow, SensorName } from "@/lib/sensorEngine";
import SensorChart from "@/components/dashboard/SensorChart";
import SensorCards from "@/components/dashboard/SensorCards";
import SensorTable from "@/components/dashboard/SensorTable";
import ScoreComparison from "@/components/dashboard/ScoreComparison";
import StatsBar from "@/components/dashboard/StatsBar";
import ParticleBackground from "@/components/ParticleBackground";
import ManualInputPanel from "@/components/dashboard/ManualInputPanel";
import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { username, logout } = useAuth();
  const [rows, setRows] = useState<DashboardRow[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [visible, setVisible] = useState(false);
  const [activeSensor, setActiveSensor] = useState<SensorName>("Temperature");
  const prevAnomalyCount = useRef(0);

  // Load dataset on mount
  useEffect(() => {
    loadDataset()
      .then((ds) => {
        // Pre-load first 80 rows immediately
        const initial = getNextRows(80);
        setRows(initial);
        setLoading(false);
        setTimeout(() => setVisible(true), 50);
        toast.success(`✅ SKAB dataset loaded — ${ds.records.length} records ready`);
      })
      .catch((e) => {
        setLoadError(String(e));
        setLoading(false);
      });
  }, []);

  // Live playback: stream 1 row every 800ms
  useEffect(() => {
    if (!isLive || loading) return;
    const interval = setInterval(() => {
      const next = getNextRows(1);
      if (next.length === 0) return;
      setRows(prev => [...prev, ...next].slice(-300));
    }, 800);
    return () => clearInterval(interval);
  }, [isLive, loading]);

  // Anomaly toasts
  useEffect(() => {
    const anomCount = rows.filter(r => r.isAnomaly || r.isChangepoint).length;
    if (anomCount > prevAnomalyCount.current && rows.length > 0) {
      const latest = [...rows].reverse().find(r => r.isAnomaly || r.isChangepoint);
      if (latest) {
        const label = latest.isChangepoint ? "⚡ Changepoint" : "🚨 Anomaly";
        const worstSensor = ALL_SENSORS.reduce((a, b) =>
          latest.readings[a].zScore > latest.readings[b].zScore ? a : b
        );
        toast.error(`${label} detected`, {
          description: `Source: ${latest.source} | Worst sensor: ${SENSOR_LABELS[worstSensor]} (z=${latest.readings[worstSensor].zScore})`,
          duration: 4000,
        });
      }
    }
    prevAnomalyCount.current = anomCount;
  }, [rows]);

  const handleReset = useCallback(() => {
    resetPlayback();
    const initial = getNextRows(80);
    setRows(initial);
    setIsLive(false);
    toast.info("Playback reset to start");
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <ParticleBackground />
        <div className="relative z-10 text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-primary font-semibold text-lg">Loading SKAB Dataset...</p>
          <p className="text-muted-foreground text-sm">Skoltech Anomaly Benchmark</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-destructive text-lg font-semibold">Failed to load dataset</p>
          <p className="text-muted-foreground text-sm">{loadError}</p>
        </div>
      </div>
    );
  }

  const anomalyCount = rows.filter(r => r.isAnomaly).length;
  const changepointCount = rows.filter(r => r.isChangepoint).length;

  return (
    <div
      className={`min-h-screen bg-[#0d1117] transition-all duration-700 ease-out ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <ParticleBackground />
      <div className="fixed top-0 left-1/3 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-quantum/5 rounded-full blur-3xl pointer-events-none z-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text text-glow">
              Quantum Anomaly Detection
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              SKAB · Skoltech Water Pump Testbed · {rows.length} readings loaded
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: "hsl(170 80% 50% / 0.08)", border: "1px solid hsl(170 80% 50% / 0.2)" }}
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-muted-foreground">Logged in as</span>
              <span className="text-primary font-semibold font-mono">{username}</span>
            </div>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              style={{ background: "hsl(220 15% 20%)", border: "1px solid hsl(220 15% 28%)" }}
            >
              ↩ Reset
            </button>
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              style={{ background: "hsl(220 15% 20%)", border: "1px solid hsl(220 15% 28%)" }}
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Dataset info banner */}
        <div
          className="rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in-up"
          style={{ animationDelay: "60ms", background: "hsl(220 20% 14% / 0.6)", border: "1px solid hsl(220 15% 25%)" }}
        >
          {[
            { label: "Dataset", value: "SKAB v1.0", sub: "Skoltech Benchmark" },
            { label: "Sensors", value: "8", sub: "Pump testbed" },
            { label: "Anomalies", value: anomalyCount, sub: `${rows.length ? ((anomalyCount/rows.length)*100).toFixed(1) : 0}% rate` },
            { label: "Changepoints", value: changepointCount, sub: "Process shifts" },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-xl font-mono font-bold text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.sub}</p>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="animate-fade-in-up" style={{ animationDelay: "120ms" }}>
          <StatsBar
            rows={rows}
            isLive={isLive}
            onToggleLive={() => setIsLive(p => !p)}
            onExport={() => exportToCSV(rows)}
          />
        </div>

        {/* Sensor cards */}
        <div className="animate-fade-in-up" style={{ animationDelay: "180ms" }}>
          <SensorCards rows={rows} activeSensor={activeSensor} onSelectSensor={setActiveSensor} />
        </div>

        {/* Chart + Score */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: "240ms" }}>
          <div className="lg:col-span-2">
            <SensorChart rows={rows} activeSensor={activeSensor} />
          </div>
          <div>
            <ScoreComparison rows={rows} activeSensor={activeSensor} />
          </div>
        </div>

        {/* Manual Input */}
        <ManualInputPanel onAddRow={(row) => setRows(prev => [...prev, row].slice(-300))} />

        {/* Table */}
        <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <SensorTable rows={rows} activeSensor={activeSensor} onExport={() => exportToCSV(rows)} />
        </div>

      </div>
    </div>
  );
}
