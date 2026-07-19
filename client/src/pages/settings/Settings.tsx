import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../../services/api';
import { useTheme } from '../../components/theme/ThemeProvider';
import type { UserSettings } from '../../types/user';

export default function SettingsPage() {
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: res } = await api.get('/users/settings');
      setSettings(res.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSetting = async (key: string, value: boolean) => {
    if (!settings) return;
    setIsSaving(true);
    try {
      const { data: res } = await api.put('/users/settings', { [key]: value });
      setSettings(res.data);
      toast.success('Setting updated');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const updateTheme = async (newTheme: string) => {
    // Apply the theme locally first (instant visual feedback)
    setTheme(newTheme as 'light' | 'dark' | 'system');
    // Save to backend
    try {
      const { data: res } = await api.put('/users/settings', { theme: newTheme });
      setSettings(res.data);
      toast.success('Theme updated');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  const toggles: Array<{ key: keyof UserSettings; label: string; description: string }> = [
    { key: 'emailNotifications', label: 'Email notifications', description: 'Receive email updates about meetings and activity' },
    { key: 'pushNotifications', label: 'Push notifications', description: 'Get push notifications on your device' },
    { key: 'desktopNotifications', label: 'Desktop notifications', description: 'Show desktop notifications' },
    { key: 'meetingReminders', label: 'Meeting reminders', description: 'Get reminded before scheduled meetings' },
    { key: 'messagePreview', label: 'Message previews', description: 'Show message content in notifications' },
    { key: 'showOnlineStatus', label: 'Show online status', description: 'Let others see when you are online' },
    { key: 'showLastSeen', label: 'Show last seen', description: 'Let others see when you were last active' },
    { key: 'autoJoinAudio', label: 'Auto-join audio', description: 'Automatically connect audio when joining a meeting' },
    { key: 'autoJoinVideo', label: 'Auto-join video', description: 'Automatically enable video when joining a meeting' },
    { key: 'blurBackground', label: 'Blur background', description: 'Blur your background in meetings by default' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Theme */}
      <section className="p-6 rounded-2xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900">
        <h3 className="font-semibold text-dark-900 dark:text-white text-lg mb-4">Appearance</h3>
        <div className="flex gap-3">
          {['light', 'dark', 'system'].map((theme) => (
            <button
              key={theme}
              onClick={() => updateTheme(theme)}
              className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                settings?.theme === theme
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-dark-200 dark:border-dark-700 text-dark-600 dark:text-dark-400 hover:border-dark-300 dark:hover:border-dark-600'
              }`}
            >
              <div className="text-xl mb-1">
                {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '💻'}
              </div>
              <div className="capitalize">{theme}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section className="p-6 rounded-2xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900">
        <h3 className="font-semibold text-dark-900 dark:text-white text-lg mb-4">Notifications</h3>
        <div className="space-y-4">
          {toggles.slice(0, 5).map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-dark-900 dark:text-white">{label}</p>
                <p className="text-xs text-dark-500 dark:text-dark-400">{description}</p>
              </div>
              <button
                onClick={() => toggleSetting(key as string, !settings?.[key])}
                disabled={isSaving}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings?.[key] ? 'bg-primary-500' : 'bg-dark-300 dark:bg-dark-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings?.[key] ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section className="p-6 rounded-2xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900">
        <h3 className="font-semibold text-dark-900 dark:text-white text-lg mb-4">Privacy</h3>
        <div className="space-y-4">
          {toggles.slice(5, 7).map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-dark-900 dark:text-white">{label}</p>
                <p className="text-xs text-dark-500 dark:text-dark-400">{description}</p>
              </div>
              <button
                onClick={() => toggleSetting(key as string, !settings?.[key])}
                disabled={isSaving}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings?.[key] ? 'bg-primary-500' : 'bg-dark-300 dark:bg-dark-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings?.[key] ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Meeting Preferences */}
      <section className="p-6 rounded-2xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900">
        <h3 className="font-semibold text-dark-900 dark:text-white text-lg mb-4">Meeting Preferences</h3>
        <div className="space-y-4">
          {toggles.slice(7).map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-dark-900 dark:text-white">{label}</p>
                <p className="text-xs text-dark-500 dark:text-dark-400">{description}</p>
              </div>
              <button
                onClick={() => toggleSetting(key as string, !settings?.[key])}
                disabled={isSaving}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings?.[key] ? 'bg-primary-500' : 'bg-dark-300 dark:bg-dark-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings?.[key] ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
