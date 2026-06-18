import { api } from '../../store/api';
import type { TeacherProfile } from '../../types/teacher.types';

export const teachersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTeacherProfile: builder.query<TeacherProfile, { teacherId: string; subjectId: string }>({
      query: ({ teacherId, subjectId }) => `teachers/${teacherId}/profile?subjectId=${subjectId}`,
      transformResponse: (res: { data: TeacherProfile }) => res.data,
      providesTags: (_r, _e, arg) => [{ type: 'TeacherProfile', id: arg.teacherId }],
    }),
    updateTeacherProfile: builder.mutation<TeacherProfile, { teacherId: string; data: Partial<TeacherProfile> }>({
      query: ({ teacherId, data }) => ({
        url: `teachers/${teacherId}/profile`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'TeacherProfile', id: arg.teacherId }],
    }),
  }),
});

export const {
  useGetTeacherProfileQuery,
  useUpdateTeacherProfileMutation,
} = teachersApi;
