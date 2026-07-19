import { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../app/store';
import { addMessage, setMessages } from '../../features/chat/chatSlice';
import { getSocket } from '../../services/socket';
import api from '../../services/api';
import type { ChatMessage } from '../../types/meeting';

interface ChatSidebarProps {
  meetingId: string;
  isOpen: boolean;
  onClose: () => void;
}

const EMOJI_LIST = ['😀', '😂', '❤️', '👍', '🎉', '🙌', '🔥', '🚀', '💡', '✅', '⭐', '👋'];

export default function ChatSidebar({ meetingId, isOpen, onClose }: ChatSidebarProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { messages } = useSelector((state: RootState) => state.chat);
  const { user } = useSelector((state: RootState) => state.auth);

  const [text, setText] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [showEmoji, setShowEmoji] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Load message history via API
  useEffect(() => {
    if (!isOpen || !meetingId) return;

    async function loadHistory() {
      setIsLoading(true);
      try {
        const { data } = await api.get(`/chat/messages/${meetingId}`);
        if (data.data && Array.isArray(data.data)) {
          dispatch(setMessages(data.data as ChatMessage[]));
        }
      } catch {
        // History loading failed silently
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, [isOpen, meetingId, dispatch]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Socket listeners for real-time messages
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleMessage = (msg: ChatMessage) => {
      dispatch(addMessage(msg));
    };

    const handleTyping = (data: { userId: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (data.isTyping) {
          next.add(data.userId);
        } else {
          next.delete(data.userId);
        }
        return next;
      });
    };

    socket.on('chat_message', handleMessage);
    socket.on('typing', handleTyping);

    return () => {
      socket.off('chat_message', handleMessage);
      socket.off('typing', handleTyping);
    };
  }, [dispatch]);

  function sendMessage() {
    const trimmed = text.trim();
    if (!trimmed || !user) return;

    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('chat_message', {
        meetingId,
        message: {
          content: trimmed,
          senderId: user.id,
          sender: {
            id: user.id,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
          },
          messageType: 'TEXT',
          createdAt: new Date().toISOString(),
        },
      });
    }

    setText('');
    setShowEmoji(false);

    // Stop typing indicator
    socket?.emit('typing', { meetingId, isTyping: false });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setText(e.target.value);

    // Typing indicator
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('typing', { meetingId, isTyping: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { meetingId, isTyping: false });
      }, 2000);
    }
  }

  function insertEmoji(emoji: string) {
    setText((prev) => prev + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div
      className={`h-full bg-gray-900/95 backdrop-blur-md border-l border-gray-800 flex flex-col transition-all duration-300 ${
        isOpen ? 'w-80' : 'w-0 overflow-hidden'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Meeting Chat
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-400" />
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-2xl mb-2">💬</div>
            <p className="text-gray-500 text-xs">No messages yet. Start the conversation!</p>
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.senderId === user?.id;
          return (
            <div key={msg.id || msg.createdAt} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                  isOwn
                    ? 'bg-indigo-600 text-white rounded-tr-md'
                    : 'bg-gray-800 text-gray-200 rounded-tl-md'
                }`}
              >
                {!isOwn && (
                  <p className="text-xs font-medium text-indigo-400 mb-0.5">
                    {msg.sender?.displayName || 'Unknown'}
                  </p>
                )}
                <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                <p className={`text-[10px] mt-0.5 text-right ${isOwn ? 'text-indigo-300' : 'text-gray-500'}`}>
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.size > 0 && (
        <div className="px-4 py-1">
          <p className="text-xs text-gray-500 italic">
            {typingUsers.size === 1 ? 'Someone is typing...' : `${typingUsers.size} people typing...`}
          </p>
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <div className="px-3 py-2 border-t border-gray-800">
          <div className="flex flex-wrap gap-1.5">
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                onClick={() => insertEmoji(emoji)}
                className="p-1.5 hover:bg-gray-700 rounded-lg text-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors shrink-0"
            title="Emoji"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800 text-white placeholder-gray-500 rounded-xl px-3.5 py-2 text-sm 
                     border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            maxLength={2000}
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim()}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed 
                     text-white transition-colors shrink-0"
            title="Send message"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 19V5m0 0l-7 7m7-7l7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
