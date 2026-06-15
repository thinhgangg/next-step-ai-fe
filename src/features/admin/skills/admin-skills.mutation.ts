import { gql } from "@apollo/client";

export const CREATE_SKILL = gql`
  mutation CreateSkill($input: CreateSkillInput!) {
    createSkill(input: $input) {
      skillId
      name
      category
      isActive
    }
  }
`;

export const UPDATE_SKILL = gql`
  mutation UpdateSkill($skillId: Int!, $input: UpdateSkillInput!) {
    updateSkill(skillId: $skillId, input: $input) {
      skillId
      name
      category
      isActive
    }
  }
`;

export const DELETE_SKILL = gql`
  mutation DeleteSkill($skillId: Int!) {
    deleteSkill(skillId: $skillId)
  }
`;
