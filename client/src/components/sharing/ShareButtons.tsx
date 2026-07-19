import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

export type ShareTheme = 'dark' | 'light';
export type ShareSize = 'sm' | 'md' | 'lg';

interface ShareButtonsProps {
  meetingId: string;
  theme?: ShareTheme;
  size?: ShareSize;
  showHeading?: boolean;
  showQR?: boolean;
  className?: string;
  qrSize?: number;
}

const sizeStyles: Record<ShareSize, { btn: string; icon: string; text: string }> = {
  sm: { btn: 'px-3 py-1.5 text-xs', icon: 'w-3.5 h-3.5', text: 'text-xs' },
  md: { btn: 'px-4 py-2 text-sm', icon: 'w-4 h-4', text: 'text-sm' },
  lg: { btn: 'px-5 py-2.5 text-sm', icon: 'w-4 h-4', text: 'text-sm' },
};

export default function ShareButtons({
  meetingId,
  theme = 'dark',
  size = 'lg',
  showHeading = true,
  showQR = true,
  className = '',
  qrSize = 160,
}: ShareButtonsProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const meetingUrl = `${window.location.origin}/meetings/${meetingId}`;
  const s = sizeStyles[size];

  // Generate QR code
  useEffect(() => {
    if (!showQR) return;
    QRCode.toDataURL(meetingUrl, {
      width: qrSize,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [meetingUrl, qrSize, showQR]);

  // Determine color scheme
  const isDark = theme === 'dark';
  const primaryBtn = isDark
    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
    : 'bg-indigo-600 hover:bg-indigo-500 text-white';
  const secondaryBtn = isDark
    ? `border border-gray-600 text-gray-300 hover:bg-gray-800`
    : `border border-gray-300 text-gray-600 hover:bg-gray-50`;
  const labelText = isDark ? 'text-gray-500' : 'text-gray-400';

  const platformBtn = (color: string) =>
    isDark
      ? `w-10 h-10 rounded-full ${color} flex items-center justify-center transition-colors shadow-lg`
      : `w-8 h-8 rounded-full ${color} flex items-center justify-center transition-colors`;
  const platformIcon = isDark ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Row 1: Copy Invite + native share / platform fallback */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Share Invite button */}
        <button
          onClick={() => {
            const text = `Join my meeting on ConnectWorld!\n\n📋 Meeting Code: ${meetingId}\n🔗 Link: ${meetingUrl}`;
            navigator.clipboard.writeText(text);
            toast.success('Invite copied to clipboard!');
          }}
          className={`${primaryBtn} ${s.btn} rounded-lg font-medium transition-colors inline-flex items-center gap-1.5`}
        >
          <svg className={s.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Copy Invite
        </button>

        {/* Copy Code button */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(meetingId);
            toast.success('Code copied!');
          }}
          className={`${secondaryBtn} ${s.btn} rounded-lg font-medium transition-colors inline-flex items-center gap-1.5 ${s.text}`}
        >
          <svg className={s.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          Copy Code
        </button>

        {/* Copy Link button */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(meetingUrl);
            toast.success('Link copied!');
          }}
          className={`${secondaryBtn} ${s.btn} rounded-lg font-medium transition-colors inline-flex items-center gap-1.5 ${s.text}`}
        >
          <svg className={s.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Copy Link
        </button>

        {/* Native Share (when available) */}
        {typeof navigator.share === 'function' && (
          <button
            onClick={async () => {
              try {
                await navigator.share({
                  title: 'Join my meeting on ConnectWorld',
                  text: `Join my meeting on ConnectWorld!\n\n📋 Meeting Code: ${meetingId}`,
                  url: meetingUrl,
                });
              } catch { /* user cancelled */ }
            }}
            className={`${secondaryBtn} ${s.btn} rounded-lg font-medium transition-colors inline-flex items-center gap-1.5 ${s.text}`}
            title="Share via system dialog"
          >
            <svg className={s.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share via...
          </button>
        )}
      </div>

      {/* Direct share fallback for non-Web Share API browsers */}
      {typeof navigator.share !== 'function' && (
        <div className="flex flex-wrap items-center gap-2">
          {showHeading && <span className={`${s.text} ${labelText}`}>Share via</span>}

          {/* WhatsApp */}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `Join my meeting on ConnectWorld!\n\n📋 Meeting Code: ${meetingId}\n🔗 ${meetingUrl}`
            )}`}
            target="_blank" rel="noopener noreferrer"
            className={platformBtn('bg-green-500 hover:bg-green-400')}
            title="Share via WhatsApp"
          >
            <svg className={`${platformIcon} text-white`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </a>

          {/* Telegram */}
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(meetingUrl)}&text=${encodeURIComponent(`Join my meeting on ConnectWorld! 📋 Code: ${meetingId}`)}`}
            target="_blank" rel="noopener noreferrer"
            className={platformBtn('bg-sky-500 hover:bg-sky-400')}
            title="Share via Telegram"
          >
            <svg className={`${platformIcon} text-white`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
          </a>

          {/* SMS */}
          <a
            href={`sms:?&body=${encodeURIComponent(
              `Join my meeting on ConnectWorld!\n📋 Code: ${meetingId}\n🔗 ${meetingUrl}`
            )}`}
            className={platformBtn('bg-blue-500 hover:bg-blue-400')}
            title="Share via SMS"
          >
            <svg className={`${platformIcon} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </a>
        </div>
      )}

      {/* QR Code */}
      {showQR && qrDataUrl && (
        <div className="flex flex-col items-center pt-1">
          <div className={`bg-white rounded-xl shadow-lg ${isDark ? 'shadow-black/20' : 'shadow-gray-200'} p-2`}>
            <img
              src={qrDataUrl}
              alt="QR code to join meeting"
              style={{ width: qrSize * 0.8, height: qrSize * 0.8 }}
            />
          </div>
          <p className={`text-xs mt-2 ${labelText}`}>Scan to join meeting</p>
        </div>
      )}
    </div>
  );
}
