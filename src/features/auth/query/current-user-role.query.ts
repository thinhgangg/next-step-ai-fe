import { gql } from "@apollo/client";

export const CURRENT_USER_ROLE_QUERY = gql`
  query CurrentUserRole {
    me {
      userId
      email
      role
    }
  }
`;
