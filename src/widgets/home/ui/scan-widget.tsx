import {
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  Check,
  CheckCircle2,
  CloudUpload,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useAnalyzeCv, useUploadCv } from "@/features/cv/model/cv.model";
import { useSession } from "@/features/auth/session/session.model";
import { useJobsCatalog } from "@/features/jobs/model/jobs.model";
import { setLatestAnalysisId } from "@/shared/config/latest-analysis";

const JD_SAMPLES = [
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Product Designer",
  "Data Analyst",
  "DevOps Engineer",
  "Mobile Developer",
  "Software Engineer",
  "QA Engineer",
  "Machine Learning Engineer",
];

const JD_CONTENT: Record<string, string> = {
  "Full Stack Developer":
    "We are looking for a highly skilled Full Stack Developer comfortable with both front-end and back-end programming.\n\nResponsibilities:\n- Develop front-end website architecture\n- Design user interactions on web pages\n- Build and maintain back-end APIs\n- Collaborate with product and design teams\n\nRequirements:\n- 3+ years with React and Node.js\n- Strong TypeScript and REST API knowledge\n- Experience with SQL/NoSQL databases\n- CI/CD and cloud deployment familiarity",
  "Frontend Developer":
    "Seeking a Frontend Developer to translate product requirements into clean, performant web interfaces.\n\nResponsibilities:\n- Build responsive UIs with React\n- Collaborate closely with designers\n- Maintain component libraries\n\nRequirements:\n- 2+ years React experience\n- Strong CSS and accessibility knowledge\n- Experience with design systems",
  "Backend Developer":
    "Join our backend team to build reliable APIs and services.\n\nResponsibilities:\n- Design and maintain microservices\n- Optimise database queries\n- Write API documentation\n\nRequirements:\n- 3+ years Node.js or Python\n- PostgreSQL / MongoDB experience\n- REST & GraphQL API design",
  "Product Designer":
    "We need a Product Designer to own user flows, wireframes, and high-fidelity prototypes.\n\nResponsibilities:\n- Create wireframes and prototypes in Figma\n- Conduct user research and usability tests\n- Collaborate with engineering for smooth delivery\n\nRequirements:\n- 3+ years product design experience\n- Proficiency in Figma\n- Strong portfolio demonstrating end-to-end design",
  "Data Analyst":
    "Looking for a Data Analyst to build dashboards and provide insights.\n\nResponsibilities:\n- Build and maintain BI dashboards\n- Perform exploratory data analysis\n- Present findings to stakeholders\n\nRequirements:\n- Proficiency in SQL and Python (pandas)\n- Experience with Tableau or Looker\n- Strong statistical reasoning",
  "DevOps Engineer":
    "Hiring a DevOps Engineer to improve deployment pipelines and ensure reliability.\n\nResponsibilities:\n- Manage CI/CD pipelines (GitHub Actions, Jenkins)\n- Maintain Kubernetes clusters\n- Implement observability solutions\n\nRequirements:\n- 3+ years DevOps/SRE experience\n- Terraform and cloud IaC proficiency\n- Linux administration skills",
  "Mobile Developer":
    "Seeking a Mobile Developer for iOS/Android features.\n\nResponsibilities:\n- Build cross-platform features in React Native\n- Optimise for performance and battery usage\n- Collaborate with QA on release testing\n\nRequirements:\n- 2+ years React Native experience\n- Familiarity with native APIs\n- App Store / Play Store deployment experience",
  "Software Engineer":
    "Hiring a Software Engineer to design and maintain scalable product features.\n\nResponsibilities:\n- Design, develop, test, and deploy features\n- Participate in code reviews\n- Contribute to architecture decisions\n\nRequirements:\n- 3+ years software engineering\n- Proficiency in at least one backend language\n- Strong fundamentals in data structures and algorithms",
  "QA Engineer":
    "We are hiring a QA Engineer to ensure product quality across web and mobile.\n\nResponsibilities:\n- Write and maintain automated test suites\n- Perform manual and exploratory testing\n- Report and track bugs to resolution\n\nRequirements:\n- 2+ years QA experience\n- Proficiency with Cypress or Playwright\n- Experience with API testing tools",
  "Machine Learning Engineer":
    "Seeking an ML Engineer to design and deploy machine learning models.\n\nResponsibilities:\n- Train and fine-tune ML models\n- Build data pipelines for model training\n- Deploy and monitor models in production\n\nRequirements:\n- 3+ years ML engineering experience\n- Proficiency in Python, PyTorch or TensorFlow\n- Experience with MLOps tooling (MLflow, SageMaker)",
};

