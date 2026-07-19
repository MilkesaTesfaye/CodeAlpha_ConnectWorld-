import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface NotificationsState {
  items: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

export const fetchNotifications = createAsyncThunk('notifications/fetchAll', async () => {
  const { data } = await api.get('/notifications');
  return data.data as Notification[];
});

export const markAsRead = createAsyncThunk('notifications/markRead', async (id: string) => {
  await api.patch(`/notifications/${id}/read`);
  return id;
});

export const markAllAsRead = createAsyncThunk('notifications/markAllRead', async () => {
  await api.patch('/notifications/read-all');
});

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification(state, action: PayloadAction<Notification>) {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    },
    clearNotifications(state) {
      state.items = [];
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.items = action.payload;
        state.unreadCount = action.payload.filter((n) => !n.read).length;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const n = state.items.find((item) => item.id === action.payload);
        if (n && !n.read) {
          n.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.items.forEach((n) => { n.read = true; });
        state.unreadCount = 0;
      });
  },
});

export const { addNotification, clearNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer;
