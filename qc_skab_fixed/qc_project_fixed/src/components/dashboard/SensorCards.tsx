import { useMemo } from "react";
import { ALL_SENSORS, SENSOR_LABELS, SENSOR_UNITS } from "@/lib/sensorEngine";
import type { DashboardRow, SensorName } from "@/lib/sensorEngine";

interface Props {
  rows: DashboardRow[];
  activeSensor: SensorName;
  onSelectSensor: (s: SensorName) => void;
}

const SENSOR_COLORS: Record<SensorName, string> = {
  Accelerometer1RMS:  "hsl(170 80% 50%)",
  Accelerometer2RMS:  "hsl(190 80% 55%)",
  Current:            "hsl(38 92% 55%)",
  Pressure:           "hsl(200 80% 60%)",
  Temperature:        "hsl(0 72% 55%)",
  Thermocouple:       "hsl(20 80% 55%)",
  Voltage:            "hsl(260 60% 65%)",
  VolumeFlowRateRMS:  "hsl(145 70% 45%)",
};

export default function SensorCards({ rows, activeSensor, onSelectSensor }: Props) {
  const latestRow = useMemo(() => rows.length ? rows[rows.length - 1] : null, [rows]);

  if (!latestRow) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ALL_SENSORS.map((s, i) => (
          <div key={s} className="glass-panel rounded-xl p-4 animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="h-3 rounded bg-muted/40 animate-pulse mb-2 w-2/3" />
            <div className="h-7 rounded bg-muted/30 animate-pulse mb-1" />
            <div className="h-3 rounded bg-muted/20 animate-pulse w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {ALL_SENSORS.map((sensor, i) => {
        const r = latestRow.readings[sensor];
        const isActive = sensor === activeSensor;
        const isAnomaly = r.status === "Anomaly";
        const isChangepoint = r.status === "Changepoint";
        const color = SENSOR_COLORS[sensor];

        // Mini sparkline: last 20 values for this sensor
        const sparkVals = rows.slice(-20).map(row => row.readings[sensor].value);
        const min = Math.min(...sparkVals);
        const max = Math.max(...sparkVals);
        const range = max - min || 1;
        const points = sparkVals.map((v, idx) => {
          const x = (idx / (sparkVals.length - 1)) * 100;
          const y = 20 - ((v - min) / range) * 18;
          return `${x},${y}`;
        }).join(" ");

        return (
          <button
            key={sensor}
            onClick={() => onSelectSensor(sensor)}
            className={`glass-panel rounded-xl p-4 text-left transition-all duration-200 animate-fade-in-up ${
              isAnomaly ? "pulse-anomaly" : ""
            } ${isActive ? "ring-1" : "hover:brightness-110"}`}
            style={{
              animationDelay: `${i * 60}ms`,
              ringColor: color,
              ...(isActive ? { boxShadow: `0 0 0 1px ${color}66, 0 0 16px ${color}22` } : {}),
              ...(isChangepoint ? { boxShadow: `0 0 0 1px hsl(260 60% 65% / 0.5)` } : {}),
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">{SENSOR_LABELS[sensor]}</span>
              <span
                className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                style={
                  isChangepoint
                    ? { background: "hsl(260 60% 65% / 0.2)", color: "hsl(260 60% 75%)" }
                    : isAnomaly
                    ? { background: "hsl(0 72% 55% / 0.2)", color: "hsl(0 72% 70%)" }
                    : { background: "hsl(145 70% 45% / 0.15)", color: "hsl(145 70% 55%)" }
                }
              >
                {r.status}
              </span>
            </div>

            <p className="text-xl font-mono font-bold text-foreground">
              {r.value}
              <span className="text-xs text-muted-foreground font-normal ml-1">{SENSOR_UNITS[sensor]}</span>
            </p>

            <p className="text-xs text-muted-foreground mb-2">
              z = <span className={`font-mono ${isAnomaly ? "text-destructive" : "text-foreground"}`}>{r.zScore}</span>
              &nbsp;·&nbsp; exp {r.expected}
            </p>

            {/* Sparkline */}
            <svg viewBox="0 0 100 20" className="w-full h-5 overflow-visible" preserveAspectRatio="none">
              <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.8"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
