import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  BriefcaseBusiness,
  CloudUpload,
  Eye,
  Loader2,
  RefreshCcw,
  Search,
  Star,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AppShell } from "@/shared/ui/app-shell";
import { useToast } from "@/shared/ui/toast";
import {
  useCvAnalysisHistory,
  useCvFile,
  useDeleteCv,
  useRenameCv,
  useSetBaseCv,
  useUploadCv,
  useUserCvs,
  type UploadedCv,
} from "@/features/cv/model/cv.model";
import { getUserFacingErrorMessage } from "@/shared/api/graphql/error-message";
import { useSession } from "@/features/auth/session/session.model";

function formatUploadDate(value?: string | null) {
  if (!value) return "Unknown date";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Unknown date";

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp));
}

const PAGE_SIZE = 10;

function base64ToBlob(base64: string, contentType: string) {
  const byteCharacters = atob(base64);
  const byteArrays: ArrayBuffer[] = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
    const slice = byteCharacters.slice(offset, offset + 1024);
    const byteNumbers = new Array(slice.length);

    for (let index = 0; index < slice.length; index += 1) {
      byteNumbers[index] = slice.charCodeAt(index);
    }

    const bytes = new Uint8Array(byteNumbers);
    byteArrays.push(bytes.buffer.slice(0));
  }

  return new Blob(byteArrays, {
    type: contentType || "application/octet-stream",
  });
}

