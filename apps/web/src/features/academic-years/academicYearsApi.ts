import { api } from '../../store/api';

export const academicYearsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAcademicYears: builder.query<any, void>({
      query: () => '/academic-years',
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['AcademicYear'],
    }),
    getAcademicYearDetails: builder.query<any, string>({
      query: (id) => `/academic-years/${id}`,
      transformResponse: (response: { data: any }) => response.data,
      providesTags: (_result, _error, id) => [{ type: 'AcademicYear', id }],
    }),
    getPromotions: builder.query<any, string>({
      query: (id) => `/academic-years/${id}/promotions`,
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Student'],
    }),
    promoteStudents: builder.mutation<any, any>({
      query: (body) => ({
        url: '/academic-years/promote',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { data: any }) => response.data,
      invalidatesTags: ['Student', 'AcademicYear'],
    }),
    closeAcademicYear: builder.mutation<any, { id: string; confirmationText: string; nextYearId?: string }>({
      query: ({ id, ...body }) => ({
        url: `/academic-years/${id}/close`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: { data: any }) => response.data,
      invalidatesTags: ['AcademicYear'],
    }),
    activateAcademicYear: builder.mutation<any, string>({
      query: (id) => ({
        url: `/academic-years/${id}/activate`,
        method: 'PATCH',
      }),
      transformResponse: (response: { data: any }) => response.data,
      invalidatesTags: ['AcademicYear'],
    }),
    archiveAcademicYear: builder.mutation<any, string>({
      query: (id) => ({
        url: `/academic-years/${id}/archive`,
        method: 'PATCH',
      }),
      transformResponse: (response: { data: any }) => response.data,
      invalidatesTags: ['AcademicYear'],
    }),
  }),
});

export const {
  useGetAcademicYearsQuery,
  useGetAcademicYearDetailsQuery,
  useGetPromotionsQuery,
  usePromoteStudentsMutation,
  useCloseAcademicYearMutation,
  useActivateAcademicYearMutation,
  useArchiveAcademicYearMutation,
} = academicYearsApi;
