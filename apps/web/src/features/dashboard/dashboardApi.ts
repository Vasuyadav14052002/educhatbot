import { api } from '../../store/api';

export const dashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getKpis: builder.query<any, { academicYearId: string }>({
      query: (params) => ({
        url: `/dashboard/kpis`,
        params,
      }),
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Analytics', 'Attendance', 'Student', 'User', 'Fee'],
    }),

    getAlerts: builder.query<any, { academicYearId: string }>({
      query: (params) => ({
        url: `/dashboard/alerts`,
        params,
      }),
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Analytics', 'Attendance', 'Fee'],
    }),

    getDashboardAttendanceTrend: builder.query<any, { range: string }>({
      query: (params) => ({
        url: `/dashboard/attendance-trend`,
        params,
      }),
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Analytics', 'Attendance'],
    }),

    getSubjectPerformance: builder.query<any, { academicYearId: string }>({
      query: (params) => ({
        url: `/dashboard/subject-performance`,
        params,
      }),
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Analytics', 'Mark', 'Exam'],
    }),

    getTodayAttendanceBreakdown: builder.query<any, void>({
      query: () => `/dashboard/today-attendance-breakdown`,
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Analytics', 'Attendance'],
    }),

    getFeeCollectionTrend: builder.query<any, { range: string }>({
      query: (params) => ({
        url: `/dashboard/fee-collection-trend`,
        params,
      }),
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Analytics', 'Fee'],
    }),

    getRecentActivity: builder.query<any, { limit?: number }>({
      query: (params) => ({
        url: `/dashboard/recent-activity`,
        params,
      }),
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['AuditLog'],
    }),

    getUpcomingEvents: builder.query<any, { limit?: number }>({
      query: (params) => ({
        url: `/dashboard/upcoming-events`,
        params,
      }),
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['AcademicYear'],
    }),

    getInsights: builder.query<any, { academicYearId: string }>({
      query: (params) => ({
        url: `/dashboard/insights`,
        params,
      }),
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Analytics'],
    }),

    getClassPerformance: builder.query<any, { academicYearId: string }>({
      query: (params) => ({
        url: `/dashboard/class-performance`,
        params,
      }),
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Analytics', 'Class', 'Student'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetKpisQuery,
  useGetAlertsQuery,
  useGetDashboardAttendanceTrendQuery,
  useGetSubjectPerformanceQuery,
  useGetTodayAttendanceBreakdownQuery,
  useGetFeeCollectionTrendQuery,
  useGetRecentActivityQuery,
  useGetUpcomingEventsQuery,
  useGetInsightsQuery,
  useGetClassPerformanceQuery,
} = dashboardApi;
