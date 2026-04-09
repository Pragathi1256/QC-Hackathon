import type { DashboardRow } from "@/lib/sensorEngine";

interface Props {
  rows: DashboardRow[];
  isLive: boolean;
  onToggleLive: () => void;
  onExport: () => void;
}

export default function StatsBar({ rows, isLive, onToggleLive, onExport }: Props) {
  const total = rows.length;
  const anomalies = rows.filter(r => r.isAnomaly).length;
  const changepoints = rows.filter(r => r.isChangepoint).length;
  const rate = total ? ((anomalies / total) * 100).toFixed(1) : "0";

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 animate-fade-in-up">
      <div className="flex items-center gap-6 flex-wrap">
        {[
          { label: "Total Rows", value: total, color: "text-foreground" },
          { label: "Anomalies", value: anomalies, color: "text-destructive" },
          { label: "Changepoints", value: changepoints, color: "text-quantum" },
          { label: "Anomaly Rate", value: `${rate}%`, color: "text-warning" },
        ].map(item => (
          <div key={item.label}>
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className={`text-2xl font-mono font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-xs transition-all"
          style={{ background: "hsl(170 80% 50% / 0.1)", border: "1px solid hsl(170 80% 50% / 0.3)", color: "hsl(170 80% 60%)" }}
        >
          ⬇ Export CSV
        </button>
        <button
          onClick={onToggleLive}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            isLive ? "bg-success/20 text-success glow-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isLive ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
          {isLive ? "Streaming" : "Paused"}
        </button>
      </div>
    </div>
  );
}
