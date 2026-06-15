import { useQuery } from "@apollo/client/react";
import { GET_ADMIN_COMPANIES } from "./admin-companies.query";

export type AdminCompanyItem = {
  companyId: string;
  name: string;
  website?: string | null;
  industry?: string | null;
  size?: string | null;
  location?: string | null;
  logoUrl?: string | null;
};

type GetAdminCompaniesResponse = {
  getAllCompanies: AdminCompanyItem[];
};

export function useAdminCompanies() {
  const query = useQuery<GetAdminCompaniesResponse>(GET_ADMIN_COMPANIES, {
    notifyOnNetworkStatusChange: true,
  });

  return {
    companies: query.data?.getAllCompanies ?? [],
    loading: query.loading,
    error: query.error,
    refetch: query.refetch,
  };
}
