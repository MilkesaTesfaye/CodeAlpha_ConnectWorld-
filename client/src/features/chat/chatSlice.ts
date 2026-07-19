import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ChatMessage } from '../../types/meeting';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<ChatMessage>) {
      state.messages.push(action.payload);
    },
    setMessages(state, action: PayloadAction<ChatMessage[]>) {
      state.messages = action.payload;
    },
    clearMessages(state) {
      state.messages = [];
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    deleteMessage(state, action: PayloadAction<string>) {
      state.messages = state.messages.filter((m) => m.id !== action.payload);
    },
  },
});

export const { addMessage, setMessages, clearMessages, setLoading, deleteMessage } = chatSlice.actions;
export default chatSlice.reducer;
