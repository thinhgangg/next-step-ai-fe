import { gql } from "@apollo/client";

export const GET_ALL_SKILLS_QUERY = gql`
  query GetAllSkills {
    getAllSkills {
      skillId
      name
      isActive
    }
  }
`;
