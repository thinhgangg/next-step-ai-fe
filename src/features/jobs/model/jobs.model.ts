import { useQuery } from "@apollo/client/react";
import { GET_JOBS } from "@/features/jobs/query/get-jobs.query";
import type { EmploymentTypeFilterOption } from "@/shared/lib/job-options";
export type { EmploymentTypeFilterOption } from "@/shared/lib/job-options";

export type JobSortOption = "RELEVANCE" | "DATE";
export type JobDateRangeOption = "ANY" | "D3" | "D7" | "D30";
export type ExperienceFilterOption =
  | "ALL"
  | "UNDER_1"
  | "Y1_2"
  | "Y3_5"
  | "Y5_PLUS";

export type JobCompany = {
  companyId: string;
  name: string;
  website?: string | null;
};

export type JobSkill = {
  skillId: string;
  name: string;
};

export type JobItem = {
  jobId: number;
  title: string;
  level?: string | null;
  location?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  descriptionRaw: string;
  descriptionClean?: string | null;
  roleResponsibilities?: string | null;
  skillsQualifications?: string | null;
  benefits?: string | null;
  employmentType?: string | null;
  experience?: string | null;
  applicationDeadline?: string | null;
  sourceUrl: string;
  sourceSite: string;
  postedAt?: string | null;
  scrapedAt: string;
  company: JobCompany;
  skills: JobSkill[];
};

type GetJobsResponse = {
  getJobs: {
    totalCount: number;
    items: JobItem[];
  };
};

type UseJobsCatalogParams = {
  search?: string;
  location?: string;
  limit: number;
  offset: number;
  sortBy: JobSortOption;
  dateRange: JobDateRangeOption;
  employmentType: EmploymentTypeFilterOption;
  experienceRange: ExperienceFilterOption;
  cvId?: number;
  skip?: boolean;
};

export function useJobsCatalog({
  search,
  location,
  limit,
  offset,
  sortBy,
  dateRange,
  employmentType,
  experienceRange,
  cvId,
  skip = false,
}: UseJobsCatalogParams) {
  const query = useQuery<GetJobsResponse>(GET_JOBS, {
    variables: {
      search: search || undefined,
      location: location || undefined,
      limit,
      offset,
      sortBy,
      dateRange,
      employmentType: employmentType === "ALL" ? undefined : employmentType,
      experienceRange: experienceRange === "ALL" ? undefined : experienceRange,
      cvId,
    },
    skip,
    notifyOnNetworkStatusChange: true,
  });

  const jobs = (query.data?.getJobs.items ?? []).map((job) => ({
    ...job,
    jobId: Number(job.jobId),
  }));

  return {
    jobs,
    totalCount: query.data?.getJobs.totalCount ?? 0,
    loading: query.loading,
    error: query.error,
    refetch: query.refetch,
  };
}
