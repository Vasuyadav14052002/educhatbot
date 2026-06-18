import { api } from '../../store/api';

interface LoginRequest { email: string; password: string; device_info?: string; }
interface LoginResponse { access_token: string; refresh_token: string; user: object; }

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: 'auth/login', method: 'POST', body }),
      transformResponse: (response: { data: LoginResponse }) => response.data,
    }),
    logout: builder.mutation<void, { refresh_token: string }>({
      query: (body) => ({ url: 'auth/logout', method: 'POST', body }),
    }),
    getMe: builder.query<object, void>({
      query: () => 'auth/me',
      providesTags: ['Auth'],
    }),
  }),
});

export const { useLoginMutation, useLogoutMutation, useGetMeQuery } = authApi;
