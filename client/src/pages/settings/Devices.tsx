import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../../services/api';
import type { Device } from '../../types/user';

const DEVICE_ICONS: Record<string, string> = {
  DESKTOP: '💻',
  MOBILE: '📱',
  TABLET: '📟',
  UNKNOWN: '🖥️',
};

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const { data: res } = await api.get('/users/devices');
      setDevices(res.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTrust = async (deviceId: string, isTrusted: boolean) => {
    try {
      await api.patch(`/users/devices/${deviceId}/trust`, { deviceId, isTrusted: !isTrusted });
      setDevices((prev) =>
        prev.map((d) => (d.id === deviceId ? { ...d, isTrusted: !isTrusted } : d))
      );
      toast.success(isTrusted ? 'Device untrusted' : 'Device trusted');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const removeDevice = async (deviceId: string) => {
    if (!window.confirm('Remove this device? All sessions will be signed out.')) return;
    try {
      await api.delete(`/users/devices/${deviceId}`);
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
      toast.success('Device removed');
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

  return (
    <div className="max-w-2xl mx-auto">
      <section className="p-6 rounded-2xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900">
        <h3 className="font-semibold text-dark-900 dark:text-white text-lg mb-1">Connected Devices</h3>
        <p className="text-sm text-dark-500 dark:text-dark-400 mb-6">
          Devices that have accessed your account. You can trust or remove devices.
        </p>

        {devices.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl mb-4 block">📱</span>
            <p className="text-dark-500 dark:text-dark-400">No devices found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-dark-200 dark:border-dark-700 hover:border-dark-300 dark:hover:border-dark-600 transition-colors"
              >
                <span className="text-2xl">{DEVICE_ICONS[device.type] || DEVICE_ICONS.UNKNOWN}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark-900 dark:text-white truncate">
                    {device.name || 'Unknown device'}
                  </p>
                  <p className="text-xs text-dark-500 dark:text-dark-400">
                    {[device.os, device.browser].filter(Boolean).join(' · ')}
                    {device.ipAddress && ` · ${device.ipAddress}`}
                  </p>
                  <p className="text-xs text-dark-400 mt-0.5">
                    Last used: {new Date(device.lastUsedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                      device.isTrusted
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-dark-100 dark:bg-dark-800 text-dark-600 dark:text-dark-400'
                    }`}
                  >
                    {device.isTrusted ? 'Trusted' : 'Untrusted'}
                  </span>
                  <button
                    onClick={() => toggleTrust(device.id, device.isTrusted)}
                    className="px-3 py-1.5 text-xs font-medium text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                  >
                    {device.isTrusted ? 'Untrust' : 'Trust'}
                  </button>
                  <button
                    onClick={() => removeDevice(device.id)}
                    className="px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
