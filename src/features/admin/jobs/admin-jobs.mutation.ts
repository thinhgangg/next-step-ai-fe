import { gql } from "@apollo/client";

export const CREATE_JOB = gql`
  mutation CreateJob($input: CreateJobInput!) {
    createJob(input: $input) {
      jobId
      title
    }
  }
`;

export const UPDATE_JOB = gql`
  mutation UpdateJob($input: UpdateJobInput!) {
    updateJob(input: $input) {
      jobId
      title
    }
  }
`;

export const DELETE_JOB = gql`
  mutation DeleteJob($jobId: Int!) {
    deleteJob(jobId: $jobId)
  }
`;
