// ─── SKAB Dataset Types ───────────────────────────────────────────────────────

export interface SKABRecord {
  dt: string;
  a1: number;   // Accelerometer1RMS
  a2: number;   // Accelerometer2RMS
  cur: number;  // Current
  pres: number; // Pressure
  temp: number; // Temperature
  thermo: number; // Thermocouple
  volt: number; // Voltage
  flow: number; // Volume Flow RateRMS
  anom: number; // 0 or 1
  cp: number;   // changepoint 0 or 1
  src: string;  // e.g. "valve1/0"
}

export interface SKABBaselines {
  [sensor: string]: { mean: number; std: number };
}

export interface SKABDataset {
  baselines: SKABBaselines;
  records: SKABRecord[];
}

// ─── SensorData (dashboard row) ──────────────────────────────────────────────

export type SensorName =
  | "Accelerometer1RMS"
  | "Accelerometer2RMS"
  | "Current"
  | "Pressure"
  | "Temperature"
  | "Thermocouple"
  | "Voltage"
  | "VolumeFlowRateRMS";

export const SENSOR_LABELS: Record<SensorName, string> = {
  Accelerometer1RMS: "Accel 1",
  Accelerometer2RMS: "Accel 2",
  Current: "Current (A)",
  Pressure: "Pressure",
  Temperature: "Temp (°C)",
  Thermocouple: "Thermocouple",
  Voltage: "Voltage (V)",
  VolumeFlowRateRMS: "Flow Rate",
};

export const SENSOR_UNITS: Record<SensorName, string> = {
  Accelerometer1RMS: "RMS",
  Accelerometer2RMS: "RMS",
  Current: "A",
  Pressure: "bar",
  Temperature: "°C",
  Thermocouple: "°C",
  Voltage: "V",
  VolumeFlowRateRMS: "L/min",
};

export const ALL_SENSORS: SensorName[] = [
  "Accelerometer1RMS",
  "Accelerometer2RMS",
  "Current",
  "Pressure",
  "Temperature",
  "Thermocouple",
  "Voltage",
  "VolumeFlowRateRMS",
];

// Legacy alias for components that use SENSOR_IDS
export const SENSOR_IDS = ALL_SENSORS;

export interface SensorReading {
  sensor: SensorName;
  datetime: string;
  value: number;
  expected: number;
  std: number;
  deviation: number;
  zScore: number;         // classical anomaly score
  quantumScore: number;   // simulated quantum score
  status: "Normal" | "Anomaly" | "Changepoint";
  source: string;
  action: string;
}

// One dashboard row = full snapshot of all 8 sensors at a timestamp
export interface DashboardRow {
  datetime: string;
  source: string;
  isAnomaly: boolean;
  isChangepoint: boolean;
  readings: Record<SensorName, SensorReading>;
}

// ─── Dataset cache ────────────────────────────────────────────────────────────

let _dataset: SKABDataset | null = null;
let _playbackIndex = 0;

export async function loadDataset(): Promise<SKABDataset> {
  if (_dataset) return _dataset;
  const res = await fetch("/skab_data.json");
  if (!res.ok) throw new Error("Failed to load SKAB dataset");
  _dataset = await res.json() as SKABDataset;
  _playbackIndex = 0;
  return _dataset;
}

export function getDataset(): SKABDataset | null {
  return _dataset;
}

