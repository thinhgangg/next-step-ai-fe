export const JOB_TYPE_VALUES = [
  "ALL",
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
  "TEMPORARY",
  "VOLUNTEER",
] as const;

export type JobType = (typeof JOB_TYPE_VALUES)[number];
export type EmploymentTypeFilterOption = JobType;

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  ALL: "All",
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  TEMPORARY: "Temporary",
  VOLUNTEER: "Volunteer",
};

export const JOB_TYPE_OPTIONS = JOB_TYPE_VALUES.map((value) => ({
  value,
  label: JOB_TYPE_LABELS[value],
}));

export const JOB_LEVEL_VALUES = [
  "intern",
  "junior",
  "mid",
  "senior",
  "lead",
] as const;

export type JobLevel = (typeof JOB_LEVEL_VALUES)[number];

export const WORK_STYLE_VALUES = [
  "ONSITE",
  "HYBRID",
  "REMOTE",
  "HYBRID_OR_REMOTE",
] as const;

export type WorkStyle = (typeof WORK_STYLE_VALUES)[number];

export const DEFAULT_WORK_STYLE: WorkStyle = "HYBRID_OR_REMOTE";

export const WORK_STYLE_LABELS: Record<WorkStyle, string> = {
  ONSITE: "On-site",
  HYBRID: "Hybrid",
  REMOTE: "Remote",
  HYBRID_OR_REMOTE: "Hybrid or remote",
};

export const WORK_STYLE_OPTIONS = WORK_STYLE_VALUES.map((value) => ({
  value,
  label: WORK_STYLE_LABELS[value],
}));

export const WORK_MODE_VALUES = ["ONSITE", "REMOTE", "HYBRID"] as const;

export type WorkMode = (typeof WORK_MODE_VALUES)[number];

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  ONSITE: "On-site",
  REMOTE: "Remote",
  HYBRID: "Hybrid",
};

export const EXPERIENCE_TYPE_VALUES = [
  "WORK",
  "INTERNSHIP",
  "PROJECT",
  "FREELANCE",
  "EDUCATION",
] as const;

export type ExperienceType = (typeof EXPERIENCE_TYPE_VALUES)[number];

export const EXPERIENCE_TYPE_LABELS: Record<ExperienceType, string> = {
  WORK: "Work",
  INTERNSHIP: "Internship",
  PROJECT: "Project",
  FREELANCE: "Freelance",
  EDUCATION: "Education",
};

export const EXPERIENCE_TYPE_OPTIONS = EXPERIENCE_TYPE_VALUES.map((value) => ({
  value,
  label: EXPERIENCE_TYPE_LABELS[value],
}));
