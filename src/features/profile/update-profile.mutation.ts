import { gql } from "@apollo/client";

export const UPDATE_USER_PROFILE_MUTATION = gql`
  mutation UpdateUserProfile($input: UpdateUserProfileInput!) {
    updateUserProfile(input: $input) {
      userId
      name
      email
      avatar
      baseCvId
      currentRole
      location
      experienceYears
      targetSalaryMin
      targetSalaryMax
      phone
      githubUrl
      linkedinUrl
      portfolioUrl
      skills
      suggestedImprovements {
        id
        title
        status
      }
      experiences {
        id
        title
        organization
        type
        startDate
        endDate
        isCurrent
        description
        technologies
      }
      careerGoals {
        targetRole
        preferredLocation
        workStyle
        goal
      }
    }
  }
`;

export const GET_AVATAR_UPLOAD_URL_MUTATION = gql`
  mutation GetAvatarUploadUrl($fileName: String!) {
    getAvatarUploadUrl(fileName: $fileName) {
      uploadUrl
      fileKey
    }
  }
`;

export const CONFIRM_AVATAR_UPLOAD_MUTATION = gql`
  mutation ConfirmAvatarUpload($fileKey: String!) {
    confirmAvatarUpload(fileKey: $fileKey) {
      userId
      avatar
    }
  }
`;
