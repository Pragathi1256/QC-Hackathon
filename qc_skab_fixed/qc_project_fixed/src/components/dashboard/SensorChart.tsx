import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea,
} from "recharts";
import { SENSOR_LABELS, SENSOR_UNITS, ALL_SENSORS } from "@/lib/sensorEngine";
import type { DashboardRow, SensorName } from "@/lib/sensorEngine";

interface Props {
  rows: DashboardRow[];
  activeSensor: SensorName;
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

export default function SensorChart({ rows, activeSensor }: Props) {
  const color = SENSOR_COLORS[activeSensor];

  const chartData = useMemo(() => {
    return rows.slice(-100).map((row, i) => {
      const r = row.readings[activeSensor];
      return {
        i,
        time: new Date(row.datetime).toLocaleTimeString(),
        value: r.value,
        expected: r.expected,
        zScore: r.zScore,
        status: r.status,
        isAnomaly: row.isAnomaly,
        isChangepoint: row.isChangepoint,
      };
    });
  }, [rows, activeSensor]);

  const expected = rows.length ? rows[rows.length - 1].readings[activeSensor].expected : 0;
  const stdVal = rows.length ? rows[rows.length - 1].readings[activeSensor].std : 1;

  // Find anomaly regions for shading
  const anomalyRegions: { start: number; end: number }[] = [];
  let inAnom = false;
  let startIdx = 0;
  chartData.forEach((d, i) => {
    if (d.isAnomaly && !inAnom) { inAnom = true; startIdx = i; }
    if (!d.isAnomaly && inAnom) { inAnom = false; anomalyRegions.push({ start: startIdx, end: i - 1 }); }
  });
  if (inAnom) anomalyRegions.push({ start: startIdx, end: chartData.length - 1 });

  return (
    <div className="glass-panel rounded-xl p-6 animate-fade-in-up">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: color }} />
            {SENSOR_LABELS[activeSensor]}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Unit: {SENSOR_UNITS[activeSensor]} · baseline μ={expected} σ={stdVal.toFixed(4)}
          </p>
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 rounded inline-block" style={{ background: color }} /> Value
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 rounded inline-block bg-muted-foreground opacity-50" style={{ borderTop: "1px dashed" }} /> Expected
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "hsl(0 72% 55% / 0.15)" }} /> Anomaly
          </span>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
          No data yet — press Streaming to start playback
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 22%)" />
            <XAxis dataKey="time" stroke="hsl(215 20% 55%)" fontSize={10} tickLine={false} interval="preserveStartEnd" />
            <YAxis stroke="hsl(215 20% 55%)" fontSize={10} tickLine={false} width={55} />
            <Tooltip
              contentStyle={{
                background: "hsl(220 20% 12%)",
                border: "1px solid hsl(220 15% 28%)",
                borderRadius: "8px",
                color: "hsl(210 40% 98%)",
                fontSize: 12,
              }}
              formatter={(val: number, name: string) => [
                val,
                name === "value" ? SENSOR_LABELS[activeSensor] : "Expected",
              ]}
            />

            {/* Anomaly background shading */}
            {anomalyRegions.map((region, idx) => (
              <ReferenceArea
                key={idx}
                x1={region.start}
                x2={region.end}
                fill="hsl(0 72% 55%)"
                fillOpacity={0.08}
              />
            ))}

            {/* Expected baseline */}
            <ReferenceLine
              y={expected}
              stroke="hsl(215 20% 50%)"
              strokeDasharray="5 5"
              label={{ value: "μ", fill: "hsl(215 20% 55%)", fontSize: 10, position: "insideTopRight" }}
            />
            {/* ±2σ bands */}
            <ReferenceLine y={expected + 2 * stdVal} stroke="hsl(38 92% 55% / 0.4)" strokeDasharray="3 3" />
            <ReferenceLine y={expected - 2 * stdVal} stroke="hsl(38 92% 55% / 0.4)" strokeDasharray="3 3" />

            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              isAnimationActive={true}
              animationDuration={300}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                if (payload.isChangepoint) {
                  return <polygon key={props.index} points={`${cx},${cy-7} ${cx+6},${cy+4} ${cx-6},${cy+4}`} fill="hsl(260 60% 65%)" />;
                }
                if (payload.isAnomaly) {
                  return <circle key={props.index} cx={cx} cy={cy} r={5} fill="hsl(0 72% 55%)" stroke="hsl(0 72% 70%)" strokeWidth={1.5} style={{ filter: "drop-shadow(0 0 4px hsl(0 72% 55%))" }} />;
                }
                return <circle key={props.index} cx={cx} cy={cy} r={2} fill={color} />;
              }}
              activeDot={{ r: 6, fill: color }}
            />
            <Line type="monotone" dataKey="expected" stroke="hsl(215 20% 45%)" strokeWidth={1} strokeDasharray="4 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
