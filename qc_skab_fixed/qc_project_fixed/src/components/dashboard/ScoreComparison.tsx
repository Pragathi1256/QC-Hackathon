import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { SENSOR_LABELS, ALL_SENSORS } from "@/lib/sensorEngine";
import type { DashboardRow, SensorName } from "@/lib/sensorEngine";

interface Props {
  rows: DashboardRow[];
  activeSensor: SensorName;
}

export default function ScoreComparison({ rows, activeSensor }: Props) {
  // Average z-score per sensor across all loaded rows
  const sensorStats = useMemo(() => {
    if (!rows.length) return [];
    return ALL_SENSORS.map(sensor => {
      const vals = rows.map(r => r.readings[sensor].zScore);
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      const max = Math.max(...vals);
      return {
        name: SENSOR_LABELS[sensor].replace(" (A)", "").replace(" (°C)", "").replace(" (V)", ""),
        avgZ: Math.round(avg * 1000) / 1000,
        maxZ: Math.round(max * 1000) / 1000,
        isActive: sensor === activeSensor,
      };
    });
  }, [rows, activeSensor]);

  const latestRow = rows.length ? rows[rows.length - 1] : null;

  return (
    <div className="glass-panel rounded-xl p-6 animate-fade-in-up space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Score Summary</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Avg & max z-score per sensor</p>
      </div>

      {/* Latest reading scores */}
      {latestRow && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Latest snapshot</p>
          {ALL_SENSORS.map(sensor => {
            const r = latestRow.readings[sensor];
            const pct = Math.min(100, (r.zScore / 8) * 100);
            const isAnomaly = r.status === "Anomaly";
            return (
              <div key={sensor} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20 shrink-0 truncate">{SENSOR_LABELS[sensor].split(" ")[0]}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden bg-muted/30">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      background: isAnomaly ? "hsl(0 72% 55%)" : sensor === activeSensor ? "hsl(170 80% 50%)" : "hsl(215 20% 45%)",
                    }}
                  />
                </div>
                <span className={`text-xs font-mono w-10 text-right shrink-0 ${isAnomaly ? "text-destructive" : "text-foreground"}`}>
                  {r.zScore}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Bar chart: avg z-score */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Avg z-score across all rows</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={sensorStats} margin={{ top: 0, right: 0, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 22%)" />
            <XAxis dataKey="name" stroke="hsl(215 20% 55%)" fontSize={9} angle={-30} textAnchor="end" />
            <YAxis stroke="hsl(215 20% 55%)" fontSize={10} />
            <Tooltip
              contentStyle={{ background: "hsl(220 20% 12%)", border: "1px solid hsl(220 15% 28%)", borderRadius: "8px", fontSize: 11 }}
            />
            <Bar dataKey="avgZ" name="Avg z-score" fill="hsl(170 80% 45%)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="maxZ" name="Max z-score" fill="hsl(0 72% 50%)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
