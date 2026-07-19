interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarData[];
  height?: number;
  className?: string;
  showValues?: boolean;
}

export default function BarChart({ data, height = 200, className = '', showValues = true }: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(20, Math.min(60, 600 / data.length - 8));

  return (
    <div className={`flex items-end justify-center gap-2 ${className}`} style={{ height }}>
      {data.map((item, i) => {
        const barHeight = (item.value / maxValue) * (height - 20);
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            {showValues && (
              <span className="text-xs text-gray-500 dark:text-gray-400">{item.value}</span>
            )}
            <div
              className="w-full rounded-t-md transition-all hover:opacity-80"
              style={{
                height: barHeight,
                width: barWidth,
                backgroundColor: item.color || '#6366f1',
                minHeight: 4,
              }}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[60px] text-center">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
