import { useDeferredValue, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  CloudUpload,
  Loader2,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { useAnalyzeCv, useUploadCv } from "@/features/cv/model/cv.model";
import { useJobsCatalog } from "@/features/jobs/model/jobs.model";
import { setLatestAnalysisId } from "@/shared/config/latest-analysis";

type NewScanSectionProps = {
  onScan?: () => void;
};

export function NewScanSection({ onScan }: NewScanSectionProps) {
  const navigate = useNavigate();
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [selectedResumeFile, setSelectedResumeFile] = useState<File | null>(
    null,
  );
  const [selectedResumeName, setSelectedResumeName] = useState<string | null>(
    null,
  );
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const deferredJobSearch = useDeferredValue(jdText.trim().slice(0, 160));

  const { uploadCv, isUploading } = useUploadCv();
  const { analyzeCv, isAnalyzing } = useAnalyzeCv();
  const { jobs, loading: isLoadingJobs } = useJobsCatalog({
    search: deferredJobSearch || undefined,
    location: undefined,
    limit: 5,
    offset: 0,
    sortBy: deferredJobSearch ? "RELEVANCE" : "DATE",
    dateRange: "ANY",
    employmentType: "ALL",
    experienceRange: "ALL",
  });

  const selectedJob = useMemo(
    () => jobs.find((job) => job.jobId === selectedJobId) ?? null,
    [jobs, selectedJobId],
  );

  const clearSelectedResume = () => {
    setSelectedResumeFile(null);
    setSelectedResumeName(null);
    setUploadMessage(null);
    setUploadError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedResumeFile(file);
    setSelectedResumeName(file.name);
    setResumeText("");
    setUploadError(null);
    setUploadMessage("Resume selected.");
    e.target.value = "";
  };

  const hasResumeInput =
    resumeText.trim().length > 0 || selectedResumeFile !== null;
  const isBusy = isUploading || isAnalyzing;
  const canScan = hasResumeInput && selectedJobId !== null;

  const buildTextResumeFile = () =>
    new File([resumeText.trim()], "resume.txt", { type: "text/plain" });

  const handleScan = async () => {
    if (!canScan || isBusy || !selectedJobId) return;

    try {
      setUploadError(null);
      setUploadMessage("Uploading resume...");

      const fileToUpload = selectedResumeFile ?? buildTextResumeFile();
      const uploadedCv = await uploadCv(fileToUpload);

      setSelectedResumeName(uploadedCv.fileName);
      setUploadMessage("Analyzing match...");

      const analysis = await analyzeCv(Number(uploadedCv.cvId), selectedJobId);
      if (analysis.analysisResultId) {
        setLatestAnalysisId(analysis.analysisResultId);
      }

      onScan?.();
      navigate({ to: "/match-report" });
    } catch (error) {
      console.error("Analyze error:", error);
      setUploadMessage(null);
      setUploadError("Scan failed. Please try again with another resume or job.");
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <section className="border-b border-border bg-muted p-5 pb-4">
        <h2 className="text-[22px] font-bold text-foreground">New Scan</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Compare a resume with a target role.
        </p>
      </section>

      <section className="bg-background p-5">
        <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="flex flex-col overflow-hidden rounded-xl border border-border">
            <div className="flex items-center justify-between border-b border-border bg-card p-4">
              <label className="text-sm font-semibold text-foreground">
                Resume
              </label>
              <a
                href="#"
                className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <Star className="h-4 w-4" />
                Saved Resumes
              </a>
            </div>
            <div className="flex flex-1 flex-col gap-4 bg-background/50 p-4">
              <textarea
                value={resumeText}
                onChange={(e) => {
                  setResumeText(e.target.value);
                  if (e.target.value.trim().length > 0) {
                    clearSelectedResume();
                  }
                }}
                placeholder="Paste resume text"
                className="min-h-[180px] w-full flex-1 resize-none bg-transparent text-sm text-muted-foreground outline-none placeholder:text-muted-foreground"
              />
              <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card py-2.5 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:border-primary hover:text-primary">
                {isBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin text-foreground" />
                ) : (
                  <CloudUpload className="h-4 w-4" />
                )}
                {isBusy ? "Processing..." : "Upload resume"}{" "}
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  disabled={isBusy}
                  onChange={handleFileChange}
                />
              </label>

              {selectedResumeName ? (
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm text-foreground">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 font-medium text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                        Resume selected
                      </div>
                      <p className="mt-1 text-muted-foreground">
                        {selectedResumeName}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearSelectedResume}
                      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                      aria-label="Remove selected resume"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : null}

              {uploadMessage ? (
                <p className="text-sm text-primary">{uploadMessage}</p>
              ) : null}

              {uploadError ? (
                <p className="text-sm text-destructive">{uploadError}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-xl border border-border">
            <div className="flex items-center border-b border-border bg-card p-4">
              <label className="text-sm font-semibold text-foreground">
                Target role
              </label>
            </div>
            <div className="flex flex-1 flex-col gap-4 bg-background/50 p-4">
              <textarea
                value={jdText}
                onChange={(e) => {
                  setJdText(e.target.value);
                  setSelectedJobId(null);
                }}
                placeholder="Paste a job description or search keywords"
                className="min-h-[140px] w-full resize-none bg-transparent text-sm text-muted-foreground outline-none placeholder:text-muted-foreground"
              />

              <div className="rounded-lg border border-border bg-card">
                <div className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Matching Jobs
                </div>
                <div className="max-h-[220px] overflow-y-auto">
                  {isLoadingJobs ? (
                    <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching jobs...
                    </div>
                  ) : jobs.length > 0 ? (
                    jobs.map((job) => {
                      const isSelected = job.jobId === selectedJobId;

                      return (
                        <button
                          key={job.jobId}
                          type="button"
                          onClick={() => setSelectedJobId(Number(job.jobId))}
                          className={`w-full border-b border-border px-3 py-3 text-left last:border-b-0 ${
                            isSelected
                              ? "bg-primary/5"
                              : "hover:bg-background/80"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {job.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {job.company.name}
                                {job.location ? ` • ${job.location}` : ""}
                              </p>
                            </div>
                            {isSelected ? (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            ) : null}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <p className="px-3 py-4 text-sm text-muted-foreground">
                      No matches yet. Try a shorter keyword.
                    </p>
                  )}
                </div>
              </div>

              {selectedJob ? (
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
                  <p className="font-medium text-primary">Selected target job</p>
                  <p className="mt-1">
                    {selectedJob.title} • {selectedJob.company.name}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Choose a role to run the scan.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/sample-report" })}
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            View sample report
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-accent px-3 py-1.5">
              <span className="text-sm text-muted-foreground">
                Available scans:{" "}
                <span className="font-bold text-accent-foreground">5</span>
              </span>
              <a
                href="#"
                className="text-sm font-semibold text-primary hover:underline"
              >
                Upgrade
              </a>
            </div>

            <button className="flex cursor-not-allowed items-center gap-1.5 rounded-md bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              One-Click Optimize
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
        </div>
      </section>
    </div>
  );
}
