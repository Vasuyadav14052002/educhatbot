import { useGetKpisQuery } from '../dashboardApi';
import KpiCard, { KpiCardProps } from './KpiCard';

export default function KpiRow({ academicYearId }: { academicYearId: string }) {
  const { data, isLoading } = useGetKpisQuery({ academicYearId }, { 
    skip: !academicYearId,
    refetchInterval: 300000 // 5 min auto-refresh
  });

  const cards: KpiCardProps[] = [
    {
      label: 'Total Students',
      value: (data?.totalStudents ?? 0).toLocaleString(),
      icon: '👨‍🎓',
      color: 'primary',
      link: '/students',
      state: 'normal',
      trend: {
        delta: data?.newStudentsThisMonth >= 0 ? `+${data?.newStudentsThisMonth}` : `${data?.newStudentsThisMonth ?? 0}`,
        direction: data?.newStudentsThisMonth >= 0 ? 'up' : 'down',
        label: 'this month'
      },
      isLoading
    },
    {
      label: "Today's Attendance",
      value: `${data?.attendanceRateToday ?? 0}%`,
      icon: '📋',
      color: (data?.attendanceRateToday ?? 0) > 90 ? 'success' : (data?.attendanceRateToday ?? 0) > 75 ? 'warning' : 'danger',
      link: '/attendance?date=today',
      state: data?.totalStudents === 0 ? 'no_data' : 'normal',
      trend: {
        delta: data?.prevMonthAttendanceRate ? `${data.attendanceRateToday - data.prevMonthAttendanceRate}%` : 'Live',
        direction: (data?.attendanceRateToday - (data?.prevMonthAttendanceRate || 0)) >= 0 ? 'up' : 'down',
        label: data?.prevMonthAttendanceRate ? 'vs last month' : 'today'
      },
      isLoading
    },
    {
      label: 'Total Teachers',
      value: (data?.totalTeachers ?? 0).toString(),
      icon: '👩‍🏫',
      color: 'info',
      link: '/teachers',
      state: 'normal',
      trend: {
        delta: `${data?.teachersOnLeaveToday ?? 0}`,
        direction: (data?.teachersOnLeaveToday ?? 0) > 0 ? 'down' : 'neutral',
        label: 'on leave today'
      },
      isLoading
    },
    {
      label: 'Fee Collection (This Month)',
      value: `${data?.feeCollectionRate ?? 0}%`,
      icon: '💳',
      color: (data?.feeCollectionRate ?? 0) > 90 ? 'success' : (data?.feeCollectionRate ?? 0) > 70 ? 'warning' : 'danger',
      link: '/fees',
      state: data?.amountDue === 0 ? 'setup_required' : 'normal',
      setupCta: { label: 'Configure Fees', link: '/fees/setup' },
      trend: {
        delta: data?.amountDue > 0 ? `₹${(data?.amountCollected ?? 0).toLocaleString()} of ₹${(data?.amountDue ?? 0).toLocaleString()}` : '',
        direction: 'up',
        label: ''
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
