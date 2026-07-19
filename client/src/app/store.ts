import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import meetingsReducer from '../features/meetings/meetingsSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import notificationsReducer from '../features/notifications/notificationsSlice';
import chatReducer from '../features/chat/chatSlice';
import adminReducer from '../features/admin/adminSlice';
import filesReducer from '../features/files/filesSlice';
import profileReducer from '../features/profile/profileSlice';
import screenShareReducer from '../features/screenShare/screenShareSlice';
import videoReducer from '../features/video/videoSlice';
import whiteboardReducer from '../features/whiteboard/whiteboardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    meetings: meetingsReducer,
    dashboard: dashboardReducer,
    notifications: notificationsReducer,
    chat: chatReducer,
    admin: adminReducer,
    files: filesReducer,
    profile: profileReducer,
    screenShare: screenShareReducer,
    video: videoReducer,
    whiteboard: whiteboardReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setUser'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
