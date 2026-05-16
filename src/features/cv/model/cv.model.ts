import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import { useState } from "react";
import {
  ANALYZE_CV,
  ANALYZE_CV_WITH_JD,
  CONFIRM_CV_UPLOAD,
  DELETE_CV,
  GET_PRESIGNED_URL,
  RENAME_CV,
  SET_BASE_CV,
} from "../mutation/cv.mutation";
import {
  GET_CV_FILE,
  GET_CV_ANALYSIS_HISTORY,
  GET_CV_ANALYSIS_RESULT,
  USER_CVS,
} from "../query/cv.query";
import { ME_QUERY } from "@/features/auth/query/me.query";

interface GetPresignedUrlResponse {
  getPresignedUrl: {
    uploadUrl: string;
    fileKey: string;
  };
}

export type UploadedCv = {
  cvId: string;
  fileName: string;
  fileUrl: string;
  uploadedAt?: string;
};

interface ConfirmCvUploadResponse {
  confirmCvUpload: UploadedCv;
}

interface DeleteCvResponse {
  deleteCv: boolean;
}

interface RenameCvResponse {
  renameCv: UploadedCv;
}

interface SetBaseCvResponse {
  setBaseCv: {
    userId: string;
    baseCvId?: number | null;
  };
}

export type CvSkillAnalysis = {
  name: string;
  proficiency: number;
  yearsOfExperience: number;
};

export type JobSkillAnalysis = {
  name: string;
  importance: number;
  requiredProficiency: number;
};

export type CvAnalysisResult = {
  analysisResultId?: number | null;
  extractedProfile: {
    cvLevel: string;
    cvYearsExperience: number;
    preferredLocations: string[];
    cvCertifications: string[];
    cvSkills: CvSkillAnalysis[];
  };
  jobContext: {
    jobId: number;
    title: string;
    sourceUrl: string;
    jobLevel: string;
    jobYearsRequired: number;
    jobLocation?: string | null;
    jobIsRemote: boolean;
    jobSkills: JobSkillAnalysis[];
  };
  jobMatch: {
    score: number;
    scoreBreakdown: {
      skillMatch: number;
      experienceMatch: number;
      levelMatch: number;
      salaryMatch: number;
      locationMatch: number;
      keywordMatch?: number | null;
      titleMatch?: number | null;
      atsReadability?: number | null;
    };
    missingSkills: string[];
    matchedSkills: string[];
  };
  gapAnalysis: {
    recommendedSkills: string[];
    skillGap: {
      missing: Array<{
        skill: string;
        importance: string;
        reason: string;
      }>;
      weak: Array<{
        skill: string;
        currentProficiency: number;
        requiredProficiency: number;
        gap: number;
      }>;
    };
    experienceGap: {
      requiredYears: number;
      currentYears: number;
      gapWeeks: number;
    };
    levelGap: {
      cvLevel: string;
      jobLevel: string;
      gapLevels: number;
    };
    certificationGap: {
      required: string[];
      have: string[];
      missing: string[];
    };
  };
  roadmap: {
    totalWeeks: number;
    estimatedCompletion: string;
    difficultyLevel: string;
    phases: Array<{
      phase: number;
      durationWeeks: number;
      title: string;
      skills: Array<{
        skillName: string;
        priority: number;
        estimatedWeeks: number;
        baselineHours?: number | null;
        transferBonus: number;
        transferDirectionFactor?: number | null;
        effectiveTransferBonus?: number | null;
        adjustedHours?: number | null;
        recommendedResources: Array<{
          title: string;
          provider?: string | null;
          url?: string | null;
          durationHours?: number | null;
        }>;
      }>;
    }>;
  };
  aiReview?: {
    summary: string;
    strengths: string[];
    concerns: string[];
    recommendations: string[];
    verdict: string;
    source: string;
  } | null;
};

interface AnalyzeCvResponse {
  analyzeCv: CvAnalysisResult;
}

interface AnalyzeCvWithJdResponse {
  analyzeCvWithJd: CvAnalysisResult;
}

interface GetCvAnalysisResultResponse {
  getCvAnalysisResult: CvAnalysisResult;
}

interface UserCvsResponse {
  userCvs: UploadedCv[];
}

export type CvFile = {
  fileName: string;
  contentType: string;
  base64: string;
};

interface GetCvFileResponse {
  getCvFile: CvFile;
}

export type CvAnalysisHistoryItem = {
  analysisId: number;
  jobId: number;
  jobTitle: string;
  cvFilename?: string | null;
  createdAt: string;
  jobMatchScore?: number | null;
  roadmapTotalWeeks?: number | null;
};

interface GetCvAnalysisHistoryResponse {
  getCvAnalysisHistory: {
    total: number;
    items: CvAnalysisHistoryItem[];
  };
}

