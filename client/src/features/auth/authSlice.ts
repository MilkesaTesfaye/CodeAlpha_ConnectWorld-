import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { User, RegisterInput, LoginInput, VerifyEmailInput, ForgotPasswordInput, ResetPasswordInput } from '../../types/user';
import api from '../../services/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,
  error: null,
};

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const login = createAsyncThunk('auth/login', async (input: LoginInput) => {
  const { data } = await api.post('/auth/login', input);
  if (data.success && data.data) return data.data;
  throw new Error(data.message || 'Login failed');
});

export const register = createAsyncThunk('auth/register', async (input: RegisterInput) => {
  const { data } = await api.post('/auth/register', input);
  if (data.success && data.data) return data.data;
  throw new Error(data.message || 'Registration failed');
});

export const fetchCurrentUser = createAsyncThunk('auth/fetchCurrentUser', async () => {
  const { data } = await api.get('/auth/me');
  return data.data as User;
});

export const verifyEmail = createAsyncThunk('auth/verifyEmail', async (input: VerifyEmailInput) => {
  const { data } = await api.post('/auth/verify-email', input);
  return data;
});

export const forgotPassword = createAsyncThunk('auth/forgotPassword', async (input: ForgotPasswordInput) => {
  const { data } = await api.post('/auth/forgot-password', input);
  return data;
});

export const resetPassword = createAsyncThunk('auth/resetPassword', async (input: ResetPasswordInput) => {
  const { data } = await api.post('/auth/reset-password', input);
  return data;
});

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  try { await api.post('/auth/logout'); } catch { /* ignore */ }
  localStorage.removeItem('accessToken');
});

// ─── Slice ───────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<{ user: User; accessToken: string }>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      state.error = null;
      localStorage.setItem('accessToken', action.payload.accessToken);
    },
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) state.user = { ...state.user, ...action.payload };
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('accessToken');
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        localStorage.setItem('accessToken', action.payload.accessToken);
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Login failed';
      })
      // Register
      .addCase(register.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        localStorage.setItem('accessToken', action.payload.accessToken);
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Registration failed';
      })
      // Fetch current user
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        localStorage.removeItem('accessToken');
      })
      // Logout
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { setUser, updateUser, logout, setLoading, setError, clearError } = authSlice.actions;
export default authSlice.reducer;
