import { api } from '../../store/api';

export const participationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getParticipationOverview: builder.query<any, void>({
      query: () => 'participation/overview',
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Participation'],
    }),
    getParticipationAnalytics: builder.query<any, void>({
      query: () => 'participation/analytics',
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Participation'],
    }),
    getParticipationRecords: builder.query<any, void>({
      query: () => 'participation/records',
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Participation'],
    }),
    getAchievements: builder.query<any, void>({
      query: () => 'participation/achievements',
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Participation'],
    }),
    getBadges: builder.query<any, void>({
      query: () => 'participation/badges',
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Participation'],
    }),
    getStudentProfile: builder.query<any, string>({
      query: (id) => `participation/student/${id}`,
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Participation'],
    }),
    addParticipation: builder.mutation<any, Partial<any>>({
      query: (data) => ({
        url: 'participation/record',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: { data: any }) => response.data,
      invalidatesTags: ['Participation'],
    }),
    addAchievement: builder.mutation<any, Partial<any>>({
      query: (data) => ({
        url: 'participation/achievement',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: { data: any }) => response.data,
      invalidatesTags: ['Participation'],
    }),
    awardBadge: builder.mutation<any, Partial<any>>({
      query: (data) => ({
        url: 'participation/badge',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: { data: any }) => response.data,
      invalidatesTags: ['Participation'],
    }),
  }),
});

export const {
  useGetParticipationOverviewQuery,
  useGetParticipationAnalyticsQuery,
  useGetParticipationRecordsQuery,
  useGetAchievementsQuery,
  useGetBadgesQuery,
  useGetStudentProfileQuery,
  useAddParticipationMutation,
  useAddAchievementMutation,
  useAwardBadgeMutation,
} = participationApi;
