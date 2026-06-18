import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  ScatterChart, Scatter, ZAxis, LineChart, Line, ReferenceLine
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, Award, AlertTriangle, Star,
  UserCheck, BookOpen, Calendar, Activity, FileText, Download,
  RefreshCw, Sparkles, Filter, ArrowUpDown, MessageSquare, Send,
  School, Check
} from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useGetAdminKPIsQuery, useGetDetailedAnalyticsQuery } from './analyticsApi';
import { useGetMarksClassesQuery, useGetMarksSubjectsQuery, useGetMarksAcademicYearsQuery } from '../marks/marksApi';



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

const DATE_RANGES = [
  { id: '30days', name: 'Last 30 Days' },
  { id: 'term', name: 'This Term' },
  { id: '12months', name: 'Last 12 Months' },
  { id: 'custom', name: 'Custom Range' }
];

/* ─────────────────────────────────────────────────────────────────────────────
   COMPREHENSIVE ANALYTICS REDESIGNED PAGE COMPONENT
 ───────────────────────────────────────────────────────────────────────────── */
export default function AnalyticsPage() {
  // 1. Filter States
  const [academicYear, setAcademicYear] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [dateRange, setDateRange] = useState('12months');

  // 2. Control States
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [classSortKey, setClassSortKey] = useState<'rank' | 'attendance' | 'marks'>('rank');
  const [classSortOrder, setClassSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // 3. AI Insights Interaction States
  const [appliedRecommendations, setAppliedRecommendations] = useState<Record<string, boolean>>({});
  const [aiQuery, setAiQuery] = useState('');
  const [aiChatLogs, setAiChatLogs] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // 4. Load core stats from backend (Prisma-seeded values)
  const user = useSelector((s: RootState) => s.auth.user);
  const isAdmin = user?.role === 'SCHOOL_ADMIN' || user?.role === 'SUPER_ADMIN';

  const { isLoading: isKPIsLoading } = useGetAdminKPIsQuery(undefined, { skip: !isAdmin });
  const { data: detailedData } = useGetDetailedAnalyticsQuery(undefined, { skip: !isAdmin });

  // Load dropdown lists from metadata
  const { data: classesData } = useGetMarksClassesQuery();
  const { data: subjectsData } = useGetMarksSubjectsQuery();
  const { data: academicYearsData } = useGetMarksAcademicYearsQuery();

  // Show auto-dismiss toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync default academic year
  React.useEffect(() => {
    if (academicYearsData && academicYearsData.length > 0 && !academicYear) {
      const current = academicYearsData.find((ay: any) => ay.is_current) || academicYearsData[0];
      setAcademicYear(current.id);
    }
  }, [academicYearsData, academicYear]);

  const activeClass = classesData?.find((c: any) => c.id === classFilter);
  const activeClassName = activeClass ? `${activeClass.name} ${activeClass.section}` : '';
  const activeSection = activeClass ? activeClass.section : 'all';
  const activeSubject = subjectsData?.find((s: any) => s.id === subjectFilter);
  const activeSubjectName = activeSubject ? activeSubject.name : '';

  const dashboardData = useMemo(() => {
    const defaultData = {
      totalStudents: 0,
      baseAttendance: 0,
      attendanceTrend: 1.2,
      attendanceTrendDir: 'up',
      baseAcademic: 0,
      academicTrend: 2.1,
      academicTrendDir: 'up',
      baseRisk: 0,
      riskTrend: 15,
      riskTrendDir: 'down',
      teacherPerformance: 92,
      parentEngagement: 84,
      performanceTrend: [],
      subjectComparison: [],
      classComparison: [],
      attendanceTrendData: [],
      heatmapDays: [],
      classExtremes: { best: [], worst: [] },
      riskStudents: [],
      teachersList: [],
      totalAchievements: 0,
      achievementsCategories: [],
      achievementTrend: [],
      parentLoginFrequency: [],
      parentPageViews: [],
      growthScatterPoints: [],
      topImproving: [],
      requiringIntervention: [],
      classPerformanceList: [],
      aiRecommendations: [],
    };

    if (!detailedData) return defaultData;

    // Filter students at risk
    let riskStudents = detailedData.riskStudents || [];
    if (classFilter !== 'all') {
      riskStudents = riskStudents.filter((s: any) => s.class === activeClassName);
    }

    // Filter growth scatter points
    let growthScatterPoints = detailedData.growthScatterPoints || [];
    if (classFilter !== 'all') {
      growthScatterPoints = growthScatterPoints.filter((s: any) => s.class_name === activeClassName);
    }

    // Filter teachers list by department if selected
    let teachersList = detailedData.teachersList || [];
    if (subjectFilter !== 'all' && activeSubjectName) {
      teachersList = teachersList.filter((t: any) =>
        t.subject.toLowerCase().includes(activeSubjectName.toLowerCase().split(' ')[0])
      );
    }

    // Filter class comparisons/performance lists
    let classPerformanceList = detailedData.classPerformanceList || [];
    if (classFilter !== 'all') {
      classPerformanceList = classPerformanceList.filter((c: any) => c.name === activeClassName);
    }

    const totalStudents = classFilter === 'all'
      ? (detailedData.totalStudents ?? 0)
      : (classesData?.find((c: any) => c.id === classFilter)?.capacity || 8);

    const baseAttendance = classFilter === 'all'
      ? (detailedData.baseAttendance ?? 0)
      : (detailedData.classPerformanceList?.find((c: any) => c.name === activeClassName)?.attendance ?? detailedData.baseAttendance);

    const baseAcademic = classFilter === 'all'
      ? (detailedData.baseAcademic ?? 0)
      : (detailedData.classPerformanceList?.find((c: any) => c.name === activeClassName)?.avgMarks ?? detailedData.baseAcademic);

    const baseRisk = riskStudents.length;

    // Build parent engagement frequencies dynamically
    const parentLoginFrequency = detailedData.performanceTrend?.map((pt: any, idx: number) => {
      const mapping: Record<string, number> = { Jun: 620, Jul: 680, Aug: 720, Sep: 800, Oct: 850, Nov: 780, Dec: 520, Jan: 640, Feb: 820, Mar: 890, Apr: 920, May: 450 };
      const val = mapping[pt.month] || 700;
      return {
        month: pt.month,
        'Login Count': Math.round(val * ((detailedData.parentEngagement || 84) / 100)),
      };
    }) || [];

    const parentPageViews = [
      { page: 'Marks', views: Math.round(totalStudents * 45) },
      { page: 'Attendance', views: Math.round(totalStudents * 38) },
      { page: 'Achievements', views: Math.round(totalStudents * 25) },
      { page: 'Gallery', views: Math.round(totalStudents * 18) },
    ];

    return {
      ...detailedData,
      totalStudents,
      baseAttendance,
      baseAcademic,
      baseRisk,
      riskStudents,
      growthScatterPoints,
      teachersList,
      classPerformanceList,
      parentLoginFrequency,
      parentPageViews,
      // Add trend placeholders
      attendanceTrend: 1.2,
      attendanceTrendDir: 'up',
      academicTrend: 2.1,
      academicTrendDir: 'up',
      riskTrend: 15,
      riskTrendDir: 'down',
    };
  }, [detailedData, classFilter, subjectFilter, activeClassName, activeSubjectName, classesData]);

  // 6. Action: PDF & Excel Export Handler
  const handleExport = (format: 'pdf' | 'excel') => {
    setExporting(format);
    
    // Simulate generation delay
    setTimeout(() => {
      setExporting(null);
      if (format === 'excel') {
        // Generate actual CSV download for admin
        const csvContent = [
          ['EduTrack Analytics Report'],
          [`Academic Year: ${academicYear}`],
          [`Filters: Class (${classFilter}), Subject (${subjectFilter})`],
          [''],
          ['Key Metrics', 'Value'],
          ['Total Students', dashboardData.totalStudents],
          ['Average Attendance', `${dashboardData.baseAttendance}%`],
          ['Academic Performance Score', `${dashboardData.baseAcademic}%`],
          ['Students at Risk', dashboardData.baseRisk],
          ['Teacher Performance Score', `${dashboardData.teacherPerformance}%`],
          ['Parent Engagement Score', `${dashboardData.parentEngagement}%`],
          ['']
        ].map(e => e.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `EduTrack_Analytics_${academicYear}_${classFilter}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        triggerToast('📝 Excel CSV file exported successfully!');
      } else {
        // PDF Simulation triggers native window print format
        window.print();
        triggerToast('📋 PDF print view launched!');
      }
    }, 1500);
  };

  // 7. Dynamic Sorting of Class Performance
  const sortedClasses = useMemo(() => {
    const list = [...dashboardData.classPerformanceList];
    list.sort((a, b) => {
      let aVal = 0;
      let bVal = 0;
      if (classSortKey === 'rank') {
        aVal = a.rank;
        bVal = b.rank;
      } else if (classSortKey === 'attendance') {
        aVal = a.attendance;
        bVal = b.attendance;
      } else if (classSortKey === 'marks') {
        aVal = a.avgMarks;
        bVal = b.avgMarks;
      }

      if (classSortOrder === 'asc') {
        return aVal - bVal;
      } else {
        return bVal - aVal;
      }
    });
    return list;
  }, [dashboardData.classPerformanceList, classSortKey, classSortOrder]);

  const handleSortToggle = (key: 'rank' | 'attendance' | 'marks') => {
    if (classSortKey === key) {
      setClassSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setClassSortKey(key);
      setClassSortOrder('desc'); // Default to descending for numbers, ascending for ranks
      if (key === 'rank') setClassSortOrder('asc');
    }
  };

  // 8. AI Chat Helper Form Submit
  const handleAiQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    const query = aiQuery.trim();
    setAiQuery('');
    setAiChatLogs(prev => [...prev, { role: 'user', text: query }]);
    setIsAiLoading(true);

    setTimeout(() => {
      let reply = "I analyzed the data. Let me know if you need specific breakdowns.";
      const q = query.toLowerCase();
      
      if (q.includes('risk') || q.includes('failing') || q.includes('poor')) {
        const atRiskNames = dashboardData.riskStudents?.map((s: any) => `${s.name} (${s.class})`).join(', ');
        reply = `According to our diagnostic growth scatter and attendance heatmap, there are currently ${dashboardData.baseRisk} students flagged at risk. ${atRiskNames ? `The flagged students are: ${atRiskNames}.` : 'No students are currently flagged as high-risk.'} I recommend creating a Parent-Teacher conference alert.`;
      } else if (q.includes('attendance') || q.includes('absent')) {
        const bestCls = dashboardData.classExtremes?.best?.[0];
        const worstCls = dashboardData.classExtremes?.worst?.[0];
        reply = `The overall attendance rate stands at ${dashboardData.baseAttendance}%. ${bestCls ? `${bestCls.name} shows the highest consistency (${bestCls.rate}%), ` : ''}${worstCls ? `whereas ${worstCls.name} requires administrative checks as it is lagging at ${worstCls.rate}%.` : ''}`;
      } else if (q.includes('math') || q.includes('subject')) {
        const mathIndex = dashboardData.subjectComparison?.find((s: any) => s.name.toLowerCase().includes('math'));
        const csIndex = dashboardData.subjectComparison?.find((s: any) => s.name.toLowerCase().includes('computer') || s.name.toLowerCase().includes('cs'));
        reply = `Mathematics is showing a class average of ${mathIndex ? `${mathIndex['Average Marks']}%` : '88%'}. Social Studies and Science also show standard distribution. Computer Science averages stand at ${csIndex ? `${csIndex['Average Marks']}%` : '91.0%'}.`;
      } else if (q.includes('best') || q.includes('top teacher') || q.includes('leader')) {
        reply = `The top performing teachers on our leaderboard this semester are: ${dashboardData.teachersList?.slice(0, 2).map((t: any) => `${t.name} (${t.subject}, student average: ${t.score}%)`).join(', ')}.`;
      } else if (q.includes('recommend') || q.includes('action') || q.includes('do')) {
        reply = `I have actionable recommendations based on the database: ${dashboardData.aiRecommendations?.map((r: any) => `${r.title} (${r.recommendation})`).join('; ') || 'All metrics are currently within stable boundaries.'}`;
      }

      setAiChatLogs(prev => [...prev, { role: 'assistant', text: reply }]);
      setIsAiLoading(false);
    }, 1000);
  };

  // 9. Apply Recommendation Action Handler
  const handleApplyRecommendation = (id: string, text: string) => {
    setAppliedRecommendations(prev => ({ ...prev, [id]: true }));
    triggerToast(`✨ Applied Action: ${text}`);
  };

  if (!isAdmin) {
    return (
      <div className="analytics-dashboard-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <AlertTriangle size={64} color="var(--color-danger)" style={{ marginBottom: 16 }} />
        <h2 style={{ fontSize: 24, marginBottom: 8 }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)' }}>You do not have permission to view the administrative analytics dashboard.</p>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard-page">
      {/* Dynamic Toast System */}
      {toastMessage && (
        <div className="toast-overlay animate-fadeIn">
          <div className="toast-card">
            <Check size={16} color="var(--color-secondary)" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* SECTION 1: HEADER & CONTROL BAR */}
      <div className="dashboard-section-header card border-glow">
        <div className="header-meta-row">
          <div>
            <div className="title-area">
              <span className="sparkle-badge"><Sparkles size={14} className="sparkle-icon" /> AI-Powered</span>
              <h1 className="page-title">Analytics Dashboard</h1>
            </div>
            <p className="page-subtitle">ERP school administration logs, performance indices, and diagnostic insights.</p>
          </div>
          <div className="export-button-group">
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => handleExport('pdf')}
              disabled={exporting !== null}
            >
              {exporting === 'pdf' ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Formatting PDF...</span>
                </>
              ) : (
                <>
                  <FileText size={14} />
                  <span>Export PDF</span>
                </>
              )}
            </button>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => handleExport('excel')}
              disabled={exporting !== null}
            >
              {exporting === 'excel' ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Generating CSV...</span>
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span>Export Excel</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="filters-control-bar">
          <div className="filter-wrapper">
            <label className="filter-label"><Calendar size={12} /> Academic Year</label>
            <select className="form-select select-custom" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
              {academicYearsData?.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>

          <div className="filter-wrapper">
            <label className="filter-label"><School size={12} /> Class</label>
            <select className="form-select select-custom" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
              <option value="all">All Classes</option>
              {classesData?.map((c: any) => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
            </select>
          </div>

          <div className="filter-wrapper">
            <label className="filter-label"><Filter size={12} /> Section</label>
            <select className="form-select select-custom" value={activeSection} disabled>
              <option value="all">All Sections</option>
              {activeClass && <option value={activeClass.section}>Section {activeClass.section}</option>}
            </select>
          </div>

          <div className="filter-wrapper">
            <label className="filter-label"><BookOpen size={12} /> Subject</label>
            <select className="form-select select-custom" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
              <option value="all">All Subjects</option>
              {subjectsData?.map((sb: any) => <option key={sb.id} value={sb.id}>{sb.name}</option>)}
            </select>
          </div>

          <div className="filter-wrapper">
            <label className="filter-label"><Activity size={12} /> Date Range</label>
            <select className="form-select select-custom" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              {DATE_RANGES.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 2: EXECUTIVE KPI CARDS */}
      <div className="stats-grid dashboard-row">
        {/* Total Students Card */}
        <div className="stat-card primary relative-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Total Students</div>
              <div className="stat-card-value">
                {isKPIsLoading ? <span className="skeleton-loader" style={{ width: 80 }} /> : dashboardData.totalStudents}
              </div>
            </div>
            <div className="stat-card-icon primary">
              <Users size={20} />
            </div>
          </div>
          <div className="stat-card-change up">
            <TrendingUp size={12} />
            <span>+8.4% vs last year</span>
          </div>
        </div>

        {/* Attendance Score Card */}
        <div className="stat-card success relative-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Average Attendance</div>
              <div className="stat-card-value">
                {isKPIsLoading ? <span className="skeleton-loader" style={{ width: 80 }} /> : `${dashboardData.baseAttendance}%`}
              </div>
            </div>
            <div className="stat-card-icon success">
              <UserCheck size={20} />
            </div>
          </div>
          <div className={`stat-card-change ${dashboardData.attendanceTrendDir}`}>
            {dashboardData.attendanceTrendDir === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{dashboardData.attendanceTrendDir === 'up' ? '+' : '-'}{dashboardData.attendanceTrend}% vs last term</span>
          </div>
        </div>

        {/* Academic Performance Score Card */}
        <div className="stat-card warning relative-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Academic Score</div>
              <div className="stat-card-value">
                {isKPIsLoading ? <span className="skeleton-loader" style={{ width: 80 }} /> : `${dashboardData.baseAcademic}%`}
              </div>
            </div>
            <div className="stat-card-icon warning">
              <Award size={20} />
            </div>
          </div>
          <div className={`stat-card-change ${dashboardData.academicTrendDir}`}>
            {dashboardData.academicTrendDir === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{dashboardData.academicTrendDir === 'up' ? '+' : '-'}{dashboardData.academicTrend}% vs target</span>
          </div>
        </div>

        {/* Students at Risk Card */}
        <div className="stat-card danger relative-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Students At Risk</div>
              <div className="stat-card-value">
                {isKPIsLoading ? <span className="skeleton-loader" style={{ width: 80 }} /> : dashboardData.baseRisk}
              </div>
            </div>
            <div className="stat-card-icon danger">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className={`stat-card-change ${dashboardData.riskTrendDir === 'down' ? 'up' : 'down'}`}>
            {dashboardData.riskTrendDir === 'down' ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
            <span>{dashboardData.riskTrendDir === 'down' ? '-' : '+'}{dashboardData.riskTrend}% drop this month</span>
          </div>
        </div>

        {/* Teacher Performance Card */}
        <div className="stat-card info relative-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Teacher Performance</div>
              <div className="stat-card-value">
                {isKPIsLoading ? <span className="skeleton-loader" style={{ width: 80 }} /> : `${dashboardData.teacherPerformance}%`}
              </div>
            </div>
            <div className="stat-card-icon info">
              <Star size={20} />
            </div>
          </div>
          <div className="stat-card-change up">
            <TrendingUp size={12} />
            <span>+1.2% benchmark index</span>
          </div>
        </div>

        {/* Parent Engagement Card */}
        <div className="stat-card purple relative-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Parent Engagement</div>
              <div className="stat-card-value">
                {isKPIsLoading ? <span className="skeleton-loader" style={{ width: 80 }} /> : `${dashboardData.parentEngagement}%`}
              </div>
            </div>
            <div className="stat-card-icon purple">
              <MessageSquare size={20} />
            </div>
          </div>
          <div className="stat-card-change up">
            <TrendingUp size={12} />
            <span>+3.4% login activities</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: ACADEMIC PERFORMANCE ANALYTICS */}
      <div className="grid-2 dashboard-row">
        <div className="card">
          <div className="card-header">
            <span className="card-title">📈 School Performance Trend</span>
            <span className="badge badge-primary">Last 12 Months</span>
          </div>
          <div className="card-body">
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData.performanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} domain={[50, 100]} />
                  <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Line type="monotone" dataKey="Average Marks" stroke={THEME_COLORS.primary} strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Pass Percentage" stroke={THEME_COLORS.secondary} strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Performance Index" stroke={THEME_COLORS.warning} strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">📊 Subject Performance Comparison</span>
            <span className="badge badge-primary">Current Semester</span>
          </div>
          <div className="card-body">
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData.subjectComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                  <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar dataKey="Average Marks" fill={THEME_COLORS.primary} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pass Rate" fill={THEME_COLORS.info} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="card dashboard-row">
        <div className="card-header">
          <span className="card-title">🏫 Class Comparison Index</span>
          <span className="badge badge-primary">Class 1 → Class 12 Overview</span>
        </div>
        <div className="card-body">
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.classComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="Average Marks" fill={THEME_COLORS.primary} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Attendance" fill={THEME_COLORS.secondary} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Participation" fill={THEME_COLORS.warning} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 4: ATTENDANCE ANALYTICS */}
      <div className="grid-3 dashboard-row">
        {/* Attendance Trend */}
        <div className="card col-span-2">
          <div className="card-header">
            <span className="card-title">📈 Attendance Rate Trend</span>
            <span className="badge badge-primary">Last 12 Months</span>
          </div>
          <div className="card-body">
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData.attendanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attendanceColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={THEME_COLORS.secondary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={THEME_COLORS.secondary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} domain={[80, 100]} unit="%" />
                  <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="Attendance Rate" stroke={THEME_COLORS.secondary} strokeWidth={2} fillOpacity={1} fill="url(#attendanceColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Best vs Worst attendance */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📊 Class Attendance Extremes</span>
          </div>
          <div className="card-body flex-col-container">
            <div className="extreme-group">
              <span className="group-title text-success">🏆 Top Performing Classes</span>
              {dashboardData.classExtremes.best.map((item, idx) => (
                <div key={item.name} className="extreme-bar-row">
                  <div className="extreme-meta">
                    <span className="rank-bullet">{idx + 1}</span>
                    <span className="class-name">{item.name}</span>
                  </div>
                  <div className="bar-wrapper">
                    <div className="bar bg-success" style={{ width: `${item.rate}%` }} />
                    <span className="bar-value">{item.rate}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="extreme-group" style={{ marginTop: 16 }}>
              <span className="group-title text-danger">⚠️ Requiring Attention</span>
              {dashboardData.classExtremes.worst.map((item, idx) => (
                <div key={item.name} className="extreme-bar-row">
                  <div className="extreme-meta">
                    <span className="rank-bullet bg-danger-sub">{idx + 1}</span>
                    <span className="class-name">{item.name}</span>
                  </div>
                  <div className="bar-wrapper">
                    <div className="bar bg-danger" style={{ width: `${item.rate}%` }} />
                    <span className="bar-value">{item.rate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Heatmap Container */}
      <div className="card dashboard-row">
        <div className="card-header">
          <span className="card-title">📅 Academic Calendar Attendance Heatmap</span>
          <div className="heatmap-legend">
            <span className="legend-item"><span className="box bg-success" /> Present</span>
            <span className="legend-item"><span className="box bg-danger" /> Absent</span>
            <span className="legend-item"><span className="box bg-gray" /> Weekend/Holiday</span>
          </div>
        </div>
        <div className="card-body">
          <div className="heatmap-container">
            <div className="heatmap-grid-layout">
              {dashboardData.heatmapDays.map((day, idx) => (
                <div 
                  key={idx} 
                  className={`heatmap-day-cell ${day.status.toLowerCase()}`}
                  title={`${day.date} (${day.dayName}): ${day.status}`}
                >
                  <span className="tooltip-text">{day.date} - {day.status}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="caption-text">Displaying school day logs for the past 5 weeks of academic calendar activity.</p>
        </div>
      </div>

      {/* SECTION 5: STUDENT RISK ANALYSIS */}
      <div className="grid-3 dashboard-row">
        <div className="card col-span-2">
          <div className="card-header">
            <span className="card-title">🚨 Student Risk Diagnostics</span>
            <span className="badge badge-present">AI-Identified</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container border-none">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Class</th>
                    <th>Attendance %</th>
                    <th>Academic Score</th>
                    <th>Risk Level</th>
                    <th>Risk Factor Description</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.riskStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No at-risk students found matching this class filter.</td>
                    </tr>
                  ) : (
                    dashboardData.riskStudents.map((s) => (
                      <tr key={s.name}>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td>{s.class}</td>
                        <td>
                          <span className={s.attendance < 80 ? 'text-danger font-semibold' : 'font-medium'}>
                            {s.attendance}%
                          </span>
                        </td>
                        <td>
                          <span className={s.academic < 60 ? 'text-danger font-semibold' : 'font-medium'}>
                            {s.academic}%
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${s.risk === 'HIGH' ? 'absent' : s.risk === 'MEDIUM' ? 'late' : 'present'}`}>
                            {s.risk}
                          </span>
                        </td>
                        <td className="risk-reason-cell" title={s.reason}>{s.reason}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* AI Recommendations Panel */}
        <div className="card">
          <div className="card-header bg-gradient-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={16} className="text-primary" />
              <span className="card-title text-glow">AI Risk Advice</span>
            </div>
          </div>
          <div className="card-body">
            <div className="risk-recommendations-list">
              {dashboardData.aiRecommendations.slice(0, 2).map((item) => {
                const isApplied = appliedRecommendations[item.id];
                return (
                  <div key={item.id} className={`recommendation-item-card border-${item.type}`}>
                    <div className="rec-header">
                      <span className="rec-title">{item.title}</span>
                    </div>
                    <p className="rec-description">{item.recommendation}</p>
                    <button 
                      className={`btn btn-sm ${isApplied ? 'btn-ghost text-success' : 'btn-primary'}`}
                      onClick={() => handleApplyRecommendation(item.id, item.actionText)}
                      disabled={isApplied}
                      style={{ marginTop: 8 }}
                    >
                      {isApplied ? (
                        <>
                          <Check size={12} />
                          <span>{item.appliedText}</span>
                        </>
                      ) : (
                        <span>{item.actionText}</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 6: TEACHER ANALYTICS */}
      <div className="grid-3 dashboard-row">
        <div className="card col-span-2">
          <div className="card-header">
            <span className="card-title">👩‍🏫 Teacher Effectiveness Index</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container border-none">
              <table className="table">
                <thead>
                  <tr>
                    <th>Teacher Name</th>
                    <th>Subject Department</th>
                    <th>Avg Student Score</th>
                    <th>Attendance Marked Rate</th>
                    <th>Student Feedback</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.teachersList.map((t) => {
                    const isExcellent = t.score >= 90 && t.feedback >= 4.5;
                    const needsHelp = t.score < 82 || t.feedback < 4.0;
                    return (
                      <tr key={t.name}>
                        <td style={{ fontWeight: 600 }}>{t.name}</td>
                        <td>{t.subject}</td>
                        <td>{t.score}%</td>
                        <td>{t.attendance}%</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Star size={12} fill="var(--color-warning)" stroke="var(--color-warning)" />
                            <span>{t.feedback} / 5.0</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${isExcellent ? 'badge-present' : needsHelp ? 'badge-absent' : 'badge-primary'}`}>
                            {isExcellent ? 'Top Tier' : needsHelp ? 'Needs Help' : 'Stable'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Spotlights Side-by-Side */}
        <div className="teacher-spotlights flex-col-container">
          <div className="card border-glow-success flex-1" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ padding: '12px 16px' }}>
              <span className="card-title text-success" style={{ fontSize: 13 }}>⭐ Top Performing Teacher</span>
            </div>
            <div className="card-body" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <div className="avatar-fallback avatar-md bg-success-sub text-success" style={{ fontSize: 18 }}>ND</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Neha Deshmukh</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Computer Science</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 11, fontWeight: 500 }}>
                  <span className="text-success">Avg Mark: 95.8%</span>
                  <span className="text-warning">★ 4.9 Rating</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-glow-danger flex-1" style={{ display: 'flex', flexDirection: 'column', marginTop: 16 }}>
            <div className="card-header" style={{ padding: '12px 16px' }}>
              <span className="card-title text-danger" style={{ fontSize: 13 }}>⚠️ Teacher Requiring Attention</span>
            </div>
            <div className="card-body" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <div className="avatar-fallback avatar-md bg-danger-sub text-danger" style={{ fontSize: 18 }}>VR</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Vikram Rathore</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Physics Department</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 11, fontWeight: 500 }}>
                  <span className="text-danger">Avg Mark: 78.4%</span>
                  <span className="text-muted">★ 3.8 Rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 7 & 8: ACHIEVEMENT & PARENT ENGAGEMENT */}
      <div className="grid-2 dashboard-row">
        {/* Achievements Categories Pie & Trend */}
        <div className="card">
          <div className="card-header">
            <div>
              <span className="card-title">🏆 Achievement Analytics Breakdown</span>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Total Awarded Achievements: <strong>{dashboardData.totalAchievements}</strong>
              </p>
            </div>
          </div>
          <div className="card-body grid-2-chart" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', alignItems: 'center' }}>
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData.achievementsCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {dashboardData.achievementsCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Achievements`, 'Volume']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="pie-legend-list">
              {dashboardData.achievementsCategories.map((cat) => (
                <div key={cat.name} className="legend-row">
                  <span className="legend-dot" style={{ backgroundColor: cat.color }} />
                  <span className="legend-label">{cat.name}</span>
                  <span className="legend-value">{cat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Parent Engagement Log frequency */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">👨‍👩‍👧 Parent Engagement Insights</span>
            <span className="badge badge-primary">Active rate: 83%</span>
          </div>
          <div className="card-body">
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData.parentLoginFrequency} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="Login Count" stroke={THEME_COLORS.purple} strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 9: STUDENT GROWTH ANALYTICS (Scatter growth matrix & leaderboards) */}
      <div className="grid-3 dashboard-row">
        {/* Growth Matrix */}
        <div className="card col-span-2">
          <div className="card-header">
            <span className="card-title">🎯 Growth Diagnostic Scatter Matrix</span>
            <span className="badge badge-primary">Attendance vs Marks</span>
          </div>
          <div className="card-body">
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 15, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
                  <XAxis type="number" dataKey="attendance" name="Attendance" unit="%" domain={[50, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis type="number" dataKey="marks" name="Marks" unit="%" domain={[30, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <ZAxis range={[50, 60]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                  
                  {/* Grid Quadrant Guides */}
                  <ReferenceLine x={85} stroke={THEME_COLORS.gray} strokeWidth={1} strokeDasharray="5 5" label={{ value: 'Attendance Benchmark (85%)', position: 'top', fill: 'var(--text-muted)', fontSize: 10 }} />
                  <ReferenceLine y={60} stroke={THEME_COLORS.gray} strokeWidth={1} strokeDasharray="5 5" label={{ value: 'Passing Benchmark (60%)', position: 'insideRight', fill: 'var(--text-muted)', fontSize: 10 }} />
                  
                  <Scatter name="Students" data={dashboardData.growthScatterPoints} fill={THEME_COLORS.primary}>
                    {dashboardData.growthScatterPoints.map((entry, index) => {
                      let color = THEME_COLORS.primary;
                      if (entry.quadrant === 'High Attendance / Low Marks') color = THEME_COLORS.warning;
                      else if (entry.quadrant === 'Low Attendance / High Marks') color = THEME_COLORS.info;
                      else if (entry.quadrant === 'Low Attendance / Low Marks') color = THEME_COLORS.danger;
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            {/* Matrix quadrants helper */}
            <div className="quadrants-guide">
              <span className="guide-item text-primary"><span className="box bg-primary" /> High Attendance / High Marks</span>
              <span className="guide-item text-warning"><span className="box bg-warning" /> High Attendance / Low Marks</span>
              <span className="guide-item text-info"><span className="box bg-info" /> Low Attendance / High Marks</span>
              <span className="guide-item text-danger"><span className="box bg-danger" /> Low Attendance / Low Marks</span>
            </div>
          </div>
        </div>

        {/* Improving vs Declining student list */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">⚡ Student Improvement Leaderboards</span>
          </div>
          <div className="card-body flex-col-container text-xs-scroll">
            <div className="extreme-group">
              <span className="group-title text-success">📈 Top Improving Students</span>
              {dashboardData.topImproving.map((item) => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 6, marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.class} (Current: {item.current})</div>
                  </div>
                  <span className="text-success font-semibold" style={{ fontSize: 12 }}>{item.change}</span>
                </div>
              ))}
            </div>

            <div className="extreme-group" style={{ marginTop: 14 }}>
              <span className="group-title text-danger">⚠️ Requiring Intervention</span>
              {dashboardData.requiringIntervention.map((item) => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 6, marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.class} (Current: {item.current})</div>
                  </div>
                  <span className="text-danger font-semibold" style={{ fontSize: 12 }}>{item.change}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 10: CLASS ANALYTICS CARDS (Sorted) */}
      <div className="card dashboard-row">
        <div className="card-header-sorting">
          <div>
            <h2 className="card-title">🏫 Class Performance Logs</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Click headers to sort school sections dynamically.</p>
          </div>
          <div className="sorting-badge-group">
            <button 
              className={`btn btn-secondary btn-xs ${classSortKey === 'rank' ? 'active-sort' : ''}`}
              onClick={() => handleSortToggle('rank')}
            >
              <ArrowUpDown size={12} />
              <span>Rank {classSortKey === 'rank' ? (classSortOrder === 'asc' ? '↑' : '↓') : ''}</span>
            </button>
            <button 
              className={`btn btn-secondary btn-xs ${classSortKey === 'attendance' ? 'active-sort' : ''}`}
              onClick={() => handleSortToggle('attendance')}
            >
              <ArrowUpDown size={12} />
              <span>Attendance {classSortKey === 'attendance' ? (classSortOrder === 'asc' ? '↑' : '↓') : ''}</span>
            </button>
            <button 
              className={`btn btn-secondary btn-xs ${classSortKey === 'marks' ? 'active-sort' : ''}`}
              onClick={() => handleSortToggle('marks')}
            >
              <ArrowUpDown size={12} />
              <span>Average Marks {classSortKey === 'marks' ? (classSortOrder === 'asc' ? '↑' : '↓') : ''}</span>
            </button>
          </div>
        </div>
        <div className="card-body grid-cards-scroller">
          <div className="grid-class-cards">
            {sortedClasses.map((c) => (
              <div key={c.name} className="class-detail-card">
                <div className="class-card-header">
                  <span className="class-title-text">{c.name}</span>
                  <span className={`rank-badge ${c.rank <= 3 ? 'gold' : ''}`}>Rank #{c.rank}</span>
                </div>
                <div className="class-card-metrics">
                  <div className="metric-row">
                    <span className="label">Total Students</span>
                    <span className="val">{c.students}</span>
                  </div>
                  <div className="metric-row">
                    <span className="label">Attendance</span>
                    <span className="val font-semibold" style={{ color: c.attendance < 90 ? 'var(--color-danger)' : 'inherit' }}>
                      {c.attendance}%
                    </span>
                  </div>
                  <div className="metric-row" style={{ borderBottom: 'none' }}>
                    <span className="label">Avg Marks</span>
                    <span className="val font-semibold" style={{ color: c.avgMarks < 70 ? 'var(--color-warning)' : 'inherit' }}>
                      {c.avgMarks}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 11 & 12: TIMELINE FEED & AI PANEL */}
      <div className="grid-3 dashboard-row">
        {/* Real-time activity timeline */}
        <div className="card col-span-2">
          <div className="card-header">
            <span className="card-title">⚡ Real-Time Activity timeline</span>
            <span className="badge badge-leave">Live logs</span>
          </div>
          <div className="card-body">
            <div className="timeline-flow">
              <div className="timeline-item">
                <div className="timeline-bullet bg-secondary-surface text-success">📋</div>
                <div className="timeline-meta">
                  <div className="timeline-action">Attendance marked for Class 5A</div>
                  <div className="timeline-detail">Marked by teacher Priya Sharma — 28 students logged</div>
                </div>
                <div className="timeline-time">5 mins ago</div>
              </div>

              <div className="timeline-item">
                <div className="timeline-bullet bg-primary-surface text-primary">📝</div>
                <div className="timeline-meta">
                  <div className="timeline-action">Mid-Term Mathematics Marks uploaded</div>
                  <div className="timeline-detail">Class 8B exam scores entered by Ramesh Kumar</div>
                </div>
                <div className="timeline-time">15 mins ago</div>
              </div>

              <div className="timeline-item">
                <div className="timeline-bullet bg-warning-surface text-warning">🏆</div>
                <div className="timeline-meta">
                  <div className="timeline-action">Achievement Awarded: Science Fair Gold</div>
                  <div className="timeline-detail">Student Aarav Sharma awarded inter-school prize certificate</div>
                </div>
                <div className="timeline-time">1 hour ago</div>
              </div>

              <div className="timeline-item">
                <div className="timeline-bullet bg-info-surface text-info">👤</div>
                <div className="timeline-meta">
                  <div className="timeline-action">New Admission Student Enrolled</div>
                  <div className="timeline-detail">Aryan Sharma registered in Class 3B class records</div>
                </div>
                <div className="timeline-time">3 hours ago</div>
              </div>

              <div className="timeline-item" style={{ borderLeft: '2px solid transparent' }}>
                <div className="timeline-bullet bg-purple-surface text-purple">🔑</div>
                <div className="timeline-meta">
                  <div className="timeline-action">Parent Login Event Logged</div>
                  <div className="timeline-detail">Parent Rajesh Gupta logged in to review Marks module details</div>
                </div>
                <div className="timeline-time">4 hours ago</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI INSIGHTS ASSISTANT PANEL */}
        <div className="card border-glow-purple">
          <div className="card-header bg-gradient-purple-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} className="text-purple-light" />
              <span className="card-title text-glow-purple">AI Analytics Assistant</span>
            </div>
          </div>
          
          <div className="card-body ai-assistant-body">
            <div className="ai-system-insight-box">
              <span className="box-title">System Synthesis Summary:</span>
              <ul className="ai-summary-bullets">
                <li>Overall school performance increased by <strong>8%</strong> this semester.</li>
                <li>Attendance is strongest in <strong>Grades 5–7</strong>.</li>
                <li>Mathematics remains the weakest subject.</li>
                <li><strong>{dashboardData.baseRisk}</strong> students require academic intervention.</li>
              </ul>
            </div>

            {/* Chat output logs */}
            <div className="ai-chat-history">
              {aiChatLogs.map((log, idx) => (
                <div key={idx} className={`chat-bubble ${log.role}`}>
                  <span className="role-tag">{log.role === 'assistant' ? '🤖 Assistant' : '👤 You'}</span>
                  <p className="bubble-text">{log.text}</p>
                </div>
              ))}
              {isAiLoading && (
                <div className="chat-bubble assistant animate-pulse">
                  <span className="role-tag">🤖 Assistant</span>
                  <p className="bubble-text">Synthesizing school logs data model...</p>
                </div>
              )}
            </div>

            {/* Chat query input */}
            <form onSubmit={handleAiQuerySubmit} className="ai-chat-input-row">
              <input 
                type="text" 
                className="form-input chat-input-custom" 
                placeholder="Ask assistant: 'Who is at risk?' or 'Recommend action'..." 
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                disabled={isAiLoading}
              />
              <button type="submit" className="btn btn-primary btn-chat-send" disabled={isAiLoading}>
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* CUSTOM STYLE INJECTIONS FOR PREMIUM GRAPHICS & SAAS AESTHETICS */}
      <style>{`
        /* Prevent global page content layout blowout */
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

        .analytics-dashboard-page * {
          box-sizing: border-box;
        }

        .analytics-dashboard-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding-bottom: 40px;
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
          min-width: 0;
        }

        .card, .stat-card {
          min-width: 0 !important;
          max-width: 100% !important;
          overflow: hidden !important; /* Force card boundaries to clip overflowing tables/charts */
        }

        .card-body {
          min-width: 0;
          max-width: 100%;
          overflow-x: auto; /* Allow inner horizontal scrolling for wide cards */
        }

        .table-container {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .dashboard-section-header {
          padding: 24px;
        }

        .border-glow {
          border: 1px solid rgba(79, 70, 229, 0.2) !important;
          box-shadow: 0 4px 20px -2px rgba(79, 70, 229, 0.08) !important;
        }

        .border-glow:hover {
          border-color: rgba(79, 70, 229, 0.35) !important;
          box-shadow: 0 8px 30px -2px rgba(79, 70, 229, 0.15) !important;
        }

        .border-glow-purple {
          border: 1px solid rgba(139, 92, 246, 0.2) !important;
          box-shadow: 0 4px 20px -2px rgba(139, 92, 246, 0.08) !important;
        }
        
        .border-glow-purple:hover {
          border-color: rgba(139, 92, 246, 0.4) !important;
          box-shadow: 0 8px 30px -2px rgba(139, 92, 246, 0.18) !important;
        }

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
          animation: spin-pulse 2s infinite ease-in-out;
        }

        @keyframes spin-pulse {
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
          gap: 10px;
        }

        .filters-control-bar {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 16px;
          margin-top: 20px;
          padding-top: 20px;
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

        /* Stat cards details */
        .relative-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .stat-card-change.stable {
          color: var(--color-gray-500);
        }

        .skeleton-loader {
          height: 36px;
          background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%);
          background-size: 200% 100%;
          animation: skeleton-move 1.5s infinite;
          border-radius: var(--radius-sm);
          display: block;
        }

        @keyframes skeleton-move {
          from { background-position: 200% 0; }
          to { background-position: -200% 0; }
        }

        /* Calendar Heatmap styles */
        .heatmap-legend {
          display: flex;
          gap: 14px;
          font-size: 11px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .heatmap-legend .box {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 2px;
          margin-right: 4px;
          vertical-align: middle;
        }

        .heatmap-container {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 8px;
        }

        .heatmap-grid-layout {
          display: grid;
          grid-template-columns: repeat(35, 1fr);
          gap: 4px;
          padding: 4px 0;
          min-width: 680px;
        }

        .heatmap-day-cell {
          aspect-ratio: 1;
          border-radius: 4px;
          cursor: pointer;
          position: relative;
          transition: transform 0.1s ease;
        }

        .heatmap-day-cell:hover {
          transform: scale(1.2);
          z-index: 10;
        }

        .heatmap-day-cell.present { background-color: var(--color-secondary); }
        .heatmap-day-cell.absent { background-color: var(--color-danger); }
        .heatmap-day-cell.holiday { background-color: var(--color-gray-200); }
        [data-theme="dark"] .heatmap-day-cell.holiday { background-color: var(--color-gray-800); }

        .tooltip-text {
          visibility: hidden;
          background-color: var(--color-gray-900);
          color: #fff;
          text-align: center;
          border-radius: 6px;
          padding: 4px 8px;
          position: absolute;
          z-index: 20;
          bottom: 125%;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          font-size: 10px;
          box-shadow: var(--shadow-md);
          opacity: 0;
          transition: opacity 0.15s ease;
        }

        .heatmap-day-cell:hover .tooltip-text {
          visibility: visible;
          opacity: 1;
        }

        .caption-text {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 8px;
        }

        /* Extremes class list */
        .flex-col-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          height: 100%;
        }

        .extreme-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .group-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 4px;
        }

        .extreme-bar-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          font-size: 13px;
        }

        .extreme-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100px;
          flex-shrink: 0;
        }

        .rank-bullet {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background-color: var(--color-secondary-surface);
          color: var(--color-secondary-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
        }

        .rank-bullet.bg-danger-sub {
          background-color: var(--color-danger-surface);
          color: var(--color-danger);
        }

        .class-name {
          font-weight: 600;
        }

        .bar-wrapper {
          flex: 1;
          height: 14px;
          background-color: var(--bg-tertiary);
          border-radius: 99px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
        }

        .bar {
          height: 100%;
          border-radius: 99px;
        }

        .bar.bg-success { background-color: var(--color-secondary); }
        .bar.bg-danger { background-color: var(--color-danger); }

        .bar-value {
          position: absolute;
          right: 8px;
          font-size: 10px;
          font-weight: 700;
          color: var(--text-primary);
          z-index: 2;
        }

        /* Risk recommendations list */
        .risk-recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .recommendation-item-card {
          border-radius: var(--radius-md);
          padding: 12px;
          background: var(--bg-secondary);
          border-left: 4px solid var(--border-color);
        }

        .recommendation-item-card.border-warning { border-left-color: var(--color-warning); }
        .recommendation-item-card.border-danger { border-left-color: var(--color-danger); }
        .recommendation-item-card.border-info { border-left-color: var(--color-info); }

        .rec-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .rec-description {
          font-size: 11px;
          color: var(--text-secondary);
          margin-top: 4px;
          line-height: 1.4;
        }

        .risk-reason-cell {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--text-muted);
          font-size: 12px;
        }

        /* Teacher spotlights */
        .border-glow-success {
          border: 1px solid rgba(16, 185, 129, 0.2) !important;
          box-shadow: 0 4px 15px -2px rgba(16, 185, 129, 0.08) !important;
        }

        .border-glow-danger {
          border: 1px solid rgba(244, 63, 94, 0.2) !important;
          box-shadow: 0 4px 15px -2px rgba(244, 63, 94, 0.08) !important;
        }

        .bg-success-sub {
          background-color: var(--color-secondary-surface) !important;
        }
        
        .bg-danger-sub {
          background-color: var(--color-danger-surface) !important;
        }

        /* Dynamic headers */
        .bg-gradient-header {
          background: linear-gradient(90deg, rgba(79, 70, 229, 0.05) 0%, transparent 100%);
        }

        .bg-gradient-purple-header {
          background: linear-gradient(90deg, rgba(139, 92, 246, 0.08) 0%, transparent 100%);
        }

        .text-glow {
          text-shadow: 0 0 10px rgba(79, 70, 229, 0.2);
        }

        .text-glow-purple {
          text-shadow: 0 0 10px rgba(139, 92, 246, 0.25);
          color: var(--color-primary-light) !important;
        }

        .text-purple-light {
          color: var(--color-primary-light) !important;
        }

        /* Achievements Pie */
        .pie-legend-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .legend-row {
          display: flex;
          align-items: center;
          font-size: 12px;
          gap: 8px;
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

        /* Growth diagnostic scatter matrix guide */
        .quadrants-guide {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-top: 12px;
          flex-wrap: wrap;
          font-size: 11px;
          font-weight: 500;
        }

        .guide-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .guide-item .box {
          width: 10px;
          height: 10px;
          border-radius: 3px;
        }

        .text-xs-scroll {
          overflow-y: auto;
          max-height: 250px;
        }

        /* Class performance grid header & cards */
        .card-header-sorting {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color);
          flex-wrap: wrap;
          gap: 12px;
        }

        .sorting-badge-group {
          display: flex;
          gap: 8px;
        }

        .active-sort {
          background-color: var(--color-primary-surface) !important;
          color: var(--color-primary) !important;
          border-color: rgba(79, 70, 229, 0.25) !important;
          font-weight: 600 !important;
        }

        .grid-cards-scroller {
          overflow-x: auto;
          padding: 20px 24px;
        }

        .grid-class-cards {
          display: flex;
          gap: 16px;
          padding-bottom: 6px;
          min-width: 100%;
        }

        .class-detail-card {
          flex-shrink: 0;
          width: 180px;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: transform 0.15s ease, border-color 0.15s ease;
        }

        .class-detail-card:hover {
          transform: translateY(-2px);
          border-color: var(--color-primary-light);
        }

        .class-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .class-title-text {
          font-weight: 700;
          font-size: 14px;
          color: var(--text-primary);
        }

        .rank-badge {
          font-size: 10px;
          font-weight: 700;
          background-color: var(--color-primary-surface);
          color: var(--color-primary);
          padding: 1px 6px;
          border-radius: var(--radius-sm);
        }

        .rank-badge.gold {
          background-color: #FEF3C7;
          color: #D97706;
        }

        .class-card-metrics {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .class-card-metrics .metric-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          border-bottom: 1px dashed var(--border-color);
          padding-bottom: 4px;
        }

        .class-card-metrics .metric-row .label {
          color: var(--text-muted);
        }
        
        .class-card-metrics .metric-row .val {
          color: var(--text-primary);
        }

        /* Timeline feed */
        .timeline-flow {
          display: flex;
          flex-direction: column;
          position: relative;
          padding-left: 8px;
        }

        .timeline-item {
          display: flex;
          gap: 16px;
          padding-bottom: 16px;
          border-left: 2px solid var(--border-color);
          position: relative;
          padding-left: 20px;
        }

        .timeline-bullet {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          position: absolute;
          left: -15px;
          top: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          box-shadow: var(--shadow-sm);
          z-index: 2;
        }

        .bg-secondary-surface { background-color: var(--color-secondary-surface); }
        .bg-primary-surface { background-color: var(--color-primary-surface); }
        .bg-warning-surface { background-color: var(--color-warning-surface); }
        .bg-danger-surface { background-color: var(--color-danger-surface); }
        .bg-info-surface { background-color: var(--color-info-surface); }
        .bg-purple-surface { background-color: #F3E8FF; }

        .timeline-meta {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .timeline-action {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .timeline-detail {
          font-size: 11px;
          color: var(--text-secondary);
        }

        .timeline-time {
          font-size: 11px;
          color: var(--text-muted);
          flex-shrink: 0;
        }

        /* AI Assistant panel */
        .ai-assistant-body {
          display: flex;
          flex-direction: column;
          height: 330px;
          justify-content: space-between;
          gap: 12px;
        }

        .ai-system-insight-box {
          background-color: var(--bg-secondary);
          border-radius: var(--radius-sm);
          padding: 10px;
          border: 1px solid var(--border-color);
        }

        .ai-system-insight-box .box-title {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .ai-summary-bullets {
          list-style: none;
          padding: 0;
          margin-top: 4px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ai-summary-bullets li {
          font-size: 11px;
          color: var(--text-primary);
          position: relative;
          padding-left: 10px;
        }

        .ai-summary-bullets li::before {
          content: '•';
          color: var(--color-primary);
          position: absolute;
          left: 0;
          font-weight: 700;
        }

        .ai-chat-history {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-right: 4px;
        }

        .chat-bubble {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 8px 10px;
          border-radius: var(--radius-md);
          max-width: 90%;
        }

        .chat-bubble.user {
          background-color: var(--bg-tertiary);
          align-self: flex-end;
          border-bottom-right-radius: 2px;
        }

        .chat-bubble.assistant {
          background-color: var(--color-primary-surface);
          align-self: flex-start;
          border-bottom-left-radius: 2px;
        }
        
        [data-theme="dark"] .chat-bubble.assistant {
          background-color: rgba(79, 70, 229, 0.15);
        }

        .chat-bubble .role-tag {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-muted);
        }

        .chat-bubble .bubble-text {
          font-size: 11px;
          color: var(--text-primary);
          line-height: 1.4;
        }

        .ai-chat-input-row {
          display: flex;
          gap: 8px;
        }

        .chat-input-custom {
          flex: 1;
          font-size: 12px;
          padding: 8px 12px;
        }

        .btn-chat-send {
          padding: 8px 12px;
          flex-shrink: 0;
        }

        /* Toast Popup */
        .toast-overlay {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 1000;
          animation: slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
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

        /* Common details & responsive matrix grid cell overrides */
        .col-span-2 {
          grid-column: span 2;
        }

        .grid-2 > div, .grid-3 > div, .stats-grid > div {
          min-width: 0 !important;
          overflow: hidden !important; /* Prevents nested charts or tables from blowing out grid item widths */
        }

        @media (max-width: 1024px) {
          .col-span-2 {
            grid-column: span 1;
          }
        }

        @media (max-width: 768px) {
          .analytics-dashboard-page {
            gap: 16px;
          }
          
          .dashboard-section-header {
            padding: 16px;
          }
          
          .filters-control-bar {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 16px;
            padding-top: 16px;
          }
          
          .export-button-group {
            width: 100%;
            justify-content: stretch;
            gap: 10px;
          }
          
          .export-button-group button {
            flex: 1;
          }
          
          .header-meta-row {
            flex-direction: column;
            align-items: stretch;
            gap: 14px;
          }
          
          .col-span-2 {
            grid-column: span 1 / span 1 !important;
          }
          
          .ai-assistant-body {
            height: auto;
            max-height: 480px;
          }
          
          .grid-class-cards {
            flex-wrap: nowrap;
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
