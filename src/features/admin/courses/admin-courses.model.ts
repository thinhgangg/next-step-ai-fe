import { useQuery } from "@apollo/client/react";
import { GET_ADMIN_COURSES } from "./admin-courses.query";

export type AdminCourseItem = {
  courseId: string;
  title: string;
  provider?: string | null;
  url?: string | null;
  duration?: string | null;
  level?: string | null;
  durationHours?: number | null;
  rating?: number | null;
  status?: string | null;
  skillId?: string | null;
  skillName?: string | null;
};

type GetAdminCoursesResponse = {
  getAllCourses: AdminCourseItem[];
};

export function useAdminCourses() {
  const query = useQuery<GetAdminCoursesResponse>(GET_ADMIN_COURSES, {
    fetchPolicy: "cache-and-network",
  });

  return {
    courses: query.data?.getAllCourses ?? [],
    loading: query.loading,
    error: query.error,
    refetch: query.refetch,
  };
}
