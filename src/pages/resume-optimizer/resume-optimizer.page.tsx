import { AppShell } from "@/shared/ui/app-shell";
import { NewScanSection } from "@/shared/ui/new-scan-section";

export function ResumeOptimizerPage() {
  return (
    <AppShell fullWidth>
      <div className="space-y-5">
        <NewScanSection />
      </div>
    </AppShell>
  );
}
