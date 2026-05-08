import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  BriefcaseBusiness,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  DollarSign,
  Tag,
  Search,
  Layers,
  BarChart3,
  CalendarClock,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useJobsCatalog } from "@/features/jobs/model/jobs.model";
import { useUserCvs } from "@/features/cv/model/cv.model";
import type {
  JobDateRangeOption,
  JobItem,
  JobSortOption,
  EmploymentTypeFilterOption,
  ExperienceFilterOption,
} from "@/features/jobs/model/jobs.model";
import { FilterSelect, type SelectOption } from "@/shared/ui/filter-select";

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
const RESUME_MATCH_CV_STORAGE_KEY = "nextstep.jobs.resumeCvId";

function getInitialResumeCvId() {
  const rawValue = sessionStorage.getItem(RESUME_MATCH_CV_STORAGE_KEY);
  if (!rawValue) return null;

  const numericValue = Number(rawValue);
  return Number.isFinite(numericValue) && numericValue > 0
    ? numericValue
    : null;
}

const DATE_OPTIONS: Array<{ value: JobDateRangeOption; label: string }> = [
  { value: "ANY", label: "Any time" },
  { value: "D3", label: "Last 3 days" },
  { value: "D7", label: "Last week" },
  { value: "D30", label: "Last month" },
];

