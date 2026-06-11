import { gql } from "@apollo/client";

export const GET_ADMIN_COMPANIES = gql`
  query GetAdminCompanies {
    getAllCompanies {
      companyId
      name
      website
      industry
      size
      location
      logoUrl
    }
  }
`;
