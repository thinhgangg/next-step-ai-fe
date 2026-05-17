import {
  EXPERIENCE_TYPE_LABELS,
  JOB_TYPE_LABELS,
  WORK_MODE_LABELS,
  WORK_STYLE_LABELS,
  type ExperienceType,
  type JobType,
  type WorkMode,
  type WorkStyle,
} from "@/shared/lib/job-options";

function toTitleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function formatJobLevel(value?: string | null) {
  if (!value) return "Not provided.";

  return toTitleCase(value);
}

export function formatEmploymentType(value?: string | null) {
  if (!value) return "Not provided.";

  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return JOB_TYPE_LABELS[normalized as JobType] ?? toTitleCase(value);
}

export function formatWorkMode(value?: string | null) {
  if (!value) return "Not provided.";

  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return WORK_MODE_LABELS[normalized as WorkMode] ?? toTitleCase(value);
}

export function formatWorkStyle(value?: string | null) {
  if (!value) return "Not provided";

  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return WORK_STYLE_LABELS[normalized as WorkStyle] ?? toTitleCase(value);
}

export function formatExperienceType(value?: string | null) {
  if (!value) return null;

  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return EXPERIENCE_TYPE_LABELS[normalized as ExperienceType] ?? toTitleCase(value);
}
