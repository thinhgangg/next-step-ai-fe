import { gql } from "@apollo/client";

export const GET_AVATAR_FILE = gql`
  query GetAvatarFile {
    getAvatarFile {
      fileName
      contentType
      base64
    }
  }
`;
