import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ScreenShareState {
  isSharing: boolean;
  sharedBy: string | null;
  streamId: string | null;
}

const initialState: ScreenShareState = {
  isSharing: false,
  sharedBy: null,
  streamId: null,
};

const screenShareSlice = createSlice({
  name: 'screenShare',
  initialState,
  reducers: {
    startScreenShare(state, action: PayloadAction<{ userId: string; streamId: string }>) {
      state.isSharing = true;
      state.sharedBy = action.payload.userId;
      state.streamId = action.payload.streamId;
    },
    stopScreenShare(state) {
      state.isSharing = false;
      state.sharedBy = null;
      state.streamId = null;
    },
  },
});

export const { startScreenShare, stopScreenShare } = screenShareSlice.actions;
export default screenShareSlice.reducer;