const STEPS = [
  { label: "Upload Resume" },
  { label: "Add Job" },
  { label: "View Results" },
];

type LoadingStage = "uploading" | "scanning";

function Stepper({ current }: { current: number }) {
  return (
    <div className="mb-8 flex items-start justify-center">
      {STEPS.map((step, index) => {
        const num = index + 1;
        const isDone = num < current;
        const isActive = num === current;

        return (
          <div key={step.label} className="flex items-start">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-[15px] font-bold transition-colors ${
                  isDone
                    ? "border-primary bg-muted text-primary"
                    : isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-transparent text-muted-foreground"
                }`}
              >
                {isDone ? <Check className="h-4 w-4" /> : num}
              </div>
              <span
                className={`whitespace-nowrap text-[13px] font-semibold ${
                  isDone || isActive
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>

            {index < STEPS.length - 1 ? (
              <div
                className={`mt-[19px] h-[2px] w-24 flex-shrink-0 transition-colors ${
                  num < current ? "bg-foreground" : "bg-border"
                }`}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function StepUpload({
  onFile,
  onViewSampleReport,
}: {
  onFile: (file: File) => void;
  onViewSampleReport?: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (file?: File) => {
    if (!file) return;
    const ok = /\.(pdf|doc|docx)$/i.test(file.name);
    if (ok) onFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="flex flex-col items-center gap-[18px]">
      <label
        htmlFor="scan-resume-input"
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={handleDrop}
        className={`flex min-h-[280px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-8 text-center transition-all ${
          dragging ? "border-primary bg-muted" : "border-border bg-card"
        }`}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CloudUpload className="h-7 w-7" />
        </div>
        <p className="mt-4 text-lg font-semibold text-foreground">
          Drag & Drop or{" "}
          <span className="text-primary underline">Choose file</span> to upload
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          as .pdf or .docx file
        </p>
        <input
          id="scan-resume-input"
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0] ?? undefined)}
        />
      </label>

      <button
        type="button"
        onClick={onViewSampleReport}
        className="cursor-pointer inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      >
        View sample report
      </button>
    </div>
  );
}

function StepJob({
  fileName,
  onScan,
  onRemoveFile,
  onViewSampleReport,
  isUploading = false,
  isAnalyzing = false,
  statusMessage,
  errorMessage,
  isAuthenticated = false,
  isSessionLoading = false,
}: {
  fileName?: string;
  onScan: (jobId: number) => void;
  onRemoveFile?: () => void;
  onViewSampleReport?: () => void;
  isUploading?: boolean;
  isAnalyzing?: boolean;
  statusMessage?: string | null;
  errorMessage?: string | null;
  isAuthenticated?: boolean;
  isSessionLoading?: boolean;
}) {
  const [jd, setJd] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [jdFileName, setJdFileName] = useState<string | null>(null);
  const [draggingJd, setDraggingJd] = useState(false);
  const deferredJobSearch = useDeferredValue(jd.trim().slice(0, 160));
  const { jobs, loading: isLoadingJobs } = useJobsCatalog({
    search: deferredJobSearch || undefined,
    location: undefined,
    limit: 5,
    offset: 0,
    sortBy: deferredJobSearch ? "RELEVANCE" : "DATE",
    dateRange: "ANY",
    employmentType: "ALL",
    experienceRange: "ALL",
    skip: jd.trim().length === 0,
  });
  const targetJobId = jobs[0]?.jobId ?? null;

  const canScan = jd.trim().length > 0 && targetJobId !== null && !isLoadingJobs;

  const pickSample = (name: string) => {
    setSelected(name);
    setJd(JD_CONTENT[name] ?? "");
    setJdFileName(null);
  };

  const handleJdFile = (selectedFile?: File) => {
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setJd(text);
      setSelected(null);
      setJdFileName(selectedFile.name);
    };
    reader.readAsText(selectedFile);
  };

  const handleJdFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleJdFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleJdDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDraggingJd(false);
    handleJdFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {fileName ? (
        <div className="w-full rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm text-foreground">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-medium text-primary">
                <CheckCircle2 className="h-4 w-4" />
                Resume selected
              </div>
              <p className="mt-1 text-muted-foreground">{fileName}</p>
            </div>
            {onRemoveFile ? (
              <button
                type="button"
                onClick={onRemoveFile}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                aria-label="Remove selected resume"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <p className="w-full text-sm text-muted-foreground">
        {isSessionLoading
          ? "Checking your session before scanning."
          : isAuthenticated
          ? "Your resume will be uploaded when you click Scan."
          : "You can try the scan flow here. Sign in is required before viewing results."}
      </p>

      <div className="grid min-h-[320px] w-full grid-cols-[1fr_auto_1fr] overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold text-muted-foreground">
            Upload a Job Description
          </div>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <label
              onDragOver={(event) => {
                event.preventDefault();
                setDraggingJd(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setDraggingJd(false);
              }}
              onDrop={handleJdDrop}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-8 text-center transition-colors hover:border-primary hover:text-primary ${
                draggingJd
                  ? "border-primary bg-muted"
                  : "border-border bg-background"
              }`}
            >
              <CloudUpload className="h-8 w-8" />
              <span className="mt-3 text-sm font-semibold">
                Drag & Drop or <span className="underline">Choose JD file</span>
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                as .txt or .md file
              </span>
              <input
                type="file"
                accept=".txt,.md"
                className="hidden"
                onChange={handleJdFileChange}
              />
            </label>

            {jdFileName ? (
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm text-foreground">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 font-medium text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                      Job description selected
                    </div>
                    <p className="mt-1 text-muted-foreground">{jdFileName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setJd("");
                      setJdFileName(null);
                    }}
                    className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                    aria-label="Remove selected job description"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}

            <textarea
              value={jd}
              onChange={(event) => {
                setJd(event.target.value);
                setSelected(null);
                setJdFileName(null);
              }}
              placeholder="Or paste a job description here"
              className="min-h-[104px] flex-1 resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none"
            />
          </div>
        </div>

        <div className="relative w-px bg-border">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded bg-card px-2 py-1 text-xs font-semibold tracking-wide text-muted-foreground">
            OR
          </div>
        </div>

        <div className="flex flex-col">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold text-muted-foreground">
            Use a Job Description Sample
          </div>
          <div className="flex-1 overflow-y-auto">
            {JD_SAMPLES.map((name) => {
              const active = selected === name;
              return (
                <button
                  key={name}
                  onClick={() => pickSample(name)}
                  className={`flex w-full items-center justify-between border-b border-border px-4 py-2.5 text-left text-sm transition-colors ${
                    active
                      ? "bg-muted text-foreground"
                      : "bg-transparent text-foreground hover:bg-background"
                  }`}
                >
                  <span>{name}</span>
                  {active ? <Check className="h-4 w-4" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button
        disabled={!canScan || isUploading || isAnalyzing}
        onClick={() => {
          if (canScan && targetJobId) onScan(targetJobId);
        }}
        className="rounded-md bg-primary px-8 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
      >
        {isUploading || isAnalyzing ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isUploading ? "Uploading..." : "Scanning..."}
          </span>
        ) : (
          isLoadingJobs ? "Preparing..." : "Scan"
        )}
      </button>

      {statusMessage ? <p className="text-sm text-primary">{statusMessage}</p> : null}
      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

      <button
        type="button"
        onClick={onViewSampleReport}
        className="cursor-pointer inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      >
        <FileText className="h-4 w-4" /> View sample report
      </button>
    </div>
  );
}

type ScanWidgetProps = {
  onScanComplete: () => void;
  onViewSampleReport?: () => void;
};

function LoadingPanel({
  fileName,
  progress,
  stage,
}: {
  fileName?: string;
  progress: number;
  stage: LoadingStage;
}) {
  const title =
    stage === "uploading" ? "Uploading your resume" : "Preparing your results";
  const subtitle =
    stage === "uploading"
      ? "We are securely uploading your selected resume."
      : "Our AI is matching your resume against the selected job.";

  return (
    <div className="rounded-[20px] border border-dashed border-primary/40 bg-card px-6 py-12 sm:px-10">
      <div className="mx-auto flex max-w-[520px] flex-col items-center text-center">
        <h3 className="text-[32px] font-bold leading-tight text-foreground">
          {title}
        </h3>
        <p className="mt-2 text-base text-muted-foreground">{subtitle}</p>

        <div className="mt-8 flex items-center gap-2 text-sm text-foreground">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="line-clamp-1">{fileName ?? "Selected resume"}</span>
        </div>

        <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-border/60">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#b8f1d3_0%,#76bdf2_45%,#2f7eea_100%)] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function ScanWidget({
  onScanComplete,
  onViewSampleReport,
}: ScanWidgetProps) {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPreparingScan, setIsPreparingScan] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>("uploading");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { uploadCv, isUploading } = useUploadCv();
  const { analyzeCv, isAnalyzing } = useAnalyzeCv();
  const { isAuthenticated, isSessionLoading } = useSession();
  const currentStep = isPreparingScan ? 3 : file ? 2 : 1;

  const handleScan = async (jobId: number) => {
    setErrorMessage(null);
    setStatusMessage(null);

    if (isSessionLoading) {
      setErrorMessage("Still checking your session. Please try again in a moment.");
      return;
    }

    if (!isAuthenticated) {
      navigate({ to: "/login" });
      return;
    }

    setIsPreparingScan(true);
    setLoadingStage("uploading");
    setLoadingProgress(18);

    if (file) {
      try {
        const result = await uploadCv(file);
        setStatusMessage(`Resume uploaded: ${result.fileName}. Starting scan...`);
        setLoadingStage("scanning");
        setLoadingProgress(72);

        const analysis = await analyzeCv(Number(result.cvId), jobId);
        if (analysis.analysisResultId) {
          setLatestAnalysisId(analysis.analysisResultId);
        }
      } catch {
        setStatusMessage(null);
        setErrorMessage("Scan failed. Please try again with another resume or job.");
        setIsPreparingScan(false);
        setLoadingProgress(0);
        return;
      }
    }

    onScanComplete();
  };

  useEffect(() => {
    if (!isPreparingScan) return;

    if (loadingStage === "uploading") {
      const timeout = window.setTimeout(() => {
        setLoadingProgress((prev) => (prev < 54 ? 54 : prev));
      }, 220);

      return () => {
        window.clearTimeout(timeout);
      };
    }

    const t1 = window.setTimeout(() => setLoadingProgress(82), 150);
    const t2 = window.setTimeout(() => setLoadingProgress(92), 450);
    const t3 = window.setTimeout(() => setLoadingProgress(100), 900);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [isPreparingScan, loadingStage]);

  return (
    <section id="how-it-works" className="bg-muted py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="mb-12">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight">
            Precision Job Matching in Minutes
          </h2>
          <p className="text-muted-foreground text-center">
            Our streamlined three-step process ensures your resume speaks the
            language of recruiters and ATS systems.
          </p>
        </div>

        <div className="rounded-[20px] border border-border bg-muted px-10 py-9">
          <Stepper current={currentStep} />

          {isPreparingScan ? (
            <LoadingPanel
              fileName={file?.name}
              progress={loadingProgress}
              stage={loadingStage}
            />
          ) : currentStep === 1 ? (
            <StepUpload
              onFile={(selectedFile) => {
                setFile(selectedFile);
                setStatusMessage(null);
                setErrorMessage(null);
              }}
              onViewSampleReport={onViewSampleReport}
            />
          ) : null}

          {currentStep === 2 ? (
            <StepJob
              fileName={file?.name}
              onScan={(jobId) => {
                void handleScan(jobId);
              }}
              onRemoveFile={() => {
                setFile(null);
                setStatusMessage(null);
                setErrorMessage(null);
              }}
              onViewSampleReport={onViewSampleReport}
              isUploading={isUploading}
              isAnalyzing={isAnalyzing}
              statusMessage={statusMessage}
              errorMessage={errorMessage}
              isAuthenticated={isAuthenticated}
              isSessionLoading={isSessionLoading}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
