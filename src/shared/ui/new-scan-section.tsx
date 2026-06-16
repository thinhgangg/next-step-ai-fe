import { useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  BriefcaseBusiness,
  CheckCircle2,
  CloudUpload,
  FileText,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import {
  useAnalyzeCv,
  useAnalyzeCvWithJd,
  useUploadCv,
  useUserCvs,
} from "@/features/cv/model/cv.model";
import { setLatestAnalysisId } from "@/shared/config/latest-analysis";
import { FilterSelect, type SelectOption } from "@/shared/ui/filter-select";

type NewScanSectionProps = {
  onScan?: () => void;
};

type InputMode = "file" | "paste";
type JobInputMode = InputMode | "attached";
type ResumeInputMode = InputMode | "saved";
type InputModeDropdown = "resume" | "job" | null;

const MIN_JOB_DESCRIPTION_LENGTH = 30;
const MIN_JOB_DESCRIPTION_WORDS = 8;
const MIN_UNIQUE_JOB_DESCRIPTION_WORDS = 5;

const scanProgressMessages = [
  "Đang tải lên CV...",
  "Đang đọc nội dung CV...",
  "Đang phân tích yêu cầu công việc...",
  "Đang so khớp CV với công việc...",
  "Đang tìm kỹ năng phù hợp và còn thiếu...",
  "Đang tạo lộ trình cải thiện...",
  "Đang chuẩn bị báo cáo phân tích...",
];

const RESUME_INPUT_MODE_OPTIONS: Array<SelectOption<ResumeInputMode>> = [
  { value: "file", label: "Tải lên CV" },
  { value: "saved", label: "CV đã lưu" },
  { value: "paste", label: "Dán văn bản" },
];

const BASE_JOB_INPUT_MODE_OPTIONS: Array<SelectOption<JobInputMode>> = [
  { value: "file", label: "Tải lên JD" },
  { value: "paste", label: "Dán văn bản" },
];

const inputModeButtonClassName =
  "h-8 w-[132px] justify-between text-xs font-medium text-muted-foreground";

function formatUploadDate(value?: string | null) {
  if (!value) return "Tải lên gần đây";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Tải lên gần đây";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(timestamp));
}

function getJobDescriptionValidationMessage(value: string): string | null {
  const normalized = value.trim();
  if (!normalized) return null;

  const words = normalized
    .toLowerCase()
    .split(/[^\p{L}\p{N}+#.]+/u)
    .filter((word) => word.length > 1);
  const uniqueWords = new Set(words);

  if (normalized.length < MIN_JOB_DESCRIPTION_LENGTH) {
    return "Hãy bổ sung mô tả công việc đầy đủ hơn để hệ thống có thể so sánh kỹ năng, kinh nghiệm và trách nhiệm.";
  }

  if (
    words.length < MIN_JOB_DESCRIPTION_WORDS ||
    uniqueWords.size < MIN_UNIQUE_JOB_DESCRIPTION_WORDS
  ) {
    return "Hãy dán mô tả công việc chi tiết hơn, bao gồm nhiệm vụ, kỹ năng yêu cầu hoặc kinh nghiệm liên quan.";
  }

  return null;
}

export function NewScanSection({ onScan }: NewScanSectionProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [detachedJobId, setDetachedJobId] = useState<number | null>(null);
  const attachedJobParams = new URLSearchParams(window.location.search);
  const attachedJobIdParam = attachedJobParams.get("jobId");
  const attachedJobIdValue =
    attachedJobIdParam === null ? NaN : Number(attachedJobIdParam);
  const urlAttachedJobId =
    attachedJobIdParam !== null &&
    Number.isFinite(attachedJobIdValue) &&
    attachedJobIdValue > 0
      ? attachedJobIdValue
      : null;
  const attachedJobId =
    urlAttachedJobId !== null && urlAttachedJobId !== detachedJobId
      ? urlAttachedJobId
      : null;
  const attachedJobTitle = attachedJobParams.get("jobTitle") ?? "";
  const attachedCompany = attachedJobParams.get("company") ?? "";
  const attachedCvIdValue = Number(attachedJobParams.get("cvId"));
  const attachedCvId =
    Number.isFinite(attachedCvIdValue) && attachedCvIdValue > 0
      ? attachedCvIdValue
      : null;
  const [resumeInputMode, setResumeInputMode] = useState<ResumeInputMode>(
    attachedCvId !== null ? "saved" : "file",
  );
  const [jdInputMode, setJdInputMode] = useState<JobInputMode>(
    urlAttachedJobId !== null ? "attached" : "file",
  );
  const [openInputModeDropdown, setOpenInputModeDropdown] =
    useState<InputModeDropdown>(null);
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [selectedResumeFile, setSelectedResumeFile] = useState<File | null>(
    null,
  );
  const [selectedResumeName, setSelectedResumeName] = useState<string | null>(
    null,
  );
  const [selectedSavedCvId, setSelectedSavedCvId] = useState<number | null>(
    attachedCvId,
  );
  const [selectedJdFile, setSelectedJdFile] = useState<File | null>(null);
  const [selectedJdName, setSelectedJdName] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const scanMessageTimerRef = useRef<number | null>(null);
  const [jdMessage, setJdMessage] = useState<string | null>(null);
  const [jdError, setJdError] = useState<string | null>(null);

  const { uploadCv, isUploading } = useUploadCv();
  const { analyzeCv, isAnalyzing } = useAnalyzeCv();
  const { analyzeCvWithJd, isAnalyzingWithJd } = useAnalyzeCvWithJd();
  const { cvs, loading: isLoadingCvs } = useUserCvs();

  const selectedSavedCv = useMemo(
    () => cvs.find((cv) => Number(cv.cvId) === selectedSavedCvId) ?? null,
    [cvs, selectedSavedCvId],
  );
  const jobInputModeOptions = useMemo<Array<SelectOption<JobInputMode>>>(
    () =>
      attachedJobId !== null
        ? [
            {
              value: "attached",
              label: "Công việc đã chọn",
              description: attachedJobTitle || attachedCompany || undefined,
            },
            ...BASE_JOB_INPUT_MODE_OPTIONS,
          ]
        : BASE_JOB_INPUT_MODE_OPTIONS,
    [attachedCompany, attachedJobId, attachedJobTitle],
  );
  const selectedResumeInputModeLabel =
    RESUME_INPUT_MODE_OPTIONS.find((option) => option.value === resumeInputMode)
      ?.label ?? "Tải lên file";
  const safeJobInputMode =
    jdInputMode === "attached" && attachedJobId === null ? "file" : jdInputMode;
  const selectedJobInputModeLabel =
    jobInputModeOptions.find((option) => option.value === safeJobInputMode)
      ?.label ?? "Tải lên file";
  const isBusy = isUploading || isAnalyzing || isAnalyzingWithJd;
  const normalizedJdText = jdText.trim();
  const jobDescriptionValidationMessage =
    jdInputMode === "paste"
      ? getJobDescriptionValidationMessage(normalizedJdText)
      : null;
  const hasResumeInput =
    (resumeInputMode === "paste" && resumeText.trim().length > 0) ||
    (resumeInputMode === "file" && selectedResumeFile !== null) ||
    (resumeInputMode === "saved" && selectedSavedCv !== null);
  const hasJdInput =
    (jdInputMode === "attached" && attachedJobId !== null) ||
    (jdInputMode === "file" && selectedJdFile !== null) ||
    (jdInputMode === "paste" &&
      normalizedJdText.length > 0 &&
      jobDescriptionValidationMessage === null);
  const canScan = hasResumeInput && hasJdInput;

  const clearSelectedResume = () => {
    setSelectedResumeFile(null);
    setSelectedResumeName(null);
    setSelectedSavedCvId(null);
    setUploadMessage(null);
    setUploadError(null);
  };

  const clearSelectedJd = () => {
    setSelectedJdFile(null);
    setSelectedJdName(null);
    setJdMessage(null);
    setJdError(null);
    setJdText("");
  };

  const handleResumeFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedResumeFile(file);
    setSelectedResumeName(file.name);
    setSelectedSavedCvId(null);
    setResumeText("");
    setUploadError(null);
    setUploadMessage("Đã chọn CV.");
    event.target.value = "";
  };

  const handleJdFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedJdName(file.name);
    setSelectedJdFile(file);
    setJdError(null);

    try {
      const isTextFile =
        file.type.startsWith("text/") || /\.(txt|md)$/i.test(file.name);
      const text = isTextFile ? await file.text() : "";

      setJdText(text.trim());
      if (!isTextFile) {
        setJdMessage(
          "Đã chọn mô tả công việc. Nó sẽ được sử dụng cho lần quét này.",
        );
      }
    } catch {
      setJdError(
        "Không thể đọc mô tả công việc này. Hãy dán nội dung trực tiếp thay thế.",
      );
    } finally {
      event.target.value = "";
    }
  };

  const buildTextResumeFile = () =>
    new File([resumeText.trim()], "resume.txt", { type: "text/plain" });

  const readFileAsBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        resolve(result.includes(",") ? result.split(",")[1] : result);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const stopScanProgressMessages = () => {
    if (scanMessageTimerRef.current !== null) {
      window.clearInterval(scanMessageTimerRef.current);
      scanMessageTimerRef.current = null;
    }
  };

  const startScanProgressMessages = () => {
    stopScanProgressMessages();

    let messageIndex = 0;
    setUploadMessage(scanProgressMessages[messageIndex]);

    scanMessageTimerRef.current = window.setInterval(() => {
      messageIndex = Math.min(
        messageIndex + 1,
        scanProgressMessages.length - 1,
      );
      setUploadMessage(scanProgressMessages[messageIndex]);

      if (messageIndex === scanProgressMessages.length - 1) {
        stopScanProgressMessages();
      }
    }, 3000);
  };

  const handleScan = async () => {
    if (!canScan || isBusy) return;

    try {
      setUploadError(null);
      setJdError(null);
      startScanProgressMessages();

      let cvId = resumeInputMode === "saved" ? selectedSavedCvId : null;

      if (cvId === null) {
        const fileToUpload =
          resumeInputMode === "file" && selectedResumeFile
            ? selectedResumeFile
            : buildTextResumeFile();
        const uploadedCv = await uploadCv(fileToUpload);
        cvId = Number(uploadedCv.cvId);
        setSelectedResumeName(uploadedCv.fileName);
      }

      const analysis =
        jdInputMode === "attached" && attachedJobId !== null
          ? await analyzeCv(cvId, attachedJobId)
          : await analyzeCvWithJd(cvId, {
              jdText: jdInputMode === "paste" ? normalizedJdText || null : null,
              jdFileBase64:
                jdInputMode === "file" && selectedJdFile
                  ? await readFileAsBase64(selectedJdFile)
                  : null,
              jdFileName:
                jdInputMode === "file" ? (selectedJdFile?.name ?? null) : null,
              jdContentType:
                jdInputMode === "file" ? selectedJdFile?.type || null : null,
            });

      setUploadMessage("Đang chuẩn bị báo cáo phân tích...");

      if (analysis.analysisResultId) {
        setLatestAnalysisId(analysis.analysisResultId);
      } else {
        throw new Error("Phân tích hoàn tất nhưng không có mã báo cáo.");
      }

      onScan?.();
      navigate({ to: "/match-report" });
    } catch (error) {
      console.error("Analyze error:", error);
      setUploadMessage(null);
      setUploadError(
        "Phân tích thất bại. Vui lòng thử lại với CV hoặc mô tả công việc khác.",
      );
    } finally {
      stopScanProgressMessages();
    }
  };

  const clearAttachedJob = () => {
    if (urlAttachedJobId !== null) {
      setDetachedJobId(urlAttachedJobId);
    }
    setJdInputMode("file");
    const nextUrl = `${location.pathname}`;
    window.history.replaceState(window.history.state, "", nextUrl);
    navigate({
      to: "/resume-optimizer",
      search: {},
      replace: true,
    });
  };

  return (
    <div className="rounded-xl border border-primary/10 bg-card shadow-sm">
      <section className="border-b border-border bg-card p-5 pb-4 rounded-t-xl">
        <h2 className="text-[22px] font-bold text-foreground">Phân tích CV</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ưu tiên dùng file để kết quả phân tích ổn định hơn. Chỉ dán văn bản
          khi bạn không có file sẵn.
        </p>
      </section>

      <section className="bg-card p-5 rounded-b-xl">
        <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="flex flex-col rounded-xl border border-border bg-background/30">
            <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 rounded-t-xl">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <label className="text-sm font-semibold text-foreground">
                  CV của bạn
                </label>
              </div>
              <FilterSelect
                label={selectedResumeInputModeLabel}
                isOpen={openInputModeDropdown === "resume"}
                onToggle={() =>
                  setOpenInputModeDropdown((current) =>
                    current === "resume" ? null : "resume",
                  )
                }
                onClose={() => setOpenInputModeDropdown(null)}
                options={RESUME_INPUT_MODE_OPTIONS}
                onSelect={(value) => {
                  setResumeInputMode(value);
                  setUploadError(null);
                  setUploadMessage(null);
                }}
                selectedValue={resumeInputMode}
                menuWidthClass="w-36"
                align="right"
                buttonClassName={inputModeButtonClassName}
                optionLabelClassName="text-xs leading-4"
                optionDescriptionClassName="text-[11px] leading-4"
              />
            </div>

            <div className="flex flex-1 flex-col gap-4 p-4">
              {resumeInputMode === "file" ? (
                selectedResumeName ? (
                  <div className="relative flex h-[212px] w-full flex-col justify-center rounded-xl border border-primary/20 bg-primary/5 p-5 pr-12 text-left">
                    <button
                      type="button"
                      onClick={clearSelectedResume}
                      className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-card hover:text-foreground"
                      aria-label="Remove selected resume"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-card text-primary">
                      <CheckCircle2 className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-bold text-primary">
                      Đã chọn CV
                    </span>
                    <span className="mt-2 max-w-full break-words text-sm font-medium text-foreground">
                      {selectedResumeName}
                    </span>
                  </div>
                ) : (
                  <label className="flex h-[212px] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-background/70 px-5 py-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/5">
                    {isBusy ? (
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    ) : (
                      <CloudUpload className="h-8 w-8 text-primary" />
                    )}
                    <span className="text-sm font-bold text-foreground">
                      {isBusy ? "Đang xử lý..." : "Tải lên CV"}
                    </span>
                    <span className="max-w-[280px] text-xs leading-5 text-muted-foreground">
                      Hỗ trợ PDF, DOC, DOCX hoặc TXT. Hãy dùng CV mới nhất để
                      kết quả so khớp chính xác hơn.
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt"
                      disabled={isBusy}
                      onChange={handleResumeFileChange}
                    />
                  </label>
                )
              ) : resumeInputMode === "saved" ? (
                selectedSavedCv ? (
                  <div className="relative flex h-[212px] w-full flex-col justify-center rounded-xl border border-primary/20 bg-primary/5 p-5 pr-12 text-left">
                    <button
                      type="button"
                      onClick={clearSelectedResume}
                      className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-card hover:text-foreground"
                      aria-label="Remove selected saved CV"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-card text-primary">
                      <CheckCircle2 className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-bold text-primary">
                      Đã chọn CV đã lưu
                    </p>
                    <h3 className="mt-2 line-clamp-2 break-words text-lg font-bold text-foreground">
                      {selectedSavedCv.fileName}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Đã tải lên {formatUploadDate(selectedSavedCv.uploadedAt)}
                    </p>
                  </div>
                ) : (
                  <div className="h-[212px] rounded-xl border border-border bg-background/70 p-3">
                    {isLoadingCvs ? (
                      <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        Đang tải...
                      </div>
                    ) : cvs.length > 0 ? (
                      <div className="h-full space-y-2 overflow-y-auto pr-1">
                        {cvs.map((cv) => (
                          <button
                            key={cv.cvId}
                            type="button"
                            disabled={isBusy}
                            onClick={() => {
                              setSelectedSavedCvId(Number(cv.cvId));
                              setSelectedResumeFile(null);
                              setSelectedResumeName(null);
                              setResumeText("");
                              setUploadError(null);
                              setUploadMessage("Đã chọn CV đã lưu.");
                            }}
                            className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <FileText className="h-4 w-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-foreground">
                                {cv.fileName}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                Đã tải lên {formatUploadDate(cv.uploadedAt)}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm font-bold text-foreground">
                          Không có CV đã lưu nào
                        </span>
                        <span className="max-w-[280px] text-xs leading-5 text-muted-foreground">
                          Hãy tải CV lên trước. Sau đó CV sẽ xuất hiện tại đây
                          để dùng cho các lần phân tích sau.
                        </span>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="h-[212px] rounded-xl border border-border bg-background/70 p-4">
                  <textarea
                    value={resumeText}
                    onChange={(event) => {
                      setResumeText(event.target.value);
                      if (event.target.value.trim().length > 0) {
                        clearSelectedResume();
                      }
                    }}
                    placeholder="Dán nội dung CV của bạn vào đây..."
                    className="h-full w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>
              )}

              {uploadMessage ? (
                <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-medium text-primary">
                  {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  <span>{uploadMessage}</span>
                </div>
              ) : null}

              {uploadError ? (
                <p className="text-sm text-destructive">{uploadError}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col rounded-xl border border-border bg-background/30">
            <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 rounded-t-xl">
              <div className="flex items-center gap-2">
                <BriefcaseBusiness className="h-4 w-4 text-primary" />
                <label className="text-sm font-semibold text-foreground">
                  Công việc mục tiêu
                </label>
              </div>
              <FilterSelect
                label={selectedJobInputModeLabel}
                isOpen={openInputModeDropdown === "job"}
                onToggle={() =>
                  setOpenInputModeDropdown((current) =>
                    current === "job" ? null : "job",
                  )
                }
                onClose={() => setOpenInputModeDropdown(null)}
                options={jobInputModeOptions}
                onSelect={(nextMode) => {
                  setJdInputMode(nextMode);
                  setJdError(null);
                  setJdMessage(null);

                  if (nextMode === "file" || nextMode === "paste") {
                    setSelectedJdFile(null);
                    setSelectedJdName(null);
                  }
                }}
                selectedValue={safeJobInputMode}
                menuWidthClass="w-36"
                align="right"
                buttonClassName={inputModeButtonClassName}
                optionLabelClassName="text-xs leading-4"
                optionDescriptionClassName="text-[11px] leading-4"
              />
            </div>

            <div className="flex flex-1 flex-col gap-4 p-4">
              {jdInputMode === "attached" && attachedJobId !== null ? (
                <div className="relative flex h-[212px] flex-col justify-center rounded-xl border border-primary/20 bg-primary/5 p-5 pr-12">
                  <button
                    type="button"
                    onClick={clearAttachedJob}
                    className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-card hover:text-foreground"
                    aria-label="Remove attached target job"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-card text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-bold text-primary">
                    Đã chọn công việc mục tiêu
                  </p>
                  <h3 className="mt-2 line-clamp-2 text-lg font-bold text-foreground">
                    {attachedJobTitle || "Công việc đã chọn"}
                  </h3>
                  {attachedCompany ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {attachedCompany}
                    </p>
                  ) : null}
                </div>
              ) : jdInputMode === "file" ? (
                selectedJdName ? (
                  <div className="relative flex h-[212px] w-full flex-col justify-center rounded-xl border border-primary/20 bg-primary/5 p-5 pr-12 text-left">
                    <button
                      type="button"
                      onClick={clearSelectedJd}
                      className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-card hover:text-foreground"
                      aria-label="Gỡ bỏ mô tả công việc đã chọn"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-card text-primary">
                      <CheckCircle2 className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-bold text-primary">
                      Mô tả công việc đã chọn
                    </span>
                    <span className="mt-2 max-w-full break-words text-sm font-medium text-foreground">
                      {selectedJdName}
                    </span>
                    {jdMessage ? (
                      <span className="mt-2 text-xs leading-5 text-muted-foreground">
                        {jdMessage}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <label className="flex h-[212px] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-background/70 px-5 py-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/5">
                    <CloudUpload className="h-8 w-8 text-primary" />
                    <span className="text-sm font-bold text-foreground">
                      Tải lên mô tả công việc
                    </span>
                    <span className="max-w-[280px] text-xs leading-5 text-muted-foreground">
                      Hỗ trợ PDF, DOC, DOCX, TXT hoặc MD. Hãy dùng JD chi tiết
                      để có kết quả so khớp tốt hơn.
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt,.md"
                      disabled={isBusy}
                      onChange={(event) => {
                        void handleJdFileChange(event);
                      }}
                    />
                  </label>
                )
              ) : (
                <div className="h-[212px] rounded-xl border border-border bg-background/70 p-4">
                  <textarea
                    value={jdText}
                    onChange={(event) => {
                      setJdText(event.target.value);
                      setSelectedJdFile(null);
                      setSelectedJdName(null);
                      setJdMessage(null);
                      setJdError(null);
                    }}
                    placeholder="Dán mô tả công việc vào đây..."
                    className="h-full w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>
              )}

              {jobDescriptionValidationMessage ? (
                <p className="text-sm text-destructive">
                  {jobDescriptionValidationMessage}
                </p>
              ) : null}

              {jdError ? (
                <p className="text-sm text-destructive">{jdError}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => navigate({ to: "/sample-report" })}
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <FileText className="h-4 w-4" />
            Xem mẫu
          </button>

          <button
            type="button"
            disabled={!canScan || isBusy}
            onClick={() => {
              void handleScan();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          >
            <Sparkles className="h-4 w-4" />
            {isBusy ? "Đang phân tích..." : "Phân tích ngay"}
          </button>
        </div>
      </section>
    </div>
  );
}