export function resetPlayback() {
  _playbackIndex = 0;
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

function zScore(value: number, mean: number, std: number): number {
  if (std === 0) return 0;
  return Math.abs(value - mean) / std;
}

function quantumScore(z: number, value: number, mean: number): number {
  const phase = Math.sin(value * 0.5) * 0.3;
  const entanglement = Math.cos((value - mean) * 0.8) * 0.2;
  const noise = (Math.sin(value * 127.1 + mean * 311.7) * 0.5) * 0.05;
  return Math.max(0, Math.min(1, z / 5 + phase + entanglement + noise));
}

function getAction(status: string, sensor: SensorName, z: number): string {
  if (status === "Changepoint") return `⚡ Changepoint detected in ${SENSOR_LABELS[sensor]}. Possible process shift.`;
  if (status === "Normal") return "System operating within normal parameters.";
  if (z > 6) return `🔴 CRITICAL: ${SENSOR_LABELS[sensor]} severely out of range. Halt operation.`;
  if (z > 4) return `🟠 WARNING: ${SENSOR_LABELS[sensor]} anomalous. Inspect pump & valve immediately.`;
  return `🟡 NOTICE: Minor deviation in ${SENSOR_LABELS[sensor]}. Monitor closely.`;
}

// ─── Convert one SKABRecord → DashboardRow ────────────────────────────────────

export function recordToDashboardRow(record: SKABRecord, baselines: SKABBaselines): DashboardRow {
  const sensorMap: Record<SensorName, number> = {
    Accelerometer1RMS: record.a1,
    Accelerometer2RMS: record.a2,
    Current: record.cur,
    Pressure: record.pres,
    Temperature: record.temp,
    Thermocouple: record.thermo,
    Voltage: record.volt,
    VolumeFlowRateRMS: record.flow,
  };

  const readings = {} as Record<SensorName, SensorReading>;

  for (const sensor of ALL_SENSORS) {
    const bl = baselines[sensor];
    const mean = bl?.mean ?? 0;
    const std = bl?.std ?? 1;
    const value = sensorMap[sensor];
    const z = Math.round(zScore(value, mean, std) * 1000) / 1000;
    const qs = Math.round(quantumScore(z, value, mean) * 1000) / 1000;

    let status: "Normal" | "Anomaly" | "Changepoint" = "Normal";
    if (record.cp === 1) status = "Changepoint";
    else if (record.anom === 1) status = "Anomaly";

    readings[sensor] = {
      sensor,
      datetime: record.dt,
      value: Math.round(value * 10000) / 10000,
      expected: mean,
      std,
      deviation: Math.round((value - mean) * 10000) / 10000,
      zScore: z,
      quantumScore: qs,
      status,
      source: record.src,
      action: getAction(status, sensor, z),
    };
  }

  return {
    datetime: record.dt,
    source: record.src,
    isAnomaly: record.anom === 1,
    isChangepoint: record.cp === 1,
    readings,
  };
}

// ─── Playback: get next N rows from dataset ───────────────────────────────────

export function getNextRows(n: number): DashboardRow[] {
  if (!_dataset) return [];
  const rows: DashboardRow[] = [];
  for (let i = 0; i < n; i++) {
    if (_playbackIndex >= _dataset.records.length) {
      _playbackIndex = 0; // loop
    }
    rows.push(recordToDashboardRow(_dataset.records[_playbackIndex], _dataset.baselines));
    _playbackIndex++;
  }
  return rows;
}

// ─── CSV Export ──────────────────────────────────────────────────────────────

export function exportToCSV(rows: DashboardRow[]): void {
  const headers = ["datetime", "source", "status", ...ALL_SENSORS.map(s => `${s}_value`), ...ALL_SENSORS.map(s => `${s}_zscore`)];
  const lines = rows.map(row => {
    const status = row.isChangepoint ? "Changepoint" : row.isAnomaly ? "Anomaly" : "Normal";
    const values = ALL_SENSORS.map(s => row.readings[s].value);
    const zscores = ALL_SENSORS.map(s => row.readings[s].zScore);
    return [row.datetime, row.source, status, ...values, ...zscores].join(",");
  });
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `skab_export_${new Date().toISOString().slice(0,19).replace(/:/g,"-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Legacy compat (used by InputPanel) ──────────────────────────────────────

export type SensorData = SensorReading & {
  sensor_id: string;
  timestamp: string;
  expected_value: number;
  anomaly_score: number;
  quantum_score: number;
  prediction: number;
  recommended_action: string;
  type: string;
};

export function toSensorData(r: SensorReading): SensorData {
  return {
    ...r,
    sensor_id: r.sensor,
    timestamp: r.datetime,
    expected_value: r.expected,
    anomaly_score: r.zScore,
    quantum_score: r.quantumScore,
    prediction: Math.min(1, r.quantumScore * 0.8 + r.zScore * 0.05),
    recommended_action: r.action,
    type: r.sensor,
  };
}
