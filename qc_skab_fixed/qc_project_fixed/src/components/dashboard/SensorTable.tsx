import { useState, useMemo } from "react";
import { SENSOR_LABELS, ALL_SENSORS } from "@/lib/sensorEngine";
import type { DashboardRow, SensorName } from "@/lib/sensorEngine";

interface Props {
  rows: DashboardRow[];
  activeSensor: SensorName;
  onExport: () => void;
}

export default function SensorTable({ rows, activeSensor, onExport }: Props) {
  const [statusFilter, setStatusFilter] = useState<"All" | "Normal" | "Anomaly" | "Changepoint">("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [search, setSearch] = useState("");

  const sources = useMemo(() => {
    const s = [...new Set(rows.map(r => r.source))];
    return ["All", ...s];
  }, [rows]);

  const filtered = useMemo(() => {
    return [...rows].reverse().slice(0, 200).filter(row => {
      const status = row.isChangepoint ? "Changepoint" : row.isAnomaly ? "Anomaly" : "Normal";
      if (statusFilter !== "All" && status !== statusFilter) return false;
      if (sourceFilter !== "All" && row.source !== sourceFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return row.source.toLowerCase().includes(q) || status.toLowerCase().includes(q) || row.datetime.includes(q);
      }
      return true;
    });
  }, [rows, statusFilter, sourceFilter, search]);

  const r = activeSensor;

  return (
    <div className="glass-panel rounded-xl p-6 animate-fade-in-up">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Data Log</h3>
          <p className="text-xs text-muted-foreground mt-0.5">SKAB real sensor readings</p>
        </div>
        <button
          onClick={onExport}
          disabled={rows.length === 0}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
          style={{ background: "hsl(170 80% 50% / 0.12)", border: "1px solid hsl(170 80% 50% / 0.3)", color: "hsl(170 80% 60%)" }}
        >
          ⬇ Export CSV ({rows.length})
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search datetime, source, status..."
          className="flex-1 min-w-[180px] px-3 py-1.5 rounded-lg text-xs text-foreground placeholder-muted-foreground outline-none"
          style={{ background: "hsl(220 15% 20%)", border: "1px solid hsl(220 15% 28%)" }}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="px-3 py-1.5 rounded-lg text-xs text-foreground outline-none"
          style={{ background: "hsl(220 15% 20%)", border: "1px solid hsl(220 15% 28%)" }}
        >
          {["All", "Normal", "Anomaly", "Changepoint"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs text-foreground outline-none"
          style={{ background: "hsl(220 15% 20%)", border: "1px solid hsl(220 15% 28%)" }}
        >
          {sources.map(s => <option key={s} value={s}>{s === "All" ? "All Sources" : s}</option>)}
        </select>
        {(search || statusFilter !== "All" || sourceFilter !== "All") && (
          <button
            onClick={() => { setSearch(""); setStatusFilter("All"); setSourceFilter("All"); }}
            className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground"
            style={{ background: "hsl(220 15% 20%)", border: "1px solid hsl(220 15% 28%)" }}
          >✕ Clear</button>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-2">Showing {filtered.length} of {rows.length} rows</p>

      <div className="overflow-x-auto scrollbar-thin max-h-[400px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-2 px-2">Datetime</th>
              <th className="text-left py-2 px-2">Source</th>
              <th className="text-center py-2 px-2">Status</th>
              <th className="text-right py-2 px-2">{SENSOR_LABELS[activeSensor]}</th>
              <th className="text-right py-2 px-2">Expected</th>
              <th className="text-right py-2 px-2">Deviation</th>
              <th className="text-right py-2 px-2">z-score</th>
              <th className="text-right py-2 px-2">Quantum</th>
              <th className="text-left py-2 px-2 min-w-[180px]">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">No rows match filters</td></tr>
            ) : filtered.map((row, i) => {
              const reading = row.readings[activeSensor];
              const isAnomaly = row.isAnomaly;
              const isCP = row.isChangepoint;
              const status = isCP ? "Changepoint" : isAnomaly ? "Anomaly" : "Normal";
              return (
                <tr
                  key={`${row.datetime}-${i}`}
                  className={`border-b border-border/40 transition-colors ${
                    isCP ? "bg-quantum/5" : isAnomaly ? "bg-destructive/5" : "hover:bg-muted/20"
                  }`}
                >
                  <td className="py-2 px-2 font-mono text-muted-foreground whitespace-nowrap">
                    {new Date(row.datetime).toLocaleString()}
                  </td>
                  <td className="py-2 px-2 text-muted-foreground">{row.source}</td>
                  <td className="py-2 px-2 text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      isCP
                        ? "bg-quantum/20 text-quantum"
                        : isAnomaly
                        ? "bg-destructive/20 text-destructive"
                        : "bg-success/15 text-success"
                    }`}>{status}</span>
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-foreground">{reading.value}</td>
                  <td className="py-2 px-2 text-right font-mono text-muted-foreground">{reading.expected}</td>
                  <td className={`py-2 px-2 text-right font-mono ${isAnomaly ? "text-destructive" : "text-success"}`}>
                    {reading.deviation > 0 ? "+" : ""}{reading.deviation}
                  </td>
                  <td className={`py-2 px-2 text-right font-mono ${isAnomaly ? "text-destructive" : "text-foreground"}`}>
                    {reading.zScore}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-quantum">{reading.quantumScore}</td>
                  <td className="py-2 px-2 text-muted-foreground truncate max-w-[220px]">{reading.action}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
