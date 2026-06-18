import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line
} from 'recharts';
import {
  Users, Award, AlertTriangle, Star,
  UserCheck, BookOpen, Calendar, FileText, Download,
  Sparkles, Filter, School, ChevronRight, X, Printer, FileSpreadsheet,
  CheckCircle
} from 'lucide-react';
import {
  useGetMarksClassesQuery,
  useGetMarksSubjectsQuery,
  useGetMarksExamsQuery,
  useGetMarksAcademicYearsQuery,
  useGetClassRosterQuery,
  useEnterMarksMutation,
} from './marksApi';

// Colors representing variables in design tokens or matching Recharts styles
const THEME_COLORS = {
  primary: '#4F46E5',     // Indigo
  primaryLight: '#818CF8',
  secondary: '#10B981',   // Emerald
  secondaryLight: '#34D399',
  warning: '#F59E0B',     // Amber
  danger: '#F43F5E',      // Rose
  info: '#06B6D4',        // Cyan
  purple: '#8B5CF6',      // Violet
  gray: '#94A3B8'
};

const CHART_GRID_STROKE = 'var(--border-color)';

const STATUSES = ['Draft', 'Published', 'Archived'];

// Grading Engine boundaries helper
function getGradeFromPercentage(pct: number): string {
  if (pct >= 95) return 'A+';
  if (pct >= 90) return 'A';
  if (pct >= 80) return 'B+';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A+': case 'A': return '#10B981'; // green
    case 'B+': case 'B': return '#4F46E5'; // indigo
    case 'C': return '#06B6D4'; // cyan
    case 'D': return '#F59E0B'; // amber
    default: return '#F43F5E'; // rose
  }
}

// Pseudo-random helper seeded for demo consistency
function seededRandom(seedStr: string) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
}

