import { useMutation } from "@apollo/client/react";
import { LOGIN_MUTATION } from "../mutation/login.mutation";
import { setSessionTokens } from "@/shared/lib/storage";
import { useNavigate } from "@tanstack/react-router";
import { apolloClient } from "@/shared/api/graphql/client";
import { CURRENT_USER_ROLE_QUERY } from "../query/current-user-role.query";

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  login: {
    accessToken: string;
    refreshToken: string;
  };
}

type MeResponse = {
  me: {
    role?: string | null;
  } | null;
};

function isAdminRole(role?: string | null) {
  return role?.toLowerCase() === "admin";
}

export function useLogin() {
  const navigate = useNavigate();

  const [loginMutation, { loading, error }] =
    useMutation<LoginResponse>(LOGIN_MUTATION);

  const login = async (loginInput: LoginInput) => {
    const res = await loginMutation({
      variables: { loginInput },
    });

    const tokens = res.data?.login;
    if (!tokens) return res;

    setSessionTokens(tokens);

    const { data } = await apolloClient.query<MeResponse>({
      query: CURRENT_USER_ROLE_QUERY,
      fetchPolicy: "network-only",
    });

    navigate({ to: isAdminRole(data?.me?.role) ? "/admin" : "/dashboard" });

    return res;
  };

  return {
    login,
    loading,
    error,
  };
}
