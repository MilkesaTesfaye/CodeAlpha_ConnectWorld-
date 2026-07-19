import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getErrorMessage } from '../../services/api';
import type { CreateMeetingInput, MeetingType } from '../../types/meeting';
import toast from 'react-hot-toast';

export default function CreateMeeting() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [meetingType, setMeetingType] = useState<MeetingType>('instant');
  const [form, setForm] = useState({
    title: '',
    description: '',
    password: '',
    maxParticipants: 100,
    hasWaitingRoom: true,
    scheduledAt: '',
    scheduledTime: '',
    recordingEnabled: false,
    isRecurring: false,
    recurringRule: '',
  });

  function handleChange(field: string, value: string | boolean | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: CreateMeetingInput = {
        title: form.title,
        description: form.description || null,
        meetingType,
        password: form.password || null,
        maxParticipants: form.maxParticipants,
        hasWaitingRoom: form.hasWaitingRoom,
        recordingEnabled: form.recordingEnabled,
        isRecurring: form.isRecurring,
        recurringRule: form.recurringRule || null,
      };

      // For scheduled meetings, combine date and time
      if (meetingType === 'scheduled' && form.scheduledAt) {
        const dateTime = form.scheduledTime
          ? `${form.scheduledAt}T${form.scheduledTime}:00.000Z`
          : `${form.scheduledAt}T12:00:00.000Z`;
        payload.scheduledAt = new Date(dateTime).toISOString();
      }

      const { data } = await api.post('/meetings', payload);
      if (data.success) {
        toast.success(meetingType === 'instant' ? 'Meeting created! Share the code to invite others' : 'Meeting scheduled');
        navigate(`/meetings?highlight=${data.data.meetingId}`);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/meetings')}
            className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 
                     hover:text-gray-700 dark:hover:text-gray-200 mb-4 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Meetings
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create a Meeting</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Start an instant meeting or schedule one for later
          </p>
        </div>

        {/* Meeting Type Selector */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { type: 'instant' as MeetingType, label: 'Instant', desc: 'Start now', icon: '🚀' },
            { type: 'scheduled' as MeetingType, label: 'Schedule', desc: 'Plan ahead', icon: '📅' },
            { type: 'recurring' as MeetingType, label: 'Recurring', desc: 'Repeat weekly', icon: '🔄' },
          ].map((option) => (
            <button
              key={option.type}
              type="button"
              onClick={() => setMeetingType(option.type)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                meetingType === option.type
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="text-2xl mb-1">{option.icon}</div>
              <div className={`font-semibold text-sm ${
                meetingType === option.type
                  ? 'text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {option.label}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{option.desc}</div>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
          {/* Title */}
          <div>
            <label htmlFor="meetingTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Meeting Title <span className="text-red-500">*</span>
            </label>
            <input
              id="meetingTitle"
              type="text"
              required
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g. Weekly Standup, Client Call, Team Brainstorm"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       placeholder-gray-400 dark:placeholder-gray-500
                       focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="meetingDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="meetingDescription"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="What's this meeting about?"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       placeholder-gray-400 dark:placeholder-gray-500
                       focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              maxLength={1000}
            />
          </div>

          {/* Scheduled Date/Time (only for scheduled/recurring) */}
          {(meetingType === 'scheduled' || meetingType === 'recurring') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="meetingDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="meetingDate"
                  type="date"
                  required
                  value={form.scheduledAt}
                  onChange={(e) => handleChange('scheduledAt', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="meetingTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="meetingTime"
                  type="time"
                  value={form.scheduledTime}
                  onChange={(e) => handleChange('scheduledTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Recurring Rule */}
          {meetingType === 'recurring' && (
            <div>
              <label htmlFor="recurringRule" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Recurring Rule <span className="text-gray-400">(optional)</span>
              </label>
              <select
                id="recurringRule"
                value={form.recurringRule}
                onChange={(e) => handleChange('recurringRule', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select frequency...</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every 2 weeks</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          )}

          {/* Password */}
          <div>
            <label htmlFor="meetingPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Meeting Password <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id="meetingPassword"
              type="password"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Leave empty for no password"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       placeholder-gray-400 dark:placeholder-gray-500
                       focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              minLength={4}
              maxLength={64}
            />
            <p className="mt-1 text-xs text-gray-400">
              Participants will need this password to join. Min 4 characters.
            </p>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Max Participants */}
            <div>
              <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Participants
              </label>
              <input
                id="maxParticipants"
                type="number"
                value={form.maxParticipants}
                onChange={(e) => handleChange('maxParticipants', parseInt(e.target.value) || 100)}
                min={1}
                max={1000}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Waiting Room Toggle */}
            <div className="flex items-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasWaitingRoom}
                  onChange={(e) => handleChange('hasWaitingRoom', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                              peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 
                              rounded-full peer dark:bg-gray-700 
                              peer-checked:after:translate-x-full peer-checked:after:border-white 
                              after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                              after:bg-white after:border-gray-300 after:border after:rounded-full 
                              after:h-5 after:w-5 after:transition-all 
                              peer-checked:bg-indigo-600" />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Waiting Room</span>
              </label>
            </div>

            {/* Recording Toggle */}
            <div className="flex items-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.recordingEnabled}
                  onChange={(e) => handleChange('recordingEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                              peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 
                              rounded-full peer dark:bg-gray-700 
                              peer-checked:after:translate-x-full peer-checked:after:border-white 
                              after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                              after:bg-white after:border-gray-300 after:border after:rounded-full 
                              after:h-5 after:w-5 after:transition-all 
                              peer-checked:bg-indigo-600" />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Allow Recording</span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate('/meetings')}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                       hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium
                       hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors inline-flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Creating...
                </>
              ) : meetingType === 'instant' ? (
                'Start Meeting'
              ) : (
                'Schedule Meeting'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
