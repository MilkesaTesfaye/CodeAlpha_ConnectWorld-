interface PieData {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieData[];
  size?: number;
  className?: string;
  showLegend?: boolean;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export default function PieChart({ data, size = 160, className = '', showLegend = true }: PieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 10;

  let cumulativePercent = 0;

  const slices = data.map((item, i) => {
    const percent = item.value / total;
    const startAngle = cumulativePercent * 360;
    const endAngle = (cumulativePercent + percent) * 360;
    cumulativePercent += percent;

    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArc = percent > 0.5 ? 1 : 0;

    const color = item.color || COLORS[i % COLORS.length];

    return {
      path: `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color,
      label: item.label,
      value: item.value,
      percent: (percent * 100).toFixed(1),
    };
  });

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((slice, i) => (
          <path key={i} d={slice.path} fill={slice.color} className="hover:opacity-80 transition-opacity" />
        ))}
        <circle cx={cx} cy={cy} r={radius * 0.4} fill="white" className="dark:fill-gray-800" />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" className="text-sm font-bold fill-gray-900 dark:fill-white">
          {total}
        </text>
      </svg>
      {showLegend && (
        <div className="flex flex-wrap justify-center gap-3">
          {slices.map((slice, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
              <span>{slice.label}</span>
              <span className="font-medium">{slice.percent}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
