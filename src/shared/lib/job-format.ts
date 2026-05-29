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

const JOB_LEVEL_LABELS: Record<string, string> = {
  intern: "Intern",
  junior: "Junior",
  mid: "Middle",
  senior: "Senior",
  lead: "Lead",
};

const EMPLOYMENT_TYPE_ALIASES: Record<string, string> = {
  ALL: "Tất cả",
  FULL_TIME: "Full-time",
  PARTTIME: "Part-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  TEMPORARY: "Temporary",
  VOLUNTEER: "Volunteer",
  REMOTE: "Remote",
  HYBRID: "Hybrid",
  FREELANCE: "Freelance",
};

export function formatJobLevel(value?: string | null) {
  if (!value) return "Chưa cập nhật.";

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return JOB_LEVEL_LABELS[normalized] ?? toTitleCase(value);
}

export function formatEmploymentType(value?: string | null) {
  if (!value) return "Chưa cập nhật.";

  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  const compact = normalized.replace(/_/g, "");
  return (
    EMPLOYMENT_TYPE_ALIASES[normalized] ??
    EMPLOYMENT_TYPE_ALIASES[compact] ??
    JOB_TYPE_LABELS[normalized as JobType] ??
    toTitleCase(value)
  );
}

export function formatWorkMode(value?: string | null) {
  if (!value) return "Chưa cập nhật.";

  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  return WORK_MODE_LABELS[normalized as WorkMode] ?? toTitleCase(value);
}

export function formatWorkStyle(value?: string | null) {
  if (!value) return "Chưa cập nhật";

  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  return WORK_STYLE_LABELS[normalized as WorkStyle] ?? toTitleCase(value);
}

export function formatExperienceType(value?: string | null) {
  if (!value) return "Chưa cập nhật";

  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  return (
    EXPERIENCE_TYPE_LABELS[normalized as ExperienceType] ?? toTitleCase(value)
  );
}
