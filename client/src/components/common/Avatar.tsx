interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  status?: 'online' | 'offline' | 'busy' | 'away' | null;
  ring?: boolean;
}

const sizeStyles = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-14 h-14 text-lg',
  '2xl': 'w-20 h-20 text-2xl',
};

const colorPalette = [
  'bg-gradient-to-br from-indigo-400 to-indigo-600 text-white',
  'bg-gradient-to-br from-purple-400 to-purple-600 text-white',
  'bg-gradient-to-br from-pink-400 to-pink-600 text-white',
  'bg-gradient-to-br from-blue-400 to-blue-600 text-white',
  'bg-gradient-to-br from-green-400 to-teal-600 text-white',
  'bg-gradient-to-br from-amber-400 to-orange-600 text-white',
  'bg-gradient-to-br from-rose-400 to-red-600 text-white',
  'bg-gradient-to-br from-cyan-400 to-neon-500 text-white',
  'bg-gradient-to-br from-violet-400 to-brand-600 text-white',
];

const statusDotStyles = {
  online: 'bg-green-500',
  offline: 'bg-dark-400',
  busy: 'bg-red-500',
  away: 'bg-amber-500',
};

const statusSizeStyles = {
  sm: 'w-1.5 h-1.5 right-0 bottom-0',
  md: 'w-2 h-2 right-0 bottom-0',
  lg: 'w-2.5 h-2.5 right-0 bottom-0',
  xl: 'w-3 h-3 right-0.5 bottom-0.5',
  '2xl': 'w-4 h-4 right-0.5 bottom-0.5',
};

function getGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colorPalette[Math.abs(hash) % colorPalette.length];
}

export default function Avatar({ src, name, size = 'md', className = '', status, ring = false }: AvatarProps) {
  const initial = (name || '?').charAt(0).toUpperCase();
  const gradientClass = getGradient(name || '?');

  return (
    <div className={`relative shrink-0 ${ring ? 'ring-2 ring-primary-200 dark:ring-primary-800 rounded-full' : ''}`}>
      <div
        className={`relative rounded-full flex items-center justify-center font-semibold overflow-hidden shadow-sm ${
          sizeStyles[size]
        } ${src ? '' : gradientClass} ${className}`}
      >
        {src ? (
          <img src={src} alt="" className="w-full h-full object-cover" />
        ) : (
          <span>{initial}</span>
        )}
      </div>
      {status && (
        <span
          className={`absolute rounded-full border-2 border-white dark:border-dark-900 ${
            statusDotStyles[status]
          } ${statusSizeStyles[size]}`}
        />
      )}
    </div>
  );
}
