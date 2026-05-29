export type ScoreBand = "excellent" | "good" | "average" | "low" | "veryLow";

export const SCORE_RING_TRACK_COLOR = "#e9e7ff";

export function clampScore(value?: number | null) {
  return Math.max(0, Math.min(100, Math.round(value ?? 0)));
}

export function getScoreBand(score: number): ScoreBand {
  const clamped = clampScore(score);

  if (clamped >= 85) return "excellent";
  if (clamped >= 70) return "good";
  if (clamped >= 50) return "average";
  if (clamped >= 30) return "low";
  return "veryLow";
}

export function getScoreColor(score: number) {
  const colors: Record<ScoreBand, string> = {
    excellent: "#16a34a",
    good: "#2563eb",
    average: "#f59e0b",
    low: "#f97316",
    veryLow: "#ef4444",
  };

  return colors[getScoreBand(score)];
}

export function getScoreLabel(score: number) {
  const labels: Record<ScoreBand, string> = {
    excellent: "Rất phù hợp",
    good: "Phù hợp",
    average: "Trung bình",
    low: "Thấp",
    veryLow: "Rất thấp",
  };

  return labels[getScoreBand(score)];
}

export function getScoreTone(score: number) {
  const band = getScoreBand(score);

  if (band === "excellent") return "success";
  if (band === "good") return "info";
  if (band === "average" || band === "low") return "warning";
  return "danger";
}
