import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { RootState } from '../../store';
import {
  useGetParentStudentProfileQuery,
  useGetParentAttendanceQuery,
  useGetParentMarksQuery,
  useGetParentHomeworkQuery,
  useGetParentFeesQuery,
  useGetParentBadgesQuery,
  useGetParentRemarksQuery,
  useGetParentAiInsightsQuery,
  useGetParentRankingsQuery,
  useGetParentProgressQuery,
} from './parentApi';

export default function ParentDashboard() {
  const selectedStudent = useSelector((s: RootState) => s.auth.selected_student);
  const studentId = selectedStudent?.id;

  // Fetch data
  const { data: profile, isLoading: isProfileLoading } = useGetParentStudentProfileQuery({ studentId: studentId! }, { skip: !studentId });
  const { data: attendance, isLoading: isAttendanceLoading } = useGetParentAttendanceQuery({ studentId: studentId! }, { skip: !studentId });
  const { data: marks, isLoading: isMarksLoading } = useGetParentMarksQuery({ studentId: studentId! }, { skip: !studentId });
  const { data: homework, isLoading: isHomeworkLoading } = useGetParentHomeworkQuery({ studentId: studentId! }, { skip: !studentId });
  const { data: fees, isLoading: isFeesLoading } = useGetParentFeesQuery({ studentId: studentId! }, { skip: !studentId });
  const { data: badges, isLoading: isBadgesLoading } = useGetParentBadgesQuery({ studentId: studentId! }, { skip: !studentId });
  const { data: remarks, isLoading: isRemarksLoading } = useGetParentRemarksQuery({ studentId: studentId! }, { skip: !studentId });
  const { data: aiInsights, isLoading: isAiInsightsLoading } = useGetParentAiInsightsQuery({ studentId: studentId! }, { skip: !studentId });
  const { data: rankings, isLoading: isRankingsLoading } = useGetParentRankingsQuery({ studentId: studentId! }, { skip: !studentId });
  const { data: progressLogs = [], isLoading: isProgressLoading } = useGetParentProgressQuery({ studentId: studentId! }, { skip: !studentId });

  // Helper functions and Memos
  const getOverallBehaviorScore = (ratings: any) => {
    if (!ratings) return 80;
    const values = Object.values(ratings) as number[];
    if (values.length === 0) return 80;
    return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 20); // out of 100
  };

  const getOverallParticipationScore = (ratings: any) => {
    if (!ratings) return 80;
    const values = Object.values(ratings) as number[];
    if (values.length === 0) return 80;
    return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 20); // out of 100
  };

  const latestDate = useMemo(() => {
    if (progressLogs.length === 0) return null;
    return progressLogs[0].date.split('T')[0];
  }, [progressLogs]);

  const latestLogs = useMemo(() => {
    if (!latestDate) return [];
    return progressLogs.filter((log: any) => log.date.split('T')[0] === latestDate);
  }, [progressLogs, latestDate]);

  const latestMetrics = useMemo(() => {
    if (latestLogs.length === 0) return { performance: 0, behavior: 0, participation: 0 };
    
    let perfSum = 0;
    let behSum = 0;
    let partSum = 0;
    
    latestLogs.forEach((log: any) => {
      perfSum += log.performance_score ?? 0;
      behSum += getOverallBehaviorScore(log.behavior_ratings);
      partSum += getOverallParticipationScore(log.participation_ratings);
    });
    
    const count = latestLogs.length;
    return {
      performance: Math.round(perfSum / count),
      behavior: Math.round(behSum / count),
      participation: Math.round(partSum / count),
    };
  }, [latestLogs]);

  const trendData = useMemo(() => {
    const groups: Record<string, { performanceSum: number; count: number; date: string; behaviorSum: number; partSum: number }> = {};
    
    progressLogs.forEach((log: any) => {
      const dStr = log.date.split('T')[0];
      if (!groups[dStr]) {
        groups[dStr] = {
          date: dStr,
          performanceSum: 0,
          behaviorSum: 0,
          partSum: 0,
          count: 0,
        };
      }
      groups[dStr].performanceSum += log.performance_score ?? 0;
      groups[dStr].behaviorSum += getOverallBehaviorScore(log.behavior_ratings);
      groups[dStr].partSum += getOverallParticipationScore(log.participation_ratings);
      groups[dStr].count++;
    });

    const sortedDates = Object.keys(groups).sort();
    const last10Dates = sortedDates.slice(-10);

    return last10Dates.map((dateStr) => {
      const g = groups[dateStr];
      const count = g.count || 1;
      return {
        date: new Date(dateStr + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' }),
        Performance: Math.round(g.performanceSum / count),
        Behavior: Math.round(g.behaviorSum / count),
        Participation: Math.round(g.partSum / count),
      };
    });
  }, [progressLogs]);

  if (!studentId) {
    return (
      <div className="flex-center" style={{ height: '70vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48 }}>👨‍👩‍👧</div>
        <h2 style={{ color: 'var(--text-primary)' }}>Welcome to Parent Portal</h2>
        <p style={{ color: 'var(--text-muted)' }}>Please select a child profile from the top-left switcher to continue.</p>
      </div>
    );
  }

  const isAnyLoading = isProfileLoading || isAttendanceLoading || isMarksLoading || isHomeworkLoading || isFeesLoading || isBadgesLoading || isRemarksLoading || isAiInsightsLoading || isRankingsLoading || isProgressLoading;

  if (isAnyLoading) {
    return (
      <div className="flex-center" style={{ height: '70vh', flexDirection: 'column', gap: 12 }}>
        <div style={{
          width: 44, height: 44,
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}/>
        <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Loading student profile...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Calculate stats
  const attRate = attendance?.summary?.rate ?? 0;
  const growthRate = rankings?.[0]?.growth_index ?? 0;
  const perfBand = rankings?.[0]?.performance_band ?? 'ON_TRACK';

  const formatBand = (band: string) => {
    switch(band) {
      case 'TOP_10_PERCENT': return '🌟 Top 10% Band';
      case 'TOP_25_PERCENT': return '✨ Top 25% Band';
      case 'ON_TRACK': return '📈 On Track';
      case 'NEEDS_IMPROVEMENT': return '⚠️ Action Required';
      default: return band;
    }
  };

  const getBandColor = (band: string) => {
    switch(band) {
      case 'TOP_10_PERCENT': return '#8B5CF6';
      case 'TOP_25_PERCENT': return '#6366F1';
      case 'ON_TRACK': return '#10B981';
      case 'NEEDS_IMPROVEMENT': return '#F43F5E';
      default: return '#64748B';
    }
  };

  // Subject marks chart mapping
  const chartData = (marks || []).map((m: any) => ({
    subject: m.exam_schedule?.subject?.name || 'Subject',
    score: m.obtained_marks,
    maxScore: m.exam_schedule?.max_marks || 100,
  }));

  const pendingHomework = (homework || []).filter((h: any) => h.status !== 'COMPLETED');
  const pendingFees = (fees || []).filter((f: any) => f.status === 'PENDING');

  const initials = `${selectedStudent.first_name[0] || ''}${selectedStudent.last_name[0] || ''}`.toUpperCase();

  const getHomeworkStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="badge badge-present" style={{ fontSize: 10 }}>✅ Completed</span>;
      case 'PARTIALLY_DONE':
        return <span className="badge badge-late" style={{ fontSize: 10 }}>🟡 Partial</span>;
      case 'NOT_SUBMITTED':
        return <span className="badge badge-absent" style={{ fontSize: 10 }}>❌ Missing</span>;
      case 'EXCUSED':
        return <span className="badge badge-leave" style={{ fontSize: 10 }}>💤 Excused</span>;
      default:
        return <span className="badge badge-leave" style={{ fontSize: 10 }}>{status}</span>;
    }
  };

  const getPerformanceBand = (score: number) => {
    if (score >= 90) return { label: 'Excellent', bg: 'var(--color-secondary-surface)', text: 'var(--color-secondary-dark)' };
    if (score >= 75) return { label: 'Good', bg: 'var(--color-primary-surface)', text: 'var(--color-primary)' };
    if (score >= 60) return { label: 'Average', bg: 'var(--color-warning-surface)', text: 'var(--color-warning)' };
    if (score >= 45) return { label: 'Needs Improvement', bg: 'var(--color-danger-surface)', text: 'var(--color-danger)' };
    return { label: 'Poor', bg: '#FFF1F2', text: '#E11D48' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* 1. Profile Summary Banner Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary-dark), #1E1B4B)',
          color: 'white',
          border: 'none',
          padding: '24px 20px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            className="avatar-fallback"
            style={{
              width: 68,
              height: 68,
              fontSize: 24,
              fontWeight: 800,
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2.5px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
            }}
          >
            {initials}
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
              {selectedStudent.first_name} {selectedStudent.last_name}
            </h1>
            <p style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>
              Grade: {selectedStudent.class ? `${selectedStudent.class.name} ${selectedStudent.class.section}` : 'Unassigned'} · Roll Code: #{selectedStudent.student_code}
            </p>
          </div>
        </div>

        {/* Child Core KPI block */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginTop: 24,
            paddingTop: 20,
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attendance</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{attRate}%</div>
          </div>
          <div>
            <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Academic Status</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6, color: getBandColor(perfBand), background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '2px 8px', display: 'inline-block' }}>
              {formatBand(perfBand)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Growth Index</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: growthRate >= 0 ? '#34D399' : '#FB7185' }}>
              {growthRate >= 0 ? `+${growthRate}%` : `${growthRate}%`}
            </div>
          </div>
        </div>
      </div>

      {/* Today's Daily Classroom Progress & Engagement Card */}
      <div className="card" style={{ padding: 20 }}>
        <div className="card-header" style={{ padding: 0, paddingBottom: 16, borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <span className="card-title" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              📈 Today's Daily Classroom Progress & Engagement
            </span>
            {latestDate && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                For {new Date(latestDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            )}
          </div>
          <span className="badge badge-primary" style={{ padding: '4px 8px', fontSize: 10 }}>Daily Sync Active</span>
        </div>

        {latestLogs.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 14 }}>No daily progress logged yet for this student.</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Daily updates from teachers will appear here automatically.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 16 }}>
            {/* Top Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Performance Avg</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-primary)', marginTop: 4 }}>
                  {latestMetrics.performance}%
                </div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Behavior Index</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-secondary)', marginTop: 4 }}>
                  {latestMetrics.behavior}%
                </div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Participation Index</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-warning)', marginTop: 4 }}>
                  {latestMetrics.participation}%
                </div>
              </div>
            </div>

            {/* Split Content: Subjects & Trends */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              {/* Left Column: Subject logs list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Subject Wise Log</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
                  {latestLogs.map((log: any) => {
                    const perfBand = getPerformanceBand(log.performance_score);
                    const partScore = getOverallParticipationScore(log.participation_ratings);
                    const behScore = getOverallBehaviorScore(log.behavior_ratings);
                    return (
                      <div key={log.id} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 12, background: 'var(--bg-primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                            📚 {log.subject?.name || 'Subject'}
                          </span>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: perfBand.bg, color: perfBand.text, fontWeight: 600 }}>
                              {log.performance_score}% ({perfBand.label})
                            </span>
                            {getHomeworkStatusBadge(log.homework_status)}
                          </div>
                        </div>

                        {/* Behavior and Participation stars summary */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, background: 'var(--bg-secondary)', padding: '6px 8px', borderRadius: 6, marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ color: 'var(--text-muted)' }}>🗣️ Participation:</span>
                            <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{partScore}%</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ color: 'var(--text-muted)' }}>🤝 Behavior:</span>
                            <span style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>{behScore}%</span>
                          </div>
                        </div>

                        {/* Activities */}
                        {log.activities && Array.isArray(log.activities) && log.activities.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                            {log.activities.map((act: string, aIdx: number) => (
                              <span key={aIdx} style={{ fontSize: 10, background: 'var(--color-primary-surface)', color: 'var(--color-primary-dark)', padding: '2px 6px', borderRadius: 10, border: '1px solid rgba(79, 70, 229, 0.15)' }}>
                                🎯 {act}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Teacher remarks */}
                        {log.teacher_comments && (
                          <div style={{ fontSize: 11, fontStyle: 'italic', background: 'var(--bg-secondary)', padding: '6px 10px', borderRadius: 4, color: 'var(--text-secondary)', borderLeft: '3px solid var(--color-primary-light)' }}>
                            "{log.teacher_comments}"
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Trend charts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Engagement Trends (Last 10 Days)</h4>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 12, background: 'var(--bg-primary)', height: '100%', minHeight: 250, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  {trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                        <YAxis domain={[40, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                        <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 10, fontSize: 11 }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" name="Performance" dataKey="Performance" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 2 }} />
                        <Line type="monotone" name="Behavior" dataKey="Behavior" stroke="var(--color-secondary)" strokeWidth={2} dot={{ r: 2 }} />
                        <Line type="monotone" name="Participation" dataKey="Participation" stroke="var(--color-warning)" strokeWidth={2} dot={{ r: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                      No historical progress trends available yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Medical / Health Card (Read-only) */}
      <div className="card" style={{ padding: 16 }}>
        <div className="card-header" style={{ padding: 0, paddingBottom: 12, borderBottom: '1px solid var(--border-color)', marginBottom: 12 }}>
          <span className="card-title" style={{ fontSize: 15 }}>🩺 Medical & emergency Information</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Blood Group</div>
            <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{profile?.blood_group || 'Not specified'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Allergies</div>
            <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2, color: profile?.allergies ? 'var(--color-danger)' : 'var(--text-primary)' }}>
              {profile?.allergies || 'None'}
            </div>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Emergency Contacts</div>
            <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2, color: 'var(--color-primary)' }}>
              {profile?.emergency_contact || 'None specified'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. AI Growth Insights (Gemini Generator Widget) */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.08))',
          borderColor: 'rgba(99, 102, 241, 0.25)',
          padding: 20,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute', top: -10, right: -10,
            fontSize: 80, opacity: 0.08, transform: 'rotate(15deg)',
            pointerEvents: 'none', userSelect: 'none',
          }}
        >
          ✨
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 18 }}>✨</span>
          <span style={{ fontSize: 16, fontWeight: 700, background: 'linear-gradient(90deg, #4F46E5, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AI Growth Insights
          </span>
          <span className="badge badge-primary" style={{ fontSize: 9, padding: '2px 6px', textTransform: 'uppercase' }}>EduTrack Gemini</span>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
          {aiInsights?.summary || 'Generating real-time insights based on current marks, homework submission trends, and teacher remarks. Check back shortly.'}
        </div>
      </div>

      {/* 4. Subject Performance Graph */}
      {chartData.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">📚 Subject Scores Chart</span>
            <span className="badge badge-success">Latest Exam Results</span>
          </div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} domain={[0, 100]} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 10, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={2} fill="url(#scoreGrad)" dot={{ fill: 'var(--color-primary)', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 5. Subject Roster Grades List */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">📝 Academic Performance</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {marks && marks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {marks.map((m: any, idx: number) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: idx < marks.length - 1 ? '1px solid var(--border-color)' : 'none',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{m.exam_schedule?.subject?.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {m.exam_schedule?.exam?.name || 'Term Exam'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)' }}>
                      {m.obtained_marks} <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>/ {m.exam_schedule?.max_marks}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      Grade: {m.grade || 'A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No academic scores listed yet.</div>
          )}
        </div>
      </div>

      {/* 6. Homework & Assignments Checklist */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">📖 Homework & Assignments</span>
          {pendingHomework.length > 0 && (
            <span className="badge badge-danger">{pendingHomework.length} Pending</span>
          )}
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {homework && homework.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {homework.map((h: any, idx: number) => {
                const isCompleted = h.status === 'COMPLETED';
                return (
                  <div
                    key={h.id}
                    style={{
                      padding: '14px 16px',
                      borderBottom: idx < homework.length - 1 ? '1px solid var(--border-color)' : 'none',
                      opacity: isCompleted ? 0.75 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary-light)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {h.homework?.subject?.name || 'Homework'}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 14, marginTop: 3 }}>{h.homework?.title}</div>
                        {h.homework?.description && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{h.homework.description}</div>
                        )}
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                          📅 Due: {new Date(h.homework?.due_date).toLocaleDateString()}
                        </div>
                      </div>
                      <span className={`badge badge-${isCompleted ? 'present' : 'absent'}`} style={{ textTransform: 'uppercase', fontSize: 10 }}>
                        {isCompleted ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No homework assigned yet.</div>
          )}
        </div>
      </div>

      {/* 7. Fee Management */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">💵 Tuition & school Fees</span>
          {pendingFees.length > 0 && (
            <span className="badge badge-warning">{pendingFees.length} Unpaid</span>
          )}
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {fees && fees.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {fees.map((f: any, idx: number) => {
                const isPaid = f.status === 'PAID';
                return (
                  <div
                    key={f.id}
                    style={{
                      padding: '14px 16px',
                      borderBottom: idx < fees.length - 1 ? '1px solid var(--border-color)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{f.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                          📅 Due Date: {new Date(f.due_date).toLocaleDateString()}
                        </div>
                        {isPaid && f.receipt_no && (
                          <div style={{ fontSize: 11, color: 'var(--color-secondary)', marginTop: 4, fontWeight: 500 }}>
                            Receipt #: {f.receipt_no} {f.paid_at && `· Paid on ${new Date(f.paid_at).toLocaleDateString()}`}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>${f.amount.toFixed(2)}</div>
                        <span className={`badge badge-${isPaid ? 'present' : 'absent'}`} style={{ display: 'inline-block', marginTop: 6, fontSize: 9 }}>
                          {isPaid ? 'PAID' : 'PENDING'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No fee records found.</div>
          )}
        </div>
      </div>

      {/* 8. Teacher Remarks & Badges (Combined grid) */}
      <div className="grid-2">
        {/* Badges Earned */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🎖️ Badges & Achievements</span>
          </div>
          <div className="card-body" style={{ padding: 12 }}>
            {badges && badges.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {badges.map((b: any) => (
                  <div
                    key={b.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: 10,
                      width: 'calc(50% - 6px)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 28 }}>{b.badge_icon || '🥇'}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, marginTop: 6, color: 'var(--text-primary)' }}>{b.badge_name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                      {new Date(b.awarded_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No badges awarded yet.</div>
            )}
          </div>
        </div>

        {/* Teacher Remarks */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🗣️ Teacher Remarks</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {remarks && remarks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {remarks.map((r: any, idx: number) => (
                  <div
                    key={r.id}
                    style={{
                      padding: 12,
                      borderBottom: idx < remarks.length - 1 ? '1px solid var(--border-color)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="badge badge-primary" style={{ fontSize: 9 }}>{r.category}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, fontStyle: 'italic' }}>
                      "{r.remark}"
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'right' }}>
                      — By {r.teacher?.first_name} {r.teacher?.last_name}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No teacher remarks logged yet.</div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
