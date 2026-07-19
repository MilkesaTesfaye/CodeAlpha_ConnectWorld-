import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface VideoTrack {
  userId: string;
  streamId: string;
  enabled: boolean;
  isLocal: boolean;
}

interface VideoState {
  tracks: VideoTrack[];
  isRecording: boolean;
}

const initialState: VideoState = {
  tracks: [],
  isRecording: false,
};

const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    addTrack(state, action: PayloadAction<VideoTrack>) {
      const exists = state.tracks.find((t) => t.userId === action.payload.userId);
      if (!exists) state.tracks.push(action.payload);
    },
    removeTrack(state, action: PayloadAction<string>) {
      state.tracks = state.tracks.filter((t) => t.userId !== action.payload);
    },
    toggleTrack(state, action: PayloadAction<{ userId: string; enabled: boolean }>) {
      const track = state.tracks.find((t) => t.userId === action.payload.userId);
      if (track) track.enabled = action.payload.enabled;
    },
    setRecording(state, action: PayloadAction<boolean>) {
      state.isRecording = action.payload;
    },
    clearTracks(state) {
      state.tracks = [];
    },
  },
});

export const { addTrack, removeTrack, toggleTrack, setRecording, clearTracks } = videoSlice.actions;
export default videoSlice.reducer;
