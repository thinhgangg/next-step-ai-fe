import { useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/shared/ui/app-shell";
import { JobsBrowser } from "@/shared/ui/jobs-browser";

export function JobsPage() {
  const navigate = useNavigate();

  return (
    <AppShell
      fullWidth
      headerTitle="Tìm việc"
      headerDescription="Tìm kiếm việc làm phù hợp với hồ sơ, kỹ năng và mục tiêu nghề nghiệp của bạn."
    >
      <JobsBrowser onCreateScan={() => navigate({ to: "/dashboard" })} />
    </AppShell>
  );
}
