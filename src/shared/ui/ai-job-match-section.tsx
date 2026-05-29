import { JobsBrowser } from "@/shared/ui/jobs-browser";

type AiJobMatchSectionProps = {
  onCreateScan?: () => void;
};

export function AiJobMatchSection({ onCreateScan }: AiJobMatchSectionProps) {
  return <JobsBrowser onCreateScan={onCreateScan} />;
}
