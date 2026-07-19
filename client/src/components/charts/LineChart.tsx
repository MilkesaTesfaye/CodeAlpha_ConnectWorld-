interface LineDataPoint {
  x: number | string;
  y: number;
}

interface LineChartProps {
  data: LineDataPoint[];
  height?: number;
  width?: number;
  color?: string;
  className?: string;
  showGrid?: boolean;
}

export default function LineChart({
  data,
  height = 200,
  width = 400,
  color = '#6366f1',
  className = '',
  showGrid = true,
}: LineChartProps) {
  if (data.length < 2) return null;

  const values = data.map((d) => d.y);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  const padding = { top: 10, right: 10, bottom: 20, left: 30 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const stepX = chartW / (data.length - 1);

  const points = data.map((d, i) => ({
    x: padding.left + i * stepX,
    y: padding.top + chartH - ((d.y - minVal) / range) * chartH,
    label: d.x,
    value: d.y,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Y-axis grid lines
  const gridLines = 4;
  const gridValues = Array.from({ length: gridLines + 1 }, (_, i) =>
    Math.round(minVal + (range * i) / gridLines)
  );

  return (
    <svg width={width} height={height} className={className}>
      {/* Grid */}
      {showGrid &&
        gridValues.map((val, i) => {
          const y = padding.top + chartH - ((val - minVal) / range) * chartH;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#e5e7eb"
                className="dark:stroke-gray-700"
                strokeWidth={1}
              />
              <text x={padding.left - 6} y={y + 4} textAnchor="end" className="text-[10px] fill-gray-400">
                {val}
              </text>
            </g>
          );
        })}

      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} stroke="white" strokeWidth={2} className="hover:r-5 transition-all" />
      ))}
    </svg>
  );
}
