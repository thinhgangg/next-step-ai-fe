import { gql } from "@apollo/client";

export const CREATE_COMPANY = gql`
  mutation CreateCompany($input: CreateCompanyInput!) {
    createCompany(input: $input) {
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

export const UPDATE_COMPANY = gql`
  mutation UpdateCompany($input: UpdateCompanyInput!) {
    updateCompany(input: $input) {
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

export const DELETE_COMPANY = gql`
  mutation DeleteCompany($companyId: Int!) {
    deleteCompany(companyId: $companyId)
  }
`;
