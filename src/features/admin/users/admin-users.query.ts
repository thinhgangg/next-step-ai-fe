import { gql } from "@apollo/client";

export const ADMIN_USERS_QUERY = gql`
  query AdminUsers {
    adminUsers {
      userId
      name
      email
      role
      avatar
      currentRole
      location
      createdAt
      updatedAt
      cvCount
      scanCount
    }
  }
`;
