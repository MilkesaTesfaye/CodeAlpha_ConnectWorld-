import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import api, { getErrorMessage } from '../../services/api';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100).optional(),
  lastName: z.string().min(1, 'Last name is required').max(100).optional(),
  displayName: z.string().min(1, 'Display name is required').max(100).optional(),
  bio: z.string().max(500, 'Bio must be under 500 characters').optional().nullable(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, updateProfile: updateProfileRedux } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      displayName: user?.displayName || '',
      bio: user?.bio || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      const { data: res } = await api.put('/users/profile', data);
      updateProfileRedux(res.data);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data: res } = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateProfileRedux(res.data);
      toast.success('Avatar updated!');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Avatar Section */}
      <div className="flex items-center gap-6 p-6 rounded-2xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900">
        <div className="relative">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {user?.displayName?.charAt(0)?.toUpperCase() || user?.email.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-dark-900 dark:text-white mb-1">Profile photo</h3>
          <p className="text-sm text-dark-500 dark:text-dark-400 mb-3">JPEG, PNG, or WebP. Max 5MB.</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={isUploading}
              className="px-4 py-2 text-sm font-medium bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white rounded-lg transition-colors"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
            {user?.avatarUrl && (
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                onClick={async () => {
                  try {
                    await api.put('/users/profile', { avatarUrl: null });                      updateProfileRedux({ avatarUrl: null });
                    toast.success('Avatar removed');
                  } catch (error) {
                    toast.error(getErrorMessage(error));
                  }
                }}
              >
                Remove
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6 rounded-2xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900">
        <h3 className="font-semibold text-dark-900 dark:text-white text-lg">Profile Information</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">First name</label>
            <input id="firstName" {...register('firstName')} className="w-full px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-dark-900 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
            {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>}
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Last name</label>
            <input id="lastName" {...register('lastName')} className="w-full px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-dark-900 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
            {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Display name</label>
          <input id="displayName" {...register('displayName')} className="w-full px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-dark-900 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
          {errors.displayName && <p className="mt-1 text-sm text-red-500">{errors.displayName.message}</p>}
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Bio</label>
          <textarea
            id="bio"
            {...register('bio')}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-dark-900 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
            placeholder="Tell us a bit about yourself..."
          />
          {errors.bio && <p className="mt-1 text-sm text-red-500">{errors.bio.message}</p>}
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-dark-400">
            Email: <span className="text-dark-600 dark:text-dark-300">{user?.email}</span>
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="px-4 py-2 text-sm font-medium text-dark-600 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-medium rounded-lg transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </form>

      {/* Email Verification Status */}
      {!user?.isEmailVerified && (
        <div className="p-4 rounded-2xl border border-yellow-200 dark:border-yellow-900/30 bg-yellow-50 dark:bg-yellow-900/10">
          <div className="flex items-center gap-3">
            <span className="text-yellow-500 text-xl">⚠️</span>
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Email not verified</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">Verify your email to access all features.</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  await api.post('/auth/resend-verification', { email: user?.email });
                  toast.success('Verification email sent!');
                } catch (error) {
                  toast.error(getErrorMessage(error));
                }
              }}
              className="ml-auto px-4 py-1.5 text-sm font-medium bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
            >
              Resend
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
