import { api } from '../../store/api';

export const parentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getLinkedStudents: builder.query<any[], void>({
      query: () => 'parent/linked-students',
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Student'],
    }),
    verifyStudentId: builder.mutation<any, { studentCode: string }>({
      query: (body) => ({
        url: 'parent/verify-student-id',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { data: any }) => response.data,
    }),
    getParentStudentProfile: builder.query<any, { studentId: string }>({
      query: ({ studentId }) => ({
        url: 'parent/student-profile',
        params: { studentId },
      }),
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Student'],
    }),
    getParentAttendance: builder.query<any, { studentId: string; month?: number; year?: number }>({
      query: ({ studentId, month, year }) => ({
        url: 'parent/attendance',
        params: { studentId, month, year },
      }),
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Attendance'],
    }),
    getParentMarks: builder.query<any[], { studentId: string }>({
      query: ({ studentId }) => ({
        url: 'parent/marks',
        params: { studentId },
      }),
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Mark'],
    }),
    getParentHomework: builder.query<any[], { studentId: string }>({
      query: ({ studentId }) => ({
        url: 'parent/homework',
        params: { studentId },
      }),
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Progress'],
    }),
    getParentFees: builder.query<any[], { studentId: string }>({
      query: ({ studentId }) => ({
        url: 'parent/fees',
        params: { studentId },
      }),
      transformResponse: (response: { data: any }) => response.data,
    }),
    getParentAnnouncements: builder.query<any[], void>({
      query: () => 'parent/announcements',
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Notification'],
    }),
    getParentTimeline: builder.query<any[], { studentId: string }>({
      query: ({ studentId }) => ({
        url: 'parent/timeline',
        params: { studentId },
      }),
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Attendance', 'Mark', 'Student', 'Progress'],
    }),
    getParentMessages: builder.query<any[], { studentId: string }>({
      query: ({ studentId }) => ({
        url: 'parent/messages',
        params: { studentId },
      }),
      transformResponse: (response: { data: any }) => response.data,
    }),
    sendParentMessage: builder.mutation<any, { studentId: string; teacherId: string; content: string }>({
      query: ({ studentId, teacherId, content }) => ({
        url: 'parent/messages',
        method: 'POST',
        params: { studentId },
        body: { teacherId, content },
      }),
      transformResponse: (response: { data: any }) => response.data,
    }),
    getParentReports: builder.query<any[], { studentId: string }>({
      query: ({ studentId }) => ({
        url: 'parent/reports',
        params: { studentId },
      }),
      transformResponse: (response: { data: any }) => response.data,
    }),
    getParentAchievements: builder.query<any[], { studentId: string }>({
      query: ({ studentId }) => ({
        url: 'parent/achievements',
        params: { studentId },
      }),
      transformResponse: (response: { data: any }) => response.data,
    }),
    getParentBadges: builder.query<any[], { studentId: string }>({
      query: ({ studentId }) => ({
        url: 'parent/badges',
        params: { studentId },
      }),
      transformResponse: (response: { data: any }) => response.data,
    }),
    getParentRankings: builder.query<any[], { studentId: string }>({
      query: ({ studentId }) => ({
        url: 'parent/rankings',
        params: { studentId },
      }),
      transformResponse: (response: { data: any }) => response.data,
    }),
    getParentRemarks: builder.query<any[], { studentId: string }>({
      query: ({ studentId }) => ({
        url: 'parent/remarks',
        params: { studentId },
      }),
      transformResponse: (response: { data: any }) => response.data,
    }),
    getParentGallery: builder.query<any[], { studentId: string }>({
      query: ({ studentId }) => ({
        url: 'parent/gallery',
        params: { studentId },
      }),
      transformResponse: (response: { data: any }) => response.data,
    }),
    getParentProgress: builder.query<any[], { studentId: string }>({
      query: ({ studentId }) => ({
        url: 'parent/progress',
        params: { studentId },
      }),
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Progress'],
    }),
    getParentAiInsights: builder.query<any, { studentId: string }>({
      query: ({ studentId }) => ({
        url: 'parent/ai-insights',
        params: { studentId },
      }),
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Analytics'],
    }),
  }),
});

export const {
  useGetLinkedStudentsQuery,
  useLazyGetLinkedStudentsQuery,
  useVerifyStudentIdMutation,
  useGetParentStudentProfileQuery,
  useGetParentAttendanceQuery,
  useGetParentMarksQuery,
  useGetParentHomeworkQuery,
  useGetParentFeesQuery,
  useGetParentAnnouncementsQuery,
  useGetParentTimelineQuery,
  useGetParentMessagesQuery,
  useSendParentMessageMutation,
  useGetParentReportsQuery,
  useGetParentAchievementsQuery,
  useGetParentBadgesQuery,
  useGetParentRankingsQuery,
  useGetParentRemarksQuery,
  useGetParentGalleryQuery,
  useGetParentProgressQuery,
  useGetParentAiInsightsQuery,
} = parentApi;
