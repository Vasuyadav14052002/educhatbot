// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  TEACHER = 'TEACHER',
  PARENT = 'PARENT',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum SchoolStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  TRIAL = 'TRIAL',
}

export enum SubscriptionPlan {
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export enum AcademicYearStatus {
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TRANSFERRED = 'TRANSFERRED',
  GRADUATED = 'GRADUATED',
  ARCHIVED = 'ARCHIVED',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum RelationshipType {
  FATHER = 'FATHER',
  MOTHER = 'MOTHER',
  GUARDIAN = 'GUARDIAN',
  RELATIVE = 'RELATIVE',
  SELF = 'SELF',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  HALF_DAY = 'HALF_DAY',
  LEAVE = 'LEAVE',
}

export enum ExamType {
  MID_TERM = 'MID_TERM',
  FINAL_TERM = 'FINAL_TERM',
  UNIT_TEST = 'UNIT_TEST',
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL',
}

export enum HomeworkStatus {
  COMPLETED = 'COMPLETED',
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  PARTIALLY_DONE = 'PARTIALLY_DONE',
  EXCUSED = 'EXCUSED',
}

export enum EngagementLevel {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  AVERAGE = 'AVERAGE',
  POOR = 'POOR',
}

export enum ActivityType {
  COMPETITION = 'COMPETITION',
  SPORTS = 'SPORTS',
  ARTS = 'ARTS',
  GROUP_WORK = 'GROUP_WORK',
  CLASS_ACTIVITY = 'CLASS_ACTIVITY',
  EXTRACURRICULAR = 'EXTRACURRICULAR',
}

export enum NotificationType {
  ATTENDANCE_MARKED = 'ATTENDANCE_MARKED',
  MARKS_UPDATED = 'MARKS_UPDATED',
  PROGRESS_UPDATED = 'PROGRESS_UPDATED',
  EVENT_CREATED = 'EVENT_CREATED',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  SYSTEM = 'SYSTEM',
  REMINDER = 'REMINDER',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  BULK_UPDATE = 'BULK_UPDATE',
  EXPORT = 'EXPORT',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  PROMOTION = 'PROMOTION',
  SUSPENSION = 'SUSPENSION',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

export enum PromotionAction {
  PROMOTED = 'PROMOTED',
  RETAINED = 'RETAINED',
  TRANSFERRED = 'TRANSFERRED',
  GRADUATED = 'GRADUATED',
  ARCHIVED = 'ARCHIVED',
}

export enum FileType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  AUDIO = 'AUDIO',
}

export enum ReportType {
  ATTENDANCE = 'ATTENDANCE',
  ACADEMIC = 'ACADEMIC',
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL',
  CUSTOM = 'CUSTOM',
}

export enum ReportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE ENTITY INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

export interface School {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email: string;
  logo_url?: string;
  status: SchoolStatus;
  subscription_plan: SubscriptionPlan;
  subscription_expires_at?: Date;
  timezone: string;
  created_at: Date;
  updated_at: Date;
}

export interface AcademicYear {
  id: string;
  school_id: string;
  name: string;
  start_date: Date;
  end_date: Date;
  is_current: boolean;
  status: AcademicYearStatus;
  created_at: Date;
  terms?: Term[];
}

export interface Term {
  id: string;
  academic_year_id: string;
  name: string;
  start_date: Date;
  end_date: Date;
  is_current: boolean;
}

export interface User {
  id: string;
  school_id?: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  status: UserStatus;
  email_verified: boolean;
  phone_verified: boolean;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Class {
  id: string;
  school_id: string;
  name: string;
  section: string;
  capacity?: number;
  created_at: Date;
}

export interface Subject {
  id: string;
  school_id: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  created_at: Date;
}

export interface Student {
  id: string;
  school_id: string;
  class_id: string;
  student_code: string;
  admission_no: string;
  first_name: string;
  last_name: string;
  full_name: string;
  dob: Date;
  gender: Gender;
  photo_url?: string;
  address?: string;
  blood_group?: string;
  status: StudentStatus;
  joined_date: Date;
  created_at: Date;
  class?: Class;
}

export interface ParentStudentRelation {
  id: string;
  parent_user_id: string;
  student_id: string;
  relationship: RelationshipType;
  is_primary: boolean;
  can_receive_notifications: boolean;
  verified_at?: Date;
  created_at: Date;
  student?: Student;
  parent?: User;
}

export interface Attendance {
  id: string;
  school_id: string;
  student_id: string;
  academic_year_id: string;
  date: Date;
  status: AttendanceStatus;
  remarks?: string;
  marked_by: string;
  marked_at: Date;
  updated_at: Date;
  student?: Student;
}

export interface Exam {
  id: string;
  school_id: string;
  class_id: string;
  academic_year_id: string;
  term_id?: string;
  name: string;
  exam_type: ExamType;
  start_date: Date;
  end_date: Date;
  created_at: Date;
}

export interface Mark {
  id: string;
  school_id: string;
  student_id: string;
  exam_id: string;
  subject_id: string;
  academic_year_id: string;
  term_id?: string;
  score: number;
  max_score: number;
  grade?: string;
  percentage?: number;
  remarks?: string;
  entered_by: string;
  created_at: Date;
  updated_at: Date;
  subject?: Subject;
  exam?: Exam;
}

export interface StudentProgress {
  id: string;
  school_id: string;
  student_id: string;
  subject_id: string;
  academic_year_id: string;
  date: Date;
  performance_score: number;
  teacher_comments?: string;
  homework_status: HomeworkStatus;
  class_engagement: EngagementLevel;
  behavior_notes?: string;
  created_by: string;
  created_at: Date;
  subject?: Subject;
}

export interface Participation {
  id: string;
  school_id: string;
  student_id: string;
  subject_id?: string | null;
  academic_year_id: string;
  date: Date;
  activity_type: ActivityType;
  description: string;
  points: number;
  recorded_by: string;
  created_at: Date;
}

export interface Notification {
  id: string;
  school_id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: Record<string, unknown>;
  is_read: boolean;
  sent_via: string[];
  created_at: Date;
  read_at?: Date;
}

export interface AuditLog {
  id: string;
  school_id?: string;
  user_id?: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  device_info?: string;
  metadata?: Record<string, unknown>;
  created_at: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// API RESPONSE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface JwtPayload {
  sub: string;        // user id
  email: string;
  role: UserRole;
  school_id?: string;
  iat?: number;
  exp?: number;
}

export interface LoginDto {
  email: string;
  password: string;
  device_info?: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  school_id?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI / ANALYTICS TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface AttendanceStats {
  percentage: number;
  present: number;
  absent: number;
  late: number;
  half_day: number;
  leave: number;
  total_days: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  monthly_data: { month: string; year: number; percentage: number }[];
}

export interface SubjectScore {
  subject_id: string;
  subject_name: string;
  subject_code: string;
  score: number;
  max_score: number;
  percentage: number;
  grade: string;
  color?: string;
}

export interface AcademicsStats {
  average_percentage: number;
  grade: string;
  subject_scores: SubjectScore[];
  rank_in_class?: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  term_comparison: { term: string; average: number }[];
}

export interface HomeworkStats {
  completion_rate: number;
  pending: number;
  completed: number;
  partially_done: number;
  excused: number;
}

export interface ParticipationStats {
  total_score: number;
  total_activities: number;
  recent_activities: Participation[];
  activity_type_breakdown: { type: ActivityType; count: number; points: number }[];
}

export interface ParentStudentKPIs {
  student: Student;
  attendance: AttendanceStats;
  academics: AcademicsStats;
  homework: HomeworkStats;
  participation: ParticipationStats;
  behavior_score: number;
  ai_summary?: string;
}

export interface StudentAtRisk {
  student: Student;
  risk_factors: string[];
  attendance_percentage: number;
  average_marks: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface TeacherKPIs {
  students_at_risk: StudentAtRisk[];
  low_attendance_students: { student: Student; percentage: number }[];
  pending_evaluations: number;
  class_averages: { subject: Subject; average: number }[];
  today_marked_attendance: boolean;
  total_students: number;
}

export interface AdminKPIs {
  total_students: number;
  total_teachers: number;
  total_parents: number;
  school_attendance_rate: number;
  teacher_activity_score: number;
  active_users_today: number;
  performance_overview: { class_name: string; section: string; average: number }[];
  recent_activities?: any[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SOCKET.IO EVENT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export enum SocketEvent {
  // Attendance
  ATTENDANCE_UPDATED = 'attendance:updated',
  ATTENDANCE_BULK_UPDATED = 'attendance:bulk_updated',
  // Marks
  MARKS_UPDATED = 'marks:updated',
  // Progress
  PROGRESS_UPDATED = 'progress:updated',
  // Notifications
  NOTIFICATION_NEW = 'notification:new',
  NOTIFICATION_READ = 'notification:read',
  // System
  ROOM_JOIN = 'room:join',
  ROOM_LEAVE = 'room:leave',
}

export interface SocketAttendancePayload {
  school_id: string;
  student_id: string;
  date: string;
  status: AttendanceStatus;
  student_name: string;
}

export interface SocketMarksPayload {
  school_id: string;
  student_id: string;
  subject_name: string;
  score: number;
  max_score: number;
  exam_name: string;
}
