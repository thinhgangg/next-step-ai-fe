import { gql } from "@apollo/client";

export const ADMIN_UPDATE_USER_ROLE = gql`
  mutation AdminUpdateUserRole($userId: Int!, $role: Role!) {
    adminUpdateUserRole(userId: $userId, role: $role) {
      userId
      role
      updatedAt
    }
  }
`;

export const ADMIN_CREATE_USER = gql`
  mutation AdminCreateUser(
    $name: String!
    $email: String!
    $password: String!
    $role: Role!
  ) {
    adminCreateUser(
      name: $name
      email: $email
      password: $password
      role: $role
    ) {
      userId
      name
      email
      role
    }
  }
`;

export const ADMIN_DELETE_USER = gql`
  mutation AdminDeleteUser($userId: Int!) {
    adminDeleteUser(userId: $userId)
  }
`;
