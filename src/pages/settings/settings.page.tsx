import { useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  BriefcaseBusiness,
  ChevronDown,
  Link as LinkIcon,
  Plus,
  Save,
  Search,
  Sparkles,
  Target,
  Trash2,
  X,
  User,
} from "lucide-react";
import { AppShell } from "@/shared/ui/app-shell";
import { ME_QUERY } from "@/features/auth/query/me.query";
import { useSession } from "@/features/auth/session/session.model";
import {
  type ProfilePreferences,
  useProfilePreferences,
} from "@/features/profile/profile-preferences.model";
import { useAvatarFile } from "@/features/profile/avatar.model";
import {
  CONFIRM_AVATAR_UPLOAD_MUTATION,
  GET_AVATAR_UPLOAD_URL_MUTATION,
  UPDATE_USER_PROFILE_MUTATION,
} from "@/features/profile/update-profile.mutation";
import { GET_ALL_SKILLS_QUERY } from "@/features/profile/skills.query";

type SkillOption = {
  skillId: string;
  name: string;
  isActive: boolean;
};

type GetAllSkillsResponse = {
  getAllSkills: SkillOption[];
};

type ProfileExperience = ProfilePreferences["experiences"][number];

function PageCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-border bg-card shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  readOnly = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
        className={`mt-2 h-10 w-full rounded-lg border border-border px-3 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 ${
          readOnly ? "bg-muted/50" : "bg-background"
        }`}
      />
    </label>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
}) {
  return (
    <TextInput
      type="number"
      label={label}
      value={value === null ? "" : String(value)}
      placeholder={placeholder}
      onChange={(nextValue) =>
        onChange(nextValue.trim() ? Number(nextValue) : null)
      }
    />
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { user } = useSession();
  const { profile, setProfile } = useProfilePreferences(user);
  const { avatarSrc } = useAvatarFile(user?.avatar);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [skillSearch, setSkillSearch] = useState("");
  const [avatarUploadMessage, setAvatarUploadMessage] = useState<string | null>(
    null,
  );
  const [expandedExperienceIds, setExpandedExperienceIds] = useState<
    Set<string>
  >(() => new Set());
  const { data: skillsData, loading: areSkillsLoading } =
    useQuery<GetAllSkillsResponse>(GET_ALL_SKILLS_QUERY);

  const [updateUserProfile, { loading: isSaving }] = useMutation(
    UPDATE_USER_PROFILE_MUTATION,
    {
      refetchQueries: [{ query: ME_QUERY }],
      awaitRefetchQueries: true,
    },
  );
  const [getAvatarUploadUrl, { loading: isPreparingAvatarUpload }] =
    useMutation(GET_AVATAR_UPLOAD_URL_MUTATION);
  const [confirmAvatarUpload, { loading: isConfirmingAvatarUpload }] =
    useMutation(CONFIRM_AVATAR_UPLOAD_MUTATION, {
      refetchQueries: [{ query: ME_QUERY }],
      awaitRefetchQueries: true,
    });

  const updateProfileField = <K extends keyof ProfilePreferences>(
    field: K,
    value: ProfilePreferences[K],
  ) => {
    setStatusMessage(null);
    setProfile({ ...profile, [field]: value });
  };

  const updateCareerGoal = (
    field: keyof ProfilePreferences["careerGoals"],
    value: string | ProfilePreferences["workStyle"],
  ) => {
    setStatusMessage(null);
    setProfile({
      ...profile,
      careerGoals: {
        ...profile.careerGoals,
        [field]: value || null,
      },
    });
  };

  const updateWorkStyle = (value: ProfilePreferences["workStyle"]) => {
    setStatusMessage(null);
    setProfile({
      ...profile,
      workStyle: value,
      careerGoals: {
        ...profile.careerGoals,
        workStyle: value,
      },
    });
  };

  const normalizeOptionalString = (value: string) => {
    const trimmed = value.trim();
    return trimmed || null;
  };

  const saveProfile = async () => {
    setStatusMessage(null);
    const experiences = profile.experiences.map(
      ({
        id,
        title,
        organization,
        type,
        startDate,
        endDate,
        isCurrent,
        description,
        technologies,
      }) => ({
        id,
        title,
        organization,
        type,
        startDate: normalizeOptionalString(startDate || ""),
        endDate: isCurrent ? null : normalizeOptionalString(endDate || ""),
        isCurrent: Boolean(isCurrent),
        description: normalizeOptionalString(description || ""),
        technologies: technologies ?? [],
      }),
    );

    try {
      await updateUserProfile({
        variables: {
          input: {
            name: profile.fullName,
            currentRole: normalizeOptionalString(profile.currentRole),
            location: normalizeOptionalString(profile.location),
            experienceYears: profile.experienceYears,
            targetSalaryMin: profile.targetSalaryMin,
            targetSalaryMax: profile.targetSalaryMax,
            phone: normalizeOptionalString(profile.phone),
            githubUrl: normalizeOptionalString(profile.githubUrl),
            linkedinUrl: normalizeOptionalString(profile.linkedinUrl),
            portfolioUrl: normalizeOptionalString(profile.portfolioUrl),
            skills: profile.skills,
            experiences,
            careerGoals: {
              targetRole: normalizeOptionalString(
                profile.careerGoals.targetRole || "",
              ),
              preferredLocation: normalizeOptionalString(
                profile.careerGoals.preferredLocation || "",
              ),
              workStyle: profile.careerGoals.workStyle || profile.workStyle,
              goal: normalizeOptionalString(profile.careerGoals.goal || ""),
            },
          },
        },
      });
      setStatusMessage("Profile saved.");
    } catch (error) {
      console.error("Profile save error:", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Could not save profile.";
      setStatusMessage(message);
    }
  };

  const isAvatarUploading = isPreparingAvatarUpload || isConfirmingAvatarUpload;
  const displayName = profile.fullName || "User";
  const avatarFallback = displayName.charAt(0).toUpperCase() || "U";
  const selectedSkillNames = useMemo(
    () => new Set(profile.skills.map((skill) => skill.toLowerCase())),
    [profile.skills],
  );
  const skillOptions = useMemo(() => {
    const query = skillSearch.trim().toLowerCase();

    return (skillsData?.getAllSkills ?? [])
      .filter((skill) => skill.isActive)
      .filter((skill) => !selectedSkillNames.has(skill.name.toLowerCase()))
      .filter((skill) => {
        if (!query) return true;
        return skill.name.toLowerCase().includes(query);
      })
      .slice(0, 13);
  }, [skillSearch, selectedSkillNames, skillsData]);

  const addSkill = (skillName: string) => {
    if (selectedSkillNames.has(skillName.toLowerCase())) return;
    updateProfileField("skills", [...profile.skills, skillName]);
    setSkillSearch("");
  };

  const removeSkill = (skillName: string) => {
    updateProfileField(
      "skills",
      profile.skills.filter((skill) => skill !== skillName),
    );
  };

  const createExperienceId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }

    return `experience-${Date.now()}`;
  };

  const addExperience = () => {
    const nextExperience: ProfileExperience = {
      id: createExperienceId(),
      title: "",
      organization: "",
      type: "WORK",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: "",
      technologies: [],
    };

    updateProfileField("experiences", [...profile.experiences, nextExperience]);
    setExpandedExperienceIds((current) =>
      new Set(current).add(nextExperience.id),
    );
  };

  const updateExperience = <K extends keyof ProfileExperience>(
    id: string,
    field: K,
    value: ProfileExperience[K],
  ) => {
    updateProfileField(
      "experiences",
      profile.experiences.map((experience) =>
        experience.id === id ? { ...experience, [field]: value } : experience,
      ),
    );
  };

  const removeExperience = (id: string) => {
    updateProfileField(
      "experiences",
      profile.experiences.filter((experience) => experience.id !== id),
    );
  };

  const toggleExperience = (id: string) => {
    setExpandedExperienceIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const uploadAvatar = async (file: File) => {
    setAvatarUploadMessage(null);

    if (!file.type.startsWith("image/")) {
      setAvatarUploadMessage("Please choose an image file.");
      return;
    }

    try {
      const { data: presignedData } = await getAvatarUploadUrl({
        variables: { fileName: file.name },
      });
      const uploadTarget = (
        presignedData as
          | {
              getAvatarUploadUrl?: {
                uploadUrl: string;
                fileKey: string;
              };
            }
          | undefined
      )?.getAvatarUploadUrl;

      if (!uploadTarget) {
        setAvatarUploadMessage("Could not prepare avatar upload.");
        return;
      }

      const uploadResponse = await fetch(uploadTarget.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });

      if (!uploadResponse.ok) {
        setAvatarUploadMessage("Avatar upload to storage failed.");
        return;
      }

      await confirmAvatarUpload({
        variables: { fileKey: uploadTarget.fileKey },
      });
      setAvatarUploadMessage("Avatar updated.");
    } catch (error) {
      console.error("Avatar upload error:", error);
      setAvatarUploadMessage("Avatar update failed. Please try again.");
    }
  };

  return (
    <AppShell fullWidth>
      <div className="mx-auto max-w-[1480px] space-y-5">
        <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Account data
            </p>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Settings
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Manage the information used to personalize your job matches and
              recommendations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {statusMessage ? (
              <span className="text-sm font-medium text-muted-foreground">
                {statusMessage}
              </span>
            ) : null}
            <button
              onClick={saveProfile}
              disabled={isSaving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <PageCard className="p-5">
              <SectionHeader
                icon={User}
                title="Account information"
                description="Your basic profile and contact information."
              />
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput
                  label="Full name"
                  value={profile.fullName}
                  onChange={(value) => updateProfileField("fullName", value)}
                  placeholder="Your name"
                />
                <TextInput
                  label="Email"
                  value={profile.email}
                  readOnly
                  placeholder="Email is managed by authentication"
                />
                <TextInput
                  label="Phone"
                  value={profile.phone}
                  onChange={(value) => updateProfileField("phone", value)}
                  placeholder="Phone number"
                />
                <TextInput
                  label="Location"
                  value={profile.location}
                  onChange={(value) => updateProfileField("location", value)}
                  placeholder="City, country"
                />
              </div>
            </PageCard>

            <PageCard className="p-5">
              <SectionHeader
                icon={BriefcaseBusiness}
                title="Career information"
                description="Your role, experience level, salary expectation, and work style."
              />
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput
                  label="Current role"
                  value={profile.currentRole}
                  onChange={(value) => updateProfileField("currentRole", value)}
                  placeholder="Backend Engineer"
                />
                <NumberInput
                  label="Experience years"
                  value={profile.experienceYears}
                  onChange={(value) =>
                    updateProfileField("experienceYears", value)
                  }
                  placeholder="3"
                />
                <NumberInput
                  label="Target salary min"
                  value={profile.targetSalaryMin}
                  onChange={(value) =>
                    updateProfileField("targetSalaryMin", value)
                  }
                  placeholder="40"
                />
                <NumberInput
                  label="Target salary max"
                  value={profile.targetSalaryMax}
                  onChange={(value) =>
                    updateProfileField("targetSalaryMax", value)
                  }
                  placeholder="60"
                />
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Work style
                  </span>
                  <select
                    value={profile.workStyle}
                    onChange={(event) => {
                      const value = event.target
                        .value as ProfilePreferences["workStyle"];
                      updateWorkStyle(value);
                    }}
                    className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                  >
                    <option value="ONSITE">On-site</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="REMOTE">Remote</option>
                    <option value="HYBRID_OR_REMOTE">Hybrid or remote</option>
                  </select>
                </label>
              </div>
            </PageCard>

            <PageCard className="p-5">
              <SectionHeader
                icon={LinkIcon}
                title="Links and skills"
                description="Add your professional links and key skills."
              />
              <div className="grid gap-4 md:grid-cols-3">
                <TextInput
                  label="GitHub URL"
                  value={profile.githubUrl}
                  onChange={(value) => updateProfileField("githubUrl", value)}
                  placeholder="https://github.com/..."
                />
                <TextInput
                  label="LinkedIn URL"
                  value={profile.linkedinUrl}
                  onChange={(value) => updateProfileField("linkedinUrl", value)}
                  placeholder="https://linkedin.com/in/..."
                />
                <TextInput
                  label="Portfolio URL"
                  value={profile.portfolioUrl}
                  onChange={(value) =>
                    updateProfileField("portfolioUrl", value)
                  }
                  placeholder="https://..."
                />
              </div>
              <div className="mt-4">
                <span className="text-sm font-medium text-muted-foreground">
                  Skills
                </span>
                <div className="mt-2 rounded-xl border border-border bg-background p-3">
                  {profile.skills.length ? (
                    <div className="mb-3 flex flex-wrap gap-2 border-b border-border pb-3">
                      {profile.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1.5 text-sm font-semibold text-primary"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="rounded-md hover:bg-primary/10"
                            aria-label={`Remove ${skill}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={skillSearch}
                      onChange={(event) => setSkillSearch(event.target.value)}
                      placeholder={
                        areSkillsLoading ? "Loading skills..." : "Search skills"
                      }
                      className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                    />
                  </div>

                  <div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                    {skillOptions.map((skill) => (
                      <button
                        key={skill.skillId}
                        type="button"
                        onClick={() => addSkill(skill.name)}
                        className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-medium text-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                      >
                        {skill.name}
                      </button>
                    ))}
                    {!areSkillsLoading && !skillOptions.length ? (
                      <span className="text-sm text-muted-foreground">
                        No matching skills.
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </PageCard>

            <PageCard className="p-5">
              <SectionHeader
                icon={Target}
                title="Career goals"
                description="Tell us what roles, locations, and goals you are aiming for."
              />
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput
                  label="Target role"
                  value={profile.careerGoals.targetRole || ""}
                  onChange={(value) => updateCareerGoal("targetRole", value)}
                  placeholder="Senior Backend Engineer"
                />
                <TextInput
                  label="Preferred location"
                  value={profile.careerGoals.preferredLocation || ""}
                  onChange={(value) =>
                    updateCareerGoal("preferredLocation", value)
                  }
                  placeholder="Ho Chi Minh City"
                />
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Goal
                  </span>
                  <textarea
                    value={profile.careerGoals.goal || ""}
                    onChange={(event) =>
                      updateCareerGoal("goal", event.target.value)
                    }
                    rows={3}
                    placeholder="Describe your career goal"
                    className="mt-2 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                  />
                </label>
              </div>
            </PageCard>

            <PageCard className="p-5">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <SectionHeader
                  icon={BriefcaseBusiness}
                  title="Experiences"
                  description="Add work, internship, project, freelance, or education experience."
                />
                <button
                  type="button"
                  onClick={addExperience}
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 text-sm font-semibold text-primary hover:bg-primary/15"
                >
                  <Plus className="h-4 w-4" />
                  Add experience
                </button>
              </div>

              {profile.experiences.length ? (
                <div className="space-y-4">
                  {profile.experiences.map((experience, index) => {
                    const isExpanded = expandedExperienceIds.has(experience.id);

                    return (
                      <div
                        key={experience.id}
                        className="overflow-hidden rounded-xl border border-border bg-background/50"
                      >
                        <button
                          type="button"
                          onClick={() => toggleExperience(experience.id)}
                          className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-muted/40"
                        >
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-bold text-foreground">
                              {experience.title || `Experience ${index + 1}`}
                            </h3>

                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {[experience.organization, experience.type]
                                .filter(Boolean)
                                .join(" · ") || "Add organization and type"}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-3">
                            <ChevronDown
                              className={`h-4 w-4 text-muted-foreground transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </button>

                        {isExpanded ? (
                          <div className="border-t border-border p-4">
                            <div className="mb-4 flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => removeExperience(experience.id)}
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-destructive/20 bg-card px-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                                Remove
                              </button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <TextInput
                                label="Title"
                                value={experience.title}
                                onChange={(value) =>
                                  updateExperience(
                                    experience.id,
                                    "title",
                                    value,
                                  )
                                }
                                placeholder="Backend Engineer"
                              />

                              <TextInput
                                label="Organization"
                                value={experience.organization}
                                onChange={(value) =>
                                  updateExperience(
                                    experience.id,
                                    "organization",
                                    value,
                                  )
                                }
                                placeholder="Company or school"
                              />

                              <label className="block">
                                <span className="text-sm font-medium text-muted-foreground">
                                  Type
                                </span>
                                <select
                                  value={experience.type}
                                  onChange={(event) =>
                                    updateExperience(
                                      experience.id,
                                      "type",
                                      event.target
                                        .value as ProfileExperience["type"],
                                    )
                                  }
                                  className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                                >
                                  <option value="WORK">Work</option>
                                  <option value="INTERNSHIP">Internship</option>
                                  <option value="PROJECT">Project</option>
                                  <option value="FREELANCE">Freelance</option>
                                  <option value="EDUCATION">Education</option>
                                </select>
                              </label>

                              <label className="flex items-end gap-2 pb-2">
                                <input
                                  type="checkbox"
                                  checked={Boolean(experience.isCurrent)}
                                  onChange={(event) =>
                                    updateExperience(
                                      experience.id,
                                      "isCurrent",
                                      event.target.checked,
                                    )
                                  }
                                  className="h-4 w-4 rounded border-border [accent-color:var(--primary)] focus:ring-primary/20"
                                />
                                <span className="text-sm font-medium text-foreground">
                                  Current experience
                                </span>
                              </label>

                              <TextInput
                                label="Start date"
                                value={experience.startDate || ""}
                                onChange={(value) =>
                                  updateExperience(
                                    experience.id,
                                    "startDate",
                                    value,
                                  )
                                }
                                placeholder="2024-01"
                              />

                              <TextInput
                                label="End date"
                                value={experience.endDate || ""}
                                onChange={(value) =>
                                  updateExperience(
                                    experience.id,
                                    "endDate",
                                    value,
                                  )
                                }
                                placeholder="2025-12"
                                readOnly={Boolean(experience.isCurrent)}
                              />
                            </div>

                            <label className="mt-4 block">
                              <span className="text-sm font-medium text-muted-foreground">
                                Description
                              </span>
                              <textarea
                                value={experience.description || ""}
                                onChange={(event) =>
                                  updateExperience(
                                    experience.id,
                                    "description",
                                    event.target.value,
                                  )
                                }
                                rows={3}
                                placeholder="Describe responsibilities, outcomes, or project scope."
                                className="mt-2 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                              />
                            </label>

                            <label className="mt-4 block">
                              <span className="text-sm font-medium text-muted-foreground">
                                Technologies
                              </span>
                              <input
                                value={(experience.technologies ?? []).join(
                                  ", ",
                                )}
                                onChange={(event) =>
                                  updateExperience(
                                    experience.id,
                                    "technologies",
                                    event.target.value
                                      .split(",")
                                      .map((technology) => technology.trim())
                                      .filter(Boolean),
                                  )
                                }
                                placeholder="React, NestJS, PostgreSQL"
                                className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                              />
                            </label>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-background/50 p-5 text-sm text-muted-foreground">
                  No experiences saved yet.
                </div>
              )}
            </PageCard>
          </div>

          <div className="space-y-5">
            <PageCard className="p-5">
              <SectionHeader
                icon={User}
                title="Avatar"
                description="Upload a new profile photo."
              />

              <div className="flex flex-col items-center">
                <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-primary/20 bg-primary/10 text-5xl font-black text-primary">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    avatarFallback
                  )}
                </div>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) void uploadAvatar(file);
                  }}
                />

                <p className="mt-4 text-center text-sm text-muted-foreground">
                  JPG, PNG, or GIF. Max 5MB.
                </p>

                {avatarUploadMessage ? (
                  <p className="mt-2 text-center text-sm font-medium text-muted-foreground">
                    {avatarUploadMessage}
                  </p>
                ) : null}

                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isAvatarUploading}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg border border-primary/30 bg-card px-4 text-sm font-semibold text-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                >
                  {isAvatarUploading ? "Uploading..." : "Change photo"}
                </button>
              </div>
            </PageCard>

            <PageCard className="p-5">
              <h2 className="text-base font-bold text-foreground">
                Profile summary
              </h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2">
                  <span className="text-muted-foreground">Skills</span>
                  <span className="font-semibold text-foreground">
                    {profile.skills.length}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2">
                  <span className="text-muted-foreground">Experiences</span>
                  <span className="font-semibold text-foreground">
                    {profile.experiences.length}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2">
                  <span className="text-muted-foreground">Suggestions</span>
                  <span className="font-semibold text-foreground">
                    {profile.suggestedImprovements.length}
                  </span>
                </div>
              </div>
            </PageCard>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
