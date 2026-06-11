import { gql } from "@apollo/client";

export const ME_QUERY = gql`
  query Me {
    me {
      userId
      name
      email
      role
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
