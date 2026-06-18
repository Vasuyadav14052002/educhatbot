export interface TeacherSummary {
  id: string;
  name: string;
  photoUrl: string;
  qualification: string;
  experienceYears: number;
  syllabusCompleted: number;
}

export interface TeacherSkill {
  id: string;
  skill_name: string;
  category: 'pedagogical' | 'technical' | 'language' | 'other';
  proficiency_level: 'beginner' | 'intermediate' | 'expert';
}

export interface TeacherAward {
  id: string;
  title: string;
  description: string | null;
  awarded_by: string;
  awarded_date: string;
  academic_year: string;
}

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  photoUrl: string;
  bio: string | null;
  qualification: string;
  experienceYears: number;
  joinedDate: string;
  skills: TeacherSkill[];
  awards: TeacherAward[];
  leavesTaken: number;
  syllabusCompleted: number;
  classesAssigned: { id: string; name: string }[];
}
