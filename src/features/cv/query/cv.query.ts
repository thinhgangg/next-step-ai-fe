import { gql } from "@apollo/client";
import { CV_ANALYSIS_FIELDS } from "@/features/cv/mutation/cv.mutation";

export const GET_CV_ANALYSIS_RESULT = gql`
  query GetCvAnalysisResult($analysisId: Int!) {
    getCvAnalysisResult(analysisId: $analysisId) {
      ...CvAnalysisFields
    }
  }
  ${CV_ANALYSIS_FIELDS}
`;

export const USER_CVS = gql`
  query UserCvs {
    userCvs {
      cvId
      fileName
      fileUrl
      uploadedAt
    }
  }
`;

export const GET_CV_FILE = gql`
  query GetCvFile($cvId: Int!) {
    getCvFile(cvId: $cvId) {
      fileName
      contentType
      base64
    }
  }
`;

export const GET_CV_ANALYSIS_HISTORY = gql`
  query GetCvAnalysisHistory($limit: Int) {
    getCvAnalysisHistory(limit: $limit) {
      total
      items {
        analysisId
        jobId
        jobTitle
        cvFilename
        createdAt
        jobMatchScore
        roadmapTotalWeeks
      }
    }
  }
`;