export function ResumeManagerPage() {
  const navigate = useNavigate();
  const { cvs, loading, error, refetch } = useUserCvs();
  const { items: analysisHistory } = useCvAnalysisHistory();
  const { uploadCv, isUploading } = useUploadCv();
  const { getCvFile, isGettingCvFile } = useCvFile();
  const { deleteCv, isDeleting } = useDeleteCv();
  const { renameCv, isRenaming } = useRenameCv();
  const { setBaseCv, isSettingBaseCv } = useSetBaseCv();
  const { user } = useSession();
  const { showToast } = useToast();
  const [searchValue, setSearchValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<UploadedCv | null>(null);
  const [optimisticBaseCvId, setOptimisticBaseCvId] = useState<string | null>(
    null,
  );
  const [editingCvId, setEditingCvId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCvs = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase();
    if (!normalizedQuery) return cvs;

    return cvs.filter((cv) =>
      cv.fileName.toLowerCase().includes(normalizedQuery),
    );
  }, [cvs, searchValue]);
  const totalItems = filteredCvs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedCvs = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredCvs.slice(start, start + PAGE_SIZE);
  }, [filteredCvs, safeCurrentPage]);
  const fromItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const toItem =
    totalItems === 0 ? 0 : Math.min(totalItems, safeCurrentPage * PAGE_SIZE);
  const latestUploadDate = useMemo(() => {
    const latestTimestamp = cvs.reduce((latest, cv) => {
      const timestamp = new Date(cv.uploadedAt ?? "").getTime();
      return Number.isNaN(timestamp) ? latest : Math.max(latest, timestamp);
    }, 0);

    return latestTimestamp ? formatUploadDate(new Date(latestTimestamp).toISOString()) : "None";
  }, [cvs]);
  const latestJobByFilename = useMemo(() => {
    const jobMap = new Map<string, string>();

    analysisHistory.forEach((item) => {
      if (!item.cvFilename || jobMap.has(item.cvFilename)) return;
      jobMap.set(item.cvFilename, item.jobTitle || "-");
    });

    return jobMap;
  }, [analysisHistory]);
  const isInitialLoading = loading && cvs.length === 0;

  const baseCvId = optimisticBaseCvId ?? (user?.baseCvId ? String(user.baseCvId) : null);

  const handleUpload = async (file?: File) => {
    if (!file) return;

    try {
      await uploadCv(file);
      showToast("Upload complete", {
        description: "Your resume is ready to use.",
      });
      await refetch();
    } catch {
      showToast("Upload failed", {
        description: "Please try again with another file.",
        variant: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const deleted = await deleteCv(Number(deleteTarget.cvId));
      if (deleted) {
        showToast("Resume deleted", {
          description: "It has been removed from your library.",
        });
      }
      setDeleteTarget(null);
    } catch {
      showToast("Delete failed", {
        description: "Please try again in a moment.",
        variant: "error",
      });
    }
  };

  const handleMatchJobs = async (cv: UploadedCv) => {
    await handleSetBase(cv);
    navigate({ to: "/jobs" });
  };

  const handleViewCv = async (cv: UploadedCv) => {
    const viewWindow = window.open("about:blank", "_blank");
    if (viewWindow) {
      viewWindow.opener = null;
    }

    try {
      const file = await getCvFile(Number(cv.cvId));
      const blob = base64ToBlob(file.base64, file.contentType);
      const viewUrl = URL.createObjectURL(blob);

      if (viewWindow) {
        viewWindow.document.title = file.fileName;
        viewWindow.location.href = viewUrl;
      } else {
        window.location.href = viewUrl;
      }

      window.setTimeout(() => URL.revokeObjectURL(viewUrl), 60_000);
    } catch {
      viewWindow?.close();
      showToast("Could not open resume", {
        description: "Please try again in a moment.",
        variant: "error",
      });
    }
  };

  const handleSetBase = async (cv: UploadedCv) => {
    try {
      const nextBaseCvId = await setBaseCv(Number(cv.cvId));
      setOptimisticBaseCvId(nextBaseCvId ? String(nextBaseCvId) : null);
      showToast("Base resume updated");
    } catch {
      showToast("Could not update base resume", {
        description: "Please try again in a moment.",
        variant: "error",
      });
    }
  };

  const startRename = (cv: UploadedCv) => {
    setEditingCvId(String(cv.cvId));
    setEditingName(cv.fileName);
  };

  const cancelRename = () => {
    setEditingCvId(null);
    setEditingName("");
  };

  const submitRename = async (cv: UploadedCv) => {
    const nextName = editingName.trim();
    if (!nextName || nextName === cv.fileName) {
      cancelRename();
      return;
    }

    try {
      await renameCv(Number(cv.cvId), nextName);
      showToast("Resume renamed", {
        description: "Your change has been saved.",
      });
      cancelRename();
    } catch {
      showToast("Rename failed", {
        description: "Please try again in a moment.",
        variant: "error",
      });
    }
  };

  return (
    <AppShell fullWidth>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <section className="border-b border-border bg-muted p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-[22px] font-bold text-foreground">
                Resume Manager
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage CVs for scans and job matching.
              </p>
            </div>

            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CloudUpload className="h-4 w-4" />
              )}
              {isUploading ? "Uploading..." : "Upload CV"}
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
                disabled={isUploading}
                onChange={(event) => {
                  void handleUpload(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Total CVs
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {cvs.length}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Latest Upload
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {latestUploadDate}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Supported Files
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  PDF, DOCX, TXT
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-[280px] max-w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchValue}
                  onChange={(event) => {
                    setSearchValue(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search CVs"
                  className="h-10 w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground"
                />
              </div>
              <button
                type="button"
                onClick={() => void refetch()}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground hover:bg-background"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </section>

        <section className="bg-background p-5">
          {isInitialLoading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-border bg-card">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Loading...
              </div>
            </div>
          ) : error ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <h3 className="text-base font-bold text-foreground">
                Unable to load resumes
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {getUserFacingErrorMessage(error)}
              </p>
            </div>
          ) : filteredCvs.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                No resumes found
              </h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Upload a CV to start matching jobs.
              </p>
            </div>
          ) : (
            <div className="min-h-[320px] space-y-4">
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px] table-fixed">
                    <thead>
                      <tr className="border-b border-border bg-card text-left text-sm font-semibold text-foreground">
                        <th className="w-[88px] px-5 py-3">Base</th>
                        <th className="w-[280px] px-4 py-3">Resume</th>
                        <th className="px-4 py-3">Job Title</th>
                        <th className="w-[150px] px-4 py-3">Created</th>
                        <th className="w-[150px] px-4 py-3">Last Modified</th>
                        <th className="w-[150px] px-4 py-3 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedCvs.map((cv) => (
                        <tr
                          key={cv.cvId}
                          className="border-b border-border last:border-b-0 hover:bg-muted/40"
                        >
                          <td className="px-5 py-4 align-top">
                            <button
                              type="button"
                              onClick={() => void handleSetBase(cv)}
                              disabled={isSettingBaseCv}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                              title="Set as base resume"
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  baseCvId === String(cv.cvId)
                                    ? "fill-primary text-primary"
                                    : ""
                                }`}
                              />
                            </button>
                          </td>
                          <td className="px-4 py-4">
                            <div className="min-w-0">
                              {editingCvId === String(cv.cvId) ? (
                                <input
                                  value={editingName}
                                  autoFocus
                                  disabled={isRenaming}
                                  onChange={(event) =>
                                    setEditingName(event.target.value)
                                  }
                                  onBlur={() => void submitRename(cv)}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      void submitRename(cv);
                                    }
                                    if (event.key === "Escape") {
                                      cancelRename();
                                    }
                                  }}
                                  className="h-9 w-full rounded-md border border-primary bg-card px-3 text-sm text-foreground outline-none"
                                />
                              ) : (
                                <button
                                  type="button"
                                  title="Rename"
                                  onClick={() => startRename(cv)}
                                  className="block max-w-full truncate text-left text-sm font-semibold text-foreground hover:text-primary"
                                >
                                  {cv.fileName}
                                </button>
                              )}
                              <p className="mt-1 truncate text-xs text-muted-foreground">
                                Upload #{cv.cvId}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <p className="line-clamp-2 text-foreground">
                              {latestJobByFilename.get(cv.fileName) ?? "-"}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">
                            {formatUploadDate(cv.uploadedAt)}
                          </td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">
                            {formatUploadDate(cv.uploadedAt)}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => void handleViewCv(cv)}
                                disabled={isGettingCvFile}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                                title="Open"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleMatchJobs(cv)}
                                disabled={isSettingBaseCv}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                                title="Match jobs"
                              >
                                <BriefcaseBusiness className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(cv)}
                                disabled={isDeleting}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <p className="text-muted-foreground">
                  Showing {fromItem}-{toItem} of {totalItems}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={safeCurrentPage === 1}
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-muted-foreground">
                    {safeCurrentPage}/{totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={safeCurrentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {deleteTarget ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
            <h3 className="text-lg font-bold text-foreground">
              Delete resume?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This removes {deleteTarget.fileName} from your library.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="h-9 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-background"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-destructive px-4 text-sm font-semibold text-destructive-foreground disabled:opacity-60"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
