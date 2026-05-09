import { JobsBrowser } from "@/shared/ui/jobs-browser";

type AiJobMatchSectionProps = {
  hasScan: boolean;
  onCreateScan?: () => void;
};

export function AiJobMatchSection({
  hasScan,
  onCreateScan,
}: AiJobMatchSectionProps) {
  return (
    <JobsBrowser
      hasScan={hasScan}
      title="Find Jobs"
      description="Search jobs, filter results, and rank matches by CV."
      onCreateScan={onCreateScan}
    />
  );
}
