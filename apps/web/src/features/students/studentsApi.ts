import { api } from '../../store/api';

export const studentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getStudents: builder.query<{ data: any[]; meta: { total: number; total_pages: number } }, { page: number; limit: number; search?: string; class_id?: string }>({
      query: (params) => ({ url: 'students', params }),
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Student'],
    }),
    getStudentDetail: builder.query<any, string>({
      query: (id) => `students/${id}`,
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Student'],
    }),
    createAchievement: builder.mutation<any, { student_id: string; title: string; description: string; date: string; certificate_url?: string }>({
      query: (body) => ({ url: 'student-records/achievements', method: 'POST', body }),
      transformResponse: (response: { data: any }) => response.data,
      invalidatesTags: ['Student'],
    }),
    awardBadge: builder.mutation<any, { student_id: string; badge_name: string; badge_icon: string; awarded_date: string }>({
      query: (body) => ({ url: 'student-records/badges', method: 'POST', body }),
      transformResponse: (response: { data: any }) => response.data,
      invalidatesTags: ['Student'],
    }),
    createRemark: builder.mutation<any, { student_id: string; remark: string; category: string }>({
      query: (body) => ({ url: 'student-records/remarks', method: 'POST', body }),
      transformResponse: (response: { data: any }) => response.data,
      invalidatesTags: ['Student'],
    }),
    createCulturalActivity: builder.mutation<any, { student_id: string; activity_name: string; description: string; event_date: string; photos: string[] }>({
      query: (body) => ({ url: 'student-records/cultural-activities', method: 'POST', body }),
      transformResponse: (response: { data: any }) => response.data,
      invalidatesTags: ['Student'],
    }),
    createFee: builder.mutation<any, { student_id: string; title: string; amount: number; due_date: string }>({
      query: (body) => ({ url: 'student-records/fees', method: 'POST', body }),
      transformResponse: (response: { data: any }) => response.data,
      invalidatesTags: ['Student'],
    }),
  }),
});

export const {
  useGetStudentsQuery,
  useLazyGetStudentsQuery,
  useGetStudentDetailQuery,
  useCreateAchievementMutation,
  useAwardBadgeMutation,
  useCreateRemarkMutation,
  useCreateCulturalActivityMutation,
  useCreateFeeMutation,
} = studentsApi;
