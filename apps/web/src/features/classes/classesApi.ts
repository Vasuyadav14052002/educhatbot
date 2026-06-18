import { api } from '../../store/api';

export const classesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getClassesOverview: builder.query<any[], void>({
      query: () => 'classes/overview',
      transformResponse: (response: { data: any[] }) => response.data,
      providesTags: ['Class'],
    }),
    getClassDetails: builder.query<any, { grade: string; search?: string; section?: string; page?: number; limit?: number; sort_by?: string; sort_order?: string }>({
      query: ({ grade, ...params }) => ({
        url: `classes/details/${grade}`,
        params,
      }),
      transformResponse: (response: { data: any }) => response.data,
      providesTags: (result, error, arg) => [{ type: 'Class', id: arg.grade }],
    }),
  }),
});

export const {
  useGetClassesOverviewQuery,
  useGetClassDetailsQuery,
} = classesApi;
