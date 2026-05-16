import { useDeferredValue, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  BriefcaseBusiness,
  CheckCircle2,
  CloudUpload,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import {
  useAnalyzeCv,
  useUploadCv,
  useUserCvs,
} from "@/features/cv/model/cv.model";
import { useJobsCatalog } from "@/features/jobs/model/jobs.model";
import { setLatestAnalysisId } from "@/shared/config/latest-analysis";

type NewScanSectionProps = {
  onScan?: () => void;
};

type InputMode = "file" | "paste";
type ResumeInputMode = InputMode | "saved";

const scanProgressMessages = [
  "Uploading resume...",
  "Reading resume content...",
  "Analyzing job requirements...",
  "Comparing your resume with this job...",
  "Finding matched and missing skills...",
  "Building your learning roadmap...",
  "Preparing your match report...",
];

function formatUploadDate(value?: string | null) {
  if (!value) return "Recently uploaded";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Recently uploaded";

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp));
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
  const [resumeInputMode, setResumeInputMode] =
    useState<ResumeInputMode>(attachedCvId !== null ? "saved" : "file");
  const [jdInputMode, setJdInputMode] = useState<InputMode>("file");
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
  const [selectedJdName, setSelectedJdName] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const scanMessageTimerRef = useRef<number | null>(null);
  const [jdMessage, setJdMessage] = useState<string | null>(null);
  const [jdError, setJdError] = useState<string | null>(null);
  const deferredJobSearch = useDeferredValue(jdText.trim().slice(0, 160));

  const { uploadCv, isUploading } = useUploadCv();
  const { analyzeCv, isAnalyzing } = useAnalyzeCv();
  const { cvs, loading: isLoadingCvs } = useUserCvs();
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
  const selectedSavedCv = useMemo(
    () => cvs.find((cv) => Number(cv.cvId) === selectedSavedCvId) ?? null,
    [cvs, selectedSavedCvId],
  );
  const isBusy = isUploading || isAnalyzing;
  const hasResumeInput =
    (resumeInputMode === "paste" && resumeText.trim().length > 0) ||
    (resumeInputMode === "file" && selectedResumeFile !== null) ||
    (resumeInputMode === "saved" && selectedSavedCv !== null);
  const hasJdInput =
    attachedJobId !== null ||
    jdText.trim().length > 0 ||
    selectedJdName !== null;
  const canScan = hasResumeInput && hasJdInput && targetJobId !== null;

  const clearSelectedResume = () => {
    setSelectedResumeFile(null);
    setSelectedResumeName(null);
    setSelectedSavedCvId(null);
    setUploadMessage(null);
    setUploadError(null);
  };

  const clearSelectedJd = () => {
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
    if (!canScan || isBusy || targetJobId === null) return;

    try {
      setUploadError(null);
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

      const analysis = await analyzeCv(cvId, targetJobId);

      setUploadMessage("Preparing your match report...");

      if (analysis.analysisResultId) {
        setLatestAnalysisId(analysis.analysisResultId);
      }

      onScan?.();
      navigate({ to: "/match-report" });
    } catch (error) {
      console.error("Analyze error:", error);
      setUploadMessage(null);
      setUploadError(
        "Scan failed. Please try again with another resume or JD.",
      );
    } finally {
      stopScanProgressMessages();
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
            <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <label className="text-sm font-semibold text-foreground">
                  Resume
                </label>
              </div>
              <select
                value={resumeInputMode}
                disabled={isBusy}
                onChange={(event) => {
                  setResumeInputMode(event.target.value as ResumeInputMode);
                  setUploadError(null);
                  setUploadMessage(null);
                }}
                className="h-8 max-w-[170px] rounded-md border border-border bg-background px-2 text-xs font-semibold text-foreground outline-none transition-colors hover:border-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-70"
                aria-label="Choose resume input mode"
              >
                <option value="file">Upload file</option>
                <option value="saved">Choose saved CV</option>
                <option value="paste">Paste text</option>
              </select>
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
                      Resume selected
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
                      Saved CV selected
                    </p>
                    <h3 className="mt-2 line-clamp-2 break-words text-lg font-bold text-foreground">
                      {selectedSavedCv.fileName}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Uploaded {formatUploadDate(selectedSavedCv.uploadedAt)}
                    </p>
                  </div>
                ) : (
                  <div className="h-[212px] rounded-xl border border-border bg-background/70 p-3">
                    {isLoadingCvs ? (
                      <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        Loading saved CVs...
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
                              setUploadMessage("Saved CV selected.");
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
                                Uploaded {formatUploadDate(cv.uploadedAt)}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm font-bold text-foreground">
                          No saved CVs yet
                        </span>
                        <span className="max-w-[280px] text-xs leading-5 text-muted-foreground">
                          Upload a resume file first, then it will appear here
                          for later scans.
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
                    placeholder="Paste resume text here."
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

          <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-background/30">
            <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
              <div className="flex items-center gap-2">
                <BriefcaseBusiness className="h-4 w-4 text-primary" />
                <label className="text-sm font-semibold text-foreground">
                  Target job
                </label>
              </div>
              {attachedJobId === null ? (
                <select
                  value={jdInputMode}
                  disabled={isBusy}
                  onChange={(event) => {
                    setJdInputMode(event.target.value as InputMode);
                    setJdError(null);
                    setJdMessage(null);
                  }}
                  className="h-8 max-w-[150px] rounded-md border border-border bg-background px-2 text-xs font-semibold text-foreground outline-none transition-colors hover:border-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-70"
                  aria-label="Choose target job input mode"
                >
                  <option value="file">Upload file</option>
                  <option value="paste">Paste text</option>
                </select>
              ) : null}
            </div>

            <div className="flex flex-1 flex-col gap-4 p-4">
              {attachedJobId !== null ? (
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
                    Target job attached
                  </p>
                  <h3 className="mt-2 line-clamp-2 text-lg font-bold text-foreground">
                    {attachedJobTitle || "Selected job"}
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
                      aria-label="Remove selected JD"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-card text-primary">
                      <CheckCircle2 className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-bold text-primary">
                      JD selected
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
                <div className="h-[212px] rounded-xl border border-border bg-background/70 p-4">
                  <textarea
                    value={jdText}
                    onChange={(event) => {
                      setJdText(event.target.value);
                      setSelectedJdName(null);
                      setJdMessage(null);
                      setJdError(null);
                    }}
                    placeholder="Paste job description text or search keywords."
                    className="h-full w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>
              )}

              {attachedJobId === null && isLoadingJobs ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Finding the closest target role...
                </p>
              ) : attachedJobId === null && targetJob ? (
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm">
                  <p className="font-medium text-primary">
                    Matched target role
                  </p>
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
