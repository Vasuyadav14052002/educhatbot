import { api } from '../../store/api';

export const progressApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProgressByClass: builder.query<any[], { classId: string; date: string; subjectId: string }>({
      query: ({ classId, date, subjectId }) => ({
        url: `progress/class/${classId}`,
        params: { date, subjectId },
      }),
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Progress'],
    }),
    saveProgressBulk: builder.mutation<any, { academic_year_id: string; class_id: string; subject_id: string; date: string; entries: any[] }>({
      query: (body) => ({
        url: 'progress/bulk',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { data: any }) => response.data,
      invalidatesTags: ['Progress', 'Analytics'],
    }),
    getProgressAnalytics: builder.query<any, void>({
      query: () => 'progress/analytics',
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Analytics'],
    }),
    getStudentProgressHistory: builder.query<any[], string>({
      query: (studentId) => `progress/student/${studentId}`,
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Progress'],
    }),
  }),
});

export const {
  useGetProgressByClassQuery,
  useSaveProgressBulkMutation,
  useGetProgressAnalyticsQuery,
  useGetStudentProgressHistoryQuery,
} = progressApi;
