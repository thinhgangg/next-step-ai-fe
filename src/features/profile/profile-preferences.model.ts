import { useEffect, useState } from "react";

export type ProfilePreferences = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  currentRole: string;
  experienceYears: number | null;
  targetSalaryMin: number | null;
  targetSalaryMax: number | null;
  workStyle: "ONSITE" | "HYBRID" | "REMOTE" | "HYBRID_OR_REMOTE";
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  skills: string[];
  suggestedImprovements: {
    id: string;
    title: string;
    status: "done" | "warning" | "todo";
  }[];
  experiences: {
    id: string;
    title: string;
    organization: string;
    type: "WORK" | "INTERNSHIP" | "PROJECT" | "FREELANCE" | "EDUCATION";
    startDate?: string | null;
    endDate?: string | null;
    isCurrent?: boolean | null;
    description?: string | null;
    technologies?: string[] | null;
  }[];
  careerGoals: {
    targetRole?: string | null;
    preferredLocation?: string | null;
    workStyle?: "ONSITE" | "HYBRID" | "REMOTE" | "HYBRID_OR_REMOTE" | null;
    goal?: string | null;
  };
};

type SessionUser = {
  userId?: string | null;
  name?: string | null;
  email?: string | null;
  currentRole?: string | null;
  location?: string | null;
  experienceYears?: number | null;
  targetSalaryMin?: number | null;
  targetSalaryMax?: number | null;
  phone?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  skills?: string[] | null;
  suggestedImprovements?: ProfilePreferences["suggestedImprovements"] | null;
  experiences?: ProfilePreferences["experiences"] | null;
  careerGoals?: ProfilePreferences["careerGoals"] | null;
};

export function getDefaultProfilePreferences(
  user?: SessionUser | null,
): ProfilePreferences {
  const careerGoals = user?.careerGoals ?? {};

  return {
    fullName: user?.name?.trim() || "",
    email: user?.email?.trim() || "",
    phone: user?.phone?.trim() || "",
    location:
      user?.location?.trim() ||
      careerGoals.preferredLocation?.trim() ||
      "",
    currentRole:
      user?.currentRole?.trim() || careerGoals.targetRole?.trim() || "",
    experienceYears: user?.experienceYears ?? null,
    targetSalaryMin: user?.targetSalaryMin ?? null,
    targetSalaryMax: user?.targetSalaryMax ?? null,
    workStyle: careerGoals.workStyle || "HYBRID_OR_REMOTE",
    linkedinUrl: user?.linkedinUrl?.trim() || "",
    githubUrl: user?.githubUrl?.trim() || "",
    portfolioUrl: user?.portfolioUrl?.trim() || "",
    skills: user?.skills ?? [],
    suggestedImprovements: user?.suggestedImprovements ?? [],
    experiences: user?.experiences ?? [],
    careerGoals: {
      targetRole: careerGoals.targetRole || user?.currentRole || "",
      preferredLocation:
        careerGoals.preferredLocation || user?.location || "",
      workStyle: careerGoals.workStyle || "HYBRID_OR_REMOTE",
      goal: careerGoals.goal || "",
    },
  };
}

export function formatWorkStyle(
  workStyle?: ProfilePreferences["workStyle"] | null,
) {
  const labels: Record<ProfilePreferences["workStyle"], string> = {
    ONSITE: "On-site",
    HYBRID: "Hybrid",
    REMOTE: "Remote",
    HYBRID_OR_REMOTE: "Hybrid or remote",
  };

  return workStyle ? labels[workStyle] : "Not provided";
}

export function formatSalaryRange(profile: ProfilePreferences) {
  if (profile.targetSalaryMin && profile.targetSalaryMax) {
    return `${profile.targetSalaryMin} - ${profile.targetSalaryMax}M VND`;
  }

  if (profile.targetSalaryMin) return `From ${profile.targetSalaryMin}M VND`;
  if (profile.targetSalaryMax) return `Up to ${profile.targetSalaryMax}M VND`;

  return "Not provided";
}

export function useProfilePreferences(user?: SessionUser | null) {
  const [profile, setProfile] = useState<ProfilePreferences>(() =>
    getDefaultProfilePreferences(user),
  );

  useEffect(() => {
    setProfile(getDefaultProfilePreferences(user));
  }, [user]);

  return {
    profile,
    setProfile,
  };
}
