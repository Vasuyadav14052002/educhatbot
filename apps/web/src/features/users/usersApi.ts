import { api } from '../../store/api';

export const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getStaff: builder.query<any[], void>({
      query: () => 'users/staff',
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['User'],
    }),
    createStaff: builder.mutation<any, { first_name: string; last_name: string; email: string; phone: string; role: string }>({
      query: (body) => ({
        url: 'users/staff',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { data: any }) => response.data,
      invalidatesTags: ['User'],
    }),
    updateStaff: builder.mutation<any, { id: string; first_name?: string; last_name?: string; phone?: string; role?: string; status?: string }>({
      query: ({ id, ...body }) => ({
        url: `users/staff/${id}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (response: { data: any }) => response.data,
      invalidatesTags: ['User'],
    }),
    setStaffStatus: builder.mutation<any, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `users/staff/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      transformResponse: (response: { data: any }) => response.data,
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useSetStaffStatusMutation,
} = usersApi;
