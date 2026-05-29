import { AppShell } from "@/shared/ui/app-shell";
import { ScanHistorySection } from "@/shared/ui/scan-history-section";

export function ScanHistoryPage() {
  return (
    <AppShell
      fullWidth
      headerTitle="Lịch sử phân tích"
      headerDescription="Xem lại các lần phân tích CV trước đó, so sánh điểm phù hợp và mở lại báo cáo khi cần."
    >
      <ScanHistorySection />
    </AppShell>
  );
}
