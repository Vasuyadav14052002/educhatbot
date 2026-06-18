import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  school_id?: string;
  avatar_url?: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_code: string;
  admission_no: string;
  photo_url?: string;
  class?: { id: string; name: string; section: string };
  blood_group?: string;
  medical_conditions?: string;
  allergies?: string;
  emergency_contact?: string;
}

interface AuthState {
  user: User | null;
  access_token: string | null;
  refresh_token: string | null;
  is_authenticated: boolean;
  selected_student: Student | null;
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('edutrack_user') || 'null'),
  access_token: localStorage.getItem('edutrack_token'),
  refresh_token: localStorage.getItem('edutrack_refresh_token'),
  is_authenticated: !!localStorage.getItem('edutrack_token'),
  selected_student: JSON.parse(localStorage.getItem('edutrack_selected_student') || 'null'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: User; access_token: string; refresh_token: string }>) {
      state.user = action.payload.user;
      state.access_token = action.payload.access_token;
      state.refresh_token = action.payload.refresh_token;
      state.is_authenticated = true;
      localStorage.setItem('edutrack_token', action.payload.access_token);
      localStorage.setItem('edutrack_refresh_token', action.payload.refresh_token);
      localStorage.setItem('edutrack_user', JSON.stringify(action.payload.user));
    },
    setSelectedStudent(state, action: PayloadAction<Student | null>) {
      state.selected_student = action.payload;
      if (action.payload) {
        localStorage.setItem('edutrack_selected_student', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('edutrack_selected_student');
      }
    },
    updateTokens(state, action: PayloadAction<{ access_token: string; refresh_token: string }>) {
      state.access_token = action.payload.access_token;
      state.refresh_token = action.payload.refresh_token;
      localStorage.setItem('edutrack_token', action.payload.access_token);
      localStorage.setItem('edutrack_refresh_token', action.payload.refresh_token);
    },
    logout(state) {
      state.user = null;
      state.access_token = null;
      state.refresh_token = null;
      state.is_authenticated = false;
      state.selected_student = null;
      localStorage.removeItem('edutrack_token');
      localStorage.removeItem('edutrack_refresh_token');
      localStorage.removeItem('edutrack_user');
      localStorage.removeItem('edutrack_selected_student');
    },
  },
});

export const { setCredentials, setSelectedStudent, updateTokens, logout } = authSlice.actions;
export default authSlice.reducer;
