import { useGetKpisQuery } from '../dashboardApi';
import KpiCard, { KpiCardProps } from './KpiCard';

export default function KpiRowSecondary({ academicYearId }: { academicYearId: string }) {
  const { data, isLoading } = useGetKpisQuery({ academicYearId }, { 
    skip: !academicYearId,
    refetchInterval: 300000 // 5 min auto-refresh
  });

  const cards: KpiCardProps[] = [
    {
      label: 'Pending Fee Dues',
      value: `₹${(data?.pendingFeesAmount ?? 0).toLocaleString()}`,
      icon: <i className="ti ti-coins"></i>,
      color: 'warning',
      link: '/fees?status=pending',
      state: data?.amountDue === 0 ? 'no_data' : 'normal',
      trend: {
        delta: '',
        direction: 'neutral',
        label: 'Total outstanding amount'
      },
      isLoading
    },
    {
      label: 'Upcoming Exams',
      value: data?.nextExam ? data.nextExam.name : 'None Scheduled',
      icon: <i className="ti ti-calendar-event"></i>,
      color: 'primary',
      link: '/academic-years',
      state: data?.nextExam ? 'normal' : 'no_data',
      trend: data?.nextExam ? {
        delta: new Date(data.nextExam.date).toLocaleDateString(),
        direction: 'neutral',
        label: 'Start date'
      } : undefined,
      isLoading
    },
    {
      label: 'Syllabus Completion',
      value: `${data?.syllabusCompletion ?? 0}%`,
      icon: <i className="ti ti-book-2"></i>,
      color: 'success',
      link: '/subjects',
      state: 'normal',
      trend: {
        delta: '',
        direction: 'neutral',
        label: 'Average across all subjects'
      },
      isLoading
    },
    {
      label: 'Open Admissions',
      value: (data?.openAdmissions ?? 0).toString(),
      icon: <i className="ti ti-users-plus"></i>,
      color: 'info',
      link: '/admissions',
      state: 'normal',
      trend: {
        delta: '',
        direction: 'neutral',
        label: 'Pending review applications'
      },
      isLoading
    },
  ];

  return (
    <div className="stats-grid" style={{ marginBottom: 24 }}>
      {cards.map((card, idx) => (
        <KpiCard key={idx} {...card} />
      ))}
    </div>
  );
}
