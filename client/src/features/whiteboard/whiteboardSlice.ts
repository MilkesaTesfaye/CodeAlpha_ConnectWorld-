import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { WhiteboardObject } from '../../types/meeting';

interface WhiteboardState {
  objects: WhiteboardObject[];
  selectedId: string | null;
  activeTool: 'select' | 'draw' | 'text' | 'shape' | 'eraser';
  strokeColor: string;
  strokeWidth: number;
  currentLayer: number;
}

const initialState: WhiteboardState = {
  objects: [],
  selectedId: null,
  activeTool: 'select',
  strokeColor: '#6366f1',
  strokeWidth: 2,
  currentLayer: 0,
};

const whiteboardSlice = createSlice({
  name: 'whiteboard',
  initialState,
  reducers: {
    addObject(state, action: PayloadAction<WhiteboardObject>) {
      state.objects.push(action.payload);
    },
    updateObject(state, action: PayloadAction<Partial<WhiteboardObject> & { id: string }>) {
      const idx = state.objects.findIndex((o) => o.id === action.payload.id);
      if (idx >= 0) state.objects[idx] = { ...state.objects[idx], ...action.payload };
    },
    deleteObject(state, action: PayloadAction<string>) {
      state.objects = state.objects.filter((o) => o.id !== action.payload);
    },
    clearBoard(state) {
      state.objects = [];
    },
    setSelectedTool(state, action: PayloadAction<WhiteboardState['activeTool']>) {
      state.activeTool = action.payload;
    },
    setStrokeColor(state, action: PayloadAction<string>) {
      state.strokeColor = action.payload;
    },
    setStrokeWidth(state, action: PayloadAction<number>) {
      state.strokeWidth = action.payload;
    },
  },
});

export const {
  addObject, updateObject, deleteObject, clearBoard,
  setSelectedTool, setStrokeColor, setStrokeWidth,
} = whiteboardSlice.actions;
export default whiteboardSlice.reducer;
