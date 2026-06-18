import { api } from '../../store/api';

export const attendanceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getClassAttendance: builder.query<any[], { classId: string; date: string }>({
      query: ({ classId, date }) => ({
        url: `attendance/class/${classId}`,
        params: { date },
      }),
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Attendance'],
    }),
    bulkMarkAttendance: builder.mutation<any, { date: string; academic_year_id: string; entries: { student_id: string; status: string; remarks?: string }[] }>({
      query: (body) => ({
        url: 'attendance/bulk',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Attendance', 'Analytics'],
    }),
  }),
});

export const {
  useGetClassAttendanceQuery,
  useBulkMarkAttendanceMutation,
} = attendanceApi;