export function useUploadCv() {
  const [isUploading, setIsUploading] = useState(false);

  const [getPresignedUrl] =
    useMutation<GetPresignedUrlResponse>(GET_PRESIGNED_URL);
  const [confirmCvUpload] =
    useMutation<ConfirmCvUploadResponse>(CONFIRM_CV_UPLOAD);

  const uploadCv = async (file: File) => {
    try {
      setIsUploading(true);

      const { data: presignedData } = await getPresignedUrl({
        variables: { fileName: file.name },
      });

      if (!presignedData) throw new Error("No data received from server");

      const { uploadUrl, fileKey } = presignedData.getPresignedUrl;

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to storage");
      }

      const { data: confirmData } = await confirmCvUpload({
        variables: {
          fileName: file.name,
          fileKey,
        },
        refetchQueries: [{ query: USER_CVS }],
      });

      if (!confirmData) throw new Error("Failed to confirm upload");

      return confirmData.confirmCvUpload;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadCv,
    isUploading,
  };
}

export function useAnalyzeCv() {
  const [analyzeCvMutation, state] =
    useMutation<AnalyzeCvResponse>(ANALYZE_CV);

  const analyzeCv = async (cvId: number, jobId: number) => {
    const { data } = await analyzeCvMutation({
      variables: { cvId, jobId },
    });

    if (!data) {
      throw new Error("Failed to analyze CV");
    }

    return data.analyzeCv;
  };

  return {
    analyzeCv,
    isAnalyzing: state.loading,
  };
}

export function useCvAnalysisResult(analysisId?: number | null) {
  const query = useQuery<GetCvAnalysisResultResponse>(GET_CV_ANALYSIS_RESULT, {
    variables: {
      analysisId,
    },
    skip: !analysisId,
  });

  return {
    analysis: query.data?.getCvAnalysisResult ?? null,
    loading: query.loading,
    error: query.error,
  };
}

export function useUserCvs() {
  const query = useQuery<UserCvsResponse>(USER_CVS, {
    fetchPolicy: "cache-and-network",
  });

  return {
    cvs: query.data?.userCvs ?? [],
    loading: query.loading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useAnalyzeCvWithJd() {
  const [analyzeCvWithJdMutation, state] =
    useMutation<AnalyzeCvWithJdResponse>(ANALYZE_CV_WITH_JD);

  const analyzeCvWithJd = async (
    cvId: number,
    input: {
      jdText?: string | null;
      jdFileBase64?: string | null;
      jdFileName?: string | null;
      jdContentType?: string | null;
    },
  ) => {
    const { data } = await analyzeCvWithJdMutation({
      variables: {
        cvId,
        jdText: input.jdText ?? null,
        jdFileBase64: input.jdFileBase64 ?? null,
        jdFileName: input.jdFileName ?? null,
        jdContentType: input.jdContentType ?? null,
      },
    });

    if (!data) {
      throw new Error("Failed to analyze CV with JD");
    }

    return data.analyzeCvWithJd;
  };

  return {
    analyzeCvWithJd,
    isAnalyzingWithJd: state.loading,
  };
}

export function useCvFile() {
  const [getCvFileQuery, state] = useLazyQuery<GetCvFileResponse>(GET_CV_FILE, {
    fetchPolicy: "network-only",
  });

  const getCvFile = async (cvId: number) => {
    const { data } = await getCvFileQuery({
      variables: { cvId },
    });

    if (!data?.getCvFile) {
      throw new Error("Failed to get CV file");
    }

    return data.getCvFile;
  };

  return {
    getCvFile,
    isGettingCvFile: state.loading,
    error: state.error,
  };
}

export function useDeleteCv() {
  const [deleteCvMutation, state] = useMutation<DeleteCvResponse>(DELETE_CV);

  const deleteCv = async (cvId: number) => {
    const { data } = await deleteCvMutation({
      variables: { cvId },
      refetchQueries: [{ query: USER_CVS }],
      awaitRefetchQueries: true,
    });

    return Boolean(data?.deleteCv);
  };

  return {
    deleteCv,
    isDeleting: state.loading,
    error: state.error,
  };
}

export function useRenameCv() {
  const [renameCvMutation, state] = useMutation<RenameCvResponse>(RENAME_CV);

  const renameCv = async (cvId: number, fileName: string) => {
    const { data } = await renameCvMutation({
      variables: { cvId, fileName },
      refetchQueries: [{ query: USER_CVS }],
      awaitRefetchQueries: true,
    });

    if (!data) {
      throw new Error("Failed to rename CV");
    }

    return data.renameCv;
  };

  return {
    renameCv,
    isRenaming: state.loading,
    error: state.error,
  };
}

export function useSetBaseCv() {
  const [setBaseCvMutation, state] = useMutation<SetBaseCvResponse>(
    SET_BASE_CV,
  );

  const setBaseCv = async (cvId: number | null) => {
    const { data } = await setBaseCvMutation({
      variables: { cvId },
      refetchQueries: [{ query: ME_QUERY }],
      awaitRefetchQueries: true,
    });

    if (!data) {
      throw new Error("Failed to set base CV");
    }

    return data.setBaseCv.baseCvId ?? null;
  };

  return {
    setBaseCv,
    isSettingBaseCv: state.loading,
    error: state.error,
  };
}

export function useCvAnalysisHistory(limit = 100) {
  const query = useQuery<GetCvAnalysisHistoryResponse>(
    GET_CV_ANALYSIS_HISTORY,
    {
      variables: { limit },
      fetchPolicy: "cache-and-network",
    },
  );

  return {
    items: query.data?.getCvAnalysisHistory.items ?? [],
    total: query.data?.getCvAnalysisHistory.total ?? 0,
    loading: query.loading,
    error: query.error,
  };
}
