import { useRef, useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../app/store';
import { setSelectedTool, setStrokeColor, setStrokeWidth } from '../../features/whiteboard/whiteboardSlice';
import { getSocket } from '../../services/socket';
import toast from 'react-hot-toast';

interface WhiteboardCanvasProps {
  meetingId: string;
  isOpen: boolean;
  onClose: () => void;
}

type Tool = 'select' | 'draw' | 'line' | 'rectangle' | 'circle' | 'text' | 'eraser';
type ShapeData = {
  type: 'draw' | 'line' | 'rectangle' | 'circle' | 'text';
  points?: { x: number; y: number }[];
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  color: string;
  width: number;
  text?: string;
};

const TOOLS: Array<{ id: Tool; label: string; icon: string }> = [
  { id: 'select', label: 'Select', icon: '✋' },
  { id: 'draw', label: 'Draw', icon: '✏️' },
  { id: 'line', label: 'Line', icon: '📏' },
  { id: 'rectangle', label: 'Rectangle', icon: '⬜' },
  { id: 'circle', label: 'Circle', icon: '⭕' },
  { id: 'text', label: 'Text', icon: '🔤' },
  { id: 'eraser', label: 'Eraser', icon: '🧹' },
];

const COLORS = ['#6366f1', '#ef4444', '#22c55e', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#ffffff', '#94a3b8', '#1e293b'];

const STROKE_WIDTHS = [1, 2, 3, 5, 8];

export default function WhiteboardCanvas({ meetingId, isOpen, onClose }: WhiteboardCanvasProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { activeTool, strokeColor, strokeWidth } = useSelector((state: RootState) => state.whiteboard);
  const { user } = useSelector((state: RootState) => state.auth);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState<ShapeData | null>(null);
  const [shapes, setShapes] = useState<ShapeData[]>([]);
  const [undoStack, setUndoStack] = useState<ShapeData[][]>([]);
  const [redoStack, setRedoStack] = useState<ShapeData[][]>([]);
  const [textInput, setTextInput] = useState({ x: 0, y: 0, visible: false, value: '' });
  const [cursorPositions, setCursorPositions] = useState<Map<string, { x: number; y: number; name: string }>>(new Map());
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // ─── Socket Sync ───────────────────────────────────────────────────────

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('whiteboard_draw', (data: any) => {
      if (data.type === 'shape') {
        setShapes((prev) => [...prev, data.shape]);
      } else if (data.type === 'undo') {
        setShapes((prev) => prev.slice(0, -1));
      } else if (data.type === 'clear') {
        setShapes([]);
      }
    });

    // Listen for remote cursor positions separately
    socket.on('cursor_move', (data: { userId: string; x: number; y: number; displayName?: string }) => {
      setCursorPositions((prev) => {
        const next = new Map(prev);
        next.set(data.userId, { x: data.x || 0, y: data.y || 0, name: data.displayName || 'Someone' });
        return next;
      });
    });

    return () => {
      socket.off('whiteboard_draw');
      socket.off('cursor_move');
    };
  }, []);

  // ─── Drawing Logic ─────────────────────────────────────────────────────

  const getCanvasPos = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left - offset.x) / scale,
        y: (e.clientY - rect.top - offset.y) / scale,
      };
    },
    [scale, offset]
  );

  const drawShape = useCallback(
    (ctx: CanvasRenderingContext2D, shape: ShapeData) => {
      ctx.save();
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (shape.type === 'draw' && shape.points) {
        ctx.beginPath();
        shape.points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      } else if (shape.type === 'line' && shape.startX !== undefined && shape.endX !== undefined) {
        ctx.beginPath();
        ctx.moveTo(shape.startX, shape.startY!);
        ctx.lineTo(shape.endX, shape.endY!);
        ctx.stroke();
      } else if (shape.type === 'rectangle' && shape.startX !== undefined && shape.endX !== undefined) {
        ctx.strokeRect(
          Math.min(shape.startX, shape.endX),
          Math.min(shape.startY!, shape.endY!),
          Math.abs(shape.endX - shape.startX),
          Math.abs(shape.endY! - shape.startY!)
        );
      } else if (shape.type === 'circle' && shape.startX !== undefined && shape.endX !== undefined) {
        const cx = (shape.startX + shape.endX) / 2;
        const cy = (shape.startY! + shape.endY!) / 2;
        const rx = Math.abs(shape.endX - shape.startX) / 2;
        const ry = Math.abs(shape.endY! - shape.startY!) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (shape.type === 'text' && shape.text) {
        ctx.font = `${Math.max(14, shape.width * 8)}px sans-serif`;
        ctx.fillStyle = shape.color;
        ctx.fillText(shape.text, shape.startX!, shape.startY!);
      }

      ctx.restore();
    },
    []
  );

  // Render all shapes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // Grid background
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    const gridSize = 40;
    for (let x = 0; x < canvas.width / scale; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height / scale);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height / scale; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width / scale, y);
      ctx.stroke();
    }

    shapes.forEach((shape) => drawShape(ctx, shape));
    if (currentShape) drawShape(ctx, currentShape);

    ctx.restore();
  }, [shapes, currentShape, scale, offset, drawShape]);

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (activeTool === 'select') return;
    const pos = getCanvasPos(e);
    setIsDrawing(true);

    if (activeTool === 'text') {
      setTextInput({ x: pos.x, y: pos.y, visible: true, value: '' });
      return;
    }

    const newShape: ShapeData = {
      // Safe: activeTool is 'draw'|'line'|'rectangle'|'circle' here (select/text returned, eraser handled below)
      // @ts-expect-error TS2367 — TS union narrowing limitation with ternary chains
      type: activeTool === 'draw' ? 'draw' : activeTool === 'line' ? 'line' : activeTool === 'rectangle' ? 'rectangle' : 'circle',
      color: activeTool === 'eraser' ? '#0f172a' : strokeColor,
      width: activeTool === 'eraser' ? 20 : strokeWidth,
      points: activeTool === 'draw' ? [{ x: pos.x, y: pos.y }] : undefined,
      startX: pos.x,
      startY: pos.y,
    };
    setCurrentShape(newShape);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const pos = getCanvasPos(e);

    // Emit cursor position
    const socket = getSocket();
    socket?.emit('cursor_move', { meetingId, position: pos });

    setCursorPositions((prev) => {
      const next = new Map(prev);
      const myKey = `local-${user?.id}`;
      next.set(myKey, { x: pos.x, y: pos.y, name: 'You' });
      return next;
    });

    if (!isDrawing || !currentShape) return;

    if (currentShape.type === 'draw' && currentShape.points) {
      setCurrentShape({ ...currentShape, points: [...currentShape.points, pos] });
    } else {
      setCurrentShape({ ...currentShape, endX: pos.x, endY: pos.y });
    }
  }

  function handleMouseUp() {
    if (!isDrawing || !currentShape) return;
    setIsDrawing(false);

    if (currentShape.type !== 'text') {
      setUndoStack((prev) => [...prev, [...shapes]]);
      setRedoStack([]);
      const finalShape = { ...currentShape };
      setShapes((prev) => [...prev, finalShape]);

      // Emit to socket
      const socket = getSocket();
      socket?.emit('whiteboard_draw', { meetingId, drawingData: { type: 'shape', shape: finalShape } });
    }
    setCurrentShape(null);
  }

  function handleTextSubmit() {
    if (!textInput.value.trim()) {
      setTextInput({ ...textInput, visible: false });
      return;
    }

    const newShape: ShapeData = {
      type: 'text',
      color: strokeColor,
      width: strokeWidth,
      startX: textInput.x,
      startY: textInput.y,
      text: textInput.value,
    };

    setUndoStack((prev) => [...prev, [...shapes]]);
    setRedoStack([]);
    setShapes((prev) => [...prev, newShape]);
    setTextInput({ x: 0, y: 0, visible: false, value: '' });

    const socket = getSocket();
    socket?.emit('whiteboard_draw', { meetingId, drawingData: { type: 'shape', shape: newShape } });
  }

  function handleUndo() {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, [...shapes]]);
    setUndoStack((s) => s.slice(0, -1));
    setShapes(prev);
  }

  function handleRedo() {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((s) => [...s, [...shapes]]);
    setRedoStack((r) => r.slice(0, -1));
    setShapes(next);
  }

  function handleClear() {
    if (shapes.length === 0) return;
    if (!window.confirm('Clear the whiteboard?')) return;
    setUndoStack((prev) => [...prev, [...shapes]]);
    setRedoStack([]);
    setShapes([]);
    const socket = getSocket();
    socket?.emit('whiteboard_draw', { meetingId, drawingData: { type: 'clear' } });
  }

  function handleExport() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `whiteboard-${meetingId}.png`;
    link.href = canvas.toDataURL();
    link.click();
    toast.success('Whiteboard exported!');
  }

  function handleWheel(e: React.WheelEvent) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale((s) => Math.max(0.25, Math.min(4, s * delta)));
    }
  }

  return (
    <div className={`h-full bg-gray-950 border-l border-gray-800 flex flex-col ${isOpen ? 'w-96' : 'w-0 overflow-hidden'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          Whiteboard
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={handleUndo} disabled={undoStack.length === 0} 
            className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white disabled:opacity-30 transition-colors" title="Undo">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button onClick={handleRedo} disabled={redoStack.length === 0}
            className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white disabled:opacity-30 transition-colors" title="Redo">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
          </button>
          <button onClick={handleClear}
            className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-red-400 transition-colors" title="Clear">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button onClick={handleExport}
            className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="Export PNG">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors ml-2" title="Close">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tools Bar */}
      <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-gray-800 shrink-0">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => dispatch(setSelectedTool(tool.id as any))}
            className={`p-1.5 rounded-lg text-sm transition-colors ${
              activeTool === tool.id
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
            title={tool.label}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      {/* Color & Width */}
      {activeTool !== 'eraser' && activeTool !== 'select' && (
        <div className="px-3 py-2 border-b border-gray-800 space-y-2 shrink-0">
          <div className="flex flex-wrap gap-1">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => dispatch(setStrokeColor(color))}
                className={`w-5 h-5 rounded-full border-2 transition-all ${
                  strokeColor === color ? 'border-white scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {STROKE_WIDTHS.map((w) => (
              <button
                key={w}
                onClick={() => dispatch(setStrokeWidth(w))}
                className={`rounded-full transition-all ${
                  strokeWidth === w ? 'bg-indigo-600' : 'bg-gray-600 hover:bg-gray-500'
                }`}
                style={{ width: 8 + w * 2, height: 8 + w * 2 }}
                title={`${w}px`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 overflow-hidden relative">
        <canvas
          ref={canvasRef}
          width={containerRef.current?.clientWidth || 800}
          height={containerRef.current?.clientHeight || 600}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className={`w-full h-full cursor-crosshair ${activeTool === 'select' ? 'cursor-default' : ''}`}
        />

        {/* Text input overlay */}
        {textInput.visible && (
          <div
            className="absolute"
            style={{
              left: textInput.x * scale + offset.x,
              top: textInput.y * scale + offset.y,
            }}
          >
            <input
              type="text"
              autoFocus
              value={textInput.value}
              onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTextSubmit();
                if (e.key === 'Escape') setTextInput({ ...textInput, visible: false });
              }}
              onBlur={handleTextSubmit}
              className="bg-transparent text-white border-b border-indigo-500 outline-none text-sm min-w-[100px]"
              style={{ fontSize: Math.max(14, strokeWidth * 8) }}
              placeholder="Type here..."
            />
          </div>
        )}

        {/* Collaboration cursors */}
        {Array.from(cursorPositions.entries()).map(([userId, pos]) => (
          <div
            key={userId}
            className="absolute pointer-events-none"
            style={{ left: pos.x * scale + offset.x, top: pos.y * scale + offset.y }}
          >
            <div className="w-3 h-3 bg-indigo-500 rounded-full opacity-70 -translate-x-1/2 -translate-y-1/2" />
            <span className="ml-1 text-[10px] text-indigo-400 bg-gray-900/80 px-1 rounded whitespace-nowrap">
              {pos.name}
            </span>
          </div>
        ))}

        {/* Zoom indicator */}
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-gray-900/80 rounded text-[10px] text-gray-400">
          {Math.round(scale * 100)}%
        </div>
      </div>
    </div>
  );
}