export default function MarksPage() {
  // Core filters queries from backend
  const { data: classesData } = useGetMarksClassesQuery();
  const { data: subjectsData } = useGetMarksSubjectsQuery();
  const { data: examsData } = useGetMarksExamsQuery();
  const { data: academicYearsData } = useGetMarksAcademicYearsQuery();

  // 1. Filtering states
  const [academicYear, setAcademicYear] = useState('');
  const [examType, setExamType] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('A');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('Draft');
  const [searchQuery, setSearchQuery] = useState('');

  // 2. Interaction states
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PUBLISHED'>('DRAFT');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [saveTime, setSaveTime] = useState<string>('Saved draft');
  const [exporting, setExporting] = useState<'excel' | 'pdf' | 'cards' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Trigger auto-dismiss toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync default filter options from loaded data
  useEffect(() => {
    if (classesData && classesData.length > 0 && !classFilter) {
      setClassFilter(classesData[0].id);
    }
  }, [classesData, classFilter]);

  useEffect(() => {
    if (classesData && classFilter) {
      const activeClass = classesData.find((cls: any) => cls.id === classFilter);
      if (activeClass) {
        setSectionFilter(activeClass.section);
      }
    }
  }, [classesData, classFilter]);

  useEffect(() => {
    if (subjectsData && subjectsData.length > 0 && !subjectFilter) {
      setSubjectFilter(subjectsData[0].id);
    }
  }, [subjectsData, subjectFilter]);

  useEffect(() => {
    if (examsData && examsData.length > 0 && !examType) {
      setExamType(examsData[0].id);
    }
  }, [examsData, examType]);

  useEffect(() => {
    if (academicYearsData && academicYearsData.length > 0 && !academicYear) {
      const current = academicYearsData.find((ay: any) => ay.is_current) || academicYearsData[0];
      setAcademicYear(current.id);
    }
  }, [academicYearsData, academicYear]);

  // 3. QUERY ROSTER FROM DATABASE
  const { data: rosterData } = useGetClassRosterQuery(
    { classId: classFilter, examId: examType, subjectId: subjectFilter },
    { skip: !classFilter || !examType || !subjectFilter }
  );

  const [enterMarks] = useEnterMarksMutation();

  // Keep a local state of entries representing user edits
  const [scoresSheet, setScoresSheet] = useState<any[]>([]);

  // Synchronize local state with filters change
  useEffect(() => {
    if (rosterData) {
      const mapped = rosterData.map((item: any, idx: number) => ({
        id: item.student_id,
        rollNumber: idx + 1,
        studentCode: item.student_code,
        name: item.name,
        maxMarks: item.max_score || 100,
        obtainedMarks: item.score ?? 0,
        remarks: item.remarks || '',
      }));
      setScoresSheet(mapped);
      setApprovalStatus(rosterData[0]?.mark?.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT');
      setSaveTime('Saved draft');
    }
  }, [rosterData]);

  // 4. GRADE ENGINE & RANKINGS DYNAMIC CALCULATION
  const computedRoster = useMemo(() => {
    // A. Recalculate percentage and grades
    const evaluated = scoresSheet.map(item => {
      const pct = item.maxMarks > 0 ? (item.obtainedMarks / item.maxMarks) * 100 : 0;
      const roundedPct = Math.round(pct);
      const grade = getGradeFromPercentage(roundedPct);
      const status = roundedPct >= 50 ? 'PASS' : 'FAIL';
      return {
        ...item,
        percentage: roundedPct,
        grade,
        status
      };
    });

    // B. Calculate dynamic Ranks based on obtained scores (descending)
    const sorted = [...evaluated].sort((a, b) => b.obtainedMarks - a.obtainedMarks);
    
    // Map Ranks handling ties
    const ranksMap: Record<string, number> = {};
    let currentRank = 1;
    sorted.forEach((item, idx) => {
      if (idx > 0 && item.obtainedMarks < sorted[idx - 1].obtainedMarks) {
        currentRank = idx + 1;
      }
      ranksMap[item.id] = currentRank;
    });

    // Return roster with ranks mapped back to original indices
    return evaluated.map(item => ({
      ...item,
      rank: ranksMap[item.id] || 0
    }));
  }, [scoresSheet]);

  // Keep a ref for the save debounce timers
  const saveTimeoutRef = useRef<Record<string, any>>({});

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      Object.values(saveTimeoutRef.current).forEach(clearTimeout);
    };
  }, []);

  const saveToDatabase = async (studentId: string, obtained: number, remarksText: string) => {
    if (!examType || !subjectFilter || !academicYear) return;
    setIsAutoSaving(true);
    try {
      await enterMarks({
        exam_id: examType,
        subject_id: subjectFilter,
        academic_year_id: academicYear,
        entries: [{
          student_id: studentId,
          score: obtained,
          max_score: 100,
          remarks: remarksText,
        }]
      }).unwrap();
      setIsAutoSaving(false);
      const now = new Date();
      setSaveTime(`Auto-saved at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`);
    } catch (err) {
      console.error(err);
      setIsAutoSaving(false);
      setSaveTime('Save failed');
    }
  };

  // Handle Score Input Change
  const handleScoreChange = (id: string, value: string) => {
    const parsedVal = value === '' ? 0 : Math.max(0, parseFloat(value));
    const finalVal = Math.min(100, parsedVal);
    
    setScoresSheet(prev => prev.map(item => {
      if (item.id === id) {
        const updated = {
          ...item,
          obtainedMarks: finalVal
        };
        // Trigger debounced save
        if (saveTimeoutRef.current[id]) {
          clearTimeout(saveTimeoutRef.current[id]);
        }
        saveTimeoutRef.current[id] = setTimeout(() => {
          saveToDatabase(id, finalVal, item.remarks);
        }, 800);
        return updated;
      }
      return item;
    }));
  };

  // Handle Remarks Input Change
  const handleRemarksChange = (id: string, value: string) => {
    setScoresSheet(prev => prev.map(item => {
      if (item.id === id) {
        const updated = {
          ...item,
          remarks: value
        };
        // Trigger debounced save
        if (saveTimeoutRef.current[id]) {
          clearTimeout(saveTimeoutRef.current[id]);
        }
        saveTimeoutRef.current[id] = setTimeout(() => {
          saveToDatabase(id, item.obtainedMarks, value);
        }, 800);
        return updated;
      }
      return item;
    }));
  };

  // 5. METRIC COMPUTATIONS FOR KPI CARDS
  const dashboardKPIs = useMemo(() => {
    const list = computedRoster;
    if (list.length === 0) return { total: 0, avgMarks: 0, passPct: 0, attentionCount: 0, topPerformer: 'N/A', topScore: 0 };
    
    const total = list.length;
    const sumMarks = list.reduce((sum, item) => sum + item.percentage, 0);
    const avgMarks = Math.round(sumMarks / total);

    const passes = list.filter(item => item.status === 'PASS').length;
    const passPct = Math.round((passes / total) * 100);

    const attentionCount = list.filter(item => item.percentage < 60).length;

    // Find top performer
    const top = [...list].sort((a, b) => b.obtainedMarks - a.obtainedMarks)[0];

    return {
      total,
      avgMarks,
      passPct,
      attentionCount,
      topPerformer: top ? top.name : 'N/A',
      topScore: top ? top.percentage : 0
    };
  }, [computedRoster]);

  // 6. ANCHOR KEYBOARD NAVIGATION SPREADSHEET INPUTS
  // focus matrix columns index: 0=Obtained Marks, 1=Remarks
  const handleKeyDown = (e: React.KeyboardEvent, rowIdx: number, colIdx: number) => {
    let targetRow = rowIdx;
    let targetCol = colIdx;

    if (e.key === 'ArrowUp') {
      targetRow = Math.max(0, rowIdx - 1);
    } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
      targetRow = Math.min(computedRoster.length - 1, rowIdx + 1);
      e.preventDefault(); // Stop enter key form submit triggers
    } else if (e.key === 'ArrowLeft') {
      // Focus left col if cursor allows (handled standard or fallback)
      targetCol = Math.max(0, colIdx - 1);
    } else if (e.key === 'ArrowRight') {
      targetCol = Math.min(1, colIdx + 1);
    } else {
      return; // Do nothing for other characters
    }

    const nextId = `cell-input-${targetRow}-${targetCol}`;
    const element = document.getElementById(nextId);
    if (element) {
      element.focus();
    }
  };

  // 7. APPROVAL WORKFLOW ACTION PROCESS
  const handleWorkflowTransition = (nextState: 'SUBMITTED' | 'APPROVED' | 'PUBLISHED') => {
    setApprovalStatus(nextState);
    if (nextState === 'SUBMITTED') {
      triggerToast('📤 Roster marks sheet submitted to School Admin for review.');
    } else if (nextState === 'APPROVED') {
      triggerToast('✅ Roster marks approved successfully by Admin.');
    } else if (nextState === 'PUBLISHED') {
      triggerToast('🎉 Results published! Notifications sent to parent portal dashboards.');
    }
  };

  // 8. SIMULATED EXCEL IMPORT & REPORT CARD EXPORT
  const handleExcelImport = () => {
    setExporting('excel');
    setTimeout(() => {
      setExporting(null);
      // Alter marks of a few random students as import mock
      setScoresSheet(prev => prev.map((item, idx) => {
        if (idx % 7 === 0) {
          return {
            ...item,
            obtainedMarks: Math.min(100, item.obtainedMarks + 5)
          };
        }
        return item;
      }));
      triggerToast('📁 Excel marks template imported and merged successfully!');
    }, 1500);
  };

  const handleExcelExport = () => {
    setExporting('excel');
    setTimeout(() => {
      setExporting(null);
      // Generate actual CSV string and trigger download
      const csvHeaders = ['Roll Number', 'Student Code', 'Student Name', 'Max Marks', 'Obtained Marks', 'Percentage', 'Grade', 'Rank', 'Pass/Fail', 'Remarks'];
      const csvRows = computedRoster.map(s => [
        s.rollNumber, s.studentCode, s.name, s.maxMarks, s.obtainedMarks, s.percentage, s.grade, s.rank, s.status, s.remarks
      ]);
      const csvContent = [
        ['EduTrack ERP Marks Export Sheet'],
        [`Exam: ${examType} | Class: ${classFilter} | Subject: ${subjectFilter}`],
        [`Academic Year: ${academicYear}`],
        [],
        csvHeaders,
        ...csvRows
      ].map(e => e.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `EduTrack_Marks_${classFilter}_${subjectFilter}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerToast('📝 Excel spreadsheet downloaded!');
    }, 1500);
  };

  const handlePrintReports = () => {
    setExporting('pdf');
    setTimeout(() => {
      setExporting(null);
      window.print();
      triggerToast('📋 Print dialog initiated for Grade report cards.');
    }, 1200);
  };

  // 9. SELECTED STUDENT DRILL-DOWN METRICS FOR DRAWER
  const activeStudentDetails = useMemo(() => {
    if (!selectedStudentId) return null;
    const found = computedRoster.find(s => s.id === selectedStudentId);
    if (!found) return null;

    // Seed student-specific trends based on name length
    const trendSeed = found.name;
    const previousExamScore = Math.round(found.percentage - 6 + seededRandom(trendSeed) * 12);
    const attendanceVal = Math.round(88 + seededRandom(trendSeed) * 11);

    const historicalData = [
      { term: 'Unit Test 1', score: Math.round(previousExamScore - 4) },
      { term: 'Quarterly', score: previousExamScore },
      { term: 'Unit Test 2', score: Math.round(previousExamScore + 3) },
      { term: 'Mid-Term', score: found.percentage }
    ];

    const studentAchievements = seededRandom(trendSeed) > 0.4 
      ? [{ title: 'Math Olympiad City Rank #4', date: 'Oct 2024' }] 
      : [];

    return {
      ...found,
      attendance: attendanceVal,
      previousExamScore,
      historicalData,
      achievements: studentAchievements,
      improvement: found.percentage - previousExamScore
    };
  }, [selectedStudentId, computedRoster]);

  // 10. CHARTS DATA CALCULATIONS
  const classAvgTrendData = [
    { month: 'Jun', Average: 74 },
    { month: 'Jul', Average: 76 },
    { month: 'Aug', Average: 75 },
    { month: 'Sep', Average: 80 },
    { month: 'Oct', Average: 82 },
    { month: 'Nov', Average: 81 },
    { month: 'Dec', Average: 78 },
    { month: 'Jan', Average: 84 },
    { month: 'Feb', Average: 83 },
    { month: 'Mar', Average: 86 }
  ];

  const examComparisonData = [
    { name: 'MATH', 'Current Exam': dashboardKPIs.avgMarks, 'Previous Exam': Math.round(dashboardKPIs.avgMarks - 4) },
    { name: 'SCIENCE', 'Current Exam': 84, 'Previous Exam': 81 },
    { name: 'ENGLISH', 'Current Exam': 88, 'Previous Exam': 89 },
    { name: 'SOCIAL', 'Current Exam': 76, 'Previous Exam': 74 },
    { name: 'CS', 'Current Exam': 91, 'Previous Exam': 88 }
  ];

  const subjectPerformanceData = [
    { subject: 'Math', Average: dashboardKPIs.avgMarks },
    { subject: 'Science', Average: 84 },
    { subject: 'English', Average: 88 },
    { subject: 'Social Studies', Average: 76 },
    { subject: 'Computer Sci', Average: 91 }
  ];

  const gradePieData = useMemo(() => {
    const grades = ['A+', 'A', 'B+', 'B', 'C', 'D', 'F'];
    return grades.map(g => {
      const count = computedRoster.filter(item => item.grade === g).length;
      return {
        name: g,
        value: count,
        color: getGradeColor(g)
      };
    }).filter(c => c.value > 0);
  }, [computedRoster]);

  // Leaderboard Top 10 list
  const topTenStudents = useMemo(() => {
    return [...computedRoster]
      .sort((a, b) => b.obtainedMarks - a.obtainedMarks)
      .slice(0, 10);
  }, [computedRoster]);

  // At-Risk list
  const strugglingStudentsList = useMemo(() => {
    return [...computedRoster]
      .filter(s => s.percentage < 60)
      .sort((a, b) => a.obtainedMarks - b.obtainedMarks);
  }, [computedRoster]);

  return (
    <div className="marks-management-page">
      {/* Dynamic Toast Popup */}
      {toastMessage && (
        <div className="toast-overlay animate-fadeIn">
          <div className="toast-card">
            <CheckCircle size={16} color="var(--color-secondary)" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="card dashboard-section-header border-glow">
        <div className="header-meta-row">
          <div>
            <div className="title-area">
              <span className="sparkle-badge"><Sparkles size={14} className="sparkle-icon" /> ERP Marks</span>
              <h1 className="page-title">Marks Management</h1>
            </div>
            <p className="page-subtitle">Manage examinations, scores, grades, rankings, and academic performance.</p>
          </div>
          <div className="export-button-group">
            <button className="btn btn-secondary btn-sm" onClick={handleExcelImport} disabled={exporting !== null}>
              <FileSpreadsheet size={14} />
              <span>Import Excel</span>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleExcelExport} disabled={exporting !== null}>
              <Download size={14} />
              <span>Export Excel</span>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handlePrintReports} disabled={exporting !== null}>
              <Printer size={14} />
              <span>Download Report Cards</span>
            </button>
            
            {/* Approval triggers depending on state */}
            {approvalStatus === 'DRAFT' && (
              <button className="btn btn-primary btn-sm" onClick={() => handleWorkflowTransition('SUBMITTED')}>
                Submit for Approval
              </button>
            )}
            {approvalStatus === 'SUBMITTED' && (
              <button className="btn btn-success btn-sm" onClick={() => handleWorkflowTransition('APPROVED')}>
                Approve Roster
              </button>
            )}
            {approvalStatus === 'APPROVED' && (
              <button className="btn btn-primary btn-sm" onClick={() => handleWorkflowTransition('PUBLISHED')}>
                Publish Results
              </button>
            )}
            {approvalStatus === 'PUBLISHED' && (
              <span className="badge badge-present" style={{ display: 'flex', alignItems: 'center', gap: 4, height: 36, padding: '0 12px' }}>
                <CheckCircle size={12} /> Published
              </span>
            )}
          </div>
        </div>

        {/* WORKFLOW STATUS TIMELINE */}
        <div className="workflow-timeline-bar">
          <span className="timeline-title">Approval Step:</span>
          <div className="timeline-steps">
            <span className={`step-badge ${approvalStatus === 'DRAFT' ? 'active' : 'completed'}`}>Draft</span>
            <ChevronRight size={12} className="step-arrow" />
            <span className={`step-badge ${approvalStatus === 'SUBMITTED' ? 'active' : approvalStatus !== 'DRAFT' ? 'completed' : ''}`}>Submitted</span>
            <ChevronRight size={12} className="step-arrow" />
            <span className={`step-badge ${approvalStatus === 'APPROVED' ? 'active' : (approvalStatus === 'PUBLISHED') ? 'completed' : ''}`}>Approved</span>
            <ChevronRight size={12} className="step-arrow" />
            <span className={`step-badge ${approvalStatus === 'PUBLISHED' ? 'active' : ''}`}>Published</span>
          </div>
          
          {/* Roster Notification Warnings */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span className="notif-bullet bg-secondary-surface animate-pulse" />
            <span style={{ color: 'var(--text-secondary)' }}>Auto-save status:</span>
            <span style={{ fontWeight: 600, color: isAutoSaving ? 'var(--color-primary)' : 'var(--color-secondary)' }}>
              {isAutoSaving ? 'Saving changes...' : saveTime}
            </span>
          </div>
        </div>

        {/* FILTERS SECTION */}
        <div className="filters-control-bar">
          <div className="filter-wrapper">
            <label className="filter-label"><Calendar size={12} /> Academic Year</label>
            <select className="form-select select-custom" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
              {academicYearsData?.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
            </select>
          </div>

          <div className="filter-wrapper">
            <label className="filter-label"><FileText size={12} /> Exam Type</label>
            <select className="form-select select-custom" value={examType} onChange={(e) => setExamType(e.target.value)}>
              {examsData?.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
          </div>

          <div className="filter-wrapper">
            <label className="filter-label"><School size={12} /> Class</label>
            <select className="form-select select-custom" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
              {classesData?.map(cls => <option key={cls.id} value={cls.id}>{cls.name} {cls.section}</option>)}
            </select>
          </div>

          <div className="filter-wrapper">
            <label className="filter-label"><Filter size={12} /> Section</label>
            <select className="form-select select-custom" value={sectionFilter} disabled>
              <option value={sectionFilter}>Section {sectionFilter}</option>
            </select>
          </div>

          <div className="filter-wrapper">
            <label className="filter-label"><BookOpen size={12} /> Subject</label>
            <select className="form-select select-custom" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
              {subjectsData?.map(sb => <option key={sb.id} value={sb.id}>{sb.name}</option>)}
            </select>
          </div>

          <div className="filter-wrapper">
            <label className="filter-label"><Users size={12} /> Teacher</label>
            <select className="form-select select-custom" disabled>
              <option>Priya Sharma</option>
              <option>Amit Verma</option>
            </select>
          </div>

          <div className="filter-wrapper">
            <label className="filter-label"><Filter size={12} /> Status</label>
            <select className="form-select select-custom" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          </div>
        </div>

        {/* Quick Search and Reset controls */}
        <div style={{ display: 'flex', gap: 12, marginTop: 14, alignItems: 'center' }}>
          <input
            type="text"
            className="form-input"
            style={{ maxWidth: 300, fontSize: 13, height: 36 }}
            placeholder="🔍 Search student by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setSearchQuery('');
              if (classesData && classesData.length > 0) setClassFilter(classesData[0].id);
              if (subjectsData && subjectsData.length > 0) setSubjectFilter(subjectsData[0].id);
              if (examsData && examsData.length > 0) setExamType(examsData[0].id);
              if (academicYearsData && academicYearsData.length > 0) {
                const current = academicYearsData.find((ay: any) => ay.is_current) || academicYearsData[0];
                setAcademicYear(current.id);
              }
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="stats-grid dashboard-row">
        <div className="stat-card primary">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Total Students</div>
              <div className="stat-card-value">{dashboardKPIs.total}</div>
            </div>
            <div className="stat-card-icon primary"><Users size={20} /></div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Average Marks</div>
              <div className="stat-card-value">{dashboardKPIs.avgMarks}%</div>
            </div>
            <div className="stat-card-icon success"><Award size={20} /></div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Pass Percentage</div>
              <div className="stat-card-value">{dashboardKPIs.passPct}%</div>
            </div>
            <div className="stat-card-icon info"><UserCheck size={20} /></div>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Exams Completed</div>
              <div className="stat-card-value">18</div>
            </div>
            <div className="stat-card-icon purple"><Calendar size={20} /></div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Top Performer</div>
              <div className="stat-card-value" style={{ fontSize: 20, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {dashboardKPIs.topPerformer}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-secondary)' }}>Score: {dashboardKPIs.topScore}%</div>
            </div>
            <div className="stat-card-icon success"><Star size={20} fill="var(--color-secondary)" stroke="var(--color-secondary)" /></div>
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Struggling Students</div>
              <div className="stat-card-value">{dashboardKPIs.attentionCount}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Score under 60%</div>
            </div>
            <div className="stat-card-icon danger"><AlertTriangle size={20} /></div>
          </div>
        </div>
      </div>

      {/* EXAM OVERVIEW ROW */}
      <div className="grid-2 dashboard-row">
        {/* Exams Grid list */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📅 Academic Exams Overview</span>
            <span className="badge badge-primary">Roster Configured</span>
          </div>
          <div className="card-body">
            <div className="exams-overview-layout">
              <div className="exam-status-card active">
                <div className="title">Mid-Term Examination</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Status: <span className="text-warning font-semibold">Evaluation Pending</span></div>
                <div className="bar-wrapper" style={{ marginTop: 8 }}><div className="bar bg-primary" style={{ width: '80%' }} /></div>
              </div>
              <div className="exam-status-card">
                <div className="title">Quarterly Examination</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Status: <span className="text-success font-semibold">Published</span></div>
                <div className="bar-wrapper" style={{ marginTop: 8 }}><div className="bar bg-success" style={{ width: '100%' }} /></div>
              </div>
              <div className="exam-status-card">
                <div className="title">Unit Test 2</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Status: <span className="text-success font-semibold">Published</span></div>
                <div className="bar-wrapper" style={{ marginTop: 8 }}><div className="bar bg-success" style={{ width: '100%' }} /></div>
              </div>
              <div className="exam-status-card">
                <div className="title">Annual Examination</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Status: <span className="text-muted">Upcoming (April 2026)</span></div>
                <div className="bar-wrapper" style={{ marginTop: 8 }}><div className="bar bg-gray" style={{ width: '0%' }} /></div>
              </div>
            </div>
          </div>
        </div>

        {/* AI INSIGHTS ENGINE PANEL */}
        <div className="card border-glow-purple">
          <div className="card-header bg-gradient-purple-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={16} className="text-purple-light animate-pulse" />
              <span className="card-title text-glow-purple">AI Marks Insights Engine</span>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="ai-diagnostic-bubble">
              <div className="bullet">⚡ Mathematics averages dropped by 6% compared to the last Unit Test.</div>
              <div className="bullet">⚡ Class 8A achieved the highest performance index in Computer Science (91% average).</div>
              <div className="bullet">⚡ {dashboardKPIs.attentionCount} students require academic intervention in the {subjectFilter} module.</div>
            </div>
            
            <div className="ai-actions-row">
              <button className="btn btn-secondary btn-sm" onClick={() => triggerToast('✉️ Parental review alerts dispatched successfully.')}>
                Dispatch Parents Alerts
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => triggerToast('📅 Math remedial classes created on school calendar.')}>
                Configure Remedial Sessions
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BULK MARKS ENTRY SPREADSHEET */}
      <div className="card dashboard-row">
        <div className="card-header-sorting">
          <div>
            <h2 className="card-title">📋 Marks Bulk spreadsheet Entry</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Excel-like spreadsheet. Select a row to inspect. Use <strong>↑ ↓ ← → / Enter</strong> key navigations.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="badge badge-leave">Keyboard: Active</span>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container border-none" style={{ maxHeight: '420px', overflowY: 'auto' }}>
            <table className="table spreadsheet-table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Roll No</th>
                  <th style={{ width: 110 }}>Student ID</th>
                  <th>Student Name</th>
                  <th style={{ width: 110 }}>Max Marks</th>
                  <th style={{ width: 130 }}>Obtained Marks</th>
                  <th style={{ width: 100 }}>Percentage</th>
                  <th style={{ width: 80 }}>Grade</th>
                  <th style={{ width: 80 }}>Rank</th>
                  <th style={{ width: 100 }}>Status</th>
                  <th>Observation / Remarks</th>
                </tr>
              </thead>
              <tbody>
                {computedRoster
                  .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.studentCode.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((row, rowIdx) => {
                    const isSelected = selectedStudentId === row.id;
                    const isFailing = row.status === 'FAIL';
                    
                    return (
                      <tr key={row.id} className={isSelected ? 'selected-row-highlight' : ''}>
                        <td style={{ fontWeight: 600 }}>{row.rollNumber}</td>
                        <td style={{ color: 'var(--text-muted)' }}>#{row.studentCode}</td>
                        <td 
                          style={{ fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer' }}
                          onClick={() => setSelectedStudentId(row.id)}
                        >
                          {row.name}
                        </td>
                        <td style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{row.maxMarks}</td>
                        <td>
                          <input
                            id={`cell-input-${rowIdx}-0`}
                            type="number"
                            step="1"
                            min="0"
                            max={row.maxMarks}
                            className={`spreadsheet-input-cell ${isFailing ? 'input-failing' : ''}`}
                            value={row.obtainedMarks}
                            onChange={(e) => handleScoreChange(row.id, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, rowIdx, 0)}
                          />
                        </td>
                        <td style={{ fontWeight: 600 }}>{row.percentage}%</td>
                        <td>
                          <span className="grade-badge" style={{ backgroundColor: getGradeColor(row.grade) }}>
                            {row.grade}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700 }}>#{row.rank}</td>
                        <td>
                          <span className={`badge ${isFailing ? 'badge-absent' : 'badge-present'}`}>
                            {row.status}
                          </span>
                        </td>
                        <td>
                          <input
                            id={`cell-input-${rowIdx}-1`}
                            type="text"
                            className="spreadsheet-input-cell text-left"
                            placeholder="Add remark..."
                            value={row.remarks}
                            onChange={(e) => handleRemarksChange(row.id, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, rowIdx, 1)}
                          />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PERFORMANCE ANALYTICS & RESULT DISTRIBUTION */}
      <div className="grid-3 dashboard-row">
        {/* Subject performance */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📊 Subject Performance Index</span>
            <span className="badge badge-primary">Current Class</span>
          </div>
          <div className="card-body">
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectPerformanceData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
                  <XAxis dataKey="subject" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                  <Bar dataKey="Average" fill={THEME_COLORS.primary} radius={[4, 4, 0, 0]}>
                    {subjectPerformanceData.map((entry, idx) => (
                      <Cell key={idx} fill={[THEME_COLORS.primary, THEME_COLORS.secondary, THEME_COLORS.warning, THEME_COLORS.info, THEME_COLORS.purple][idx % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Class averages trend */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📈 Class Average Trend (10 Months)</span>
            <span className="badge badge-primary">Monthly Progression</span>
          </div>
          <div className="card-body">
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={classAvgTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="Average" stroke={THEME_COLORS.secondary} strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Exam-over-Exam Comparison */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📊 Exam-over-Exam Comparison</span>
            <span className="badge badge-primary">Current vs Previous</span>
          </div>
          <div className="card-body">
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={examComparisonData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Current Exam" fill={THEME_COLORS.primary} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Previous Exam" fill={THEME_COLORS.purple} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-3 dashboard-row">
        {/* Grade Distribution Pie Chart */}
        <div className="card col-span-1">
          <div className="card-header">
            <span className="card-title">🗂️ Grade Distribution ratio</span>
          </div>
          <div className="card-body pie-card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr', alignItems: 'center' }}>
            <div style={{ width: '100%', height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {gradePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Students`, 'Volume']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="pie-legend-list">
              {gradePieData.map((cat) => (
                <div key={cat.name} className="legend-row">
                  <span className="legend-dot" style={{ backgroundColor: cat.color }} />
                  <span className="legend-label">Class {cat.name}</span>
                  <span className="legend-value">{cat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top 10 Leaderboard */}
        <div className="card col-span-1">
          <div className="card-header">
            <span className="card-title">🏆 Class Top 10 Students</span>
          </div>
          <div className="card-body text-xs-scroll">
            {topTenStudents.map((item, idx) => (
              <div key={item.id} className="leaderboard-item-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`leaderboard-rank-badge ${idx < 3 ? 'top-three' : ''}`}>{idx + 1}</span>
                  <span style={{ fontWeight: 600 }}>{item.name}</span>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Struggling Students list */}
        <div className="card col-span-1">
          <div className="card-header">
            <span className="card-title">⚠️ Students Requiring Remedials</span>
          </div>
          <div className="card-body text-xs-scroll">
            {strugglingStudentsList.length === 0 ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No students currently require academic intervention.
              </div>
            ) : (
              strugglingStudentsList.map((item) => (
                <div key={item.id} className="struggling-item-row">
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</span>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Roll No: {item.rollNumber} | Score: {item.percentage}%</div>
                  </div>
                  <span className="badge badge-absent">Class {item.grade}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* STUDENT DETAIL SLIDEOUT DRAWER */}
      {selectedStudentId && activeStudentDetails && (
        <div className="drawer-overlay animate-fadeIn" onClick={() => setSelectedStudentId(null)}>
          <div className="student-drawer-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <span className="title">Student Academic File</span>
              <button className="btn-close" onClick={() => setSelectedStudentId(null)}><X size={16} /></button>
            </div>
            
            <div className="drawer-body">
              {/* Profile card summary */}
              <div className="profile-summary">
                <div className="avatar-fallback avatar-lg">
                  {activeStudentDetails.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="student-name">{activeStudentDetails.name}</h3>
                <span className="student-class">{classFilter.replace('class_', 'Class ').toUpperCase()} - Section {sectionFilter}</span>
                
                <div className="details-tags-row">
                  <span className="tag">Roll No: {activeStudentDetails.rollNumber}</span>
                  <span className="tag">ID: {activeStudentDetails.studentCode}</span>
                </div>
              </div>

              {/* Spacing indicator row */}
              <div className="diagnostic-details-row">
                <div className="metric">
                  <span className="label">Attendance</span>
                  <span className="val">{activeStudentDetails.attendance}%</span>
                </div>
                <div className="metric">
                  <span className="label">Term Rank</span>
                  <span className="val text-primary">#{activeStudentDetails.rank}</span>
                </div>
                <div className="metric">
                  <span className="label">Avg Score</span>
                  <span className="val">{activeStudentDetails.percentage}%</span>
                </div>
              </div>

              {/* Progress trend chart */}
              <div className="drawer-section">
                <h4 className="section-title">📊 Term Marks Progress</h4>
                <div style={{ width: '100%', height: 160, marginTop: 10 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activeStudentDetails.historicalData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="drawerColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={THEME_COLORS.primary} stopOpacity={0.2}/>
                          <stop offset="95%" stopColor={THEME_COLORS.primary} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
                      <XAxis dataKey="term" tick={{ fontSize: 9 }} />
                      <YAxis domain={[30, 100]} tick={{ fontSize: 9 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="score" stroke={THEME_COLORS.primary} strokeWidth={2} fillOpacity={1} fill="url(#drawerColor)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Previous term comparisons */}
              <div className="drawer-section">
                <h4 className="section-title">🔄 Term Comparison</h4>
                <div className="term-comparison-row" style={{ marginTop: 10 }}>
                  <div className="comparison-box">
                    <span className="label">Previous Score</span>
                    <span className="val">{activeStudentDetails.previousExamScore}%</span>
                  </div>
                  <div className="comparison-box">
                    <span className="label">Shift</span>
                    <span className={`val ${activeStudentDetails.improvement >= 0 ? 'text-success' : 'text-danger'}`}>
                      {activeStudentDetails.improvement >= 0 ? '+' : ''}{activeStudentDetails.improvement}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Achievements summary */}
              <div className="drawer-section">
                <h4 className="section-title">🏆 Student Achievements</h4>
                <div className="drawer-achievements-list">
                  {activeStudentDetails.achievements.length === 0 ? (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>No special extracurricular achievements logged.</p>
                  ) : (
                    activeStudentDetails.achievements.map((ach, idx) => (
                      <div key={idx} className="ach-row">
                        <Award size={14} className="text-success" />
                        <div>
                          <span className="ach-title">{ach.title}</span>
                          <span className="ach-date">{ach.date}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Remarks */}
              <div className="drawer-section">
                <h4 className="section-title">📝 Teacher Observation Remark</h4>
                <p className="remarks-box-paragraph">{activeStudentDetails.remarks}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SPREADSHEET CUSTOM STYLINGS */}
      <style>{`
        /* Global parent layout lock to center content without left/right scrolling */
        html, body {
          max-width: 100% !important;
          overflow-x: hidden !important;
        }

        .main-content {
          max-width: 100% !important;
          overflow-x: hidden !important;
        }

        .page-container {
          max-width: 100% !important;
          overflow-x: hidden !important;
          box-sizing: border-box;
        }

        .marks-management-page * {
          box-sizing: border-box;
        }

        .marks-management-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding-bottom: 40px;
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
          min-width: 0;
        }

        .dashboard-section-header {
          padding: 24px;
        }

        .card-header-sorting {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color);
          flex-wrap: wrap;
          gap: 12px;
        }

        .card, .stat-card {
          min-width: 0 !important;
          max-width: 100% !important;
          overflow: hidden !important;
        }

        .card-body {
          min-width: 0;
          max-width: 100%;
          overflow-x: auto;
        }

        .table-container {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        /* Responsive grid item shrink overrides */
        .grid-2 > div, .grid-3 > div, .stats-grid > div {
          min-width: 0 !important;
          overflow: hidden !important;
        }

        /* Header control details */
        .title-area {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sparkle-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          color: var(--color-primary);
          background: var(--color-primary-surface);
          padding: 2px 8px;
          border-radius: var(--radius-full);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        [data-theme="dark"] .sparkle-badge {
          background: rgba(79, 70, 229, 0.2);
          color: var(--color-primary-light);
        }

        .sparkle-icon {
          animation: spin-pulse-icon 2s infinite ease-in-out;
        }

        @keyframes spin-pulse-icon {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.8; }
          50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
        }

        .header-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 16px;
        }

        .export-button-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .workflow-timeline-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid var(--border-color);
          flex-wrap: wrap;
        }

        .timeline-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .timeline-steps {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .step-badge {
          font-size: 11px;
          font-weight: 600;
          background-color: var(--bg-tertiary);
          color: var(--text-muted);
          padding: 2px 10px;
          border-radius: var(--radius-full);
        }

        .step-badge.completed {
          background-color: var(--color-secondary-surface);
          color: var(--color-secondary-dark);
        }

        .step-badge.active {
          background-color: var(--color-primary-surface);
          color: var(--color-primary);
          border: 1px solid var(--color-primary-light);
        }

        .step-arrow {
          color: var(--text-muted);
        }

        .filters-control-bar {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid var(--border-color);
          width: 100%;
        }

        .filter-wrapper {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        .filter-label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .select-custom {
          padding: 8px 12px;
          background-position: right 10px center;
          font-size: 13px;
          font-weight: 500;
        }

        /* Roster spreadsheet stlyes */
        .spreadsheet-table input.spreadsheet-input-cell {
          width: 100%;
          height: 32px;
          border: 1px solid transparent;
          background: transparent;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          text-align: center;
          padding: 2px 6px;
          transition: var(--transition-fast);
          outline: none;
        }

        .spreadsheet-table input.spreadsheet-input-cell:hover {
          border-color: var(--border-color);
          background-color: var(--bg-secondary);
        }

        .spreadsheet-table input.spreadsheet-input-cell:focus {
          border-color: var(--color-primary-light);
          background-color: var(--bg-primary);
          box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15);
        }

        .spreadsheet-table input.input-failing {
          color: var(--color-danger) !important;
          background-color: var(--color-danger-surface) !important;
          border-color: rgba(244, 63, 94, 0.15) !important;
        }

        .selected-row-highlight {
          background-color: var(--color-primary-surface) !important;
        }
        
        [data-theme="dark"] .selected-row-highlight {
          background-color: rgba(79, 70, 229, 0.12) !important;
        }

        .grade-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 20px;
          border-radius: 4px;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
        }

        /* Exams Overview Layout */
        .exams-overview-layout {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .exam-status-card {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 12px;
          background-color: var(--bg-secondary);
        }

        .exam-status-card.active {
          border-color: var(--color-primary-light);
          background-color: var(--color-primary-surface);
        }
        
        [data-theme="dark"] .exam-status-card.active {
          background-color: rgba(79, 70, 229, 0.1);
        }

        .exam-status-card .title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 2px;
        }

        .bar-wrapper {
          height: 6px;
          background-color: var(--bg-tertiary);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .bar-wrapper .bar {
          height: 100%;
          border-radius: var(--radius-full);
        }

        /* AI diagnostic */
        .ai-diagnostic-bubble {
          background-color: var(--bg-secondary);
          border-radius: var(--radius-sm);
          padding: 12px;
          border: 1px dashed var(--color-primary-light);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ai-diagnostic-bubble .bullet {
          font-size: 12px;
          color: var(--text-primary);
          line-height: 1.4;
          font-weight: 500;
        }

        .ai-actions-row {
          display: flex;
          gap: 10px;
          margin-top: auto;
        }

        /* Leaderboard and items list */
        .text-xs-scroll {
          overflow-y: auto;
          max-height: 220px;
        }

        .leaderboard-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 8px;
          margin-bottom: 8px;
          border-bottom: 1px solid var(--border-color);
          font-size: 12px;
        }

        .leaderboard-item-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
          margin-bottom: 0;
        }

        .leaderboard-rank-badge {
          width: 18px;
          height: 18px;
          border-radius: 99px;
          background-color: var(--bg-tertiary);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 700;
        }

        .leaderboard-rank-badge.top-three {
          background-color: #FEF3C7;
          color: #D97706;
        }

        .struggling-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 8px;
          margin-bottom: 8px;
          border-bottom: 1px solid var(--border-color);
        }

        .struggling-item-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
          margin-bottom: 0;
        }

        /* Results Distribution legend */
        .pie-legend-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .legend-row {
          display: flex;
          align-items: center;
          font-size: 11px;
          gap: 6px;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .legend-label {
          color: var(--text-secondary);
          flex: 1;
        }

        .legend-value {
          font-weight: 700;
        }

        /* Right slide detail drawer */
        .drawer-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          justify-content: flex-end;
        }

        .student-drawer-sheet {
          width: 420px;
          height: 100vh;
          background-color: var(--bg-primary);
          border-left: 1px solid var(--border-color);
          box-shadow: var(--shadow-xl);
          display: flex;
          flex-direction: column;
          animation: slideFromRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideFromRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .drawer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color);
        }

        .drawer-header .title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .drawer-header .btn-close {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          transition: var(--transition-fast);
        }

        .drawer-header .btn-close:hover {
          background-color: var(--bg-secondary);
          color: var(--text-primary);
        }

        .drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .profile-summary {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border-color);
        }

        .profile-summary .student-name {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin-top: 10px;
          margin-bottom: 2px;
        }

        .profile-summary .student-class {
          font-size: 12px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .details-tags-row {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }

        .details-tags-row .tag {
          font-size: 10px;
          font-weight: 600;
          background-color: var(--bg-tertiary);
          color: var(--text-secondary);
          padding: 2px 8px;
          border-radius: 4px;
        }

        .diagnostic-details-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          padding: 12px 0;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          text-align: center;
        }

        .diagnostic-details-row .metric {
          display: flex;
          flex-direction: column;
          gap: 2px;
          border-right: 1px solid var(--border-color);
        }

        .diagnostic-details-row .metric:last-child {
          border-right: none;
        }

        .diagnostic-details-row .metric .label {
          font-size: 10px;
          font-weight: 500;
          color: var(--text-muted);
        }

        .diagnostic-details-row .metric .val {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .drawer-section .section-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .term-comparison-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .comparison-box {
          background-color: var(--bg-secondary);
          padding: 10px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          text-align: center;
        }

        .comparison-box .label {
          font-size: 10px;
          color: var(--text-muted);
          display: block;
        }

        .comparison-box .val {
          font-size: 14px;
          font-weight: 700;
        }

        .drawer-achievements-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ach-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 12px;
        }

        .ach-title {
          font-weight: 600;
          display: block;
        }

        .ach-date {
          font-size: 10px;
          color: var(--text-muted);
        }

        .remarks-box-paragraph {
          font-size: 12px;
          color: var(--text-primary);
          line-height: 1.4;
          padding: 10px;
          background-color: var(--color-warning-surface);
          border: 1px solid rgba(245, 158, 11, 0.2);
          border-radius: var(--radius-md);
        }

        /* Toast Popup Overlay */
        .toast-overlay {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 1000;
          animation: slideUpToast 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .toast-card {
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-lg);
          padding: 12px 20px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
        }

        @keyframes slideUpToast {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        /* Responsive Details */
        .col-span-1 {
          grid-column: span 1;
        }

        @media (max-width: 1024px) {
          .exams-overview-layout {
            grid-template-columns: 1fr;
          }
          
          .col-span-1 {
            grid-column: span 3;
          }
        }

        @media (max-width: 768px) {
          .marks-management-page {
            gap: 16px;
          }
          
          .dashboard-section-header {
            padding: 16px;
          }

          .filters-control-bar {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 12px;
            padding-top: 12px;
          }
          
          .export-button-group {
            width: 100%;
            justify-content: stretch;
            gap: 8px;
          }
          
          .export-button-group button {
            flex: 1;
          }
          
          .header-meta-row {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .workflow-timeline-bar {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          
          .ai-actions-row {
            flex-direction: column;
            width: 100%;
          }

          .ai-actions-row button {
            width: 100%;
          }

          .student-drawer-sheet {
            width: 100%;
          }

          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 12px;
            margin-bottom: 16px;
          }
        }

        @media (max-width: 480px) {
          .filters-control-bar {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
