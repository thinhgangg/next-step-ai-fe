export const LATEST_ANALYSIS_ID_STORAGE_KEY = "nextstep.latestAnalysisId";
export const LATEST_ANALYSIS_RESULT_STORAGE_KEY =
  "nextstep.latestAnalysisResult";

export function getLatestAnalysisId(): number | null {
  const value = localStorage.getItem(LATEST_ANALYSIS_ID_STORAGE_KEY);
  if (!value) return null;

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function setLatestAnalysisId(analysisId: number): void {
  localStorage.setItem(LATEST_ANALYSIS_ID_STORAGE_KEY, String(analysisId));
  localStorage.removeItem(LATEST_ANALYSIS_RESULT_STORAGE_KEY);
}

export function getLatestAnalysisResult<T>(): T | null {
  const value = localStorage.getItem(LATEST_ANALYSIS_RESULT_STORAGE_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    localStorage.removeItem(LATEST_ANALYSIS_RESULT_STORAGE_KEY);
    return null;
  }
}

export function setLatestAnalysisResult(value: unknown): void {
  localStorage.setItem(
    LATEST_ANALYSIS_RESULT_STORAGE_KEY,
    JSON.stringify(value),
  );
  localStorage.removeItem(LATEST_ANALYSIS_ID_STORAGE_KEY);
}
