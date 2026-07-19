import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import type { User, UserSettings } from '../../types/user';

interface ProfileState {
  profile: User | null;
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  profile: null,
  settings: null,
  isLoading: false,
  error: null,
};

export const updateProfile = createAsyncThunk(
  'profile/update',
  async (input: Partial<User>) => {
    const { data } = await api.patch('/auth/profile', input);
    return data.data as User;
  }
);

export const fetchSettings = createAsyncThunk('profile/fetchSettings', async () => {
  const { data } = await api.get('/auth/settings');
  return data.data as UserSettings;
});

export const updateSettings = createAsyncThunk(
  'profile/updateSettings',
  async (input: Partial<UserSettings>) => {
    const { data } = await api.patch('/auth/settings', input);
    return data.data as UserSettings;
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(updateProfile.fulfilled, (state, action) => { state.profile = action.payload; })
      .addCase(fetchSettings.fulfilled, (state, action) => { state.settings = action.payload; })
      .addCase(updateSettings.fulfilled, (state, action) => { state.settings = action.payload; });
  },
});

export default profileSlice.reducer;
