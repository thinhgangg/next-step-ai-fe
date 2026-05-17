import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  BriefcaseBusiness,
  ExternalLink,
  FileText,
  Layers,
  Loader2,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useJobsCatalog } from "@/features/jobs/model/jobs.model";
import { useUserCvs } from "@/features/cv/model/cv.model";
import { useSession } from "@/features/auth/session/session.model";
import type {
  EmploymentTypeFilterOption,
  ExperienceFilterOption,
  JobDateRangeOption,
  JobItem,
  JobSortOption,
} from "@/features/jobs/model/jobs.model";
import { FilterSelect, type SelectOption } from "@/shared/ui/filter-select";
import { getUserFacingErrorMessage } from "@/shared/api/graphql/error-message";
import {
  formatEmploymentType,
  formatJobLevel,
} from "@/shared/lib/job-format";
import { JOB_TYPE_OPTIONS } from "@/shared/lib/job-options";

type SearchMode = "keyword" | "resume";
type DropdownName =
  | "mode"
  | "cv"
  | "date"
  | "type"
  | "experience"
  | "sort"
  | null;
type PaginationItem = number | "...";

type JobsBrowserProps = {
  hasScan: boolean;
  title: string;
  description: string;
  onCreateScan?: () => void;
};

const PAGE_SIZE = 6;

const DATE_OPTIONS: Array<{ value: JobDateRangeOption; label: string }> = [
  { value: "ANY", label: "Any time" },
  { value: "D3", label: "Last 3 days" },
  { value: "D7", label: "Last week" },
  { value: "D30", label: "Last month" },
];

const EXPERIENCE_OPTIONS: Array<{
  value: ExperienceFilterOption;
  label: string;
}> = [
  { value: "ALL", label: "All" },
  { value: "UNDER_1", label: "Under 1 year" },
  { value: "Y1_2", label: "1-2 years" },
  { value: "Y3_5", label: "3-5 years" },
  { value: "Y5_PLUS", label: "5+ years" },
];

const SORT_OPTIONS: Array<{ value: JobSortOption; label: string }> = [
  { value: "RELEVANCE", label: "Relevance" },
  { value: "DATE", label: "Date" },
];

const MODE_OPTIONS: Array<SelectOption<SearchMode>> = [
  {
    value: "keyword",
    label: "Search by keyword",
    description: "Find roles by title, skill, or company.",
    icon: <Search className="h-4 w-4" />,
  },
  {
    value: "resume",
    label: "Use my resume",
    description: "Rank roles by CV fit.",
    icon: <FileText className="h-4 w-4" />,
  },
];

function formatRelativeDate(value?: string | null) {
  if (!value) return "Recently added";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Recently added";

  const diffDays = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24)),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

function formatSalary(job: JobItem): string {
  const { salaryMin, salaryMax, currency = "" } = job;

  if (salaryMin == null && salaryMax == null) return "Negotiable";

  const format = (value: number) => new Intl.NumberFormat().format(value);
  const prefix = currency ? `${currency} ` : "";

  if (salaryMin != null && salaryMax != null) {
    return `${prefix}${format(salaryMin)} - ${format(salaryMax)}`;
  }

  if (salaryMin != null) return `${prefix}${format(salaryMin)}+`;
  return `${prefix}Up to ${format(salaryMax!)}`;
}

function formatApplicationDeadline(value?: string | null) {
  if (!value) return null;

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return null;

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp));
}

function splitTextBlock(value?: string | null) {
  return (
    value
      ?.split(/\r?\n+/)
      .map((line) => line.replace(/\s+$/g, ""))
      .filter(Boolean) ?? []
  );
}

function getFilterButtonLabel<T extends string>(
  value: T,
  defaultLabel: string,
  options: Array<{ value: T; label: string }>,
) {
  return (
    options.find((option) => option.value === value)?.label ?? defaultLabel
  );
}

function buildPaginationItems(
  totalPages: number,
  currentPage: number,
): PaginationItem[] {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);
  const pages = new Set<number>([1, safeTotalPages]);

  for (let page = safeCurrentPage - 1; page <= safeCurrentPage + 1; page += 1) {
    if (page >= 1 && page <= safeTotalPages) pages.add(page);
  }

  if (safeCurrentPage <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }

  if (safeCurrentPage >= safeTotalPages - 2) {
    pages.add(safeTotalPages - 1);
    pages.add(safeTotalPages - 2);
    pages.add(safeTotalPages - 3);
  }

  const sortedPages = [...pages]
    .filter((page) => page >= 1 && page <= safeTotalPages)
    .sort((a, b) => a - b);
  const items: PaginationItem[] = [];

  for (let index = 0; index < sortedPages.length; index += 1) {
    const page = sortedPages[index];
    const prevPage = sortedPages[index - 1];

    if (index > 0) {
      const gap = page - prevPage;
      if (gap === 2) items.push(prevPage + 1);
      if (gap > 2) items.push("...");
    }

    items.push(page);
  }

  return items;
}

function PageCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
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

function EmptyResults({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <PageCard className="px-6 py-12 text-center">
      <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Search className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">
        {description}
      </p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:border-primary hover:text-primary"
        >
          {actionLabel}
        </button>
      ) : null}
    </PageCard>
  );
}

function JobListItem({
  job,
  isSelected,
  onClick,
}: {
  job: JobItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  const skills = job.skills.slice(0, 4);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border p-4 text-left transition ${
        isSelected
          ? "border-primary/40 bg-primary/5 shadow-sm"
          : "border-border bg-card hover:border-primary/25 hover:bg-primary/5"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-sm font-black text-primary">
          {job.company.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-base font-bold text-foreground">
                {job.title}
              </h3>
              <p className="mt-1 line-clamp-1 text-sm font-semibold text-muted-foreground">
                {job.company.name}
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {formatRelativeDate(job.postedAt ?? job.scrapedAt)}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {job.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {job.location}
              </span>
            ) : null}
            {job.level ? (
              <span className="inline-flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                {formatJobLevel(job.level)}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              {formatSalary(job)}
            </span>
          </div>

          {skills.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span
                  key={skill.skillId}
                  className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                >
                  {skill.name}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </button>
  );
}

export function JobsBrowser({
  title,
  description,
  onCreateScan,
}: JobsBrowserProps) {
  const navigate = useNavigate();
  const { user } = useSession();
  const initialSearchParams = new URLSearchParams(window.location.search);
  const initialCvIdValue = Number(initialSearchParams.get("cvId"));
  const initialCvId =
    Number.isFinite(initialCvIdValue) && initialCvIdValue > 0
      ? initialCvIdValue
      : null;
  const initialMode =
    initialSearchParams.get("mode") === "resume" || initialCvId !== null
      ? "resume"
      : "keyword";
  const [hasTouchedSearchMode, setHasTouchedSearchMode] = useState(
    initialMode === "resume" || initialCvId !== null,
  );
  const [searchMode, setSearchMode] = useState<SearchMode>(initialMode);
  const [sortBy, setSortBy] = useState<JobSortOption>("RELEVANCE");
  const [dateRange, setDateRange] = useState<JobDateRangeOption>("ANY");
  const [employmentType, setEmploymentType] =
    useState<EmploymentTypeFilterOption>("ALL");
  const [experienceRange, setExperienceRange] =
    useState<ExperienceFilterOption>("ALL");
  const [openDropdown, setOpenDropdown] = useState<DropdownName>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedLocation, setAppliedLocation] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedCvId, setSelectedCvId] = useState<number | null>(initialCvId);

  const { cvs, loading: isLoadingCvs } = useUserCvs();
  const cvOptions = useMemo(
    () =>
      cvs.map((cv) => ({
        value: String(cv.cvId),
        label: cv.fileName,
        description: cv.uploadedAt
          ? `Uploaded ${formatRelativeDate(cv.uploadedAt).toLowerCase()}`
          : undefined,
        icon: <FileText className="h-4 w-4" />,
      })),
    [cvs],
  );

  const baseCvId = user?.baseCvId ?? null;
  const effectiveSearchMode =
    !hasTouchedSearchMode && baseCvId ? "resume" : searchMode;
  const requestedCvId =
    selectedCvId ?? (!hasTouchedSearchMode ? baseCvId : null);
  const effectiveSelectedCvId = useMemo(() => {
    if (effectiveSearchMode !== "resume") return null;
    if (requestedCvId === null) {
      return cvs.length > 0 ? Number(cvs[0].cvId) : null;
    }

    const selectedExists = cvs.some((cv) => Number(cv.cvId) === requestedCvId);
    if (selectedExists || isLoadingCvs) return requestedCvId;
    return cvs.length > 0 ? Number(cvs[0].cvId) : null;
  }, [cvs, effectiveSearchMode, isLoadingCvs, requestedCvId]);
  const selectedCv = useMemo(
    () => cvs.find((cv) => Number(cv.cvId) === effectiveSelectedCvId) ?? null,
    [cvs, effectiveSelectedCvId],
  );

  const shouldFetch =
    effectiveSearchMode === "keyword" || effectiveSelectedCvId !== null;
  const isKeywordMode = effectiveSearchMode === "keyword";
  const offset = (currentPage - 1) * PAGE_SIZE;

  const { jobs, totalCount, loading, error } = useJobsCatalog({
    search: isKeywordMode ? appliedKeyword.trim() : undefined,
    location: appliedLocation.trim(),
    cvId:
      !isKeywordMode && effectiveSelectedCvId !== null
        ? effectiveSelectedCvId
        : undefined,
    limit: PAGE_SIZE,
    offset,
    sortBy,
    dateRange,
    employmentType,
    experienceRange,
    skip: !shouldFetch,
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const selectedJob = useMemo(
    () => jobs.find((job) => job.jobId === selectedJobId) ?? jobs[0] ?? null,
    [jobs, selectedJobId],
  );

  const handleKeywordSearch = () => {
    setCurrentPage(1);
    setSelectedJobId(null);
    setAppliedKeyword(keywordInput);
    setAppliedLocation(locationInput);
  };

  const handleSearchModeChange = (nextMode: SearchMode) => {
    if (nextMode === effectiveSearchMode) return;

    setHasTouchedSearchMode(true);
    setSearchMode(nextMode);
    setCurrentPage(1);
    setSelectedJobId(null);
    setOpenDropdown(null);

    if (nextMode === "resume") {
      setKeywordInput("");
      setAppliedKeyword("");
      setSelectedCvId(
        (currentCvId) =>
          currentCvId ??
          user?.baseCvId ??
          (cvs[0] ? Number(cvs[0].cvId) : null),
      );
    } else {
      setSelectedCvId(null);
    }
  };

  const handleCvChange = (nextValue: string) => {
    setHasTouchedSearchMode(true);
    setSelectedCvId(Number(nextValue));
    setCurrentPage(1);
    setSelectedJobId(null);
  };

  const handleClearAll = () => {
    setDateRange("ANY");
    setEmploymentType("ALL");
    setExperienceRange("ALL");
    setSortBy("RELEVANCE");
    setCurrentPage(1);
    setSelectedJobId(null);
    setOpenDropdown(null);
  };

  const toggleDropdown = (name: DropdownName) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  const closeDropdown = () => setOpenDropdown(null);

  const handleCreateScan = () => {
    if (onCreateScan) {
      onCreateScan();
      return;
    }

    navigate({ to: "/resume-optimizer" });
  };

  const responsibilities = splitTextBlock(selectedJob?.roleResponsibilities);
  const qualifications = splitTextBlock(selectedJob?.skillsQualifications);
  const benefits = splitTextBlock(selectedJob?.benefits);
  const skills = selectedJob?.skills ?? [];
  const experienceText = selectedJob?.experience?.trim() || null;
  const applicationDeadlineText = formatApplicationDeadline(
    selectedJob?.applicationDeadline,
  );
  const modeLabel = effectiveSearchMode === "keyword" ? "Keywords" : "Resume";
  const cvLabel =
    selectedCv?.fileName ?? (isLoadingCvs ? "Loading CVs" : "Choose CV");
  const modeLeadingIcon =
    effectiveSearchMode === "keyword" ? (
      <Search className="h-4 w-4" />
    ) : (
      <FileText className="h-4 w-4" />
    );
  const dateLabel =
    dateRange === "ANY"
      ? "Date range"
      : getFilterButtonLabel(dateRange, "Date range", DATE_OPTIONS);
  const employmentTypeLabel =
    employmentType === "ALL"
      ? "Employment type"
      : getFilterButtonLabel(
          employmentType,
          "Employment type",
          JOB_TYPE_OPTIONS,
        );
  const experienceLabel =
    experienceRange === "ALL"
      ? "Years of experience"
      : getFilterButtonLabel(
          experienceRange,
          "Years of experience",
          EXPERIENCE_OPTIONS,
        );
  const sortLabel =
    SORT_OPTIONS.find((option) => option.value === sortBy)?.label ??
    "Relevance";

  return (
    <div className="mx-auto max-w-[1480px] space-y-5">
      <section>
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Job discovery
          </p>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </section>

      <PageCard className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label={modeLabel}
            leadingIcon={modeLeadingIcon}
            isOpen={openDropdown === "mode"}
            onToggle={() => toggleDropdown("mode")}
            onClose={closeDropdown}
            options={MODE_OPTIONS}
            onSelect={(value) => handleSearchModeChange(value)}
            selectedValue={effectiveSearchMode}
            menuWidthClass="w-[420px]"
            buttonClassName="h-10 min-w-[120px] text-sm"
          />

          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleKeywordSearch();
            }}
            className="grid min-w-0 flex-1 grid-cols-1 gap-2 font-sans md:grid-cols-[minmax(320px,2fr)_220px_110px]"
          >
            <div className="min-w-0">
              {isKeywordMode ? (
                <input
                  value={keywordInput}
                  onChange={(event) => setKeywordInput(event.target.value)}
                  placeholder="Job title, keywords, or company"
                  className="h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                />
              ) : (
                <FilterSelect
                  label={cvLabel}
                  leadingIcon={<FileText className="h-4 w-4" />}
                  isOpen={openDropdown === "cv"}
                  onToggle={() => toggleDropdown("cv")}
                  onClose={closeDropdown}
                  options={cvOptions}
                  onSelect={handleCvChange}
                  selectedValue={
                    effectiveSelectedCvId !== null
                      ? String(effectiveSelectedCvId)
                      : undefined
                  }
                  menuWidthClass="w-full"
                  menuClassName="max-h-72 overflow-y-auto"
                  buttonClassName="h-10 w-full justify-between text-sm"
                />
              )}
            </div>

            <div className="relative min-w-0">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={locationInput}
                onChange={(event) => setLocationInput(event.target.value)}
                placeholder="Location"
                className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
              />
            </div>

            <button
              type="submit"
              className="h-10 w-full rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Search
            </button>
          </form>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <FilterSelect
            label={dateLabel}
            isOpen={openDropdown === "date"}
            onToggle={() => toggleDropdown("date")}
            onClose={closeDropdown}
            options={DATE_OPTIONS}
            onSelect={(value) => {
              setDateRange(value);
              setCurrentPage(1);
              setSelectedJobId(null);
            }}
            selectedValue={dateRange}
            menuWidthClass="w-40"
          />

          <FilterSelect
            label={employmentTypeLabel}
            isOpen={openDropdown === "type"}
            onToggle={() => toggleDropdown("type")}
            onClose={closeDropdown}
            options={JOB_TYPE_OPTIONS}
            onSelect={(value) => {
              setEmploymentType(value);
              setCurrentPage(1);
              setSelectedJobId(null);
            }}
            selectedValue={employmentType}
            menuWidthClass="w-40"
          />

          <FilterSelect
            label={experienceLabel}
            isOpen={openDropdown === "experience"}
            onToggle={() => toggleDropdown("experience")}
            onClose={closeDropdown}
            options={EXPERIENCE_OPTIONS}
            onSelect={(value) => {
              setExperienceRange(value);
              setCurrentPage(1);
              setSelectedJobId(null);
            }}
            selectedValue={experienceRange}
            menuWidthClass="w-36"
          />

          <button
            type="button"
            onClick={handleClearAll}
            className="rounded-md px-1.5 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear all
          </button>

          <div className="ml-auto">
            <FilterSelect
              label={sortLabel}
              leadingIcon={<ArrowUpDown className="h-3.5 w-3.5" />}
              isOpen={openDropdown === "sort"}
              onToggle={() => toggleDropdown("sort")}
              onClose={closeDropdown}
              options={SORT_OPTIONS}
              onSelect={(value) => {
                setSortBy(value);
                setCurrentPage(1);
                setSelectedJobId(null);
              }}
              selectedValue={sortBy}
              menuWidthClass="w-36"
              align="right"
            />
          </div>
        </div>
      </PageCard>

      {effectiveSearchMode === "resume" && cvs.length === 0 && !isLoadingCvs ? (
        <EmptyResults
          title="No CVs uploaded yet"
          description="Upload a CV to rank jobs by fit."
          actionLabel="Upload CV"
          onAction={handleCreateScan}
        />
      ) : effectiveSearchMode === "resume" &&
        effectiveSelectedCvId === null ? (
        <EmptyResults title="Choose a CV" description="Pick a CV to rank jobs." />
      ) : loading ? (
        <PageCard className="flex min-h-[320px] items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Loading jobs...
          </div>
        </PageCard>
      ) : error ? (
        <EmptyResults
          title="Unable to load jobs"
          description={getUserFacingErrorMessage(error)}
          actionLabel="Try again"
          onAction={handleKeywordSearch}
        />
      ) : jobs.length === 0 ? (
        <EmptyResults
          title="No jobs found"
          description={
            effectiveSearchMode === "keyword"
              ? "Try a different keyword or location to see more jobs."
              : "No matches for this CV yet."
          }
          actionLabel={effectiveSearchMode === "keyword" ? "Clear search" : undefined}
          onAction={
            effectiveSearchMode === "keyword"
              ? () => {
                  setKeywordInput("");
                  setLocationInput("");
                  setAppliedKeyword("");
                  setAppliedLocation("");
                  setCurrentPage(1);
                }
              : undefined
          }
        />
      ) : (
        <section className="grid gap-5 xl:grid-cols-[430px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <p>
                Showing {jobs.length} of {totalCount} jobs
              </p>
              <p>
                Page {currentPage} of {totalPages}
              </p>
            </div>

            <div className="space-y-3">
              {jobs.map((job) => (
                <JobListItem
                  key={job.jobId}
                  job={job}
                  isSelected={selectedJob?.jobId === job.jobId}
                  onClick={() => setSelectedJobId(job.jobId)}
                />
              ))}
            </div>

            <div className="flex shrink-0 items-center justify-center gap-2 text-sm">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2.5 text-muted-foreground disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              {buildPaginationItems(totalPages, currentPage).map((item) =>
                item === "..." ? (
                  <span
                    key={`ellipsis-${currentPage}-${totalPages}`}
                    className="inline-flex h-8 min-w-6 items-center justify-center px-1 text-muted-foreground"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCurrentPage(item)}
                    className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2.5 ${
                      currentPage === item
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border border-transparent text-foreground hover:border-border"
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2.5 text-muted-foreground disabled:opacity-40"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {selectedJob ? (
            <aside className="space-y-4">
              <PageCard className="p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="mb-2 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                      {formatRelativeDate(
                        selectedJob.postedAt ?? selectedJob.scrapedAt,
                      )}
                    </p>
                    <h2 className="text-xl font-black text-foreground">
                      {selectedJob.title}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-muted-foreground">
                      {selectedJob.company.name}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 text-sm md:grid-cols-2">
                  <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Location
                    </p>
                    <p className="mt-1 text-foreground">
                      {selectedJob.location ?? "Not provided"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Level
                    </p>
                    <p className="mt-1 text-foreground">
                      {formatJobLevel(selectedJob.level)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Job type
                    </p>
                    <p className="mt-1 text-foreground">
                      {formatEmploymentType(selectedJob.employmentType)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Salary
                    </p>
                    <p className="mt-1 text-foreground">
                      {formatSalary(selectedJob)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Experience
                    </p>
                    <p className="mt-1 text-foreground">
                      {experienceText ?? "Not provided"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Deadline
                    </p>
                    <p className="mt-1 text-foreground">
                      {applicationDeadlineText ?? "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      navigate({
                        to: "/resume-optimizer",
                        search: {
                          jobId: selectedJob.jobId,
                          jobTitle: selectedJob.title,
                          company: selectedJob.company.name,
                          ...(effectiveSearchMode === "resume" &&
                          effectiveSelectedCvId !== null
                            ? { cvId: effectiveSelectedCvId }
                            : {}),
                        },
                      })
                    }
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-primary hover:bg-muted"
                  >
                    <FileText className="h-4 w-4" />
                    Scan
                  </button>
                  <a
                    href={selectedJob.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Apply
                  </a>
                </div>
              </PageCard>

              <PageCard className="p-5">
                <h3 className="mb-3 text-base font-bold text-foreground">
                  Skills
                </h3>
                {skills.length ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.slice(0, 14).map((skill) => (
                      <span
                        key={skill.skillId}
                        className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground"
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No skills listed.
                  </p>
                )}
              </PageCard>

              <PageCard className="p-5">
                <h3 className="mb-3 text-base font-bold text-foreground">
                  Job Snapshot
                </h3>
                <div className="space-y-4 text-sm leading-6 text-foreground">
                  {[
                    {
                      title: "Responsibilities",
                      items: responsibilities,
                    },
                    {
                      title: "Qualifications",
                      items: qualifications,
                    },
                    {
                      title: "Benefits",
                      items: benefits,
                    },
                  ].map((section) => (
                    <div key={section.title}>
                      <h4 className="font-semibold text-primary">
                        {section.title}
                      </h4>
                      {section.items.length ? (
                        <ul className="mt-1 space-y-1 text-muted-foreground">
                          {section.items.slice(0, 5).map((item) => (
                            <li key={item}>
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-muted-foreground">
                          Not provided.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </PageCard>
            </aside>
          ) : null}
        </section>
      )}

      {openDropdown ? (
        <button
          type="button"
          aria-label="Close dropdown menu"
          onClick={closeDropdown}
          className="fixed inset-0 z-10 cursor-default"
        />
      ) : null}
    </div>
  );
}
