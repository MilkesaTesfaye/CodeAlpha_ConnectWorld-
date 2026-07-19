import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

interface DashboardStats {
  totalMeetings: number;
  upcomingMeetings: number;
  completedMeetings: number;
  totalParticipants: number;
  averageDuration: number;
  meetingsByDay: Array<{ date: string; count: number }>;
  meetingsByStatus: Array<{ status: string; count: number }>;
}

interface DashboardState {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  stats: null,
  isLoading: false,
  error: null,
};

export const fetchDashboardStats = createAsyncThunk('dashboard/fetchStats', async () => {
  const { data } = await api.get('/dashboard/stats');
  return data.data as DashboardStats;
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load dashboard';
      });
  },
});

export default dashboardSlice.reducer;
