import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

interface AdminStats {
  totalUsers: number;
  activeMeetings: number;
  totalMeetings: number;
  storageUsed: number;
  recentActivity: Array<{ id: string; type: string; userId: string; createdAt: string }>;
}

interface AdminState {
  stats: AdminStats | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  stats: null,
  isLoading: false,
  error: null,
};

/**
 * Maps the raw API response to the AdminStats interface expected by the component.
 * The server returns different field names and shapes than what the UI expects.
 */
function mapApiResponseToStats(raw: Record<string, unknown>): AdminStats {
  // Recent meetings from the API need to be mapped to activity entries
  const recentMeetings = (raw.recentMeetings as Array<Record<string, unknown>>) || [];
  const recentActivity = recentMeetings.map((m) => ({
    id: String(m.id || ''),
    type: `meeting_${String(m.status || 'created')}`,
    userId: String((m.host as Record<string, unknown>)?.id || ''),
    createdAt: String(m.createdAt || new Date().toISOString()),
  }));

  return {
    totalUsers: Number(raw.totalUsers) || 0,
    activeMeetings: Number(raw.activeMeetings) || 0,
    totalMeetings: Number(raw.totalMeetings) || 0,
    storageUsed: Number(raw.totalFiles) > 0 ? Number(raw.totalFiles) * 5 * 1024 * 1024 : 0, // estimate ~5MB per file
    recentActivity,
  };
}

export const fetchAdminStats = createAsyncThunk('admin/fetchStats', async () => {
  const response = await api.get('/admin/dashboard');
  const raw = response.data?.data || {};
  return mapApiResponseToStats(raw);
});

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminStats.pending, (state) => { state.isLoading = true; })
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchAdminStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load admin stats';
      });
  },
});

export default adminSlice.reducer;
