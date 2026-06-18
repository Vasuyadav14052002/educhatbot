import { api } from '../../store/api';

export const subjectsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSubjectsList: builder.query<any, void>({
      query: () => 'subjects',
      transformResponse: (res: any) => res.data,
      providesTags: ['Subject'],
    }),
    getSubjectDashboard: builder.query<any, string>({
      query: (id) => `subjects/${id}/dashboard`,
      transformResponse: (res: any) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'Subject', id }],
    }),
    getSubjectSyllabus: builder.query<any, string>({
      query: (id) => `subjects/${id}/syllabus`,
      transformResponse: (res: any) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'Subject', id }, 'Progress'],
    }),
    getSubjectResources: builder.query<any, string>({
      query: (id) => `subjects/${id}/resources`,
      transformResponse: (res: any) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'Subject', id }],
    }),
    getSubjectActivity: builder.query<any, string>({
      query: (id) => `subjects/${id}/activity`,
      transformResponse: (res: any) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'Subject', id }],
    }),
  }),
});

export const {
  useGetSubjectsListQuery,
  useGetSubjectDashboardQuery,
  useGetSubjectSyllabusQuery,
  useGetSubjectResourcesQuery,
  useGetSubjectActivityQuery,
} = subjectsApi;
