import { useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  BriefcaseBusiness,
  ChevronDown,
  Link as LinkIcon,
  Plus,
  Save,
  Search,
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
import {
  EXPERIENCE_TYPE_OPTIONS,
  WORK_STYLE_OPTIONS,
} from "@/shared/lib/job-options";
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
  const [technologyInputs, setTechnologyInputs] = useState<
    Record<string, string>
  >({});
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
      setStatusMessage("Hồ sơ đã được lưu.");
    } catch (error) {
      console.error("Profile save error:", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Không thể lưu hồ sơ.";
      setStatusMessage(message);
    }
  };

  const isAvatarUploading = isPreparingAvatarUpload || isConfirmingAvatarUpload;
  const displayName = profile.fullName || "Người dùng";
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
      type: "FULL_TIME",
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

  const parseTechnologies = (value: string) =>
    value
      .split(",")
      .map((technology) => technology.trim())
      .filter(Boolean);

  const getTechnologyInputValue = (experience: ProfileExperience) =>
    technologyInputs[experience.id] ??
    (experience.technologies ?? []).join(", ");

  const updateExperienceTechnologies = (
    experience: ProfileExperience,
    value: string,
  ) => {
    setTechnologyInputs((current) => ({
      ...current,
      [experience.id]: value,
    }));
    updateExperience(experience.id, "technologies", parseTechnologies(value));
  };

  const commitExperienceTechnologies = (experience: ProfileExperience) => {
    const normalizedValue = (experience.technologies ?? []).join(", ");

    setTechnologyInputs((current) => {
      const next = { ...current };
      delete next[experience.id];
      return next;
    });

    updateExperience(
      experience.id,
      "technologies",
      parseTechnologies(normalizedValue),
    );
  };

  const removeExperience = (id: string) => {
    updateProfileField(
      "experiences",
      profile.experiences.filter((experience) => experience.id !== id),
    );
    setTechnologyInputs((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
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
      setAvatarUploadMessage("Vui lòng chọn tệp hình ảnh.");
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
        setAvatarUploadMessage("Không thể chuẩn bị tải lên ảnh đại diện.");
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
        setAvatarUploadMessage("Tải lên ảnh đại diện thất bại.");
        return;
      }

      await confirmAvatarUpload({
        variables: { fileKey: uploadTarget.fileKey },
      });
      setAvatarUploadMessage("Ảnh đại diện đã được cập nhật.");
    } catch (error) {
      console.error("Lỗi tải lên ảnh đại diện:", error);
      setAvatarUploadMessage(
        "Cập nhật ảnh đại diện thất bại. Vui lòng thử lại.",
      );
    }
  };

  const completeness = [
    profile.fullName,
    profile.phone,
    profile.location,
    profile.currentRole,
    profile.githubUrl,
    profile.linkedinUrl,
    profile.careerGoals.targetRole,
    profile.careerGoals.goal,
  ].filter(Boolean).length;

  return (
    <AppShell
      fullWidth
      headerTitle="Cập nhật hồ sơ"
      headerDescription="Chỉnh sửa thông tin cá nhân, kỹ năng và mục tiêu nghề nghiệp để nhận đề xuất chính xác hơn."
    >
      <div className="mx-auto max-w-[1480px]">
        <section className="flex items-center justify-end gap-4 mb-5">
          {statusMessage ? (
            <span className="text-sm font-medium text-muted-foreground">
              {statusMessage}
            </span>
          ) : null}

          <button
            onClick={saveProfile}
            disabled={isSaving}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </section>

        {/* Profile Information */}
        <section className="grid gap-5 xl:grid-cols-[1fr_2fr] xl:items-start">
          <div className="space-y-5">
            {/* Avatar */}
            <PageCard className="p-5">
              <SectionHeader
                icon={User}
                title="Ảnh đại diện"
                description="Cá nhân hóa hồ sơ của bạn."
              />

              <div className="flex flex-col items-center">
                <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-primary/20 bg-primary/10 text-5xl font-extrabold text-primary">
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
                  {isAvatarUploading
                    ? "Đang tải lên..."
                    : "Thay đổi ảnh đại diện"}
                </button>
              </div>
            </PageCard>

            {/* Profile summary */}
            <PageCard className="p-5">
              <h2 className="text-base font-bold text-foreground">
                Tóm tắt hồ sơ
              </h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2">
                  <span className="text-muted-foreground">Kỹ năng</span>
                  <span className="font-semibold text-foreground">
                    {profile.skills.length}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2">
                  <span className="text-muted-foreground">Kinh nghiệm</span>
                  <span className="font-semibold text-foreground">
                    {profile.experiences.length}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2">
                  <span className="text-muted-foreground">Độ hoàn chỉnh</span>
                  <span className="font-semibold text-foreground">
                    {Math.round((completeness / 8) * 100)}%
                  </span>
                </div>
              </div>
            </PageCard>

            {/* Links and skills */}
            <PageCard className="p-5">
              <SectionHeader
                icon={LinkIcon}
                title="Liên kết và kỹ năng"
                description="Thêm các liên kết và kỹ năng chính."
              />
              <div className="space-y-4">
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
                  Kỹ năng
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
                            aria-label={`Xóa ${skill}`}
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
                        areSkillsLoading
                          ? "Đang tải kỹ năng..."
                          : "Tìm kiếm kỹ năng"
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
                        Không có kỹ năng nào phù hợp.
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </PageCard>
          </div>

          {/* Main profile details */}
          <div className="space-y-5">
            {/* Account Information */}
            <PageCard className="p-5">
              <SectionHeader
                icon={User}
                title="Tổng quan hồ sơ"
                description="Thông tin cơ bản và định hướng nghề nghiệp của bạn."
              />
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput
                  label="Họ và tên"
                  value={profile.fullName}
                  onChange={(value) => updateProfileField("fullName", value)}
                  placeholder="Họ và tên"
                />
                <TextInput
                  label="Email"
                  value={profile.email}
                  readOnly
                  placeholder="Email được quản lý bởi hệ thống"
                />
                <TextInput
                  label="Số điện thoại"
                  value={profile.phone}
                  onChange={(value) => updateProfileField("phone", value)}
                  placeholder="Số điện thoại"
                />
                <TextInput
                  label="Địa điểm"
                  value={profile.location}
                  onChange={(value) => updateProfileField("location", value)}
                  placeholder="Đà Nẵng, Việt Nam"
                />
                <TextInput
                  label="Vị trí hiện tại"
                  value={profile.currentRole}
                  onChange={(value) => updateProfileField("currentRole", value)}
                  placeholder="Junior Backend Engineer"
                />
                <NumberInput
                  label="Số năm kinh nghiệm"
                  value={profile.experienceYears}
                  onChange={(value) =>
                    updateProfileField("experienceYears", value)
                  }
                  placeholder="3"
                />
              </div>
            </PageCard>

            {/* Career Goals */}
            <PageCard className="p-5">
              <SectionHeader
                icon={Target}
                title="Mục tiêu nghề nghiệp"
                description="Hãy cho chúng tôi biết những vị trí, địa điểm và mục tiêu bạn đang hướng đến."
              />
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput
                  label="Vị trí mục tiêu"
                  value={profile.careerGoals.targetRole || ""}
                  onChange={(value) => updateCareerGoal("targetRole", value)}
                  placeholder="Senior Backend Engineer"
                />
                <TextInput
                  label="Địa điểm mong muốn"
                  value={profile.careerGoals.preferredLocation || ""}
                  onChange={(value) =>
                    updateCareerGoal("preferredLocation", value)
                  }
                  placeholder="Hà Nội, Việt Nam"
                />
                <NumberInput
                  label="Mức lương mong muốn tối thiểu (triệu VND)"
                  value={profile.targetSalaryMin}
                  onChange={(value) =>
                    updateProfileField("targetSalaryMin", value)
                  }
                  placeholder="20"
                />
                <NumberInput
                  label="Mức lương mong muốn tối đa (triệu VND)"
                  value={profile.targetSalaryMax}
                  onChange={(value) =>
                    updateProfileField("targetSalaryMax", value)
                  }
                  placeholder="30"
                />
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Hình thức làm việc mong muốn
                  </span>
                  <select
                    value={profile.careerGoals.workStyle || profile.workStyle}
                    onChange={(event) =>
                      updateCareerGoal(
                        "workStyle",
                        event.target.value as ProfilePreferences["workStyle"],
                      )
                    }
                    className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                  >
                    {WORK_STYLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Mục tiêu nghề nghiệp chi tiết
                  </span>
                  <textarea
                    value={profile.careerGoals.goal || ""}
                    onChange={(event) =>
                      updateCareerGoal("goal", event.target.value)
                    }
                    rows={3}
                    placeholder="Mô tả mục tiêu nghề nghiệp của bạn"
                    className="mt-2 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                  />
                </label>
              </div>
            </PageCard>

            {/* {Experiences} */}
            <PageCard className="p-5">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <SectionHeader
                  icon={BriefcaseBusiness}
                  title="Kinh nghiệm"
                  description="Thêm kinh nghiệm làm việc, thực tập, dự án, tự do hoặc giáo dục."
                />
                <button
                  type="button"
                  onClick={addExperience}
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 text-sm font-semibold text-primary hover:bg-primary/15"
                >
                  <Plus className="h-4 w-4" />
                  Thêm kinh nghiệm
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
                              {experience.title || `Kinh nghiệm ${index + 1}`}
                            </h3>

                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {[experience.organization, experience.type]
                                .filter(Boolean)
                                .join(" · ") ||
                                "Thêm tổ chức và loại kinh nghiệm"}
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
                                Xóa
                              </button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <TextInput
                                label="Vị trí / vai trò"
                                value={experience.title}
                                onChange={(value) =>
                                  updateExperience(
                                    experience.id,
                                    "title",
                                    value,
                                  )
                                }
                                placeholder="Junior Backend Engineer"
                              />

                              <TextInput
                                label="Tổ chức"
                                value={experience.organization}
                                onChange={(value) =>
                                  updateExperience(
                                    experience.id,
                                    "organization",
                                    value,
                                  )
                                }
                                placeholder="Tên công ty, trường học, dự án, v.v."
                              />

                              <label className="block">
                                <span className="text-sm font-medium text-muted-foreground">
                                  Hình thức
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
                                  {EXPERIENCE_TYPE_OPTIONS.map((option) => (
                                    <option
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </option>
                                  ))}
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
                                  Hiện tại đang làm việc ở đây
                                </span>
                              </label>

                              <TextInput
                                label="Ngày bắt đầu"
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
                                label="Ngày kết thúc"
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
                                Mô tả
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
                                Công nghệ / kỹ năng đã sử dụng
                              </span>
                              <input
                                value={getTechnologyInputValue(experience)}
                                onChange={(event) =>
                                  updateExperienceTechnologies(
                                    experience,
                                    event.target.value,
                                  )
                                }
                                onBlur={() =>
                                  commitExperienceTechnologies(experience)
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
                  Chưa có kinh nghiệm nào được thêm.
                </div>
              )}
            </PageCard>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
