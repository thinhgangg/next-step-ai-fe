import { gql } from "@apollo/client";

export const CREATE_COURSE = gql`
  mutation CreateCourse($input: CreateCourseInput!) {
    createCourse(input: $input) {
      courseId
      title
      provider
      url
      duration
      level
      durationHours
      skillId
      skillName
    }
  }
`;

export const UPDATE_COURSE = gql`
  mutation UpdateCourse($input: UpdateCourseInput!) {
    updateCourse(input: $input) {
      courseId
      title
      provider
      url
      duration
      level
      durationHours
      skillId
      skillName
    }
  }
`;

export const DELETE_COURSE = gql`
  mutation DeleteCourse($courseId: Int!) {
    deleteCourse(courseId: $courseId)
  }
`;
