import { Link } from 'react-router-dom';
import { useGetClassPerformanceQuery } from '../dashboardApi';

export default function ClassPerformanceTable({ academicYearId }: { academicYearId: string }) {
  const { data, isLoading } = useGetClassPerformanceQuery({ academicYearId }, { 
    skip: !academicYearId,
    refetchInterval: 600000 // 10 min
  });

  if (isLoading) {
    return (
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 className="card-title">Class Performance</h3>
        </div>
        <div style={{ padding: 24 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8, borderRadius: 4 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!data?.classes || data.classes.length === 0) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'var(--color-danger)';
      case 'warning': return 'var(--color-warning)';
      case 'good': return 'transparent';
      default: return 'transparent';
    }
  };

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="card-title">Class Performance Snapshot</h3>
      </div>
      
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Class</th>
              <th>Students</th>
              <th>Avg Attendance</th>
              <th>Avg Marks</th>
              <th>Fee Paid %</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.classes.map((cls: any) => (
              <tr key={cls.classId}>
                <td style={{ borderLeft: `3px solid ${getStatusColor(cls.attendanceStatus)}` }}>
                  <span style={{ fontWeight: 500, paddingLeft: cls.attendanceStatus === 'good' ? 3 : 0 }}>
                    {cls.className}
                  </span>
                </td>
                <td>{cls.studentCount}</td>
                <td>
                  <span className={`badge ${cls.attendanceStatus === 'critical' ? 'danger' : cls.attendanceStatus === 'warning' ? 'warning' : 'success'}`}>
                    {cls.avgAttendancePercent}%
                  </span>
                </td>
                <td>
                  {cls.avgMarksPercent === null ? (
                    <span style={{ color: 'var(--color-text-secondary)' }}>—</span>
                  ) : (
                    `${cls.avgMarksPercent}%`
                  )}
                </td>
                <td>
                  {cls.feeCollectedPercent === null ? (
                    <span style={{ color: 'var(--color-text-secondary)' }}>—</span>
                  ) : (
                    `${cls.feeCollectedPercent}%`
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <Link 
                    to={`/classes/${cls.classId}`}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    View &rarr;
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
