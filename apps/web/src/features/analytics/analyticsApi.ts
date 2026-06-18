import { api } from '../../store/api';
import type { AdminKPIs, TeacherKPIs, ParentStudentKPIs } from '@edutrack/shared-types';

export const analyticsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAdminKPIs: builder.query<AdminKPIs, void>({
      query: () => 'analytics/admin-kpis',
      transformResponse: (r: { data: AdminKPIs }) => r.data,
      providesTags: ['Analytics'],
    }),
    getDetailedAnalytics: builder.query<any, void>({
      query: () => 'analytics/detailed',
      transformResponse: (r: { data: any }) => r.data,
      providesTags: ['Analytics'],
    }),
    getTeacherKPIs: builder.query<TeacherKPIs, void>({
      query: () => 'analytics/teacher-kpis',
      transformResponse: (r: { data: TeacherKPIs }) => r.data,
      providesTags: ['Analytics'],
    }),
    getParentKPIs: builder.query<ParentStudentKPIs, string>({
      query: (studentId) => `analytics/parent-kpis/${studentId}`,
      transformResponse: (r: { data: ParentStudentKPIs }) => r.data,
      providesTags: (_, __, id) => [{ type: 'Analytics', id }],
    }),
    getAttendanceTrend: builder.query<object, { studentId?: string; classId?: string; months?: number }>({
      query: (params) => ({ url: 'analytics/attendance-trend', params }),
      transformResponse: (r: { data: object }) => r.data,
    }),
    getMarksTrend: builder.query<object, { studentId?: string; classId?: string }>({
      query: (params) => ({ url: 'analytics/marks-trend', params }),
      transformResponse: (r: { data: object }) => r.data,
    }),
  }),
});

export const {
  useGetAdminKPIsQuery,
  useGetDetailedAnalyticsQuery,
  useGetTeacherKPIsQuery,
  useGetParentKPIsQuery,
  useGetAttendanceTrendQuery,
  useGetMarksTrendQuery,
} = analyticsApi;
