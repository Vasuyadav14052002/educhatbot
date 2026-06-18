import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  TrendingUp,
  BookOpen,
  AlertTriangle,
  Activity,
  Search,
  Eye,
  EyeOff,
  Star,
  UserCheck,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

// RTK Query APIs
import {
  useGetMarksClassesQuery,
  useGetMarksSubjectsQuery,
  useGetMarksAcademicYearsQuery,
} from '../marks/marksApi';
import {
  useGetProgressByClassQuery,
  useSaveProgressBulkMutation,
  useGetProgressAnalyticsQuery,
  useGetStudentProgressHistoryQuery,
} from './progressApi';
import { useGetParentAiInsightsQuery } from '../parent/parentApi';

// Initial ratings default structures
const DEFAULT_PARTICIPATION = { discussion: 4, groupWork: 4, projects: 4, presentations: 4, questions: 4 };
const DEFAULT_BEHAVIOR = { respect: 4, discipline: 4, teamwork: 4, leadership: 4, communication: 4 };

// Calculate composite ratings dynamically
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

function ProgressPageContent() {
  // Filters
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // UI state
  const [activeTab, setActiveTab] = useState<'entry' | 'analytics'>('entry');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeRatingPopover, setActiveRatingPopover] = useState<{ rowIdx: number; type: 'participation' | 'behavior'; triggerEl: HTMLElement | null } | null>(null);

  // Grid editing state
  const [gridData, setGridData] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('All changes saved');

  // Load Meta Options
  const { data: years = [] } = useGetMarksAcademicYearsQuery();
  const { data: classes = [] } = useGetMarksClassesQuery();
  const { data: subjects = [] } = useGetMarksSubjectsQuery();

  // Set default filter values once loaded
  useEffect(() => {
    if (years && years.length > 0 && !selectedYear) {
      const active = years.find((y: any) => y.is_current) || years[0];
      if (active) setSelectedYear(active.id);
    }
    if (classes && classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0].id);
    }
    if (subjects && subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0].id);
    }
  }, [years, classes, subjects, selectedYear, selectedClass, selectedSubject]);

  // Load Progress Grid entries
  const {
    data: remoteGridData = [],
    isLoading: isGridLoading,
  } = useGetProgressByClassQuery(
    { classId: selectedClass, date: selectedDate, subjectId: selectedSubject },
    { skip: !selectedClass || !selectedSubject || !selectedDate },
  );

  // Load Global Analytics
  const { data: analytics, refetch: refetchAnalytics } = useGetProgressAnalyticsQuery();

  // Mutation
  const [saveProgressBulk] = useSaveProgressBulkMutation();

  // Keep local state in sync with fetched class entries
  useEffect(() => {
    if (remoteGridData) {
      setGridData(remoteGridData.map((row) => ({
        ...row,
        performance_score: row.performance_score ?? 75,
        class_activity_score: row.class_activity_score ?? 75,
        homework_status: row.homework_status ?? 'COMPLETED',
        class_engagement: row.class_engagement ?? 'GOOD',
        parent_visible: row.parent_visible ?? true,
        teacher_comments: row.teacher_comments ?? '',
        remarks_category: row.remarks_category ?? 'ACADEMIC',
        participation_ratings: row.participation_ratings || { ...DEFAULT_PARTICIPATION },
        behavior_ratings: row.behavior_ratings || { ...DEFAULT_BEHAVIOR },
        activities: row.activities || [],
      })));
    }
  }, [remoteGridData]);

  // Autosave setup (Debounced)
  const saveTimeoutRef = useRef<any>(null);

  const triggerAutosave = (updatedGrid: any[]) => {
    setIsSaving(true);
    setSaveMessage('Saving changes...');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const payload = {
          academic_year_id: selectedYear,
          class_id: selectedClass,
          subject_id: selectedSubject,
          date: selectedDate,
          entries: updatedGrid.map((row) => ({
            student_id: row.student_id,
            performance_score: Number(row.performance_score),
            class_activity_score: Number(row.class_activity_score),
            homework_status: row.homework_status,
            class_engagement: row.class_engagement,
            teacher_comments: row.teacher_comments,
            remarks_category: row.remarks_category,
            parent_visible: row.parent_visible,
            participation_ratings: row.participation_ratings,
            behavior_ratings: row.behavior_ratings,
            activities: row.activities,
          })),
        };

        await saveProgressBulk(payload).unwrap();
        setSaveMessage('All changes saved');
        refetchAnalytics();
      } catch (err) {
        console.error('Save failed:', err);
        setSaveMessage('Save failed. Retrying...');
      } finally {
        setIsSaving(false);
      }
    }, 2000);
  };

  // Keyboard navigation focus refs
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleGridKeyDown = (e: React.KeyboardEvent, rowIdx: number, field: string) => {
    const fields = ['performance_score', 'homework_status', 'class_activity_score', 'teacher_comments'];
    const currentFieldIdx = fields.indexOf(field);

    if (e.key === 'ArrowDown' && rowIdx < gridData.length - 1) {
      e.preventDefault();
      inputRefs.current[`${rowIdx + 1}-${field}`]?.focus();
    } else if (e.key === 'ArrowUp' && rowIdx > 0) {
      e.preventDefault();
      inputRefs.current[`${rowIdx - 1}-${field}`]?.focus();
    } else if (e.key === 'ArrowRight' && currentFieldIdx < fields.length - 1) {
      e.preventDefault();
      const nextField = fields[currentFieldIdx + 1];
      inputRefs.current[`${rowIdx}-${nextField}`]?.focus();
    } else if (e.key === 'ArrowLeft' && currentFieldIdx > 0) {
      e.preventDefault();
      const prevField = fields[currentFieldIdx - 1];
      inputRefs.current[`${rowIdx}-${prevField}`]?.focus();
    }
  };

  // Copy-paste parsing (TSV format)
  const handlePaste = (e: React.ClipboardEvent, startRowIdx: number, startField: string) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const rows = pastedText.split('\n').map((r) => r.split('\t'));

    const fields = ['performance_score', 'homework_status', 'class_activity_score', 'teacher_comments'];
    const startFieldIdx = fields.indexOf(startField);

    const updatedGrid = [...gridData];

    rows.forEach((rowCells, rOffset) => {
      const targetRowIdx = startRowIdx + rOffset;
      if (targetRowIdx >= updatedGrid.length) return;

      rowCells.forEach((cellVal, cOffset) => {
        const targetFieldIdx = startFieldIdx + cOffset;
        if (targetFieldIdx >= fields.length) return;

        const targetField = fields[targetFieldIdx];
        const trimmedVal = cellVal.trim();

        if (targetField === 'performance_score' || targetField === 'class_activity_score') {
          const num = parseInt(trimmedVal, 10);
          if (!isNaN(num)) {
            updatedGrid[targetRowIdx] = {
              ...updatedGrid[targetRowIdx],
              [targetField]: Math.max(0, Math.min(100, num)),
            };
          }
        } else if (targetField === 'homework_status') {
          const valid = ['COMPLETED', 'PARTIALLY_DONE', 'NOT_SUBMITTED', 'EXCUSED'].includes(trimmedVal.toUpperCase())
            ? trimmedVal.toUpperCase()
            : 'COMPLETED';
          updatedGrid[targetRowIdx] = { ...updatedGrid[targetRowIdx], homework_status: valid };
        } else {
          updatedGrid[targetRowIdx] = { ...updatedGrid[targetRowIdx], [targetField]: trimmedVal };
        }
      });
    });

    setGridData(updatedGrid);
    triggerAutosave(updatedGrid);
  };

  // Helpers moved to top level

  // Get performance rating band label & color class
  const getPerformanceBand = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'success', bg: 'var(--color-secondary-surface)', text: 'var(--color-secondary-dark)' };
    if (score >= 75) return { label: 'Good', color: 'primary', bg: 'var(--color-primary-surface)', text: 'var(--color-primary)' };
    if (score >= 60) return { label: 'Average', color: 'warning', bg: 'var(--color-warning-surface)', text: 'var(--color-warning)' };
    if (score >= 45) return { label: 'Needs Improvement', color: 'danger', bg: 'var(--color-danger-surface)', text: 'var(--color-danger)' };
    return { label: 'Poor', color: 'danger', bg: '#FFF1F2', text: '#E11D48' };
  };

  // Export Progress Report (Mock)
  const handleExport = () => {
    const headers = 'Roll Number\tStudent Name\tAttendance\tPerformance Score\tHomework Status\tParticipation Score\tBehavior Score\tClass Activity Score\tRemarks\n';
    const rows = gridData.map(r => 
      `${r.roll_number}\t${r.name}\t${r.attendance || 'PRESENT'}\t${r.performance_score}\t${r.homework_status}\t${getOverallParticipationScore(r.participation_ratings)}%\t${getOverallBehaviorScore(r.behavior_ratings)}%\t${r.class_activity_score}\t${r.teacher_comments}`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/tsv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Daily_Progress_Class_${selectedClass}_${selectedDate}.tsv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Perform bulk update class to default scores
  const handleBulkSetScore = (score: number) => {
    const updatedGrid = gridData.map((row) => ({
      ...row,
      performance_score: score,
      class_activity_score: score,
    }));
    setGridData(updatedGrid);
    triggerAutosave(updatedGrid);
  };

  // Filter grid data on client
  const filteredGridData = useMemo(() => {
    return gridData.filter((row) => {
      const matchesSearch = row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            row.roll_number.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' ||
                            (statusFilter === 'Completed' && row.status === 'Completed') ||
                            (statusFilter === 'Pending' && row.status === 'Pending') ||
                            (statusFilter === 'Reviewed' && row.parent_visible);
      
      return matchesSearch && matchesStatus;
    });
  }, [gridData, searchQuery, statusFilter]);

  // At-risk students flagged from local state
  const atRiskStudents = useMemo(() => {
    return gridData.filter((row) => {
      const lowPerformance = row.performance_score < 60;
      const lowParticipation = getOverallParticipationScore(row.participation_ratings) < 60;
      const badHomework = row.homework_status === 'NOT_SUBMITTED';
      const lowBehavior = getOverallBehaviorScore(row.behavior_ratings) < 60;
      return lowPerformance || lowParticipation || badHomework || lowBehavior;
    }).map((row) => {
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      const factors = [];
      if (row.performance_score < 60) { factors.push('Performance'); riskLevel = 'MEDIUM'; }
      if (getOverallParticipationScore(row.participation_ratings) < 60) { factors.push('Participation'); }
      if (row.homework_status === 'NOT_SUBMITTED') { factors.push('Homework Missing'); riskLevel = 'MEDIUM'; }
      if (getOverallBehaviorScore(row.behavior_ratings) < 60) { factors.push('Behavior Alert'); riskLevel = 'HIGH'; }
      
      return {
        id: row.student_id,
        name: row.name,
        roll: row.roll_number,
        risk: riskLevel,
        factors: factors.join(', '),
      };
    });
  }, [gridData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', maxWidth: '100%', minWidth: 0 }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📈 Daily Progress Management</h1>
          <p className="page-subtitle" style={{ fontSize: 13, marginTop: 4 }}>
            Track student performance, participation, behavior, homework completion, and daily classroom activities.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn btn-sm ${activeTab === 'entry' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('entry')}>
            📊 Record Daily Progress
          </button>
          <button className={`btn btn-sm ${activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('analytics')}>
            📈 Analytics Dashboard
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>
            📥 Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Students Updated Today</div>
              <div className="stat-card-value">{analytics?.updatedToday ?? 0} / {analytics?.totalStudents ?? 16}</div>
            </div>
            <div className="stat-card-icon primary"><UserCheck size={20} /></div>
          </div>
          <div className="stat-card-change up">Today's entries locked</div>
        </div>

        <div className="stat-card warning">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Pending Progress Updates</div>
              <div className="stat-card-value">{analytics?.pendingUpdates ?? 0}</div>
            </div>
            <div className="stat-card-icon warning"><AlertTriangle size={20} /></div>
          </div>
          <div className="stat-card-change down">Requires teacher logging</div>
        </div>

        <div className="stat-card success">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Average Daily Performance</div>
              <div className="stat-card-value">{analytics?.avgPerformance ?? 87}%</div>
            </div>
            <div className="stat-card-icon success"><TrendingUp size={20} /></div>
          </div>
          <div className="stat-card-change up">↑ 2.4% vs last week</div>
        </div>

        <div className="stat-card info" style={{ borderLeft: '3px solid var(--color-info)' }}>
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Homework Completion Rate</div>
              <div className="stat-card-value">{analytics?.homeworkCompletionRate ?? 94}%</div>
            </div>
            <div className="stat-card-icon" style={{ color: 'var(--color-info)' }}><BookOpen size={20} /></div>
          </div>
          <div className="stat-card-change up">94% weekly target met</div>
        </div>
      </div>

      {/* Tab 1: Spreadsheet Entry Experience */}
      {activeTab === 'entry' && (
        <>
          {/* Filter Bar */}
          <div className="card">
            <div className="card-body" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label className="form-label" style={{ margin: 0, fontSize: 11 }}>Academic Year</label>
                  <select className="form-select" style={{ width: 140 }} value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                    {years.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label className="form-label" style={{ margin: 0, fontSize: 11 }}>Class</label>
                  <select className="form-select" style={{ width: 130 }} value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                    {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label className="form-label" style={{ margin: 0, fontSize: 11 }}>Subject</label>
                  <select className="form-select" style={{ width: 160 }} value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                    {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label className="form-label" style={{ margin: 0, fontSize: 11 }}>Date</label>
                  <input type="date" className="form-input" style={{ width: 140 }} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label className="form-label" style={{ margin: 0, fontSize: 11 }}>Status</label>
                  <select className="form-select" style={{ width: 120 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="All">All Students</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Reviewed">Parent Shared</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 200 }}>
                  <label className="form-label" style={{ margin: 0, fontSize: 11 }}>Search Student</label>
                  <div className="search-bar" style={{ width: '100%' }}>
                    <span className="search-bar-icon"><Search size={14} /></span>
                    <input type="text" className="form-input" placeholder="Search by name or roll..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Autosave Banner */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: isSaving ? 'var(--color-warning)' : 'var(--color-secondary)',
                display: 'inline-block',
                animation: isSaving ? 'pulse 1s infinite' : 'none'
              }} />
              <span>{saveMessage}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => handleBulkSetScore(90)}>🌟 Bulk Set Score (90)</button>
              <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => handleBulkSetScore(75)}>📈 Bulk Set Score (75)</button>
            </div>
          </div>

          {/* Interactive Spreadsheet Grid */}
          <div className="table-container" style={{ maxHeight: 550, overflowY: 'auto', overflowX: 'auto', width: '100%', maxWidth: '100%' }}>
            {isGridLoading ? (
              <div style={{ padding: 60, textAlign: 'center' }}>
                <div style={{
                  width: 32, height: 32, margin: '0 auto 12px',
                  border: '3px solid var(--border-color)', borderTopColor: 'var(--color-primary)',
                  borderRadius: '50%', animation: 'spin 0.8s linear infinite'
                }}/>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading grid data...</span>
              </div>
            ) : filteredGridData.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                No student entries found for the selected filters.
              </div>
            ) : (
              <table className="table" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                    <th style={{ minWidth: 100 }}>Student ID</th>
                    <th style={{ minWidth: 80 }}>Roll No</th>
                    <th style={{ minWidth: 160 }}>Student Name</th>
                    <th>Attendance</th>
                    <th style={{ minWidth: 130 }}>Performance Score</th>
                    <th style={{ minWidth: 140 }}>Homework Status</th>
                    <th style={{ minWidth: 110 }}>Participation</th>
                    <th style={{ minWidth: 110 }}>Behavior</th>
                    <th style={{ minWidth: 120 }}>Activity Score</th>
                    <th style={{ minWidth: 220 }}>Teacher Remarks</th>
                    <th>Parent Shared</th>
                    <th style={{ minWidth: 120 }}>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGridData.map((row, idx) => {
                    const perfBand = getPerformanceBand(row.performance_score);
                    const overBehavior = getOverallBehaviorScore(row.behavior_ratings);
                    const overParticipation = getOverallParticipationScore(row.participation_ratings);

                    return (
                      <tr key={row.student_id}>
                        {/* ID */}
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>#{row.student_id.slice(-6).toUpperCase()}</td>
                        
                        {/* Roll */}
                        <td style={{ fontWeight: 600 }}>{row.roll_number}</td>

                        {/* Name */}
                        <td>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ padding: 0, fontWeight: 600, color: 'var(--color-primary)', textAlign: 'left' }}
                            onClick={() => setSelectedStudentId(row.student_id)}
                          >
                            {row.name}
                          </button>
                        </td>

                        {/* Attendance (Merged indicator) */}
                        <td>
                          <span className={`badge badge-${
                            row.attendance === 'PRESENT' ? 'present' :
                            row.attendance === 'ABSENT' ? 'absent' :
                            row.attendance === 'LATE' ? 'late' : 'leave'
                          }`} style={{ fontSize: 10 }}>
                            {row.attendance || 'ABSENT'}
                          </span>
                        </td>

                        {/* Performance Score */}
                        <td onPaste={(e) => handlePaste(e, idx, 'performance_score')}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input
                              type="number"
                              ref={(el) => { inputRefs.current[`${idx}-performance_score`] = el; }}
                              className="form-input"
                              style={{ width: 64, padding: '4px 8px', fontSize: 13 }}
                              value={row.performance_score}
                              min={0} max={100}
                              onKeyDown={(e) => handleGridKeyDown(e, idx, 'performance_score')}
                              onChange={(e) => {
                                const val = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
                                const updated = [...gridData];
                                updated[idx] = { ...updated[idx], performance_score: val };
                                setGridData(updated);
                                triggerAutosave(updated);
                              }}
                            />
                            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: perfBand.bg, color: perfBand.text, fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {perfBand.label}
                            </span>
                          </div>
                        </td>

                        {/* Homework Status */}
                        <td>
                          <select
                            ref={(el) => { inputRefs.current[`${idx}-homework_status`] = el as any; }}
                            className="form-select"
                            style={{ padding: '4px 8px', fontSize: 13 }}
                            value={row.homework_status}
                            onKeyDown={(e) => handleGridKeyDown(e, idx, 'homework_status')}
                            onChange={(e) => {
                              const updated = [...gridData];
                              updated[idx] = { ...updated[idx], homework_status: e.target.value };
                              setGridData(updated);
                              triggerAutosave(updated);
                            }}
                          >
                            <option value="COMPLETED">✅ Completed</option>
                            <option value="PARTIALLY_DONE">🟡 Partial</option>
                            <option value="NOT_SUBMITTED">❌ Missing</option>
                            <option value="EXCUSED">💤 Excused</option>
                          </select>
                        </td>

                        {/* Participation Sub-Ratings */}
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', width: '100%', display: 'flex', justifyContent: 'center', gap: 4, fontSize: 12 }}
                            onClick={(e) => setActiveRatingPopover({ rowIdx: idx, type: 'participation', triggerEl: e.currentTarget })}
                          >
                            <Star size={11} fill="var(--color-warning)" stroke="var(--color-warning)" />
                            <span>{overParticipation}%</span>
                          </button>
                        </td>

                        {/* Behavior Sub-Ratings */}
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', width: '100%', display: 'flex', justifyContent: 'center', gap: 4, fontSize: 12 }}
                            onClick={(e) => setActiveRatingPopover({ rowIdx: idx, type: 'behavior', triggerEl: e.currentTarget })}
                          >
                            <Activity size={11} style={{ color: 'var(--color-primary-light)' }} />
                            <span>{overBehavior}%</span>
                          </button>
                        </td>

                        {/* Class Activity Score */}
                        <td onPaste={(e) => handlePaste(e, idx, 'class_activity_score')}>
                          <input
                            type="number"
                            ref={(el) => { inputRefs.current[`${idx}-class_activity_score`] = el; }}
                            className="form-input"
                            style={{ width: 64, padding: '4px 8px', fontSize: 13 }}
                            value={row.class_activity_score}
                            min={0} max={100}
                            onKeyDown={(e) => handleGridKeyDown(e, idx, 'class_activity_score')}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
                              const updated = [...gridData];
                              updated[idx] = { ...updated[idx], class_activity_score: val };
                              setGridData(updated);
                              triggerAutosave(updated);
                            }}
                          />
                        </td>

                        {/* Remarks */}
                        <td onPaste={(e) => handlePaste(e, idx, 'teacher_comments')}>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <select
                              className="form-select"
                              style={{ width: 100, padding: '4px 8px', fontSize: 12 }}
                              value={row.remarks_category}
                              onChange={(e) => {
                                const updated = [...gridData];
                                updated[idx] = { ...updated[idx], remarks_category: e.target.value };
                                setGridData(updated);
                                triggerAutosave(updated);
                              }}
                            >
                              <option value="ACADEMIC">Academic</option>
                              <option value="BEHAVIOR">Behavior</option>
                              <option value="LEADERSHIP">Leadership</option>
                              <option value="PARTICIPATION">Discussion</option>
                              <option value="IMPROVEMENT">Progress</option>
                            </select>
                            <input
                              type="text"
                              ref={(el) => { inputRefs.current[`${idx}-teacher_comments`] = el; }}
                              className="form-input"
                              style={{ flex: 1, padding: '4px 8px', fontSize: 13, minWidth: 140 }}
                              value={row.teacher_comments}
                              placeholder="Enter remarks..."
                              onKeyDown={(e) => handleGridKeyDown(e, idx, 'teacher_comments')}
                              onChange={(e) => {
                                const updated = [...gridData];
                                updated[idx] = { ...updated[idx], teacher_comments: e.target.value };
                                setGridData(updated);
                                triggerAutosave(updated);
                              }}
                            />
                          </div>
                        </td>

                        {/* Parent Shared */}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn btn-ghost"
                            style={{ padding: 4 }}
                            onClick={() => {
                              const updated = [...gridData];
                              updated[idx] = { ...updated[idx], parent_visible: !row.parent_visible };
                              setGridData(updated);
                              triggerAutosave(updated);
                            }}
                          >
                            {row.parent_visible ? (
                              <Eye size={16} style={{ color: 'var(--color-primary)' }} />
                            ) : (
                              <EyeOff size={16} style={{ color: 'var(--text-muted)' }} />
                            )}
                          </button>
                        </td>

                        {/* Last Updated */}
                        <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {row.last_updated ? new Date(row.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* At-Risk and Quick Actions Footer */}
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
            {/* Risk Warnings */}
            <div className="card">
              <div className="card-header" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={16} style={{ color: 'var(--color-danger)' }} />
                <span className="card-title" style={{ fontSize: 14 }}>At-Risk Flag Alerts ({atRiskStudents.length})</span>
              </div>
              <div className="card-body" style={{ padding: 0, maxHeight: 200, overflowY: 'auto' }}>
                {atRiskStudents.length === 0 ? (
                  <div style={{ padding: 16, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>All students on track!</div>
                ) : (
                  atRiskStudents.map((ars) => (
                    <div key={ars.id} style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border-color)', fontSize: 13 }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{ars.name} ({ars.roll})</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Factor: {ars.factors}</div>
                      </div>
                      <span className={`badge badge-${ars.risk === 'HIGH' ? 'absent' : 'late'}`} style={{ fontSize: 9, height: 'fit-content' }}>
                        {ars.risk}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* General Activity Logger */}
            <div className="card">
              <div className="card-header" style={{ padding: '14px 16px' }}>
                <span className="card-title" style={{ fontSize: 14 }}>Batch Log Student Classroom Activities</span>
              </div>
              <div className="card-body" style={{ padding: 16 }}>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Type activities separating them by commas (e.g. <i>"Won Quiz round, Presented Math project"</i>) to apply to students who scored over 85% today.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    id="bulk-activities-input"
                    className="form-input"
                    placeholder="Helper activity tag log..."
                    style={{ flex: 1 }}
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      const input = document.getElementById('bulk-activities-input') as HTMLInputElement | null;
                      if (!input || !input.value.trim()) return;
                      const acts = input.value.split(',').map((a) => a.trim()).filter((a) => a.length > 0);

                      const updated = gridData.map((row) => {
                        if (row.performance_score >= 85) {
                          const existing = row.activities || [];
                          return { ...row, activities: [...new Set([...existing, ...acts])] };
                        }
                        return row;
                      });

                      setGridData(updated);
                      triggerAutosave(updated);
                      input.value = '';
                    }}
                  >
                    Apply Activity Log
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tab 2: Overall Analytics View */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Trend Charts */}
          <div className="grid-2">
            {/* Performance Overview */}
            <div className="card">
              <div className="card-header"><span className="card-title">📈 Weekly Performance & Homework Trends</span></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={analytics?.trend || []}>
                    <defs>
                      <linearGradient id="perfColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="hwColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <YAxis domain={[50, 100]} unit="%" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 10 }} />
                    <Legend iconType="circle" />
                    <Area type="monotone" name="Academic Score" dataKey="performance" stroke="var(--color-primary)" fillOpacity={1} fill="url(#perfColor)" strokeWidth={2} />
                    <Area type="monotone" name="Homework Rate" dataKey="homework" stroke="var(--color-secondary)" fillOpacity={1} fill="url(#hwColor)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Participation & Behavior Indices */}
            <div className="card">
              <div className="card-header"><span className="card-title">📊 Behavior vs. Participation Indices</span></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={[
                    { name: 'Class Discussion', Score: analytics?.participationScore ?? 85, color: '#4F46E5' },
                    { name: 'Group Activities', Score: (analytics?.participationScore ?? 85) - 3, color: '#8B5CF6' },
                    { name: 'Respect Index', Score: analytics?.behaviorScore ?? 92, color: '#10B981' },
                    { name: 'Discipline Index', Score: (analytics?.behaviorScore ?? 92) - 2, color: '#06B6D4' },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <YAxis domain={[50, 100]} unit="%" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 10 }} />
                    <Bar dataKey="Score" radius={[6, 6, 0, 0]}>
                      <Cell fill="#4F46E5" />
                      <Cell fill="#8B5CF6" />
                      <Cell fill="#10B981" />
                      <Cell fill="#06B6D4" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Ratings Modal/Popover */}
      {activeRatingPopover && (
        <RatingPopover
          row={gridData[activeRatingPopover.rowIdx]}
          type={activeRatingPopover.type}
          triggerEl={activeRatingPopover.triggerEl}
          onClose={() => setActiveRatingPopover(null)}
          onChange={(updatedRatings) => {
            const updated = [...gridData];
            updated[activeRatingPopover.rowIdx] = {
              ...updated[activeRatingPopover.rowIdx],
              [activeRatingPopover.type === 'participation' ? 'participation_ratings' : 'behavior_ratings']: updatedRatings,
            };
            setGridData(updated);
            triggerAutosave(updated);
          }}
        />
      )}

      {/* Sliding Student Detail Drawer */}
      {selectedStudentId && (
        <StudentDetailDrawer
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
          performanceBandCalculator={getPerformanceBand}
        />
      )}
    </div>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: '#991B1B', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, margin: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Something went wrong loading this component:</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, fontFamily: 'monospace' }}>{this.state.error?.stack || String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ProgressPage() {
  return (
    <ErrorBoundary>
      <ProgressPageContent />
    </ErrorBoundary>
  );
}

// ─── rating Popover Component ──────────────────────────────────────────────
interface RatingPopoverProps {
  row: any;
  type: 'participation' | 'behavior';
  triggerEl: HTMLElement | null;
  onClose: () => void;
  onChange: (ratings: Record<string, number>) => void;
}

function RatingPopover({ row, type, triggerEl, onClose, onChange }: RatingPopoverProps) {
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Ratings structure definition
  const categories = type === 'participation'
    ? [
        { key: 'discussion', label: '🗣️ Class Discussion' },
        { key: 'groupWork', label: '👥 Group Activities' },
        { key: 'projects', label: '🔬 Projects' },
        { key: 'presentations', label: '📢 Presentations' },
        { key: 'questions', label: '❓ Question Answering' },
      ]
    : [
        { key: 'respect', label: '🤝 Respect' },
        { key: 'discipline', label: '📏 Discipline' },
        { key: 'teamwork', label: '💪 Teamwork' },
        { key: 'leadership', label: '👑 Leadership' },
        { key: 'communication', label: '💬 Communication' },
      ];

  const currentRatings = type === 'participation'
    ? row.participation_ratings || { ...DEFAULT_PARTICIPATION }
    : row.behavior_ratings || { ...DEFAULT_BEHAVIOR };

  // Popover positioning calculations
  useEffect(() => {
    if (triggerEl && popoverRef.current) {
      const rect = triggerEl.getBoundingClientRect();
      popoverRef.current.style.top = `${rect.bottom + window.scrollY + 6}px`;
      popoverRef.current.style.left = `${Math.min(window.innerWidth - 300, rect.left + window.scrollX - 80)}px`;
    }
  }, [triggerEl]);

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node) && triggerEl && !triggerEl.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose, triggerEl]);

  const handleStarClick = (key: string, rating: number) => {
    onChange({
      ...currentRatings,
      [key]: rating,
    });
  };

  return (
    <div
      ref={popoverRef}
      className="card"
      style={{
        position: 'absolute',
        zIndex: 100,
        width: 280,
        boxShadow: 'var(--shadow-xl)',
        borderColor: 'var(--color-primary-light)',
        padding: 16,
        animation: 'fadeIn 0.1s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
          {type === 'participation' ? '🗣️ Participation Star Matrix' : '🤝 Behavior Star Matrix'}
        </h4>
        <button className="btn btn-ghost" style={{ padding: 2 }} onClick={onClose}><X size={14} /></button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {categories.map((cat) => {
          const starsVal = currentRatings[cat.key] ?? 4;
          return (
            <div key={cat.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 500 }}>{cat.label}</span>
              <div style={{ display: 'flex', gap: 3 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    onClick={() => handleStarClick(cat.key, star)}
                  >
                    <Star
                      size={14}
                      fill={star <= starsVal ? 'var(--color-warning)' : 'none'}
                      stroke={star <= starsVal ? 'var(--color-warning)' : 'var(--color-gray-300)'}
                    />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ─── Student Detail Drawer Component ───────────────────────────────────────
interface StudentDetailDrawerProps {
  studentId: string;
  onClose: () => void;
  performanceBandCalculator: (score: number) => any;
}

function StudentDetailDrawer({ studentId, onClose, performanceBandCalculator }: StudentDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'timeline' | 'trends' | 'ai'>('profile');

  // Fetch individual details from backend
  const { data: history = [], isLoading: isHistoryLoading } = useGetStudentProgressHistoryQuery(studentId);
  const { data: aiInsights, isLoading: isAiLoading } = useGetParentAiInsightsQuery({ studentId });

  // Get student metadata from the most recent progress record
  const studentMeta = useMemo(() => {
    if (history.length > 0) return history[0].student;
    return null;
  }, [history]);

  // Calculations for graphs
  const chartData = useMemo(() => {
    return [...history]
      .reverse()
      .map((h) => {
        const behRatings = h.behavior_ratings as Record<string, number> | null;
        let behaviorAvg = 0;
        if (behRatings) {
          const vals = Object.values(behRatings).filter((v) => typeof v === 'number');
          behaviorAvg = vals.length > 0 ? (vals.reduce((s, v) => s + v, 0) / vals.length) * 20 : 80;
        }

        const partRatings = h.participation_ratings as Record<string, number> | null;
        let partAvg = 0;
        if (partRatings) {
          const vals = Object.values(partRatings).filter((v) => typeof v === 'number');
          partAvg = vals.length > 0 ? (vals.reduce((s, v) => s + v, 0) / vals.length) * 20 : 80;
        }

        return {
          date: new Date(h.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
          Performance: h.performance_score,
          Behavior: behaviorAvg || 80,
          Participation: partAvg || 80,
        };
      });
  }, [history]);

  const initials = studentMeta
    ? `${studentMeta.first_name[0] || ''}${studentMeta.last_name[0] || ''}`.toUpperCase()
    : 'ST';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, right: 0,
        width: 460,
        height: '100vh',
        background: 'var(--bg-primary)',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideLeft 0.25s ease-out',
      }}
    >
      <style>{`
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {/* Drawer Header */}
      <div
        style={{
          padding: 24,
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, var(--color-primary-dark), #1E1B4B)',
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            className="avatar-fallback"
            style={{
              width: 48, height: 48, fontSize: 16, fontWeight: 800,
              background: 'rgba(255,255,255,0.1)', color: 'white', border: '2px solid rgba(255,255,255,0.2)'
            }}
          >
            {initials}
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
              {studentMeta ? `${studentMeta.first_name} ${studentMeta.last_name}` : 'Loading...'}
            </h3>
            <p style={{ opacity: 0.8, fontSize: 11, marginTop: 2 }}>
              Roll ID: #{studentMeta?.student_code ?? 'STU001'}
            </p>
          </div>
        </div>
        <button className="btn btn-ghost" style={{ padding: 4, color: 'white' }} onClick={onClose}><X size={20} /></button>
      </div>

      {/* Drawer Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
        <button
          className="btn btn-ghost"
          style={{
            flex: 1, borderRadius: 0, padding: 12, fontSize: 13,
            borderBottom: activeTab === 'profile' ? '2.5px solid var(--color-primary)' : 'none',
            color: activeTab === 'profile' ? 'var(--color-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'profile' ? 600 : 500,
          }}
          onClick={() => setActiveTab('profile')}
        >
          👤 Profile
        </button>
        <button
          className="btn btn-ghost"
          style={{
            flex: 1, borderRadius: 0, padding: 12, fontSize: 13,
            borderBottom: activeTab === 'timeline' ? '2.5px solid var(--color-primary)' : 'none',
            color: activeTab === 'timeline' ? 'var(--color-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'timeline' ? 600 : 500,
          }}
          onClick={() => setActiveTab('timeline')}
        >
          📅 Timeline
        </button>
        <button
          className="btn btn-ghost"
          style={{
            flex: 1, borderRadius: 0, padding: 12, fontSize: 13,
            borderBottom: activeTab === 'trends' ? '2.5px solid var(--color-primary)' : 'none',
            color: activeTab === 'trends' ? 'var(--color-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'trends' ? 600 : 500,
          }}
          onClick={() => setActiveTab('trends')}
        >
          📈 Trends
        </button>
        <button
          className="btn btn-ghost"
          style={{
            flex: 1, borderRadius: 0, padding: 12, fontSize: 13,
            borderBottom: activeTab === 'ai' ? '2.5px solid var(--color-primary)' : 'none',
            color: activeTab === 'ai' ? 'var(--color-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'ai' ? 600 : 500,
          }}
          onClick={() => setActiveTab('ai')}
        >
          ✨ AI Insights
        </button>
      </div>

      {/* Drawer Body Scroll */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {isHistoryLoading ? (
          <div className="flex-center" style={{ height: 200, flexDirection: 'column', gap: 8 }}>
            <div style={{
              width: 28, height: 28,
              border: '3px solid var(--border-color)', borderTopColor: 'var(--color-primary)',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite'
            }}/>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Loading history...</span>
          </div>
        ) : (
          <>
            {/* Tab: Profile Overview */}
            {activeTab === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="card" style={{ padding: 16 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)' }}>STUDENT DETAILS</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Class Assigned</span>
                      <span style={{ fontWeight: 600 }}>{studentMeta?.class ? `${studentMeta.class.name} ${studentMeta.class.section}` : 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Admission Date</span>
                      <span style={{ fontWeight: 600 }}>{studentMeta?.joined_date ? new Date(studentMeta.joined_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Blood Group</span>
                      <span style={{ fontWeight: 600 }}>{studentMeta?.blood_group || 'O+'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Medical Remarks</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-danger)' }}>{studentMeta?.medical_conditions || 'None'}</span>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: 16 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)' }}>Composite Metrics</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Behavior Index</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-secondary)', marginTop: 4 }}>
                        {history.length > 0 ? getOverallBehaviorScore(history[0].behavior_ratings) : 90}%
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Participation Index</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-primary)', marginTop: 4 }}>
                        {history.length > 0 ? getOverallParticipationScore(history[0].participation_ratings) : 85}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Timeline */}
            {activeTab === 'timeline' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {history.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No daily progress logged.</div>
                ) : (
                  history.slice(0, 10).map((log) => {
                    const dateStr = new Date(log.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                    return (
                      <div key={log.id} style={{ display: 'flex', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: 20, padding: '4px 8px', borderRadius: 8, background: 'var(--bg-secondary)', height: 'fit-content' }}>📈</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{log.subject?.name || 'Subject'} Update</span>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{dateStr}</span>
                          </div>
                          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                            Score: <b>{log.performance_score}%</b> · Homework: <b>{log.homework_status.replace('_', ' ')}</b>
                          </p>
                          {log.teacher_comments && (
                            <div style={{ fontSize: 11, fontStyle: 'italic', background: 'var(--bg-secondary)', padding: '6px 10px', borderRadius: 4, marginTop: 6, color: 'var(--text-secondary)' }}>
                              "{log.teacher_comments}"
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Tab: Trends Graph */}
            {activeTab === 'trends' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card" style={{ padding: 12 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>Performance, Behavior & Participation Trends</h4>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                        <YAxis domain={[40, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                        <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 10, fontSize: 11 }} />
                        <Legend iconType="circle" />
                        <Line type="monotone" dataKey="Performance" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 2 }} />
                        <Line type="monotone" dataKey="Behavior" stroke="var(--color-secondary)" strokeWidth={2} dot={{ r: 2 }} />
                        <Line type="monotone" dataKey="Participation" stroke="var(--color-warning)" strokeWidth={2} dot={{ r: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No historical logs to plot trends.</div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: AI Insights */}
            {activeTab === 'ai' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {isAiLoading ? (
                  <div className="flex-center" style={{ height: 120 }}>
                    <div style={{
                      width: 24, height: 24,
                      border: '3px solid var(--border-color)', borderTopColor: 'var(--color-primary)',
                      borderRadius: '50%', animation: 'spin 0.8s linear infinite'
                    }}/>
                  </div>
                ) : (
                  <>
                    <div className="card" style={{ padding: 16, background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.06))', borderColor: 'rgba(99,102,241,0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <span>✨</span>
                        <span style={{ fontWeight: 700, fontSize: 13, background: 'linear-gradient(90deg, #4F46E5, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                          AI Observation Synthesis
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {aiInsights?.summary || 'Observing positive academic momentum based on daily class averages.'}
                      </p>
                    </div>

                    <div className="card" style={{ padding: 16 }}>
                      <h4 style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Core Growth Points</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {aiInsights?.insights?.map((ins: string, idx: number) => (
                          <div key={idx} style={{ display: 'flex', gap: 8, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            <span style={{ color: 'var(--color-primary-light)' }}>•</span>
                            <span dangerouslySetInnerHTML={{ __html: ins }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
