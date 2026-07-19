import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

interface SharedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedBy: string;
  meetingId: string;
  createdAt: string;
}

interface FilesState {
  files: SharedFile[];
  isLoading: boolean;
  error: string | null;
}

const initialState: FilesState = {
  files: [],
  isLoading: false,
  error: null,
};

export const fetchFiles = createAsyncThunk('files/fetchAll', async (meetingId: string) => {
  const { data } = await api.get(`/meetings/${meetingId}/files`);
  return data.data as SharedFile[];
});

export const deleteFile = createAsyncThunk('files/delete', async (fileId: string) => {
  await api.delete(`/files/${fileId}`);
  return fileId;
});

const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    addFile(state, action: PayloadAction<SharedFile>) {
      state.files.push(action.payload);
    },
    clearFiles(state) {
      state.files = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFiles.fulfilled, (state, action) => { state.files = action.payload; })
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.files = state.files.filter((f) => f.id !== action.payload);
      });
  },
});

export const { addFile, clearFiles } = filesSlice.actions;
export default filesSlice.reducer;