const EMPLOYMENT_TYPE_OPTIONS: Array<{
  value: EmploymentTypeFilterOption;
  label: string;
}> = [
  { value: "ALL", label: "All" },
  { value: "Fulltime", label: "Fulltime" },
  { value: "Part-time", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERNSHIP", label: "Internship" },
  { value: "TEMPORARY", label: "Temporary" },
  { value: "VOLUNTEER", label: "Volunteer" },
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
    description: "What job are you looking for? We’ll find matches.",
    icon: <Search className="h-4 w-4" />,
  },
  {
    value: "resume",
    label: "Use my resume",
    description: "AI will recommend jobs based on a CV you've uploaded.",
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

  if (salaryMin == null && salaryMax == null) {
    return "Negotiable";
  }

  const format = (value: number) => new Intl.NumberFormat().format(value);

  const prefix = currency ? `${currency} ` : "";

  if (salaryMin != null && salaryMax != null) {
    return `${prefix}${format(salaryMin)} - ${format(salaryMax)}`;
  }

  if (salaryMin != null) {
    return `${prefix}${format(salaryMin)}+`;
  }

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

function formatEmploymentTypeLabel(value?: string | null) {
  return value?.trim() || null;
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
    if (page >= 1 && page <= safeTotalPages) {
      pages.add(page);
    }
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

      if (gap === 2) {
        items.push(prevPage + 1);
      } else if (gap > 2) {
        items.push("...");
      }
    }

    items.push(page);
  }

  return items;
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
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border p-4 text-left transition-colors ${
        isSelected
          ? "border-primary/40 bg-accent"
          : "border-border bg-card hover:bg-background"
      }`}
    >
      <p className="line-clamp-2 text-base font-bold text-primary">
        {job.title}
      </p>
      <p className="mt-1 line-clamp-1 text-sm font-semibold text-foreground">
        {job.company.name}
      </p>
      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
        {job.location ? (
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" />
            <span className="line-clamp-1">{job.location}</span>
          </div>
        ) : null}
        {job.level ? (
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="h-3.5 w-3.5" />
            <span>{job.level}</span>
          </div>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {formatRelativeDate(job.postedAt ?? job.scrapedAt)}
      </p>
    </button>
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
    <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
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
          className="mt-4 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:border-foreground"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function JobsBrowser({
  title,
  description,
  onCreateScan,
}: JobsBrowserProps) {
  const navigate = useNavigate();
  const initialResumeCvId = useMemo(() => getInitialResumeCvId(), []);
  const [searchMode, setSearchMode] = useState<SearchMode>(
    initialResumeCvId !== null ? "resume" : "keyword",
  );
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
  const [selectedCvId, setSelectedCvId] = useState<number | null>(
    initialResumeCvId,
  );

  useEffect(() => {
    if (initialResumeCvId !== null) {
      sessionStorage.removeItem(RESUME_MATCH_CV_STORAGE_KEY);
    }
  }, [initialResumeCvId]);

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
  const selectedCv = useMemo(
    () => cvs.find((cv) => Number(cv.cvId) === selectedCvId) ?? null,
    [cvs, selectedCvId],
  );

  const shouldFetch = searchMode === "keyword" || selectedCvId !== null;
  const isKeywordMode = searchMode === "keyword";
  const offset = (currentPage - 1) * PAGE_SIZE;

  const { jobs, totalCount, loading, error } = useJobsCatalog({
    search: isKeywordMode ? appliedKeyword.trim() : undefined,
    location: appliedLocation.trim(),
    cvId: !isKeywordMode && selectedCvId !== null ? selectedCvId : undefined,
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
    if (nextMode === searchMode) return;

    setSearchMode(nextMode);
    setCurrentPage(1);
    setSelectedJobId(null);
    setOpenDropdown(null);

    if (nextMode === "resume") {
      setKeywordInput("");
      setAppliedKeyword("");
    } else {
      setSelectedCvId(null);
    }
  };

  const handleCvChange = (nextValue: string) => {
    setSelectedCvId(Number(nextValue));
    setCurrentPage(1);
    setSelectedJobId(null);
  };

  const handleDateRangeChange = (nextValue: JobDateRangeOption) => {
    setDateRange(nextValue);
    setCurrentPage(1);
    setSelectedJobId(null);
  };

  const handleEmploymentTypeChange = (
    nextValue: EmploymentTypeFilterOption,
  ) => {
    setEmploymentType(nextValue);
    setCurrentPage(1);
    setSelectedJobId(null);
  };

  const handleExperienceChange = (nextValue: ExperienceFilterOption) => {
    setExperienceRange(nextValue);
    setCurrentPage(1);
    setSelectedJobId(null);
  };

  const handleSortChange = (nextValue: JobSortOption) => {
    setSortBy(nextValue);
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

    navigate({ to: "/dashboard" });
  };

  const responsibilities = splitTextBlock(selectedJob?.roleResponsibilities);
  const qualifications = splitTextBlock(selectedJob?.skillsQualifications);
  const skills = selectedJob?.skills ?? [];
  const benefits = splitTextBlock(selectedJob?.benefits);
  const employmentTypeText = formatEmploymentTypeLabel(
    selectedJob?.employmentType,
  );
  const experienceText = selectedJob?.experience?.trim() || null;
  const applicationDeadlineText = formatApplicationDeadline(
    selectedJob?.applicationDeadline,
  );
  const modeLabel = searchMode === "keyword" ? "Keywords" : "Resume";
  const cvLabel =
    selectedCv?.fileName ?? (isLoadingCvs ? "Loading CVs" : "Choose CV");
  const modeLeadingIcon =
    searchMode === "keyword" ? (
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
          EMPLOYMENT_TYPE_OPTIONS,
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
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <section className="border-b border-border bg-muted p-5">
        <h2 className="text-[22px] font-bold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <FilterSelect
            label={modeLabel}
            leadingIcon={modeLeadingIcon}
            isOpen={openDropdown === "mode"}
            onToggle={() => toggleDropdown("mode")}
            onClose={closeDropdown}
            options={MODE_OPTIONS}
            onSelect={(value) => handleSearchModeChange(value)}
            selectedValue={searchMode}
            menuWidthClass="w-[420px]"
            buttonClassName="h-10 min-w-[120px] text-sm"
          />

          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleKeywordSearch();
            }}
            className="grid min-w-0 flex-1 grid-cols-1 gap-2 font-sans md:grid-cols-[minmax(360px,2fr)_240px_110px]"
          >
            <div className="min-w-0">
              {isKeywordMode ? (
                <input
                  value={keywordInput}
                  onChange={(event) => setKeywordInput(event.target.value)}
                  placeholder="Job title, keywords, or company"
                  className="h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground"
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
                    selectedCvId !== null ? String(selectedCvId) : undefined
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
                placeholder="Your current location"
                className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground"
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
            onSelect={handleDateRangeChange}
            selectedValue={dateRange}
            menuWidthClass="w-40"
          />

          <FilterSelect
            label={employmentTypeLabel}
            isOpen={openDropdown === "type"}
            onToggle={() => toggleDropdown("type")}
            onClose={closeDropdown}
            options={EMPLOYMENT_TYPE_OPTIONS}
            onSelect={handleEmploymentTypeChange}
            selectedValue={employmentType}
            menuWidthClass="w-40"
          />

          <FilterSelect
            label={experienceLabel}
            isOpen={openDropdown === "experience"}
            onToggle={() => toggleDropdown("experience")}
            onClose={closeDropdown}
            options={EXPERIENCE_OPTIONS}
            onSelect={handleExperienceChange}
            selectedValue={experienceRange}
            menuWidthClass="w-36"
          />

          <button
            type="button"
            onClick={handleClearAll}
            className="ml-1 rounded-md px-1.5 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
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
              onSelect={handleSortChange}
              selectedValue={sortBy}
              menuWidthClass="w-36"
              align="right"
            />
          </div>
        </div>
      </section>

      <section className="bg-background p-5">
        {searchMode === "resume" && cvs.length === 0 && !isLoadingCvs ? (
          <EmptyResults
            title="No CVs uploaded yet"
            description="Upload a CV from the dashboard, then choose it here to rank jobs by your resume."
            actionLabel="Upload CV"
            onAction={handleCreateScan}
          />
        ) : searchMode === "resume" && selectedCvId === null ? (
          <EmptyResults
            title="Choose a CV"
            description="Select one of your uploaded CVs above to find jobs ranked by resume fit."
          />
        ) : loading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-border bg-card">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading...
            </div>
          </div>
        ) : error ? (
          <EmptyResults
            title="Unable to load jobs"
            description={error.message}
            actionLabel="Try again"
            onAction={handleKeywordSearch}
          />
        ) : jobs.length === 0 ? (
          <EmptyResults
            title="No jobs found"
            description={
              searchMode === "keyword"
                ? "Try a different keyword or location to see more jobs from the crawler."
                : "No live jobs are available for the current recommendation view yet."
            }
            actionLabel={searchMode === "keyword" ? "Clear search" : undefined}
            onAction={
              searchMode === "keyword"
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
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <p>
                {searchMode === "keyword"
                  ? `Showing ${totalCount} jobs from the crawler`
                  : `Showing ${totalCount} live jobs for resume mode`}
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-stretch">
              <div className="flex flex-col">
                <aside className="space-y-3">
                  {jobs.map((job) => (
                    <JobListItem
                      key={job.jobId}
                      job={job}
                      isSelected={selectedJob?.jobId === job.jobId}
                      onClick={() => setSelectedJobId(job.jobId)}
                    />
                  ))}
                </aside>

                <div className="mt-4 flex shrink-0 items-center justify-center gap-2 text-sm">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
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
                            ? "bg-primary text-primary-foreground"
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
                <article className="h-full rounded-xl border border-border bg-card">
                  <div className="border-b border-border px-6 pb-4 pt-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                          <h3 className="text-2xl font-bold text-foreground">
                            {selectedJob.title}
                          </h3>
                          <span className="inline-flex w-fit shrink-0 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                            {formatRelativeDate(
                              selectedJob.postedAt ?? selectedJob.scrapedAt,
                            )}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {selectedJob.company.name}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
                          Location
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-foreground">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedJob.location ?? "Not provided"}</span>
                        </p>
                      </div>

                      <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
                          Level
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-foreground">
                          <Layers className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedJob.level ?? "Not provided"}</span>
                        </p>
                      </div>

                      <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
                          Employment Type
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-foreground">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <span>{employmentTypeText ?? "Not provided"}</span>
                        </p>
                      </div>

                      <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
                          Experience
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-foreground">
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                          <span>{experienceText ?? "Not provided"}</span>
                        </p>
                      </div>

                      <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
                          Application Deadline
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-foreground">
                          <CalendarClock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {applicationDeadlineText ?? "Not provided"}
                          </span>
                        </p>
                      </div>

                      <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
                          Source Site
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-foreground">
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedJob.sourceSite}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {formatSalary(selectedJob) ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">
                            <DollarSign className="h-3.5 w-3.5" />
                            <span>{formatSalary(selectedJob)}</span>
                          </span>
                        ) : null}
                      </div>

                      <a
                        href={selectedJob.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Apply
                      </a>
                    </div>
                  </div>

                  <div className="space-y-5 px-6 py-5 text-sm leading-relaxed text-foreground">
                    {skills.length ? (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-primary">
                          Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {skills.map((skill) => (
                            <span
                              key={skill.skillId}
                              className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground"
                            >
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {responsibilities.length ||
                    qualifications.length ||
                    benefits.length ? (
                      <div className="space-y-4">
                        {[
                          {
                            title: "Your role & responsibilities",
                            items: responsibilities,
                          },
                          {
                            title: "Your skills & qualifications",
                            items: qualifications,
                          },
                          { title: "Benefits", items: benefits },
                        ].map((section, index) => (
                          <section key={section.title} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                                {index + 1}
                              </span>
                              <h4 className="text-sm font-semibold text-primary">
                                {section.title}
                              </h4>
                            </div>

                            {section.items.length ? (
                              <ul className="space-y-1.5 pl-1 text-sm text-foreground">
                                {section.items.map((item) => (
                                  <li
                                    key={item}
                                    className="whitespace-pre-wrap"
                                  >
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="pl-8 text-sm text-muted-foreground/70">
                                Not provided.
                              </p>
                            )}
                          </section>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </article>
              ) : null}
            </div>
          </>
        )}
      </section>

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
