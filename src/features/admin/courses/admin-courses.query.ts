import { gql } from "@apollo/client";

export const GET_ADMIN_COURSES = gql`
  query GetAdminCourses {
    getAllCourses {
      courseId
      title
      provider
      url
      duration
      level
      durationHours
      rating
      status
      skillId
      skillName
    }
  }
`;
