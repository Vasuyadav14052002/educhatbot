import { api } from '../../store/api';

export const marksApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMarksClasses: builder.query<any[], void>({
      query: () => 'marks/meta/classes',
      transformResponse: (response: { data: any }) => response.data,
    }),
    getMarksSubjects: builder.query<any[], void>({
      query: () => 'marks/meta/subjects',
      transformResponse: (response: { data: any }) => response.data,
    }),
    getMarksExams: builder.query<any[], void>({
      query: () => 'marks/meta/exams',
      transformResponse: (response: { data: any }) => response.data,
    }),
    getMarksAcademicYears: builder.query<any[], void>({
      query: () => 'marks/meta/academic-years',
      transformResponse: (response: { data: any }) => response.data,
    }),
    getClassRoster: builder.query<any[], { classId: string; examId: string; subjectId: string }>({
      query: ({ classId, examId, subjectId }) => ({
        url: `marks/class/${classId}`,
        params: { examId, subjectId },
      }),
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Mark'],
    }),
    enterMarks: builder.mutation<any, { exam_id: string; subject_id: string; academic_year_id: string; entries: { student_id: string; score: number; max_score: number; remarks?: string }[] }>({
      query: (body) => ({
        url: 'marks',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { data: any }) => response.data,
      invalidatesTags: ['Mark', 'Student'],
    }),
  }),
});

export const {
  useGetMarksClassesQuery,
  useGetMarksSubjectsQuery,
  useGetMarksExamsQuery,
  useGetMarksAcademicYearsQuery,
  useGetClassRosterQuery,
  useLazyGetClassRosterQuery,
  useEnterMarksMutation,
} = marksApi;
