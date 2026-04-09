import { useState } from "react";
import { toast } from "sonner";
import { ALL_SENSORS, SENSOR_LABELS, SENSOR_UNITS, recordToDashboardRow, getDataset } from "@/lib/sensorEngine";
import type { DashboardRow, SensorName } from "@/lib/sensorEngine";

interface Props {
  onAddRow: (row: DashboardRow) => void;
}

const DEFAULT_VALUES: Record<SensorName, string> = {
  Accelerometer1RMS: "0.206",
  Accelerometer2RMS: "0.278",
  Current: "1.810",
  Pressure: "0.383",
  Temperature: "90.17",
  Thermocouple: "26.78",
  Voltage: "228.2",
  VolumeFlowRateRMS: "121.7",
};

const SENSOR_KEYS: Record<SensorName, "a1"|"a2"|"cur"|"pres"|"temp"|"thermo"|"volt"|"flow"> = {
  Accelerometer1RMS: "a1",
  Accelerometer2RMS: "a2",
  Current: "cur",
  Pressure: "pres",
  Temperature: "temp",
  Thermocouple: "thermo",
  Voltage: "volt",
  VolumeFlowRateRMS: "flow",
};

export default function ManualInputPanel({ onAddRow }: Props) {
  const [values, setValues] = useState<Record<SensorName, string>>(DEFAULT_VALUES);
  const [isAnomaly, setIsAnomaly] = useState(false);
  const [isChangepoint, setIsChangepoint] = useState(false);
  const [source, setSource] = useState("manual");
  const [open, setOpen] = useState(false);

  const handleSubmit = () => {
    const dataset = getDataset();
    if (!dataset) {
      toast.error("Dataset not loaded yet");
      return;
    }

    // Validate all fields are numbers
    for (const sensor of ALL_SENSORS) {
      if (isNaN(parseFloat(values[sensor]))) {
        toast.error(`Invalid value for ${SENSOR_LABELS[sensor]}`);
        return;
      }
    }

    const record = {
      dt: new Date().toISOString().replace("T", " ").slice(0, 19),
      a1: parseFloat(values.Accelerometer1RMS),
      a2: parseFloat(values.Accelerometer2RMS),
      cur: parseFloat(values.Current),
      pres: parseFloat(values.Pressure),
      temp: parseFloat(values.Temperature),
      thermo: parseFloat(values.Thermocouple),
      volt: parseFloat(values.Voltage),
      flow: parseFloat(values.VolumeFlowRateRMS),
      anom: isAnomaly ? 1 : 0,
      cp: isChangepoint ? 1 : 0,
      src: source || "manual",
    };

    const row = recordToDashboardRow(record, dataset.baselines);
    onAddRow(row);
    toast.success("✅ Manual reading added to dashboard");
  };

  const handleReset = () => setValues(DEFAULT_VALUES);

  return (
    <div
      className="glass-panel rounded-xl animate-fade-in-up"
      style={{ animationDelay: "360ms" }}
    >
      {/* Header / toggle */}
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="text-primary">＋</span> Manual Sensor Input
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Inject a custom reading directly into the dashboard
          </p>
        </div>
        <span
          className="text-muted-foreground text-lg transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-5 border-t border-border pt-4">
          {/* Sensor values grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ALL_SENSORS.map(sensor => (
              <div key={sensor} className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {SENSOR_LABELS[sensor]}
                  <span className="ml-1 opacity-60">({SENSOR_UNITS[sensor]})</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={values[sensor]}
                  onChange={e => setValues(prev => ({ ...prev, [sensor]: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg text-sm font-mono text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/50"
                  style={{
                    background: "hsl(220 15% 20%)",
                    border: "1px solid hsl(220 15% 28%)",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1 flex-1 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">Source label</label>
              <input
                type="text"
                value={source}
                onChange={e => setSource(e.target.value)}
                placeholder="e.g. valve1/0"
                className="w-full px-3 py-1.5 rounded-lg text-sm text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary/50"
                style={{
                  background: "hsl(220 15% 20%)",
                  border: "1px solid hsl(220 15% 28%)",
                }}
              />
            </div>

            <div className="flex gap-5 pb-1">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={isAnomaly}
                  onChange={e => { setIsAnomaly(e.target.checked); if (e.target.checked) setIsChangepoint(false); }}
                  className="accent-red-500 w-4 h-4"
                />
                <span className="text-destructive font-medium">Anomaly</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={isChangepoint}
                  onChange={e => { setIsChangepoint(e.target.checked); if (e.target.checked) setIsAnomaly(false); }}
                  className="w-4 h-4"
                  style={{ accentColor: "hsl(260 60% 65%)" }}
                />
                <span style={{ color: "hsl(260 60% 75%)" }} className="font-medium">Changepoint</span>
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: "linear-gradient(135deg, hsl(170 80% 45%), hsl(170 80% 38%))",
                color: "hsl(220 20% 10%)",
                boxShadow: "0 0 16px hsl(170 80% 50% / 0.2)",
              }}
            >
              Inject Reading →
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              style={{ background: "hsl(220 15% 20%)", border: "1px solid hsl(220 15% 28%)" }}
            >
              Reset defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
