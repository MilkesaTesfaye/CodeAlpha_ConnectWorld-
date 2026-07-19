import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import type { Meeting, CreateMeetingInput, UpdateMeetingInput } from '../../types/meeting';

interface MeetingsState {
  meetings: Meeting[];
  currentMeeting: Meeting | null;
  history: Meeting[];
  isLoading: boolean;
  error: string | null;
}

const initialState: MeetingsState = {
  meetings: [],
  currentMeeting: null,
  history: [],
  isLoading: false,
  error: null,
};

export const fetchMeetings = createAsyncThunk('meetings/fetchAll', async () => {
  const { data } = await api.get('/meetings');
  return data.data as Meeting[];
});

export const fetchMeetingById = createAsyncThunk('meetings/fetchById', async (id: string) => {
  const { data } = await api.get(`/meetings/${id}`);
  return data.data as Meeting;
});

export const createMeeting = createAsyncThunk('meetings/create', async (input: CreateMeetingInput) => {
  const { data } = await api.post('/meetings', input);
  return data.data as Meeting;
});

export const updateMeeting = createAsyncThunk(
  'meetings/update',
  async ({ id, input }: { id: string; input: UpdateMeetingInput }) => {
    const { data } = await api.patch(`/meetings/${id}`, input);
    return data.data as Meeting;
  }
);

export const deleteMeeting = createAsyncThunk('meetings/delete', async (id: string) => {
  await api.delete(`/meetings/${id}`);
  return id;
});

const meetingsSlice = createSlice({
  name: 'meetings',
  initialState,
  reducers: {
    clearCurrentMeeting(state) {
      state.currentMeeting = null;
    },
    setMeetings(state, action: PayloadAction<Meeting[]>) {
      state.meetings = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMeetings.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchMeetings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.meetings = action.payload;
      })
      .addCase(fetchMeetings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch meetings';
      })
      .addCase(fetchMeetingById.fulfilled, (state, action) => {
        state.currentMeeting = action.payload;
      })
      .addCase(createMeeting.fulfilled, (state, action) => {
        state.meetings.unshift(action.payload);
        state.currentMeeting = action.payload;
      })
      .addCase(updateMeeting.fulfilled, (state, action) => {
        const idx = state.meetings.findIndex((m) => m.id === action.payload.id);
        if (idx >= 0) state.meetings[idx] = action.payload;
        if (state.currentMeeting?.id === action.payload.id) {
          state.currentMeeting = action.payload;
        }
      })
      .addCase(deleteMeeting.fulfilled, (state, action) => {
        state.meetings = state.meetings.filter((m) => m.id !== action.payload);
        if (state.currentMeeting?.id === action.payload) state.currentMeeting = null;
      });
  },
});

export const { clearCurrentMeeting, setMeetings } = meetingsSlice.actions;
export default meetingsSlice.reducer;
