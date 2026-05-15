import { useDeferredValue, useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  BriefcaseBusiness,
  CheckCircle2,
  CloudUpload,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { useAnalyzeCv, useUploadCv } from "@/features/cv/model/cv.model";
import { useJobsCatalog } from "@/features/jobs/model/jobs.model";
import { setLatestAnalysisId } from "@/shared/config/latest-analysis";

type NewScanSectionProps = {
  onScan?: () => void;
};

type InputMode = "file" | "paste";

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
  const [resumeInputMode, setResumeInputMode] = useState<InputMode>("file");
  const [jdInputMode, setJdInputMode] = useState<InputMode>("file");
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [selectedResumeFile, setSelectedResumeFile] = useState<File | null>(
    null,
  );
  const [selectedResumeName, setSelectedResumeName] = useState<string | null>(
    null,
  );
  const [selectedJdName, setSelectedJdName] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [jdMessage, setJdMessage] = useState<string | null>(null);
  const [jdError, setJdError] = useState<string | null>(null);
  const deferredJobSearch = useDeferredValue(jdText.trim().slice(0, 160));

  const { uploadCv, isUploading } = useUploadCv();
  const { analyzeCv, isAnalyzing } = useAnalyzeCv();
  const { jobs, loading: isLoadingJobs } = useJobsCatalog({
    search: deferredJobSearch || undefined,
    location: undefined,
    limit: 3,
    offset: 0,
    sortBy: "RELEVANCE",
    dateRange: "ANY",
    employmentType: "ALL",
    experienceRange: "ALL",
    skip: !deferredJobSearch,
  });

  const targetJob = jobs[0] ?? null;
  const targetJobId = attachedJobId ?? targetJob?.jobId ?? null;
  const isBusy = isUploading || isAnalyzing;
  const hasResumeInput =
    resumeText.trim().length > 0 || selectedResumeFile !== null;
  const hasJdInput =
    attachedJobId !== null || jdText.trim().length > 0 || selectedJdName !== null;
  const canScan = hasResumeInput && hasJdInput && targetJobId !== null;

  const clearSelectedResume = () => {
    setSelectedResumeFile(null);
    setSelectedResumeName(null);
    setUploadMessage(null);
    setUploadError(null);
  };

  const clearSelectedJd = () => {
    setSelectedJdName(null);
    setJdMessage(null);
    setJdError(null);
    setJdText("");
  };

  const handleResumeFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedResumeFile(file);
    setSelectedResumeName(file.name);
    setResumeText("");
    setUploadError(null);
    setUploadMessage("Resume selected.");
    event.target.value = "";
  };

  const handleJdFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedJdName(file.name);
    setJdError(null);
    setJdMessage("Job description selected.");

    try {
      const isTextFile =
        file.type.startsWith("text/") || /\.(txt|md)$/i.test(file.name);
      const fallbackSearch = file.name
        .replace(/\.[^.]+$/, "")
        .replace(/[-_]/g, " ");
      const text = isTextFile ? await file.text() : fallbackSearch;

      setJdText(text.trim().slice(0, 4000));
      if (!isTextFile) {
        setJdMessage(
          "File selected. Paste JD text instead if the matched role is not accurate.",
        );
      }
    } catch {
      setJdError("Could not read this JD file. Paste the JD text instead.");
    } finally {
      event.target.value = "";
    }
  };

  const buildTextResumeFile = () =>
    new File([resumeText.trim()], "resume.txt", { type: "text/plain" });

  const handleScan = async () => {
    if (!canScan || isBusy || targetJobId === null) return;

    try {
      setUploadError(null);
      setUploadMessage("Uploading resume...");

      const fileToUpload = selectedResumeFile ?? buildTextResumeFile();
      const uploadedCv = await uploadCv(fileToUpload);

      setSelectedResumeName(uploadedCv.fileName);
      setUploadMessage("Analyzing match...");

      const analysis = await analyzeCv(Number(uploadedCv.cvId), targetJobId);
      if (analysis.analysisResultId) {
        setLatestAnalysisId(analysis.analysisResultId);
      }

      onScan?.();
      navigate({ to: "/match-report" });
    } catch (error) {
      console.error("Analyze error:", error);
      setUploadMessage(null);
      setUploadError("Scan failed. Please try again with another resume or JD.");
    }
  };

  const clearAttachedJob = () => {
    if (urlAttachedJobId !== null) {
      setDetachedJobId(urlAttachedJobId);
    }
    const nextUrl = `${location.pathname}`;
    window.history.replaceState(window.history.state, "", nextUrl);
    navigate({
      to: "/resume-optimizer",
      search: {},
      replace: true,
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-primary/10 bg-card shadow-sm">
      <section className="border-b border-border bg-card p-5 pb-4">
        <h2 className="text-[22px] font-bold text-foreground">
          Scan Resume and JD
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Start with files for the most reliable scan. Paste text only when a
          file is not available.
        </p>
      </section>

      <section className="bg-card p-5">
        <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-background/30">
            <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-3">
              <FileText className="h-4 w-4 text-primary" />
              <label className="text-sm font-semibold text-foreground">
                Resume
              </label>
            </div>

            <div className="flex flex-1 flex-col gap-4 p-4">
              {resumeInputMode === "file" ? (
                selectedResumeName ? (
                  <div className="relative flex min-h-[212px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-5 py-8 text-center">
                    <button
                      type="button"
                      onClick={clearSelectedResume}
                      className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-card hover:text-foreground"
                      aria-label="Remove selected resume"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-card text-primary">
                      <CheckCircle2 className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-bold text-primary">
                      Resume selected
                    </span>
                    <span className="max-w-[280px] break-words text-sm text-foreground">
                      {selectedResumeName}
                    </span>
                  </div>
                ) : (
                  <label className="flex min-h-[212px] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-background/70 px-5 py-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/5">
                    {isBusy ? (
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    ) : (
                      <CloudUpload className="h-8 w-8 text-primary" />
                    )}
                    <span className="text-sm font-bold text-foreground">
                      {isBusy ? "Processing..." : "Upload resume file"}
                    </span>
                    <span className="max-w-[280px] text-xs leading-5 text-muted-foreground">
                      PDF, DOC, DOCX, or TXT. Use your most recent CV for a more
                      accurate match.
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
              ) : (
                <div className="min-h-[212px] rounded-xl border border-border bg-background/70 p-4">
                  <textarea
                    value={resumeText}
                    onChange={(event) => {
                      setResumeText(event.target.value);
                      if (event.target.value.trim().length > 0) {
                        clearSelectedResume();
                      }
                    }}
                    placeholder="Paste resume text here."
                    className="h-full min-h-[180px] w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setResumeInputMode((mode) =>
                    mode === "file" ? "paste" : "file",
                  );
                  setUploadError(null);
                  setUploadMessage(null);
                }}
                className="text-left text-sm font-semibold text-primary hover:text-primary/80"
              >
                {resumeInputMode === "file"
                  ? "Or paste resume text"
                  : "Use resume file instead"}
              </button>

              {uploadMessage ? (
                <p className="text-sm text-primary">{uploadMessage}</p>
              ) : null}

              {uploadError ? (
                <p className="text-sm text-destructive">{uploadError}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-background/30">
            <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-3">
              <BriefcaseBusiness className="h-4 w-4 text-primary" />
              <label className="text-sm font-semibold text-foreground">
                Target job
              </label>
            </div>

            <div className="flex flex-1 flex-col gap-4 p-4">
              {attachedJobId !== null ? (
                <div className="relative flex min-h-[212px] flex-col justify-center rounded-xl border border-primary/20 bg-primary/5 p-5">
                  <button
                    type="button"
                    onClick={clearAttachedJob}
                    className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-card hover:text-foreground"
                    aria-label="Remove attached target job"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-card text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-bold text-primary">
                    Target job attached
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-foreground">
                    {attachedJobTitle || "Selected job"}
                  </h3>
                  {attachedCompany ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {attachedCompany}
                    </p>
                  ) : null}
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    Upload your CV on the left, then run the scan. You do not
                    need to upload a JD again.
                  </p>
                </div>
              ) : jdInputMode === "file" ? (
                selectedJdName ? (
                  <div className="relative flex min-h-[212px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-5 py-8 text-center">
                    <button
                      type="button"
                      onClick={clearSelectedJd}
                      className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-card hover:text-foreground"
                      aria-label="Remove selected JD"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-card text-primary">
                      <CheckCircle2 className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-bold text-primary">
                      JD selected
                    </span>
                    <span className="max-w-[280px] break-words text-sm text-foreground">
                      {selectedJdName}
                    </span>
                    {jdMessage ? (
                      <span className="max-w-[280px] text-xs leading-5 text-muted-foreground">
                        {jdMessage}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <label className="flex min-h-[212px] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-background/70 px-5 py-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/5">
                    <CloudUpload className="h-8 w-8 text-primary" />
                    <span className="text-sm font-bold text-foreground">
                      Upload JD file
                    </span>
                    <span className="max-w-[280px] text-xs leading-5 text-muted-foreground">
                      TXT or MD works best today. PDF, DOC, and DOCX can be used
                      as search hints.
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
                <div className="min-h-[212px] rounded-xl border border-border bg-background/70 p-4">
                  <textarea
                    value={jdText}
                    onChange={(event) => {
                      setJdText(event.target.value);
                      setSelectedJdName(null);
                      setJdMessage(null);
                      setJdError(null);
                    }}
                    placeholder="Paste job description text or search keywords."
                    className="h-full min-h-[180px] w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>
              )}

              {attachedJobId === null ? (
                <button
                  type="button"
                  onClick={() => {
                    setJdInputMode((mode) =>
                      mode === "file" ? "paste" : "file",
                    );
                    setJdError(null);
                    setJdMessage(null);
                  }}
                  className="text-left text-sm font-semibold text-primary hover:text-primary/80"
                >
                  {jdInputMode === "file"
                    ? "Or paste JD text"
                    : "Use JD file instead"}
                </button>
              ) : null}

              {attachedJobId === null && isLoadingJobs ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Finding the closest target role...
                </p>
              ) : attachedJobId === null && targetJob ? (
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm">
                  <p className="font-medium text-primary">Matched target role</p>
                  <p className="mt-1 line-clamp-1 text-foreground">
                    {targetJob.title} - {targetJob.company.name}
                  </p>
                </div>
              ) : attachedJobId === null && hasJdInput ? (
                <p className="text-sm text-muted-foreground">
                  No matching target role found yet. Try a clearer JD title or
                  paste more JD text.
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
            View sample report
          </button>

          <button
            disabled={!canScan || isBusy}
            onClick={() => {
              void handleScan();
            }}
            className="cursor-pointer rounded-md bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          >
            {isBusy ? "Scanning..." : "Scan"}
          </button>
        </div>
      </section>
    </div>
  );
}
